import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
import app.models
from app.models.user import User, UserApplication, UserNotification
from app.models.exam import Exam, ExamDate, Vacancy
from app.pipeline.orchestrator import ExamPipelineOrchestrator

async def run_test():
    print("=" * 60)
    print("🚀 TESTING IBPS RRB CLERK END-TO-END PIPELINE (STEP 3)")
    print("=" * 60)

    # 1. Setup in-memory test database with full schema
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    # 2. Seed a candidate user who applied for IBPS RRB Clerk
    test_user = User(
        full_name="Pooja Patel",
        email="pooja.patel@aspirant.in",
        password_hash="test_hash_1234",
        preferred_category="OBC",
        preferred_state="Gujarat"
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)

    # Find or seed temporary exam id to link application
    dummy_exam = Exam(
        slug="ibps-rrb-clerk",
        name="IBPS RRB Office Assistant (Multipurpose) - Clerk",
        short_name="IBPS RRB Clerk",
        conducting_body="Institute of Banking Personnel Selection (IBPS)",
        category="Banking",
        official_portal_url="https://www.ibps.in",
        adapter_key="ibps",
        current_cycle_year=2026,
        is_active=True
    )
    db.add(dummy_exam)
    db.commit()
    db.refresh(dummy_exam)

    app_record = UserApplication(
        user_id=test_user.id,
        exam_id=dummy_exam.id,
        status="applied",
        application_number="IBPS-RRB-2026-981245",
        candidate_category="OBC",
        candidate_state="Gujarat"
    )
    db.add(app_record)
    db.commit()
    print(f"✅ [1/5 User Registered] Candidate '{test_user.full_name}' tracking exam as 'applied'.")

    # 3. Execute End-to-End Orchestrator Pipeline
    orchestrator = ExamPipelineOrchestrator(db, config_path="../config/exams.config.json" if os.path.exists("../config/exams.config.json") else "config/exams.config.json")
    print("⏳ [2/5 Ingesting & Scraping] Fetching IBPS portal announcements & checking ETags...")
    result = await orchestrator.run_pipeline("ibps-rrb-clerk")
    print(f"✅ [3/5 Ingestion Complete] Snapshots saved: {result['snapshots_created']}, Events discovered: {result['events_detected']}")

    # 4. Verify Database Persistence of Dates & Vacancies
    dates = db.query(ExamDate).filter(ExamDate.exam_id == dummy_exam.id).all()
    print(f"\n📅 [4/5 Extracted Milestone Timeline] ({len(dates)} dates recorded):")
    for d in dates:
        print(f"   • {d.date_type.upper().ljust(16)}: {d.date_value} (Confidence: {d.confidence * 100:.0f}%, Verified: {d.verified_by})")

    vacancies = db.query(Vacancy).filter(Vacancy.exam_id == dummy_exam.id).all()
    print(f"\n👥 [Vacancies Breakdown] Total posts: {sum(v.count for v in vacancies)} across categories:")
    for v in vacancies:
        print(f"   • Category {v.category.ljust(6)}: {v.count} posts")

    # 5. Verify Automated Notification Dispatch
    notifications = db.query(UserNotification).filter(UserNotification.user_id == test_user.id).all()
    print(f"\n🔔 [5/5 Notification Dispatcher] Candidate received {len(notifications)} personalized alert(s):")
    for n in notifications:
        print(f"   • [{n.channel.upper()} / {n.status}] {n.title}")
        print(f"     Body: {n.body}")
        print(f"     Action URL: {n.action_url}")

    assert len(dates) >= 4, "Expected at least 4 milestone dates"
    assert len(notifications) >= 1, "Expected candidate notification to be dispatched"
    print("\n" + "=" * 60)
    print("🎉 ALL END-TO-END PIPELINE CHECKS PASSED FOR IBPS RRB CLERK!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_test())
