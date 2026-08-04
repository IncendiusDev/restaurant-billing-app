async function testLiveLogin() {
  console.log('Testing login against live Render backend...');
  const res = await fetch('https://restaurant-billing-app-kp1p.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@spicegarden.com', password: '123456' })
  });

  const data = await res.json();
  console.log('LIVE LOGIN RESPONSE STATUS:', res.status);
  console.log('LIVE LOGIN RESPONSE DATA:', data);
}

testLiveLogin().catch(console.error);
