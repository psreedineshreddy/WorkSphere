from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class OnboardingCreate(BaseModel):
    employee_id: int = Field(gt=0)
    task_name: str = Field(min_length=1, max_length=200)
    due_date: date | None = None


class OnboardingUpdate(BaseModel):
    status: Literal["PENDING", "COMPLETED"]


class OnboardingResponse(BaseModel):
    id: int
    employee_id: int
    task_name: str
    status: str
    due_date: date | None

    model_config = ConfigDict(from_attributes=True)
