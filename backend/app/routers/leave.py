from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.employee import Employee
from app.models.leave import Leave
from app.models.user import User
from app.models.notification import Notification
from app.models.leave_balance import LeaveBalance
from app.routers.auth import get_current_user, require_roles
from app.schemas.leave import LeaveCreate, LeaveResponse
from app.email_service import send_email

router = APIRouter(prefix="/api/leaves", tags=["Leave Management"])


def get_employee(db: Session, user: User) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return employee


def count_leave_days(start_date, end_date):
    return (end_date - start_date).days + 1


@router.post("/", response_model=LeaveResponse, status_code=201)
def apply_leave(
    payload: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user)

    days_requested = count_leave_days(payload.start_date, payload.end_date)

    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee.id,
        LeaveBalance.leave_type == payload.leave_type,
    ).first()

    if not balance:
        raise HTTPException(
            status_code=400,
            detail=f"No {payload.leave_type} leave balance configured for your account",
        )

    pending_or_approved = db.query(Leave).filter(
        Leave.employee_id == employee.id,
        Leave.status.in_(["PENDING", "APPROVED"]),
        Leave.start_date <= payload.end_date,
        Leave.end_date >= payload.start_date,
    ).first()

    if pending_or_approved:
        raise HTTPException(
            status_code=409,
            detail="Leave dates overlap an existing pending or approved request",
        )

    pending_days = 0
    pending_leaves = db.query(Leave).filter(
        Leave.employee_id == employee.id,
        Leave.leave_type == payload.leave_type,
        Leave.status == "PENDING",
    ).all()

    for pending_leave in pending_leaves:
        pending_days += count_leave_days(
            pending_leave.start_date, pending_leave.end_date
        )

    if days_requested + pending_days > balance.remaining_days:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient {payload.leave_type} leave balance. "
                f"Remaining: {balance.remaining_days}; "
                f"already pending: {pending_days}; requested: {days_requested}."
            ),
        )

    leave = Leave(
        employee_id=employee.id,
        **payload.model_dump(),
        status="PENDING",
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave


@router.get("/", response_model=list[LeaveResponse])
def list_leaves(
    leave_status: str | None = Query(
        default=None,
        alias="status",
        pattern="^(PENDING|APPROVED|REJECTED)$",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Leave)

    if current_user.role not in ("HR", "ADMIN"):
        employee = get_employee(db, current_user)
        query = query.filter(Leave.employee_id == employee.id)

    if leave_status:
        query = query.filter(Leave.status == leave_status)

    return query.order_by(Leave.created_at.desc()).all()


@router.patch("/{leave_id}/approve", response_model=LeaveResponse)
def approve_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    leave = db.query(Leave).filter(Leave.id == leave_id).with_for_update().first()

    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
    if leave.status != "PENDING":
        raise HTTPException(status_code=409, detail="Leave application already processed")

    days_requested = count_leave_days(leave.start_date, leave.end_date)

    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == leave.employee_id,
        LeaveBalance.leave_type == leave.leave_type,
    ).with_for_update().first()

    if not balance:
        raise HTTPException(
            status_code=400,
            detail=f"No {leave.leave_type} leave balance configured for this employee",
        )

    if balance.remaining_days < days_requested:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient leave balance. Remaining: {balance.remaining_days}; "
                f"requested: {days_requested}."
            ),
        )

    balance.remaining_days -= days_requested
    leave.status = "APPROVED"

    employee = db.query(Employee).filter(Employee.id == leave.employee_id).first()
    if employee:
        db.add(
            Notification(
                user_id=employee.user_id,
                title="Leave Approved",
                message=(
                    f"Your {leave.leave_type} leave from {leave.start_date} "
                    f"to {leave.end_date} has been approved. "
                    f"{days_requested} day(s) deducted from your balance."
                ),
                notification_type="LEAVE",
            )
        )

    db.commit()
    if employee:
        user = db.query(User).filter(User.id == employee.user_id).first()
        if user and user.email:
            send_email(
                to_email=user.email,
                subject="Leave Approved",
                body=(
                    f"Your {leave.leave_type} leave from {leave.start_date} "
                    f"to {leave.end_date} has been approved. "
                    f"{days_requested} day(s) deducted from your balance."
                ),
            )
    db.refresh(leave)
    return leave


@router.patch("/{leave_id}/reject", response_model=LeaveResponse)
def reject_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    leave = db.query(Leave).filter(Leave.id == leave_id).first()

    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
    if leave.status != "PENDING":
        raise HTTPException(status_code=409, detail="Leave application already processed")

    leave.status = "REJECTED"

    employee = db.query(Employee).filter(Employee.id == leave.employee_id).first()
    if employee:
        db.add(
            Notification(
                user_id=employee.user_id,
                title="Leave Rejected",
                message=(
                    f"Your {leave.leave_type} leave from {leave.start_date} "
                    f"to {leave.end_date} has been rejected."
                ),
                notification_type="LEAVE",
            )
        )

    db.commit()
    if employee:
        user = db.query(User).filter(User.id == employee.user_id).first()
        if user and user.email:
            send_email(
                to_email=user.email,
                subject="Leave Rejected",
                body=(
                    f"Your {leave.leave_type} leave from {leave.start_date} "
                    f"to {leave.end_date} has been rejected."
                ),
            )
    db.refresh(leave)
    return leave

@router.get("/calendar")
def leave_calendar(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    query = (
        db.query(
            Leave.id,
            Leave.employee_id,
            Employee.full_name,
            Employee.department,
            Leave.leave_type,
            Leave.start_date,
            Leave.end_date,
            Leave.status,
        )
        .join(Employee, Employee.id == Leave.employee_id)
        .filter(Leave.status == "APPROVED")
    )

    if start_date:
        query = query.filter(Leave.end_date >= start_date)

    if end_date:
        query = query.filter(Leave.start_date <= end_date)

    records = query.order_by(Leave.start_date).all()

    return [
        {
            "id": row.id,
            "employee_id": row.employee_id,
            "full_name": row.full_name,
            "department": row.department,
            "leave_type": row.leave_type,
            "start_date": row.start_date,
            "end_date": row.end_date,
            "status": row.status,
        }
        for row in records
    ]