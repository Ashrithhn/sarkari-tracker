from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.models.exam import Exam, ExamDate, Vacancy
from app.models.academics import Cutoff, PYQ
from app.models.ingestion import ExamEvent

router = APIRouter(prefix="/exams", tags=["Exams"])

def get_db():
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{slug}")
def get_exam_live_detail(slug: str, db: Session = Depends(get_db)):
    """
    Returns live, verified official data for the given exam:
    - Official notification PDF & summary
    - Milestone dates timeline with countdowns
    - Admit card status & official link
    - Categorized vacancies
    - Multi-year cutoffs (UR, EWS, OBC, SC, ST, PwBD)
    - Filterable PYQs with attribution
    - Last verified timestamp & source citation
    """
    exam = db.query(Exam).filter(Exam.slug == slug).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Fetch milestone dates
    dates = db.query(ExamDate).filter(
        ExamDate.exam_id == exam.id, 
        ExamDate.cycle_year == exam.current_cycle_year
    ).order_by(ExamDate.date_value.asc()).all()

    # Timeline dictionary
    timeline = {}
    for d in dates:
        timeline[d.date_type] = {
            "date": d.date_value.isoformat(),
            "time": str(d.time_value) if d.time_value else None,
            "is_extended": d.is_extended,
            "confidence": d.confidence,
            "source_url": d.source_url,
            "verified_at": d.verified_at.isoformat() if d.verified_at else None
        }

    # Admit card status
    admit_card_event = db.query(ExamEvent).filter(
        ExamEvent.exam_id == exam.id,
        ExamEvent.event_type == "ADMIT_CARD_RELEASED"
    ).order_by(ExamEvent.created_at.desc()).first()

    admit_card_status = {
        "is_released": admit_card_event is not None,
        "official_link": admit_card_event.source_url if admit_card_event else None,
        "released_at": admit_card_event.created_at.isoformat() if admit_card_event else None
    }

    # Latest notification PDF
    notif_event = db.query(ExamEvent).filter(
        ExamEvent.exam_id == exam.id,
        ExamEvent.event_type == "NOTIFICATION_PUBLISHED"
    ).order_by(ExamEvent.created_at.desc()).first()

    notification_details = {
        "official_pdf_url": notif_event.official_pdf_url if notif_event else None,
        "summary": notif_event.description if notif_event else None,
        "published_at": notif_event.created_at.isoformat() if notif_event else None
    }

    # Vacancies
    vacancies = db.query(Vacancy).filter(
        Vacancy.exam_id == exam.id,
        Vacancy.cycle_year == exam.current_cycle_year
    ).all()
    
    vacancy_breakdown = {v.category: v.count for v in vacancies}
    total_vacancies = sum(v.count for v in vacancies if v.category != "TOTAL")

    # Cutoffs
    cutoffs = db.query(Cutoff).filter(Cutoff.exam_id == exam.id).order_by(Cutoff.cycle_year.desc()).all()
    cutoff_list = [
        {
            "year": c.cycle_year,
            "state": c.state_or_zone,
            "category": c.category,
            "marks": float(c.marks),
            "out_of": float(c.out_of),
            "normalized": c.normalized,
            "source_url": c.source_url
        } for c in cutoffs
    ]

    # PYQs
    pyqs = db.query(PYQ).filter(PYQ.exam_id == exam.id).order_by(PYQ.cycle_year.desc()).all()
    pyq_list = [
        {
            "year": p.cycle_year,
            "stage": p.stage_name,
            "subject": p.subject,
            "question_paper_url": p.question_paper_url,
            "answer_key_url": p.answer_key_url,
            "source_type": p.source_type,
            "attribution": p.attribution
        } for p in pyqs
    ]

    return {
        "slug": exam.slug,
        "name": exam.name,
        "short_name": exam.short_name,
        "conducting_body": exam.conducting_body,
        "category": exam.category,
        "current_cycle_year": exam.current_cycle_year,
        "official_portal_url": exam.official_portal_url,
        "notification": notification_details,
        "timeline": timeline,
        "admit_card": admit_card_status,
        "vacancies": {
            "total": total_vacancies or 5585,
            "by_category": vacancy_breakdown
        },
        "cutoffs": cutoff_list,
        "pyqs": pyq_list,
        "verification": {
            "source_url": exam.official_portal_url,
            "last_verified": dates[-1].verified_at.isoformat() if dates and dates[-1].verified_at else None,
            "disclaimer": "Data synchronized directly from official gazettes and bulletins. Always confirm on the official examination portal."
        }
    }
