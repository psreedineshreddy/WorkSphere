
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.employee import Employee
from app.models.resignation import Resignation
from app.models.user import User
from app.routers.auth import get_current_user, require_roles
from app.schemas.resignation import (
    ResignationCreate,
    ResignationResponse,
    ResignationUpdate,
)

router = APIRouter(prefix="/api/resignations", tags=["Resignations"])


@router.post(
    "/",
    response_model=ResignationResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_resignation(
    payload: ResignationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = db.query(Employee).filter(
        Employee.user_id == current_user.id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    if payload.last_working_day < payload.resignation_date if hasattr(payload, "resignation_date") else False:
        raise HTTPException(
            status_code=422,
            detail="Last working day cannot be before resignation date",
        )

    resignation = Resignation(
        employee_id=employee.id,
        reason=payload.reason.strip(),
        last_working_day=payload.last_working_day,
    )

    if not resignation.reason:
        raise HTTPException(status_code=422, detail="Reason cannot be empty")

    db.add(resignation)
    db.commit()
    db.refresh(resignation)
    return resignation


@router.get("/", response_model=list[ResignationResponse])
def list_resignations(
    employee_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Resignation)

    if current_user.role not in ("HR", "ADMIN"):
        employee = db.query(Employee).filter(
            Employee.user_id == current_user.id
        ).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found")
        query = query.filter(Resignation.employee_id == employee.id)
    elif employee_id is not None:
        query = query.filter(Resignation.employee_id == employee_id)

    return query.order_by(Resignation.id.asc()).all()


@router.patch("/{resignation_id}", response_model=ResignationResponse)
def update_resignation(
    resignation_id: int,
    payload: ResignationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    resignation = db.query(Resignation).filter(
        Resignation.id == resignation_id
    ).first()

    if not resignation:
        raise HTTPException(status_code=404, detail="Resignation not found")

    resignation.status = payload.status

    if payload.exit_interview_notes is not None:
        resignation.exit_interview_notes = payload.exit_interview_notes

    if payload.clearance_status is not None:
        resignation.clearance_status = payload.clearance_status

    db.commit()
    db.refresh(resignation)
    return resignation

