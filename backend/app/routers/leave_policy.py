
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.employee import Employee
from app.models.leave_policy import LeavePolicy
from app.models.leave_balance import LeaveBalance
from app.routers.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/leave-policies", tags=["Leave Policies"])


class LeavePolicyCreate(BaseModel):
    leave_type: str = Field(pattern="^(SICK|CASUAL|PAID)$")
    total_days_allowed: int = Field(ge=0, le=365)


class LeavePolicyResponse(LeavePolicyCreate):
    id: int

    model_config = {"from_attributes": True}


class LeaveBalanceResponse(BaseModel):
    id: int
    employee_id: int
    leave_type: str
    remaining_days: int

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[LeavePolicyResponse])
def list_policies(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(LeavePolicy).order_by(LeavePolicy.id).all()


@router.post("/", response_model=LeavePolicyResponse, status_code=201)
def create_policy(
    payload: LeavePolicyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("HR", "ADMIN")),
):
    policy = db.query(LeavePolicy).filter(
        LeavePolicy.leave_type == payload.leave_type
    ).first()

    if policy:
        raise HTTPException(status_code=409, detail="Policy already exists")

    policy = LeavePolicy(**payload.model_dump())
    db.add(policy)
    db.flush()

    employees = db.query(Employee).filter(Employee.status == "ACTIVE").all()
    for employee in employees:
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee.id,
            LeaveBalance.leave_type == policy.leave_type,
        ).first()

        if not balance:
            db.add(
                LeaveBalance(
                    employee_id=employee.id,
                    leave_type=policy.leave_type,
                    remaining_days=policy.total_days_allowed,
                )
            )

    db.commit()
    db.refresh(policy)
    return policy


@router.get("/my-balance", response_model=list[LeaveBalanceResponse])
def my_leave_balance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    employee = db.query(Employee).filter(
        Employee.user_id == current_user.id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    return db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee.id
    ).order_by(LeaveBalance.leave_type).all()


@router.get("/balances", response_model=list[LeaveBalanceResponse])
def list_balances(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("HR", "ADMIN")),
):
    return db.query(LeaveBalance).order_by(
        LeaveBalance.employee_id, LeaveBalance.leave_type
    ).all()


@router.put("/{leave_type}", response_model=LeavePolicyResponse)
def update_policy(
    leave_type: str,
    payload: LeavePolicyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("HR", "ADMIN")),
):
    if leave_type != payload.leave_type:
        raise HTTPException(
            status_code=400,
            detail="Leave type in URL must match the request body",
        )

    policy = db.query(LeavePolicy).filter(
        LeavePolicy.leave_type == leave_type
    ).first()

    if not policy:
        raise HTTPException(status_code=404, detail="Leave policy not found")

    difference = payload.total_days_allowed - policy.total_days_allowed
    policy.total_days_allowed = payload.total_days_allowed

    balances = db.query(LeaveBalance).filter(
        LeaveBalance.leave_type == leave_type
    ).all()

    for balance in balances:
        balance.remaining_days = max(0, balance.remaining_days + difference)

    db.commit()
    db.refresh(policy)
    return policy

