from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ResignationCreate(BaseModel):
    reason: str = Field(min_length=1, max_length=2000)
    last_working_day: date


class ResignationUpdate(BaseModel):
    status: Literal["APPROVED", "REJECTED"]
    exit_interview_notes: str | None = None
    clearance_status: Literal["PENDING", "COMPLETED"] | None = None


class ResignationResponse(BaseModel):
    id: int
    employee_id: int
    reason: str
    resignation_date: date
    last_working_day: date
    status: str
    exit_interview_notes: str | None
    clearance_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
