from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(
        Integer,
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(150), nullable=False)
    filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), unique=True, nullable=False)
    content_type = Column(String(100), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
