from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.employee import Employee
from app.models.notification import Notification
from app.models.payroll import Payroll
from app.models.user import User
from app.routers.auth import get_current_user, require_roles
from app.schemas.payroll import PayrollCreate, PayrollResponse

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])


@router.post("/generate", response_model=PayrollResponse, status_code=201)
def generate_payroll(
    payload: PayrollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == payload.employee_id)
        .first()
    )

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if employee.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Employee is inactive")

    existing = (
        db.query(Payroll)
        .filter(
            Payroll.employee_id == employee.id,
            Payroll.month == payload.month,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Payroll already exists for this month",
        )

    basic_salary = Decimal(str(employee.salary))
    allowances = payload.allowances
    bonus = payload.bonus
    deductions = payload.deductions

    gross_salary = basic_salary + allowances + bonus

    if deductions > gross_salary:
        raise HTTPException(
            status_code=400,
            detail="Deductions exceed total salary",
        )

    payroll = Payroll(
        employee_id=employee.id,
        basic_salary=basic_salary,
        allowances=allowances,
        deductions=deductions,
        bonus=bonus,
        net_salary=gross_salary - deductions,
        month=payload.month,
    )

    db.add(payroll)

    db.add(
        Notification(
            user_id=employee.user_id,
            title="Payroll Generated",
            message=(
                f"Your payroll for {payroll.month} has been generated. "
                f"Net salary: {payroll.net_salary}."
            ),
            notification_type="PAYROLL",
        )
    )

    db.commit()
    db.refresh(payroll)

    return payroll


@router.get("/", response_model=list[PayrollResponse])
def list_payroll(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    return (
        db.query(Payroll)
        .order_by(Payroll.month.desc(), Payroll.employee_id)
        .all()
    )


@router.get("/my", response_model=list[PayrollResponse])
def get_my_payroll(
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

    return (
        db.query(Payroll)
        .filter(Payroll.employee_id == employee.id)
        .order_by(Payroll.month.desc())
        .all()
    )


@router.get("/{payroll_id}", response_model=PayrollResponse)
def get_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    payroll = (
        db.query(Payroll)
        .filter(Payroll.id == payroll_id)
        .first()
    )

    if not payroll:
        raise HTTPException(
            status_code=404,
            detail="Payroll record not found",
        )

    return payroll
