from datetime import date
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, field_validator

class ExtractedDates(BaseModel):
    notification_date: Optional[date] = None
    apply_start: Optional[date] = None
    apply_end: Optional[date] = None
    fee_payment_end: Optional[date] = None
    admit_card_prelims: Optional[date] = None
    exam_date_prelims: Optional[date] = None
    exam_date_mains: Optional[date] = None
    result_date_prelims: Optional[date] = None

    @field_validator("apply_end")
    @classmethod
    def validate_apply_dates(cls, v, info):
        apply_start = info.data.get("apply_start")
        if v and apply_start and v < apply_start:
            raise ValueError(f"Last date to apply ({v}) cannot be earlier than apply start date ({apply_start})")
        return v

class CategoryVacancies(BaseModel):
    UR: Optional[int] = 0
    EWS: Optional[int] = 0
    OBC: Optional[int] = 0
    SC: Optional[int] = 0
    ST: Optional[int] = 0
    PwBD: Optional[int] = 0

class ExtractedVacancies(BaseModel):
    total: int = Field(..., description="Total aggregate vacancies declared")
    by_category: Optional[Dict[str, int]] = Field(default_factory=dict)
    by_state: Optional[Dict[str, int]] = Field(default_factory=dict)

class ExtractedEligibility(BaseModel):
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    age_relaxation_notes: Optional[str] = None
    qualification: str = Field(..., description="Minimum educational qualification required")
    experience_required: bool = False

class NotificationExtractionSchema(BaseModel):
    exam_id: str
    cycle_year: int
    post_names: List[str]
    dates: ExtractedDates
    vacancies: ExtractedVacancies
    eligibility: ExtractedEligibility
    fee_by_category: Dict[str, float] = Field(default_factory=dict)
    official_pdf_url: str
    official_apply_url: Optional[str] = None
    admit_card_url: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    source_page_refs: List[int] = Field(default_factory=list)
    extraction_notes: Optional[str] = None
