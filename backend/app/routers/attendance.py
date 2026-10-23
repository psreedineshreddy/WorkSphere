from datetime import date, datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.notification import Notification
from app.models.user import User
from app.routers.auth import get_current_user, require_roles
from app.schemas.attendance import AttendanceHistoryResponse, AttendanceResponse

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

IST = timezone(timedelta(hours=5, minutes=30))
SHIFT_START_HOUR = 9
STANDARD_WORK_HOURS = 8


def local_now():
    return datetime.now(IST)


def get_employee_for_user(db: Session, user: User) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return employee


def check_access(employee_id: int, user: User, db: Session):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if user.role not in ("HR", "ADMIN") and employee.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return employee


def as_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=IST)
    return value


def hours_between(start: datetime, end: datetime) -> float:
    return max(0, (as_aware(end) - as_aware(start)).total_seconds() / 3600)


@router.post("/check-in", response_model=AttendanceResponse)
def check_in(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_for_user(db, current_user)
    now = local_now()
    today = now.date()

    record = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        Attendance.date == today,
    ).first()

    if record and record.check_in:
        raise HTTPException(status_code=409, detail="Already checked in today")

    if not record:
        record = Attendance(employee_id=employee.id, date=today)

    record.check_in = now
    shift_start = now.replace(
        hour=SHIFT_START_HOUR, minute=0, second=0, microsecond=0
    )
    record.is_late = now.time() > shift_start.time()
    record.status = "PRESENT"

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_for_user(db, current_user)
    today = local_now().date()

    record = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        Attendance.date == today,
    ).first()

    if not record or not record.check_in:
        raise HTTPException(status_code=400, detail="Check in before checking out")
    if record.check_out:
        raise HTTPException(status_code=409, detail="Already checked out today")

    now = local_now()
    record.check_out = now
    elapsed = hours_between(record.check_in, now)
    record.status = "HALF_DAY" if elapsed < 4 else "PRESENT"
    record.overtime_hours = round(max(0, elapsed - STANDARD_WORK_HOURS), 2)

    db.commit()
    db.refresh(record)
    return record


def build_history_response(record: Attendance) -> AttendanceHistoryResponse:
    working_hours = None
    if record.check_in and record.check_out:
        working_hours = round(hours_between(record.check_in, record.check_out), 2)

    return AttendanceHistoryResponse(
        id=record.id,
        employee_id=record.employee_id,
        date=record.date,
        check_in=record.check_in,
        check_out=record.check_out,
        status=record.status,
        is_late=record.is_late,
        overtime_hours=record.overtime_hours or 0,
        working_hours=working_hours,
    )


@router.get("/history", response_model=list[AttendanceHistoryResponse])
def attendance_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_for_user(db, current_user)
    records = (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee.id)
        .order_by(Attendance.date.desc())
        .all()
    )
    return [build_history_response(record) for record in records]


@router.get(
    "/employee/{employee_id}/history",
    response_model=list[AttendanceHistoryResponse],
)
def employee_attendance_history(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_access(employee_id, current_user, db)
    records = (
        db.query(Attendance)
        .filter(Attendance.employee_id == employee_id)
        .order_by(Attendance.date.desc())
        .all()
    )
    return [build_history_response(record) for record in records]


@router.post(
    "/employee/{employee_id}/mark-absent",
    response_model=AttendanceResponse,
)
def mark_absent(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    today = local_now().date()
    record = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        Attendance.date == today,
    ).first()

    if record:
        raise HTTPException(
            status_code=409,
            detail="Attendance already exists for today",
        )

    record = Attendance(
        employee_id=employee_id,
        date=today,
        status="ABSENT",
        is_late=False,
        overtime_hours=0,
    )
    db.add(record)
    db.add(
        Notification(
            user_id=employee.user_id,
            title="Attendance Alert",
            message=f"You were marked absent for {today}.",
            notification_type="ATTENDANCE",
        )
    )
    db.commit()
    db.refresh(record)
    return record


@router.get("/overview")
def attendance_overview(
    attendance_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    selected_date = attendance_date or local_now().date()

    employees = (
        db.query(Employee)
        .filter(Employee.status == "ACTIVE")
        .order_by(Employee.full_name)
        .all()
    )

    results = []
    for employee in employees:
        record = db.query(Attendance).filter(
            Attendance.employee_id == employee.id,
            Attendance.date == selected_date,
        ).first()

        working_hours = None
        if record and record.check_in and record.check_out:
            working_hours = round(
                hours_between(record.check_in, record.check_out), 2
            )

        results.append({
            "employee_id": employee.id,
            "full_name": employee.full_name,
            "department": employee.department,
            "designation": employee.designation,
            "date": selected_date,
            "check_in": record.check_in if record else None,
            "check_out": record.check_out if record else None,
            "working_hours": working_hours,
            "is_late": record.is_late if record else False,
            "overtime_hours": record.overtime_hours if record else 0,
            "status": record.status if record else "NOT_MARKED",
        })

    return results
