from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1)


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    message: str
    created_by: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
