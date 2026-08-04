async function testReservation() {
  console.log('Testing Table Reservation on live Render backend...');

  // 1. Login
  const loginRes = await fetch('https://restaurant-billing-app-kp1p.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@krishna.com', password: '3846' })
  });

  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Login token:', token ? 'OK' : 'FAILED', loginData);

  // 2. Post Reservation
  const resRes = await fetch('https://restaurant-billing-app-kp1p.onrender.com/api/tables/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tableId: 6,
      customerName: 'Rajesh Sahu',
      customerPhone: '9583203368',
      partySize: 2,
      reservationTime: new Date().toISOString()
    })
  });

  console.log('RESERVATION HTTP STATUS:', resRes.status);
  const data = await resRes.json();
  console.log('RESERVATION RESPONSE DATA:', data);
}

testReservation().catch(console.error);
