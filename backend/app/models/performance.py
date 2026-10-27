from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from app.database import Base


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reviewer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )
    review_period = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=False)
    goals = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
