from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    String, Integer, Boolean, Text, DateTime, Date,
    ForeignKey, Index
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), index=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Preferences & Contact handles
    telegram_chat_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    webpush_subscription: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    preferred_category: Mapped[str] = mapped_column(String(30), default="UR", nullable=False) # For cutoff matching
    preferred_state: Mapped[str] = mapped_column(String(100), default="All India", nullable=False)

    applications: Mapped[List["UserApplication"]] = relationship("UserApplication", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["UserNotification"]] = relationship("UserNotification", back_populates="user", cascade="all, delete-orphan")

class UserApplication(Base, TimestampMixin):
    __tablename__ = "user_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    cycle_year: Mapped[int] = mapped_column(Integer, default=2026, nullable=False)
    
    # Statuses: "interested", "applied", "admit_card_downloaded", "appeared", "result_awaiting", "qualified", "not_qualified"
    status: Mapped[str] = mapped_column(String(40), default="applied", index=True, nullable=False)
    application_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # User-entered, optional
    roll_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    candidate_category: Mapped[str] = mapped_column(String(30), default="UR", nullable=False)
    candidate_state: Mapped[str] = mapped_column(String(100), default="All India", nullable=False)
    
    user_exam_center: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="applications")

    __table_args__ = (
        Index("idx_user_apps_user_exam", "user_id", "exam_id", unique=True),
        Index("idx_user_apps_status", "status"),
    )

class UserNotification(Base, TimestampMixin):
    __tablename__ = "user_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id: Mapped[Optional[int]] = mapped_column(ForeignKey("exam_events.id", ondelete="SET NULL"), nullable=True)
    
    channel: Mapped[str] = mapped_column(String(30), default="email", nullable=False) # "email", "webpush", "telegram"
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    action_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    # Status: "QUEUED", "SENT", "DELIVERED", "FAILED", "READ"
    status: Mapped[str] = mapped_column(String(30), default="QUEUED", index=True, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="notifications")

    __table_args__ = (
        Index("idx_user_notifs_user_status", "user_id", "status"),
        Index("idx_user_notifs_exam_event", "exam_id", "event_id"),
    )
