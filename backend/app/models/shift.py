from sqlalchemy import Column, Integer, String, Time, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    employee_shifts = relationship(
        "EmployeeShift",
        back_populates="shift",
        cascade="all, delete-orphan",
    )


class EmployeeShift(Base):
    __tablename__ = "employee_shifts"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    shift_id = Column(
        Integer,
        ForeignKey("shifts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    employee = relationship("Employee")
    shift = relationship("Shift", back_populates="employee_shifts")