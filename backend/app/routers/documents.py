import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.employee import Employee
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/documents", tags=["Document Management"])

UPLOAD_DIR = Path("uploads/documents").resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"}


def get_employee(db: Session, user: User):
    employee = db.query(Employee).filter(Employee.user_id == user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return employee


def can_access_document(document: Document, employee: Employee, user: User):
    return user.role in ("HR", "ADMIN") or document.employee_id == employee.id


@router.post("/", status_code=201)
async def upload_document(
    title: str = Form(...),
    employee_id: int | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role in ("HR", "ADMIN"):
        if employee_id is None:
            raise HTTPException(status_code=400, detail="employee_id is required for HR/Admin uploads")
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
    else:
        employee = get_employee(db, current_user)

    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    stored_filename = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOAD_DIR / stored_filename
    size = 0

    try:
        with destination.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="File exceeds 10 MB limit")
                output.write(chunk)

        document = Document(
            employee_id=employee.id,
            title=title.strip(),
            filename=Path(file.filename or "document").name,
            stored_filename=stored_filename,
            content_type=file.content_type or "application/octet-stream",
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        return {
            "id": document.id,
            "employee_id": document.employee_id,
            "title": document.title,
            "filename": document.filename,
            "content_type": document.content_type,
            "uploaded_at": document.uploaded_at,
        }
    except Exception:
        if destination.exists():
            destination.unlink()
        db.rollback()
        raise
    finally:
        await file.close()


@router.get("/")
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Document)

    if current_user.role not in ("HR", "ADMIN"):
        employee = get_employee(db, current_user)
        query = query.filter(Document.employee_id == employee.id)

    return [
        {
            "id": document.id,
            "employee_id": document.employee_id,
            "title": document.title,
            "filename": document.filename,
            "content_type": document.content_type,
            "uploaded_at": document.uploaded_at,
        }
        for document in query.order_by(Document.uploaded_at.desc()).all()
    ]


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    employee = None
    if current_user.role not in ("HR", "ADMIN"):
        employee = get_employee(db, current_user)

    if current_user.role not in ("HR", "ADMIN") and document.employee_id != employee.id:
        raise HTTPException(status_code=403, detail="Access denied")

    path = UPLOAD_DIR / document.stored_filename
    if not path.is_file() or path.parent != UPLOAD_DIR:
        raise HTTPException(status_code=404, detail="Stored file not found")

    return FileResponse(
        path=path,
        media_type=document.content_type,
        filename=document.filename,
    )
