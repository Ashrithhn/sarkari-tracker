"""Initial migration creating all production SarkariTracker tables and indexes

Revision ID: 001_initial_sarkari_schema
Revises: 
Create Date: 2026-09-28 11:58:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial_sarkari_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. EXAMS
    op.create_table(
        'exams',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('short_name', sa.String(length=100), nullable=False),
        sa.Column('conducting_body', sa.String(length=150), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('official_portal_url', sa.String(length=500), nullable=False),
        sa.Column('careers_page_url', sa.String(length=500), nullable=True),
        sa.Column('notification_archive_url', sa.String(length=500), nullable=True),
        sa.Column('adapter_key', sa.String(length=50), nullable=False),
        sa.Column('scrape_frequency_minutes', sa.Integer(), server_default='360', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('current_cycle_year', sa.Integer(), server_default='2026', nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('eligibility_summary', sa.Text(), nullable=True),
        sa.Column('age_limit_summary', sa.String(length=255), nullable=True),
        sa.Column('fee_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('syllabus_meta', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_exams_slug', 'exams', ['slug'], unique=True)
    op.create_index('ix_exams_category', 'exams', ['category'])
    op.create_index('ix_exams_conducting_body', 'exams', ['conducting_body'])
    op.create_index('ix_exams_is_active', 'exams', ['is_active'])

    # 2. EXAM_STAGES
    op.create_table(
        'exam_stages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('stage_order', sa.Integer(), server_default='1', nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_exam_stages_exam_id', 'exam_stages', ['exam_id'])

    # 3. EXAM_DATES
    op.create_table(
        'exam_dates',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('stage_id', sa.Integer(), nullable=True),
        sa.Column('cycle_year', sa.Integer(), nullable=False),
        sa.Column('date_type', sa.String(length=50), nullable=False),
        sa.Column('date_value', sa.Date(), nullable=False),
        sa.Column('time_value', sa.Time(), nullable=True),
        sa.Column('is_extended', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('original_date_value', sa.Date(), nullable=True),
        sa.Column('confidence', sa.Float(), server_default='1.0', nullable=False),
        sa.Column('source_url', sa.String(length=1000), nullable=False),
        sa.Column('official_pdf_url', sa.String(length=1000), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('verified_by', sa.String(length=100), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['stage_id'], ['exam_stages.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_exam_dates_exam_year', 'exam_dates', ['exam_id', 'cycle_year'])
    op.create_index('idx_exam_dates_type_date', 'exam_dates', ['date_type', 'date_value'])

    # 4. VACANCIES
    op.create_table(
        'vacancies',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('cycle_year', sa.Integer(), nullable=False),
        sa.Column('post_name', sa.String(length=200), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('state_or_region', sa.String(length=100), nullable=True),
        sa.Column('count', sa.Integer(), nullable=False),
        sa.Column('source_url', sa.String(length=1000), nullable=False),
        sa.Column('confidence', sa.Float(), server_default='1.0', nullable=False),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_vacancies_exam_year_cat', 'vacancies', ['exam_id', 'cycle_year', 'category'])

    # 5. NOTIFICATIONS_RAW (Snapshots)
    op.create_table(
        'notifications_raw',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('source_url', sa.String(length=1000), nullable=False),
        sa.Column('http_status', sa.Integer(), nullable=False),
        sa.Column('content_hash', sa.String(length=64), nullable=False),
        sa.Column('etag', sa.String(length=200), nullable=True),
        sa.Column('last_modified_header', sa.String(length=200), nullable=True),
        sa.Column('file_type', sa.String(length=20), server_default='html', nullable=False),
        sa.Column('s3_snapshot_key', sa.String(length=500), nullable=True),
        sa.Column('raw_text_preview', sa.Text(), nullable=True),
        sa.Column('fetched_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notifications_raw_content_hash', 'notifications_raw', ['content_hash'])
    op.create_index('ix_notifications_raw_fetched_at', 'notifications_raw', ['fetched_at'])

    # 6. EXAM_EVENTS
    op.create_table(
        'exam_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('stage_id', sa.Integer(), nullable=True),
        sa.Column('raw_snapshot_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=60), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('source_url', sa.String(length=1000), nullable=False),
        sa.Column('official_pdf_url', sa.String(length=1000), nullable=True),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('is_processed_for_alerts', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_verified', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['stage_id'], ['exam_stages.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['raw_snapshot_id'], ['notifications_raw.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_exam_events_type_created', 'exam_events', ['exam_id', 'event_type', 'created_at'])

    # 7. SCRAPE_RUNS
    op.create_table(
        'scrape_runs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('adapter_key', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('http_status', sa.Integer(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('items_found', sa.Integer(), server_default='0', nullable=False),
        sa.Column('new_events_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_scrape_runs_status_started', 'scrape_runs', ['status', 'started_at'])

    # 8. REVIEW_QUEUE (Human in the loop)
    op.create_table(
        'review_queue',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(length=60), nullable=False),
        sa.Column('raw_extracted_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('proposed_changes', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('diff_summary', sa.Text(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('failure_reason', sa.String(length=255), nullable=False),
        sa.Column('source_pdf_url', sa.String(length=1000), nullable=False),
        sa.Column('s3_pdf_key', sa.String(length=500), nullable=True),
        sa.Column('status', sa.String(length=30), server_default='PENDING', nullable=False),
        sa.Column('reviewed_by', sa.String(length=100), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_review_queue_status_created', 'review_queue', ['status', 'created_at'])

    # 9. CUTOFFS
    op.create_table(
        'cutoffs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('stage_id', sa.Integer(), nullable=True),
        sa.Column('cycle_year', sa.Integer(), nullable=False),
        sa.Column('state_or_zone', sa.String(length=100), server_default='All India', nullable=False),
        sa.Column('category', sa.String(length=30), nullable=False),
        sa.Column('sub_category', sa.String(length=50), nullable=True),
        sa.Column('marks', sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column('out_of', sa.Numeric(precision=6, scale=2), server_default='100.0', nullable=False),
        sa.Column('normalized', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('shift', sa.String(length=50), nullable=True),
        sa.Column('source_url', sa.String(length=1000), nullable=False),
        sa.Column('source_pdf_page', sa.Integer(), nullable=True),
        sa.Column('verified_by', sa.String(length=100), server_default='OFFICIAL_GAZETTE', nullable=False),
        sa.Column('verified_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['stage_id'], ['exam_stages.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_cutoffs_exam_year_cat', 'cutoffs', ['exam_id', 'cycle_year', 'category'])
    op.create_index('idx_cutoffs_exam_state_year', 'cutoffs', ['exam_id', 'state_or_zone', 'cycle_year'])

    # 10. PYQS
    op.create_table(
        'pyqs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('stage_id', sa.Integer(), nullable=True),
        sa.Column('cycle_year', sa.Integer(), nullable=False),
        sa.Column('stage_name', sa.String(length=50), server_default='Prelims', nullable=False),
        sa.Column('shift', sa.String(length=50), nullable=True),
        sa.Column('exam_date_recorded', sa.String(length=50), nullable=True),
        sa.Column('subject', sa.String(length=100), server_default='Comprehensive', nullable=False),
        sa.Column('question_paper_url', sa.String(length=1000), nullable=False),
        sa.Column('answer_key_url', sa.String(length=1000), nullable=True),
        sa.Column('solution_url', sa.String(length=1000), nullable=True),
        sa.Column('source_type', sa.String(length=30), server_default='official', nullable=False),
        sa.Column('attribution', sa.String(length=255), nullable=True),
        sa.Column('is_verified', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('downloads_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['stage_id'], ['exam_stages.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_pyqs_exam_year_stage', 'pyqs', ['exam_id', 'cycle_year', 'stage_name'])

    # 11. USERS
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_admin', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('telegram_chat_id', sa.String(length=100), nullable=True),
        sa.Column('webpush_subscription', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('preferred_category', sa.String(length=30), server_default='UR', nullable=False),
        sa.Column('preferred_state', sa.String(length=100), server_default='All India', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_phone_number', 'users', ['phone_number'])

    # 12. USER_APPLICATIONS
    op.create_table(
        'user_applications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('cycle_year', sa.Integer(), server_default='2026', nullable=False),
        sa.Column('status', sa.String(length=40), server_default='applied', nullable=False),
        sa.Column('application_number', sa.String(length=100), nullable=True),
        sa.Column('roll_number', sa.String(length=100), nullable=True),
        sa.Column('candidate_category', sa.String(length=30), server_default='UR', nullable=False),
        sa.Column('candidate_state', sa.String(length=100), server_default='All India', nullable=False),
        sa.Column('user_exam_center', sa.String(length=200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_apps_user_exam', 'user_applications', ['user_id', 'exam_id'], unique=True)
    op.create_index('idx_user_apps_status', 'user_applications', ['status'])

    # 13. USER_NOTIFICATIONS
    op.create_table(
        'user_notifications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=True),
        sa.Column('channel', sa.String(length=30), server_default='email', nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('action_url', sa.String(length=1000), nullable=True),
        sa.Column('status', sa.String(length=30), server_default='QUEUED', nullable=False),
        sa.Column('error_message', sa.String(length=500), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['exam_events.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['exam_id'], ['exams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_user_notifs_user_status', 'user_notifications', ['user_id', 'status'])
    op.create_index('idx_user_notifs_exam_event', 'user_notifications', ['exam_id', 'event_id'])

def downgrade() -> None:
    op.drop_table('user_notifications')
    op.drop_table('user_applications')
    op.drop_table('users')
    op.drop_table('pyqs')
    op.drop_table('cutoffs')
    op.drop_table('review_queue')
    op.drop_table('scrape_runs')
    op.drop_table('exam_events')
    op.drop_table('notifications_raw')
    op.drop_table('vacancies')
    op.drop_table('exam_dates')
    op.drop_table('exam_stages')
    op.drop_table('exams')
