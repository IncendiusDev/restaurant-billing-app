async function testRemoteSlug() {
  const loginRes = await fetch('https://restaurant-billing-app-kp1p.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@krishna.com', password: '3846' })
  });
  const data = await loginRes.json();
  console.log('Login User Data:', data);
}

testRemoteSlug().catch(console.error);
