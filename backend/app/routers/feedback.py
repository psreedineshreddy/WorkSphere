from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.feedback import Feedback
from app.models.employee import Employee
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])


@router.post("/", response_model=FeedbackResponse, status_code=201)
def submit_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = db.query(Employee).filter(
        Employee.user_id == current_user.id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    feedback = Feedback(
        employee_id=employee.id,
        message=data.message,
        rating=data.rating,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/", response_model=list[FeedbackResponse])
def get_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["HR", "ADMIN"]:
        raise HTTPException(
            status_code=403,
            detail="Only HR or Admin can view feedback",
        )

    return db.query(Feedback).order_by(Feedback.created_at.desc()).all()
