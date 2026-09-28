from datetime import datetime, date, time
from typing import Optional, List
from sqlalchemy import (
    String, Integer, Boolean, Text, Date, Time, DateTime, 
    ForeignKey, Index, Float, Numeric
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Exam(Base, TimestampMixin):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    short_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    conducting_body: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # Banking, SSC, UPSC, Railway, PSU, Defence
    
    official_portal_url: Mapped[str] = mapped_column(String(500), nullable=False)
    careers_page_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    notification_archive_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    adapter_key: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "ibps", "ssc", "upsc", "isro"
    scrape_frequency_minutes: Mapped[int] = mapped_column(Integer, default=360, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    current_cycle_year: Mapped[int] = mapped_column(Integer, default=2026, index=True, nullable=False)
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    eligibility_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    age_limit_summary: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    fee_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True) # {UR: 850, SC: 175, ...}
    syllabus_meta: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Relationships
    stages: Mapped[List["ExamStage"]] = relationship("ExamStage", back_populates="exam", cascade="all, delete-orphan")
    dates: Mapped[List["ExamDate"]] = relationship("ExamDate", back_populates="exam", cascade="all, delete-orphan")
    vacancies: Mapped[List["Vacancy"]] = relationship("Vacancy", back_populates="exam", cascade="all, delete-orphan")
    events: Mapped[List["ExamEvent"]] = relationship("ExamEvent", back_populates="exam", cascade="all, delete-orphan")

class ExamStage(Base, TimestampMixin):
    __tablename__ = "exam_stages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False) # "Prelims (Tier-I)", "Mains (Tier-II)", "Interview"
    code: Mapped[str] = mapped_column(String(50), nullable=False) # "PRE", "MAINS", "INTV"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="stages")

class ExamDate(Base, TimestampMixin):
    __tablename__ = "exam_dates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_id: Mapped[Optional[int]] = mapped_column(ForeignKey("exam_stages.id", ondelete="SET NULL"), nullable=True, index=True)
    cycle_year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    
    # Date Types: "notification", "apply_start", "apply_end", "fee_payment_end", "admit_card", "exam_start", "exam_end", "result"
    date_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    date_value: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    time_value: Mapped[Optional[time]] = mapped_column(Time, nullable=True) # e.g. 23:59:00 for last date cutoff
    
    is_extended: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    original_date_value: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    
    source_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    official_pdf_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    verified_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # "AUTO_EXTRACTION" or admin username
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="dates")

    __table_args__ = (
        Index("idx_exam_dates_exam_year", "exam_id", "cycle_year"),
        Index("idx_exam_dates_type_date", "date_type", "date_value"),
    )

class Vacancy(Base, TimestampMixin):
    __tablename__ = "vacancies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[int] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    cycle_year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    post_name: Mapped[str] = mapped_column(String(200), nullable=False) # e.g., "Office Assistant (Multipurpose)"
    
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # "UR", "EWS", "OBC", "SC", "ST", "PwBD", "TOTAL"
    state_or_region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True) # "All India", "Karnataka", "Uttar Pradesh", etc.
    count: Mapped[int] = mapped_column(Integer, nullable=False)
    
    source_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    exam: Mapped["Exam"] = relationship("Exam", back_populates="vacancies")

    __table_args__ = (
        Index("idx_vacancies_exam_year_cat", "exam_id", "cycle_year", "category"),
    )
