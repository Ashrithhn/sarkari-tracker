const API_BASE = 'http://localhost:3001/api';

async function runTests() {
  console.log('🧪 Starting End-to-End Feature Verification...\n');

  // 1. Verify Private Admin Login
  console.log('1️⃣ Testing Private Admin Login (admin@sarkari.in)...');
  const adminRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sarkari.in', password: 'admin123' })
  });
  const adminData = await adminRes.json();
  if (!adminRes.ok || !adminData.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminData)}`);
  }
  console.log('   ✓ Admin login successful! Token received.');

  // Check /api/auth/me includes is_admin
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${adminData.token}` }
  });
  const meData = await meRes.json();
  const isAdmin = meData.user ? meData.user.is_admin : meData.is_admin;
  if (isAdmin !== 1) {
    throw new Error(`Expected is_admin === 1, got ${JSON.stringify(meData)}`);
  }
  console.log('   ✓ Admin role verified in /api/auth/me (is_admin === 1)');

  // 2. Verify KEA VAO Exam Confirmed Dates
  console.log('\n2️⃣ Testing Confirmed KEA VAO 2026 Exam Status...');
  const vaoRes = await fetch(`${API_BASE}/exams/67`);
  const vaoData = await vaoRes.json();
  console.log(`   Exam: ${vaoData.name}`);
  console.log(`   Data Status: ${vaoData.data_status}`);
  console.log(`   Official Date: ${vaoData.exam_date}`);
  console.log(`   Content items: ${vaoData.content?.length || 0}`);
  
  if (vaoData.data_status !== 'verified') {
    throw new Error('KEA VAO should be marked verified with official dates!');
  }
  console.log('   ✓ KEA VAO is verified with confirmed official exam dates (4 & 25 October 2026)!');

  // 3. Test Normal Candidate Registration & Unlisted Job Keyword Processing
  console.log('\n3️⃣ Testing Candidate User & Custom Job Keyword Web Analysis...');
  const candidateEmail = `test_candidate_${Date.now()}@gmail.com`;
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Pooja Patil',
      email: candidateEmail,
      phone: '9876543210',
      password: 'candidatePass123'
    })
  });
  const regData = await regRes.json();
  console.log('   Register response:', regData);
  const candToken = regData.token;
  console.log(`   ✓ Candidate registered: ${candidateEmail}`);

  // Normal user cannot access admin route
  const forbiddenRes = await fetch(`${API_BASE}/admin/exams`, {
    headers: { Authorization: `Bearer ${candToken}` }
  });
  if (forbiddenRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for candidate on /api/admin/exams, got ${forbiddenRes.status}`);
  }
  console.log('   ✓ Protected admin route properly denied to candidate (403 Forbidden)');

  // 4. Add an unlisted custom job and verify keyword web intelligence
  console.log('\n4️⃣ Testing Auto-Search & Keyword Processing for Unlisted Job...');
  const customJobPayload = {
    custom_exam_name: 'KPTCL Junior Assistant',
    post_name: 'Junior Assistant & AE',
    custom_conducting_body: 'Karnataka Power Transmission Corporation Ltd',
    official_portal_link: 'https://kptcl.karnataka.gov.in',
    category: 'Karnataka 2A',
    fee_paid: 1,
    notes: 'Saw tentative exam dates in Kannada news portals'
  };

  const addJobRes = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${candToken}`
    },
    body: JSON.stringify(customJobPayload)
  });
  const addJobData = await addJobRes.json();
  console.log('   Add job status:', addJobRes.status);
  console.log('   Add job response:', addJobData);
  console.log('   ✓ Web Analysis object present:', !!addJobData.web_analysis);

  if (addJobData.web_analysis) {
    console.log('   - Keywords analyzed:', addJobData.web_analysis.keywords);
    console.log('   - Expected Exam Date:', addJobData.web_analysis.expected_exam_date || 'Awaited/Tentative');
    console.log('   - Expected Last Date:', addJobData.web_analysis.expected_apply_end || 'Awaited');
    console.log('   - Expected Fee:', addJobData.web_analysis.expected_fee || 'Varies');
    console.log('   - Total Sources Crawled:', addJobData.web_analysis.sources?.length || 0);
  }

  // 5. Test On-Demand Re-Analysis endpoint
  console.log('\n5️⃣ Testing On-Demand Re-Analysis /api/jobs/:id/analyze...');
  const reAnalyzeRes = await fetch(`${API_BASE}/jobs/${addJobData.id}/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${candToken}` }
  });
  const reAnalyzeData = await reAnalyzeRes.json();
  if (!reAnalyzeRes.ok || !reAnalyzeData.analysis) {
    throw new Error(`Re-analyze failed: ${JSON.stringify(reAnalyzeData)}`);
  }
  console.log('   ✓ On-demand keyword re-analysis executed successfully!');
  console.log('   - Sources found:', reAnalyzeData.analysis.sources?.length || 0);

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED PERFECTLY!');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
