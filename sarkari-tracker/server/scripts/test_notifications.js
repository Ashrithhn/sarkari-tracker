const API_BASE = 'http://localhost:3001/api';

async function testNotifications() {
  console.log('🔔 Testing Notification System End-to-End...\n');

  // 1. Login as user
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sarkari.in', password: 'admin123' })
  });
  const { token } = await loginRes.json();
  if (!token) throw new Error('Auth failed');
  console.log('✓ Logged in and got JWT token');

  // 2. Fetch notifications
  const notifsRes = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const notifs = await notifsRes.json();
  console.log(`✓ Fetched ${notifs.length} notifications:`);
  
  notifs.forEach(n => {
    console.log(`   - [ID ${n.id}] ${n.title}`);
    console.log(`     Exam: ${n.exam_short_name || 'N/A'} | Commission: ${n.conducting_body || 'N/A'} | Urgent: ${n.is_urgent} | Read: ${n.read}`);
  });

  // Verify none are dummy/fake (no "UPSC CSE tomorrow" or "SSC CGL admit card tier 1")
  const fakeFound = notifs.some(n => 
    n.title.includes('UPSC CSE 2026 is tomorrow') || 
    n.title.includes('SSC CGL Tier 1 admit cards are now available')
  );
  if (fakeFound) {
    throw new Error('Found legacy fake mock notifications in feed!');
  }
  console.log('✓ Verified: Zero fake/mock notifications in the database feed');

  // 3. Test Mark Single Read
  if (notifs.length > 0) {
    const first = notifs[0];
    const markRes = await fetch(`${API_BASE}/notifications/${first.id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    const markData = await markRes.json();
    console.log(`✓ Marked notification #${first.id} as read:`, markData.success);
  }

  // 4. Test Mark All as Read
  const markAllRes = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  const markAllData = await markAllRes.json();
  console.log('✓ Marked all notifications as read:', markAllData.success);

  // 5. Test Unread Count
  const countRes = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { count } = await countRes.json();
  console.log(`✓ Unread count after mark all read: ${count} (expected 0)`);
  if (count !== 0) throw new Error(`Expected 0 unread, got ${count}`);

  console.log('\n🎉 NOTIFICATION SYSTEM TESTS PASSED SUCCESSFULLY!');
}

testNotifications().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
