from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    date: date
    check_in: datetime | None
    check_out: datetime | None
    status: Literal["PRESENT", "ABSENT", "HALF_DAY"]

    model_config = ConfigDict(from_attributes=True)


class AttendanceHistoryResponse(AttendanceResponse):
    working_hours: float | None = None
