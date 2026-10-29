from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


UserRole = Literal["EMPLOYEE", "HR", "ADMIN"]


class AdminUserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = "EMPLOYEE"


class AdminUserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
class ProfileUpdate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class NotificationPreferences(BaseModel):
    announcement_notifications: bool = True
    leave_notifications: bool = True
    payroll_notifications: bool = True
    attendance_notifications: bool = True