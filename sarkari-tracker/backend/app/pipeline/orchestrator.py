import json
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.exam import Exam, ExamDate, Vacancy, ExamStage
from app.models.ingestion import NotificationRaw, ExamEvent, ReviewQueue, ScrapeRun
from app.models.user import UserApplication, UserNotification
from app.scrapers.adapters.ibps_adapter import IBPSRRBClerkAdapter
from app.extractors.llm_extractor import llm_extractor

logger = logging.getLogger("sarkari_pipeline")

class ExamPipelineOrchestrator:
    """
    Executes the complete End-to-End Lifecycle for an exam:
    Scrape -> Extract -> Review/Validate -> Persist -> Notify.
    """

    def __init__(self, db: Session, config_path: str = "config/exams.config.json"):
        self.db = db
        with open(config_path, "r") as f:
            self.registry = json.load(f)["registry"]

    def get_config(self, slug: str) -> Dict[str, Any]:
        for c in self.registry:
            if c["slug"] == slug:
                return c
        raise ValueError(f"Exam slug '{slug}' not found in registry")

    async def run_pipeline(self, exam_slug: str) -> Dict[str, Any]:
        config = self.get_config(exam_slug)
        start_time = datetime.utcnow()
        
        # 1. Ensure Exam row exists in DB
        exam = self.db.query(Exam).filter(Exam.slug == exam_slug).first()
        if not exam:
            exam = Exam(
                slug=exam_slug,
                name=config["name"],
                short_name=config["short_name"],
                conducting_body=config["conducting_body"],
                category=config["category"],
                official_portal_url=config["official_urls"]["portal"],
                careers_page_url=config["official_urls"].get("careers"),
                adapter_key=config["adapter_key"],
                scrape_frequency_minutes=config.get("scrape_frequency_minutes", 60),
                current_cycle_year=config.get("current_cycle_year", 2026),
                is_active=True
            )
            self.db.add(exam)
            self.db.commit()
            self.db.refresh(exam)

        # 2. INGESTION & SCRAPING
        adapter = IBPSRRBClerkAdapter(config)
        listing_items = await adapter.fetch_listing()
        events_discovered = []
        new_snapshots = 0

        for item in listing_items:
            raw_result = await adapter.fetch_detail(item)
            
            # Save Raw Snapshot for Auditing
            snapshot = NotificationRaw(
                exam_id=exam.id,
                source_url=raw_result.url,
                http_status=raw_result.http_status,
                content_hash=raw_result.content_hash,
                etag=raw_result.etag,
                file_type="pdf" if item.is_pdf else "html",
                raw_text_preview=raw_result.content_bytes.decode("utf-8", errors="ignore")[:1000],
                fetched_at=datetime.utcnow()
            )
            self.db.add(snapshot)
            self.db.commit()
            self.db.refresh(snapshot)
            new_snapshots += 1

            # Detect Events
            parsed_evts = adapter.parse_events(raw_result, item)
            for evt in parsed_evts:
                evt["snapshot_id"] = snapshot.id
                events_discovered.append(evt)

        # 3. EXTRACTION LAYER (LLM / Structured Parsing)
        pipeline_results = []
        for evt in events_discovered:
            if evt["event_type"] == "NOTIFICATION_PUBLISHED":
                raw_text = evt.get("raw_text", "")
                schema_data, val_error = await llm_extractor.extract_from_text(
                    raw_text=raw_text,
                    exam_slug=exam.slug,
                    cycle_year=exam.current_cycle_year,
                    source_url=evt["source_url"]
                )

                # 4. HUMAN-IN-THE-LOOP & VERIFICATION LOGIC
                if val_error or not schema_data or schema_data.confidence < 0.85:
                    # Confidence below 0.85 or validation failure -> Route to Review Queue
                    review_item = ReviewQueue(
                        exam_id=exam.id,
                        event_type=evt["event_type"],
                        raw_extracted_data={"text_preview": raw_text[:500]},
                        proposed_changes=schema_data.model_dump() if schema_data else {},
                        confidence=schema_data.confidence if schema_data else 0.0,
                        failure_reason=val_error or "CONFIDENCE_BELOW_0.85",
                        source_pdf_url=evt["source_url"],
                        status="PENDING"
                    )
                    self.db.add(review_item)
                    self.db.commit()
                    pipeline_results.append({"status": "QUEUED_FOR_ADMIN_REVIEW", "reason": review_item.failure_reason})
                else:
                    # Validated with confidence >= 0.85 -> Auto-Publish
                    self._persist_verified_data(exam, schema_data, evt)
                    pipeline_results.append({"status": "AUTO_PUBLISHED", "data": schema_data.model_dump()})

            elif evt["event_type"] in ["ADMIT_CARD_RELEASED", "RESULT_DECLARED"]:
                # Log official event
                exam_event = ExamEvent(
                    exam_id=exam.id,
                    event_type=evt["event_type"],
                    title=evt["title"],
                    source_url=evt["source_url"],
                    official_pdf_url=evt.get("official_pdf_url"),
                    payload={"status": "live", "portal_url": evt["source_url"]},
                    is_processed_for_alerts=False,
                    is_verified=True
                )
                self.db.add(exam_event)
                self.db.commit()
                self.db.refresh(exam_event)

                # Trigger Notifications immediately
                self._dispatch_user_notifications(exam, exam_event)
                pipeline_results.append({"status": "EVENT_RECORDED_AND_NOTIFIED", "event": evt["event_type"]})

        # Record Scrape Run Telemetry
        duration = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        scrape_run = ScrapeRun(
            exam_id=exam.id,
            adapter_key=config["adapter_key"],
            status="SUCCESS",
            duration_ms=duration,
            items_found=len(listing_items),
            new_events_count=len(events_discovered),
            started_at=start_time,
            completed_at=datetime.utcnow()
        )
        self.db.add(scrape_run)
        self.db.commit()

        return {
            "exam": exam.short_name,
            "cycle_year": exam.current_cycle_year,
            "snapshots_created": new_snapshots,
            "events_detected": len(events_discovered),
            "pipeline_actions": pipeline_results
        }

    def _persist_verified_data(self, exam: Exam, data: Any, evt: Dict[str, Any]):
        # Clear/update previous dates for this cycle
        self.db.query(ExamDate).filter(
            ExamDate.exam_id == exam.id, 
            ExamDate.cycle_year == exam.current_cycle_year
        ).delete()

        dates = data.dates
        dates_to_insert = [
            ("apply_start", dates.apply_start, False),
            ("apply_end", dates.apply_end, False),
            ("fee_payment_end", dates.fee_payment_end, False),
            ("admit_card", dates.admit_card_prelims, False),
            ("exam_start", dates.exam_date_prelims, False),
            ("result", dates.result_date_prelims, False),
        ]

        for dtype, dval, is_ext in dates_to_insert:
            if dval:
                self.db.add(
                    ExamDate(
                        exam_id=exam.id,
                        cycle_year=exam.current_cycle_year,
                        date_type=dtype,
                        date_value=dval,
                        is_extended=is_ext,
                        confidence=data.confidence,
                        source_url=data.official_pdf_url,
                        official_pdf_url=data.official_pdf_url,
                        verified_by="CLAUDE_VERIFIED_EXTRACTOR",
                        verified_at=datetime.utcnow()
                    )
                )

        # Update Vacancies
        self.db.query(Vacancy).filter(
            Vacancy.exam_id == exam.id, 
            Vacancy.cycle_year == exam.current_cycle_year
        ).delete()

        for cat, count in (data.vacancies.by_category or {}).items():
            self.db.add(
                Vacancy(
                    exam_id=exam.id,
                    cycle_year=exam.current_cycle_year,
                    post_name=data.post_names[0] if data.post_names else "Office Assistant",
                    category=cat,
                    state_or_region="All India",
                    count=count,
                    source_url=data.official_pdf_url,
                    confidence=data.confidence,
                    verified_at=datetime.utcnow()
                )
            )

        # Record NOTIFICATION_PUBLISHED Exam Event
        event = ExamEvent(
            exam_id=exam.id,
            raw_snapshot_id=evt.get("snapshot_id"),
            event_type="NOTIFICATION_PUBLISHED",
            title=f"{exam.short_name} Official Notification Published",
            description=f"Total Vacancies: {data.vacancies.total}. Last date to apply: {dates.apply_end}.",
            source_url=data.official_pdf_url,
            official_pdf_url=data.official_pdf_url,
            payload=data.model_dump(mode="json"),
            is_processed_for_alerts=False,
            is_verified=True
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)

        # Notify active candidate subscribers
        self._dispatch_user_notifications(exam, event)

    def _dispatch_user_notifications(self, exam: Exam, event: ExamEvent):
        # Find candidates tracking this exam as 'applied' or 'interested'
        candidates = self.db.query(UserApplication).filter(
            UserApplication.exam_id == exam.id,
            UserApplication.status.in_(["applied", "interested"])
        ).all()

        for app in candidates:
            notif = UserNotification(
                user_id=app.user_id,
                exam_id=exam.id,
                event_id=event.id,
                channel="email",
                title=f"Update: {exam.short_name} - {event.event_type.replace('_', ' ').title()}",
                body=f"Official update for {exam.name}: {event.title}. View timeline and links on Sarkari Tracker.",
                action_url=f"/exam/{exam.slug}",
                status="QUEUED"
            )
            self.db.add(notif)

        event.is_processed_for_alerts = True
        self.db.commit()
