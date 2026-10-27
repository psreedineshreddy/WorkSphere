from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.leave import Leave
from app.models.payroll import Payroll
from app.routers.auth import require_roles
from app.models.performance import PerformanceReview

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
@router.get("/analytics")
def dashboard_analytics(
    start_date: date | None = None,
    end_date: date | None = None,
    department: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    from sqlalchemy import func

    employee_query = db.query(Employee)

    if department:
        employee_query = employee_query.filter(
            Employee.department == department
        )

    employees = employee_query.all()
    employee_ids = [employee.id for employee in employees]

    attendance_query = db.query(Attendance).filter(
        Attendance.employee_id.in_(employee_ids)
    ) if employee_ids else db.query(Attendance).filter(False)

    leave_query = db.query(Leave).filter(
        Leave.employee_id.in_(employee_ids)
    ) if employee_ids else db.query(Leave).filter(False)

    performance_query = db.query(PerformanceReview).filter(
        PerformanceReview.employee_id.in_(employee_ids)
    ) if employee_ids else db.query(PerformanceReview).filter(False)

    if start_date:
        attendance_query = attendance_query.filter(
            Attendance.date >= start_date
        )
        leave_query = leave_query.filter(
            Leave.start_date >= start_date
        )
        performance_query = performance_query.filter(
            PerformanceReview.created_at >= start_date
        )

    if end_date:
        attendance_query = attendance_query.filter(
            Attendance.date <= end_date
        )
        leave_query = leave_query.filter(
            Leave.start_date <= end_date
        )
        performance_query = performance_query.filter(
            PerformanceReview.created_at <= end_date
        )

    department_counts = (
        db.query(
            Employee.department,
            func.count(Employee.id).label("employee_count"),
        )
        .filter(Employee.id.in_(employee_ids))
        .group_by(Employee.department)
        .all()
    ) if employee_ids else []

    attendance_counts = (
        attendance_query.with_entities(
            Attendance.status,
            func.count(Attendance.id),
        )
        .group_by(Attendance.status)
        .all()
    )

    leave_counts = (
        leave_query.with_entities(
            Leave.status,
            func.count(Leave.id),
        )
        .group_by(Leave.status)
        .all()
    )

    performance_summary = (
        performance_query.with_entities(
            func.count(PerformanceReview.id),
            func.avg(PerformanceReview.rating),
        )
        .first()
    )

    return {
        "department_wise_employees": [
            {"department": name, "employee_count": count}
            for name, count in department_counts
        ],
        "attendance_trends": [
            {"status": status, "count": count}
            for status, count in attendance_counts
        ],
        "leave_trends": [
            {"status": status, "count": count}
            for status, count in leave_counts
        ],
        "performance_insights": {
            "total_reviews": performance_summary[0] or 0,
            "average_rating": round(float(performance_summary[1] or 0), 2),
        },
    }