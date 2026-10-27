from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.performance import PerformanceReview
from app.models.employee import Employee
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/performance", tags=["Performance Management"])


class PerformanceReviewCreate(BaseModel):
    employee_id: int
    review_period: str = Field(min_length=1, max_length=100)
    rating: int = Field(ge=1, le=5)
    feedback: str = Field(min_length=1)
    goals: str | None = None


def review_response(review):
    return {
        "id": review.id,
        "employee_id": review.employee_id,
        "reviewer_id": review.reviewer_id,
        "review_period": review.review_period,
        "rating": review.rating,
        "feedback": review.feedback,
        "goals": review.goals,
        "created_at": review.created_at,
    }


def require_hr(user: User):
    if user.role not in ("HR", "ADMIN"):
        raise HTTPException(
            status_code=403,
            detail="Only HR or Admin can manage performance reviews",
        )


@router.post("/", status_code=201)
def create_review(
    data: PerformanceReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hr(current_user)

    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    review = PerformanceReview(
        employee_id=data.employee_id,
        reviewer_id=current_user.id,
        review_period=data.review_period.strip(),
        rating=data.rating,
        feedback=data.feedback.strip(),
        goals=data.goals.strip() if data.goals else None,
    )

    db.add(review)
    db.commit()
    db.refresh(review)
    return review_response(review)


@router.get("/")
def list_reviews(
    employee_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PerformanceReview)

    if current_user.role not in ("HR", "ADMIN"):
        employee = db.query(Employee).filter(
            Employee.user_id == current_user.id
        ).first()

        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found")

        query = query.filter(PerformanceReview.employee_id == employee.id)
    elif employee_id is not None:
        query = query.filter(PerformanceReview.employee_id == employee_id)

    reviews = query.order_by(PerformanceReview.created_at.desc()).all()
    return [review_response(review) for review in reviews]


@router.get("/{review_id}")
def get_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(PerformanceReview).filter(
        PerformanceReview.id == review_id
    ).first()

    if not review:
        raise HTTPException(status_code=404, detail="Performance review not found")

    if current_user.role not in ("HR", "ADMIN"):
        employee = db.query(Employee).filter(
            Employee.user_id == current_user.id
        ).first()

        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found")

        if review.employee_id != employee.id:
            raise HTTPException(status_code=403, detail="Access denied")

    return review_response(review)
