import assert from 'assert';

const BASE_URL = 'http://localhost:3001';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('🚀 Starting SarkariTracker End-to-End System Verification...\n');

  // 1. Authenticate Admin and Student
  console.log('1. Testing Authentication...');
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@sarkari.in', password: 'admin123' })
  });
  assert.strictEqual(adminLogin.status, 200, 'Admin login failed');
  const adminToken = adminLogin.data.token;
  console.log('   ✓ Admin login successful. is_admin =', adminLogin.data.user.is_admin);

  const studentLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student@sarkari.in', password: 'student123' })
  });
  assert.strictEqual(studentLogin.status, 200, 'Student login failed');
  const studentToken = studentLogin.data.token;
  console.log('   ✓ Student login successful. ID =', studentLogin.data.user.id);

  // Clean student applications to ensure repeatable test execution
  const existingJobs = await request('/api/jobs', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  for (const j of existingJobs.data || []) {
    await request(`/api/jobs/${j.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
  }
  console.log('   ✓ Test workspace cleaned (0 previous test applications).');

  // 2. Verify Exam Registry (Rule Zero: No Dummy Data)
  console.log('\n2. Verifying Official Exam Registry...');
  const examsRes = await request('/api/exams');
  assert.strictEqual(examsRes.status, 200);
  assert.ok(examsRes.data.length >= 80, `Expected at least 80 official exams, got ${examsRes.data.length}`);
  console.log(`   ✓ Loaded ${examsRes.data.length} official exams from registry.`);
  
  // Verify that empty exams don't have fake dates
  const sampleExam = examsRes.data.find(e => e.short_name.includes('KEA FDA') || e.short_name.includes('SSC CGL'));
  assert.ok(sampleExam, 'Expected KEA FDA or SSC CGL in registry');
  console.log(`   ✓ Inspected sample exam '${sampleExam.short_name}': data_status = '${sampleExam.data_status}'`);

  const detailRes = await request(`/api/exams/${sampleExam.id}`);
  assert.strictEqual(detailRes.status, 200);
  assert.strictEqual(detailRes.data.historicalCutoffs.length, 0, 'Rule Zero violation: sample exam should have 0 fake cutoffs');
  assert.strictEqual(detailRes.data.pyqs.length, 0, 'Rule Zero violation: sample exam should have 0 fake pyqs');
  console.log('   ✓ Verified: 0 fake cutoffs, 0 fake PYQs in unverified exam.');

  // 3. Candidate Tracks an Official Exam (Mode A)
  console.log('\n3. Testing Tracking an Official Exam (Mode A)...');
  const applyRes = await request('/api/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      exam_id: sampleExam.id,
      category: '2A',
      registration_number: 'KEA-2026-9921',
      roll_number: 'BLR-0412',
      fee_paid: 1,
      user_exam_date: '2026-11-15',
      user_last_date: '2026-10-20',
      notes: 'Shift 1 morning reporting at Bangalore center'
    })
  });
  assert.strictEqual(applyRes.status, 201, 'Failed to track exam');
  const trackedJobId = applyRes.data.id;
  console.log(`   ✓ Tracked exam '${sampleExam.short_name}'. Application ID = ${trackedJobId}`);
  assert.strictEqual(applyRes.data.effectiveExamDate, '2026-11-15', 'User date hierarchy failed for exam date');
  assert.strictEqual(applyRes.data.effectiveLastDate, '2026-10-20', 'User date hierarchy failed for last date');
  assert.strictEqual(Boolean(applyRes.data.fee_paid), true);
  console.log('   ✓ Personal date priority hierarchy confirmed (user dates win over registry).');

  // 4. Candidate Adds a Custom Job (Mode B)
  console.log('\n4. Testing Adding a Custom Job (Mode B)...');
  const customJobRes = await request('/api/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      custom_exam_name: 'BEL Project Engineer Recruitment 2026',
      post_name: 'Project Engineer-I (Electronics)',
      custom_conducting_body: 'Bharat Electronics Limited',
      official_portal_link: 'https://bel-india.in/careers',
      category: 'General',
      registration_number: 'BEL-PE-4482',
      fee_paid: 1,
      user_last_date: '2026-10-31',
      user_exam_date: '2026-12-05',
      notes: 'Written test + interview at BEL Bangalore complex'
    })
  });
  assert.strictEqual(customJobRes.status, 201, 'Failed to add custom job');
  const customJobId = customJobRes.data.id;
  console.log(`   ✓ Added custom job '${customJobRes.data.custom_exam_name}'. Application ID = ${customJobId}`);

  // 5. Verify Document Checklist
  console.log('\n5. Testing Document Checklist & Live Toggle...');
  const userJobsRes = await request('/api/jobs', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(userJobsRes.status, 200);
  const myJob = userJobsRes.data.find(j => j.id === trackedJobId);
  assert.ok(myJob.checklist.length >= 5, 'Checklist was not seeded');
  console.log(`   ✓ Application has ${myJob.checklist.length} checklist items initialized.`);

  const firstChecklistItem = myJob.checklist[0];
  const toggleRes = await request(`/api/jobs/${trackedJobId}/checklist/${firstChecklistItem.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ is_checked: 1 })
  });
  assert.strictEqual(toggleRes.status, 200);
  console.log(`   ✓ Toggled checklist item '${firstChecklistItem.item_title}' to Completed.`);

  // Add custom checklist item
  const addChecklistRes = await request(`/api/jobs/${trackedJobId}/checklist`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ item_title: 'Karnataka Domicile Certificate' })
  });
  assert.strictEqual(addChecklistRes.status, 201);
  console.log('   ✓ Added custom checklist item: "Karnataka Domicile Certificate".');

  // 6. Test Status Flow
  console.log('\n6. Testing Application Status Progression Flow...');
  const statusUpdate = await request(`/api/jobs/${trackedJobId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ status: 'Admit Card Downloaded' })
  });
  assert.strictEqual(statusUpdate.status, 200);
  console.log('   ✓ Updated status to: Admit Card Downloaded');

  // 7. Test Real Stats API
  console.log('\n7. Testing Real Stats Calculation...');
  const statsRes = await request('/api/jobs/stats', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(statsRes.status, 200);
  console.log('   ✓ Stats output:', statsRes.data);
  assert.strictEqual(statsRes.data.totalApplied, 2, 'Expected 2 total applied jobs');
  assert.strictEqual(statsRes.data.admitCardsAvailable, 1, 'Expected 1 admit card ready');

  // 8. Test CSV Export Endpoint
  console.log('\n8. Testing CSV Export...');
  const csvRes = await fetch(`${BASE_URL}/api/jobs/export/csv`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.ok(csvText.includes('ID,Exam,Post,Reg No'), 'CSV header missing');
  assert.ok(csvText.includes('BEL Project Engineer'), 'Custom job missing in CSV');
  console.log('   ✓ CSV export contains authentic candidate applications.');

  // 9. Admin Content Upload & Verification Flow
  console.log('\n9. Testing Admin Verification & Content Upload...');
  const adminPublishDates = await request(`/api/admin/exams/${sampleExam.id}/content`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      content_type: 'dates',
      title: 'Official 2026 Examination Schedule',
      payload: {
        apply_start: '2026-09-01',
        apply_end: '2026-10-15',
        exam_date: '2026-11-20'
      },
      source_url: 'https://cetonline.karnataka.gov.in/kea/notifications/2026_schedule.pdf',
      status: 'published'
    })
  });
  assert.strictEqual(adminPublishDates.status, 200);
  console.log('   ✓ Admin published official dates with source URL.');

  // Verify Audit Log
  const auditRes = await request('/api/admin/audit-logs', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(auditRes.status, 200);
  assert.ok(auditRes.data.length > 0, 'No audit logs found');
  console.log(`   ✓ Audit trail recorded: Action = '${auditRes.data[0].action}', User = '${auditRes.data[0].user_email}'`);

  // Verify Student received notification for published update
  const studentNotifs = await request('/api/notifications', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(studentNotifs.status, 200);
  assert.ok(studentNotifs.data.length > 0, 'Student should receive notification for tracked exam update');
  console.log(`   ✓ Student received alert: "${studentNotifs.data[0].title}"`);

  console.log('\n🎉 ALL 9 SYSTEM VERIFICATION SUITES PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('\n❌ System Verification Failed:', err);
  process.exit(1);
});
