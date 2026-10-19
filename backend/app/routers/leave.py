from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.employee import Employee
from app.models.leave import Leave
from app.models.user import User
from app.models.notification import Notification
from app.routers.auth import get_current_user, require_roles
from app.schemas.leave import LeaveCreate, LeaveResponse

router = APIRouter(prefix="/api/leaves", tags=["Leave Management"])


def get_employee(db: Session, user: User) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return employee


@router.post("/", response_model=LeaveResponse, status_code=201)
def apply_leave(
    payload: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee(db, current_user)
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
    leave = db.query(Leave).filter(Leave.id == leave_id).first()

    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
    if leave.status != "PENDING":
        raise HTTPException(status_code=409, detail="Leave application already processed")

    leave.status = "APPROVED"
    employee = db.query(Employee).filter(Employee.id == leave.employee_id).first()

    if employee:
        db.add(
            Notification(
                user_id=employee.user_id,
                title="Leave Approved",
                message=(
                    f"Your {leave.leave_type} leave from {leave.start_date} "
                    f"to {leave.end_date} has been approved."
                ),
                notification_type="LEAVE",
            )
        )

    db.commit()
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
    db.refresh(leave)
    return leave