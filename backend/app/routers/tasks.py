from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.employee import Employee
from app.models.task import Task
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.task import TaskCreate, TaskResponse, TaskStatusUpdate

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def is_manager(user):
    return user.role in ["HR", "ADMIN"]


@router.post("/", response_model=TaskResponse, status_code=201)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not is_manager(current_user):
        raise HTTPException(status_code=403, detail="Only HR or Admin can assign tasks")

    employee = db.query(Employee).filter(
        Employee.id == payload.assigned_to
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Title cannot be empty")

    task = Task(
        assigned_to=employee.id,
        title=title,
        description=(payload.description or "").strip() or None,
        due_date=payload.due_date,
    )

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/", response_model=list[TaskResponse])
def list_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Task)

    if not is_manager(current_user):
        employee = db.query(Employee).filter(
            Employee.user_id == current_user.id
        ).first()

        if not employee:
            return []

        query = query.filter(Task.assigned_to == employee.id)

    return query.order_by(Task.due_date.asc(), Task.id.desc()).all()


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not is_manager(current_user):
        employee = db.query(Employee).filter(
            Employee.user_id == current_user.id
        ).first()

        if not employee or task.assigned_to != employee.id:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own tasks",
            )

    task.status = payload.status
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not is_manager(current_user):
        raise HTTPException(
            status_code=403,
            detail="Only HR or Admin can delete tasks",
        )

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
