
from datetime import datetime, timezone

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


@router.post("/check-in", response_model=AttendanceResponse)
def check_in(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_for_user(db, current_user)
    today = datetime.now().date()

    record = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        Attendance.date == today,
    ).first()

    if record and record.check_in:
        raise HTTPException(status_code=409, detail="Already checked in today")

    if not record:
        record = Attendance(employee_id=employee.id, date=today)

    record.check_in = datetime.now(timezone.utc)
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
    today = datetime.now().date()

    record = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        Attendance.date == today,
    ).first()

    if not record or not record.check_in:
        raise HTTPException(status_code=400, detail="Check in before checking out")
    if record.check_out:
        raise HTTPException(status_code=409, detail="Already checked out today")

    record.check_out = datetime.now(timezone.utc)
    start = record.check_in
    end = record.check_out

    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)

    elapsed = (end - start).total_seconds() / 3600
    record.status = "HALF_DAY" if elapsed < 4 else "PRESENT"

    db.commit()
    db.refresh(record)
    return record


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

    results = []
    for record in records:
        working_hours = None
        if record.check_in and record.check_out:
            start = record.check_in
            end = record.check_out

            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)

            working_hours = round((end - start).total_seconds() / 3600, 2)

        results.append(
            AttendanceHistoryResponse(
                id=record.id,
                employee_id=record.employee_id,
                date=record.date,
                check_in=record.check_in,
                check_out=record.check_out,
                status=record.status,
                working_hours=working_hours,
            )
        )

    return results


@router.get("/employee/{employee_id}/history", response_model=list[AttendanceHistoryResponse])
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

    results = []
    for record in records:
        working_hours = None
        if record.check_in and record.check_out:
            start = record.check_in
            end = record.check_out

            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)

            working_hours = round((end - start).total_seconds() / 3600, 2)

        results.append(
            AttendanceHistoryResponse(
                id=record.id,
                employee_id=record.employee_id,
                date=record.date,
                check_in=record.check_in,
                check_out=record.check_out,
                status=record.status,
                working_hours=working_hours,
            )
        )

    return results


@router.post("/employee/{employee_id}/mark-absent", response_model=AttendanceResponse)
def mark_absent(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    today = datetime.now().date()
    record = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        Attendance.date == today,
    ).first()

    if record:
        raise HTTPException(status_code=409, detail="Attendance already exists for today")

    record = Attendance(employee_id=employee_id, date=today, status="ABSENT")
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
