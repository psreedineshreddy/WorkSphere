from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.leave import Leave
from app.models.payroll import Payroll
from app.routers.auth import require_roles

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter(
        Employee.status == "ACTIVE"
    ).count()

    total_attendance = db.query(Attendance).count()
    present_today = db.query(Attendance).filter(
        Attendance.date == func.current_date(),
        Attendance.status == "PRESENT",
    ).count()

    pending_leaves = db.query(Leave).filter(
        Leave.status == "PENDING"
    ).count()
    approved_leaves = db.query(Leave).filter(
        Leave.status == "APPROVED"
    ).count()

    total_payroll = db.query(func.coalesce(
        func.sum(Payroll.net_salary), 0
    )).scalar()

    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "total_attendance_records": total_attendance,
        "present_today": present_today,
        "pending_leave_requests": pending_leaves,
        "approved_leave_requests": approved_leaves,
        "total_payroll_amount": total_payroll,
    }
