from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class LeaveCreate(BaseModel):
    leave_type: Literal["SICK", "CASUAL", "PAID"]
    start_date: date
    end_date: date
    reason: str = Field(min_length=5, max_length=1000)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date")
        return self


class LeaveResponse(BaseModel):
    id: int
    employee_id: int
    leave_type: Literal["SICK", "CASUAL", "PAID"]
    start_date: date
    end_date: date
    reason: str
    status: Literal["PENDING", "APPROVED", "REJECTED"]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
