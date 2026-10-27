from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.employee import Employee
from app.models.user import User
from app.models.attendance import Attendance
from app.models.performance import PerformanceReview
from app.routers.auth import get_current_user, require_roles
from app.schemas.employee import EmployeeCreate, EmployeeResponse, EmployeeUpdate

router = APIRouter(prefix="/api/employees", tags=["Employees"])


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if db.query(Employee).filter(Employee.user_id == payload.user_id).first():
        raise HTTPException(status_code=409, detail="Employee profile already exists")

    employee = Employee(**payload.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee

@router.get("/", response_model=list[EmployeeResponse])
def list_employees(
    search: str | None = Query(
        default=None,
        description="Search name, designation, or department",
    ),
    department: str | None = None,
    employee_status: str | None = Query(
        default=None,
        alias="status",
        pattern="^(ACTIVE|INACTIVE)$",
    ),
    role: str | None = Query(
        default=None,
        pattern="^(EMPLOYEE|HR|ADMIN)$",
    ),
    attendance: str | None = Query(
        default=None,
        pattern="^(PRESENT|ABSENT|HALF_DAY)$",
    ),
    min_rating: int | None = Query(default=None, ge=1, le=5),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    query = db.query(Employee)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            Employee.full_name.ilike(term)
            | Employee.designation.ilike(term)
            | Employee.department.ilike(term)
        )

    if department and department.strip():
        query = query.filter(Employee.department.ilike(department.strip()))

    if employee_status:
        query = query.filter(Employee.status == employee_status)

    if role:
        query = query.join(User, Employee.user_id == User.id)
        query = query.filter(User.role == role)

    if attendance:
        latest_attendance = (
            db.query(
                Attendance.employee_id,
                func.max(Attendance.date).label("latest_date"),
            )
            .group_by(Attendance.employee_id)
            .subquery()
        )

        query = query.join(
            latest_attendance,
            Employee.id == latest_attendance.c.employee_id,
        ).join(
            Attendance,
            (Attendance.employee_id == latest_attendance.c.employee_id)
            & (Attendance.date == latest_attendance.c.latest_date),
        ).filter(Attendance.status == attendance)

    if min_rating is not None:
        latest_review = (
            db.query(
                PerformanceReview.employee_id,
                func.max(PerformanceReview.created_at).label("latest_created"),
            )
            .group_by(PerformanceReview.employee_id)
            .subquery()
        )

        query = query.join(
            latest_review,
            Employee.id == latest_review.c.employee_id,
        ).join(
            PerformanceReview,
            (
                PerformanceReview.employee_id
                == latest_review.c.employee_id
            )
            & (
                PerformanceReview.created_at
                == latest_review.c.latest_created
            ),
        ).filter(PerformanceReview.rating >= min_rating)

    return query.distinct().order_by(Employee.id.asc()).all()

@router.get("/me", response_model=EmployeeResponse)
def get_my_employee_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = (
        db.query(Employee)
        .filter(Employee.user_id == current_user.id)
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee profile not found",
        )

    return employee

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if current_user.role not in ("HR", "ADMIN") and employee.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)
    return employee
