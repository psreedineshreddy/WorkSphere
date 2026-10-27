from datetime import time

from fastapi import APIRouter, Depends, HTTPException
from fastapi import status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.employee import Employee
from app.models.shift import Shift, EmployeeShift
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/shifts", tags=["Shifts"])


class ShiftCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    start_time: time
    end_time: time


class ShiftResponse(ShiftCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class EmployeeShiftCreate(BaseModel):
    employee_id: int = Field(gt=0)
    shift_id: int = Field(gt=0)


class EmployeeShiftResponse(BaseModel):
    id: int
    employee_id: int
    shift_id: int
    model_config = ConfigDict(from_attributes=True)

class ShiftScheduleResponse(BaseModel):
    employee_id: int
    full_name: str
    department: str
    designation: str
    shift_id: int
    shift_name: str
    start_time: time
    end_time: time

def require_hr_or_admin(current_user: User):
    role = str(current_user.role).upper()
    if role not in ("HR", "ADMIN", "USER. HR", "USER. ADMIN"):
        raise HTTPException(
            status_code=403,
            detail="Only HR or Admin can manage shifts",
        )


@router.get("/", response_model=list[ShiftResponse])
def list_shifts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Shift).order_by(Shift.id).all()


@router.post("/", response_model=ShiftResponse, status_code=201)
def create_shift(
    payload: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hr_or_admin(current_user)

    if payload.start_time == payload.end_time:
        raise HTTPException(
            status_code=400,
            detail="Shift start and end times cannot be identical",
        )

    existing = db.query(Shift).filter(
        Shift.name.ilike(payload.name.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Shift already exists")

    shift = Shift(
        name=payload.name.strip(),
        start_time=payload.start_time,
        end_time=payload.end_time,
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


@router.post("/assign", response_model=EmployeeShiftResponse, status_code=201)
def assign_shift(
    payload: EmployeeShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hr_or_admin(current_user)

    employee = db.query(Employee).filter(
        Employee.id == payload.employee_id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    shift = db.query(Shift).filter(Shift.id == payload.shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    assignment = db.query(EmployeeShift).filter(
        EmployeeShift.employee_id == payload.employee_id
    ).first()

    if assignment:
        assignment.shift_id = payload.shift_id
    else:
        assignment = EmployeeShift(
            employee_id=payload.employee_id,
            shift_id=payload.shift_id,
        )
        db.add(assignment)

    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/assignments", response_model=list[EmployeeShiftResponse])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(EmployeeShift).order_by(EmployeeShift.employee_id).all()

@router.get("/schedule", response_model=list[ShiftScheduleResponse])
def shift_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(
            Employee.id.label("employee_id"),
            Employee.full_name.label("full_name"),
            Employee.department.label("department"),
            Employee.designation.label("designation"),
            Shift.id.label("shift_id"),
            Shift.name.label("shift_name"),
            Shift.start_time.label("start_time"),
            Shift.end_time.label("end_time"),
        )
        .join(
            EmployeeShift,
            EmployeeShift.employee_id == Employee.id,
        )
        .join(
            Shift,
            Shift.id == EmployeeShift.shift_id,
        )
        .order_by(Employee.full_name)
    )

    return query.all()