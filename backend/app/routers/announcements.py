
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.announcement import Announcement
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.announcement import AnnouncementCreate, AnnouncementResponse

router = APIRouter(
    prefix="/api/announcements",
    tags=["Announcements"],
)


@router.post("/", response_model=AnnouncementResponse, status_code=201)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["HR", "ADMIN"]:
        raise HTTPException(
            status_code=403,
            detail="Only HR or Admin can create announcements",
        )

    announcement = Announcement(
        title=payload.title.strip(),
        message=payload.message.strip(),
        created_by=current_user.id,
    )

    if not announcement.title or not announcement.message:
        raise HTTPException(
            status_code=422,
            detail="Title and message cannot be empty",
        )

    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement


@router.get("/", response_model=list[AnnouncementResponse])
def list_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Announcement)
        .order_by(Announcement.created_at.desc())
        .all()
    )


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    announcement = db.query(Announcement).filter(
        Announcement.id == announcement_id
    ).first()

    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    return announcement


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ["HR", "ADMIN"]:
        raise HTTPException(
            status_code=403,
            detail="Only HR or Admin can delete announcements",
        )

    announcement = db.query(Announcement).filter(
        Announcement.id == announcement_id
    ).first()

    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    db.delete(announcement)
    db.commit()

    return {"message": "Announcement deleted successfully"}

