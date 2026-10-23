from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(
        Integer, ForeignKey("employees.id"), nullable=False, index=True
    )
    leave_type = Column(String(50), nullable=False)
    remaining_days = Column(Integer, nullable=False, default=0)
