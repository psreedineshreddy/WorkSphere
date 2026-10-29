from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.employee import Employee
from app.models.onboarding import Onboarding
from app.models.user import User
from app.routers.auth import get_current_user, require_roles
from app.schemas.onboarding import (
    OnboardingCreate,
    OnboardingResponse,
    OnboardingUpdate,
)

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])


@router.post("/", response_model=OnboardingResponse, status_code=status.HTTP_201_CREATED)
def create_onboarding_task(
    payload: OnboardingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    employee = db.query(Employee).filter(
        Employee.id == payload.employee_id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    task = Onboarding(
        employee_id=payload.employee_id,
        task_name=payload.task_name.strip(),
        due_date=payload.due_date,
    )
    if not task.task_name:
        raise HTTPException(status_code=422, detail="Task name cannot be empty")

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/", response_model=list[OnboardingResponse])
def list_onboarding_tasks(
    employee_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Onboarding)

    if current_user.role not in ("HR", "ADMIN"):
        employee = db.query(Employee).filter(
            Employee.user_id == current_user.id
        ).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found")
        query = query.filter(Onboarding.employee_id == employee.id)
    elif employee_id is not None:
        query = query.filter(Onboarding.employee_id == employee_id)

    return query.order_by(Onboarding.id.asc()).all()


@router.patch("/{task_id}", response_model=OnboardingResponse)
def update_onboarding_task(
    task_id: int,
    payload: OnboardingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Onboarding).filter(Onboarding.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Onboarding task not found")

    if current_user.role not in ("HR", "ADMIN"):
        employee = db.query(Employee).filter(
            Employee.user_id == current_user.id
        ).first()
        if not employee or employee.id != task.employee_id:
            raise HTTPException(status_code=403, detail="Access denied")

    task.status = payload.status
    db.commit()
    db.refresh(task)
    return task

