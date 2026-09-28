from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Integer, Boolean, Text, DateTime, 
    ForeignKey, Index, Float
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class NotificationRaw(Base, TimestampMixin):
    __tablename__ = "notifications_raw"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    source_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    
    http_status: Mapped[int] = mapped_column(Integer, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True) # SHA-256 of raw content
    etag: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    last_modified_header: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    file_type: Mapped[str] = mapped_column(String(20), default="html", nullable=False) # "html", "pdf", "rss"
    s3_snapshot_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True) # Key in MinIO / S3 bucket
    raw_text_preview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)

class ExamEvent(Base, TimestampMixin):
    __tablename__ = "exam_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_id: Mapped[Optional[int]] = mapped_column(ForeignKey("exam_stages.id", ondelete="SET NULL"), nullable=True)
    raw_snapshot_id: Mapped[Optional[int]] = mapped_column(ForeignKey("notifications_raw.id", ondelete="SET NULL"), nullable=True)
    
    # Event Types: NOTIFICATION_PUBLISHED, DATE_EXTENDED, ADMIT_CARD_RELEASED, RESULT_DECLARED, CUTOFF_PUBLISHED, CORRIGENDUM
    event_type: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    official_pdf_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    payload: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False) # Extracted dates, diff markers, metadata
    is_processed_for_alerts: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="events")

    __table_args__ = (
        Index("idx_exam_events_type_created", "exam_id", "event_type", "created_at"),
    )

class ScrapeRun(Base, TimestampMixin):
    __tablename__ = "scrape_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    adapter_key: Mapped[str] = mapped_column(String(50), nullable=False)
    
    status: Mapped[str] = mapped_column(String(30), nullable=False, index=True) # "SUCCESS", "FAILED", "UNCHANGED", "SKIPPED"
    http_status: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    items_found: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    new_events_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        Index("idx_scrape_runs_status_started", "status", "started_at"),
    )

class ReviewQueue(Base, TimestampMixin):
    __tablename__ = "review_queue"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(60), nullable=False)
    
    raw_extracted_data: Mapped[dict] = mapped_column(JSONB, nullable=False) # Raw JSON from Claude / Parsers
    proposed_changes: Mapped[dict] = mapped_column(JSONB, nullable=False) # Normalized schema proposed to be written
    diff_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    confidence: Mapped[float] = mapped_column(Float, nullable=False) # e.g. 0.72 (< 0.85 triggers review)
    failure_reason: Mapped[str] = mapped_column(String(255), nullable=False) # "CONFIDENCE_BELOW_THRESHOLD", "ILLOGICAL_DATE_SEQUENCE", "VACANCY_MISMATCH"
    
    source_pdf_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    s3_pdf_key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    status: Mapped[str] = mapped_column(String(30), default="PENDING", index=True, nullable=False) # "PENDING", "APPROVED", "REJECTED", "EDITED"
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index("idx_review_queue_status_created", "status", "created_at"),
    )
