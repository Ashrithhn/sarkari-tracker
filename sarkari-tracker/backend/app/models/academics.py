from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Integer, Boolean, DateTime, Numeric,
    ForeignKey, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Cutoff(Base, TimestampMixin):
    __tablename__ = "cutoffs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_id: Mapped[Optional[int]] = mapped_column(ForeignKey("exam_stages.id", ondelete="SET NULL"), nullable=True, index=True)
    cycle_year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    
    state_or_zone: Mapped[str] = mapped_column(String(100), default="All India", nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True) # "UR", "EWS", "OBC", "SC", "ST", "PwBD-VI", "PwBD-HI", "PwBD-LD", "ESM"
    sub_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # e.g. "Hearing Impaired", "Visual"
    
    marks: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False) # e.g. 74.25
    out_of: Mapped[float] = mapped_column(Numeric(6, 2), default=100.0, nullable=False) # e.g. 80.0, 100.0, 200.0
    normalized: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    shift: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # "Shift 1", "Combined"
    
    source_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    source_pdf_page: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    verified_by: Mapped[str] = mapped_column(String(100), default="OFFICIAL_GAZETTE", nullable=False)
    verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_cutoffs_exam_year_cat", "exam_id", "cycle_year", "category"),
        Index("idx_cutoffs_exam_state_year", "exam_id", "state_or_zone", "cycle_year"),
    )

class PYQ(Base, TimestampMixin):
    __tablename__ = "pyqs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_id: Mapped[Optional[int]] = mapped_column(ForeignKey("exam_stages.id", ondelete="SET NULL"), nullable=True)
    cycle_year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    
    stage_name: Mapped[str] = mapped_column(String(50), default="Prelims", nullable=False) # "Prelims", "Mains", "Tier-1", "Tier-2"
    shift: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # "Shift 1 (Morning)", "Shift 2", "All Shifts"
    exam_date_recorded: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    subject: Mapped[str] = mapped_column(String(100), default="Comprehensive", nullable=False) # "Quantitative Aptitude", "General Studies", "Full Paper"
    
    question_paper_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    answer_key_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    solution_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    source_type: Mapped[str] = mapped_column(String(30), default="official", nullable=False) # "official", "user_uploaded", "external_link"
    attribution: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # "Official IBPS Question Bank / RTI"
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    downloads_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        Index("idx_pyqs_exam_year_stage", "exam_id", "cycle_year", "stage_name"),
    )
