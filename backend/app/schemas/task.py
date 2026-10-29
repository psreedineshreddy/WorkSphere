from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    assigned_to: int
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    due_date: date


class TaskStatusUpdate(BaseModel):
    status: Literal["PENDING", "COMPLETED"]


class TaskResponse(BaseModel):
    id: int
    assigned_to: int
    title: str
    description: str | None
    due_date: date
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
