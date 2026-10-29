from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from app.database import Base


class Resignation(Base):
    __tablename__ = "resignations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=False,
        index=True,
    )
    reason = Column(Text, nullable=False)
    resignation_date = Column(Date, default=date.today, nullable=False)
    last_working_day = Column(Date, nullable=False)
    status = Column(String(20), default="PENDING", nullable=False)
    exit_interview_notes = Column(Text, nullable=True)
    clearance_status = Column(String(20), default="PENDING", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
