from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import require_roles
from app.schemas.user import (
    AdminUserCreate,
    AdminUserResponse,
    AdminUserUpdate,
)
from app.services.security import hash_password

router = APIRouter(
    prefix="/api/admin/users",
    tags=["Admin User Management"],
)


@router.get("/", response_model=list[AdminUserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    return db.query(User).order_by(User.id.asc()).all()


@router.post(
    "/",
    response_model=AdminUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    if db.query(User).filter(
        (User.username == payload.username)
        | (User.email == str(payload.email))
    ).first():
        raise HTTPException(
            status_code=409,
            detail="Username or email already exists",
        )

    user = User(
        username=payload.username,
        email=str(payload.email),
        hashed_password=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=AdminUserResponse)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = payload.model_dump(exclude_unset=True)

    if "username" in updates and updates["username"] is not None:
        duplicate = db.query(User).filter(
            User.username == updates["username"],
            User.id != user_id,
        ).first()
        if duplicate:
            raise HTTPException(status_code=409, detail="Username already exists")

    if "email" in updates and updates["email"] is not None:
        updates["email"] = str(updates["email"])
        duplicate = db.query(User).filter(
            User.email == updates["email"],
            User.id != user_id,
        ).first()
        if duplicate:
            raise HTTPException(status_code=409, detail="Email already exists")

    for field, value in updates.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own admin account",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
