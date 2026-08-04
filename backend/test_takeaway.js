async function testTakeaway() {
  console.log('Testing Takeaway order on live Render backend...');

  // 1. Login
  const loginRes = await fetch('https://restaurant-billing-app-kp1p.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'waiter@krishna.com', password: '3846' })
  });

  const loginData = await loginRes.json();
  const token = loginData.token;

  if (!token) {
    console.error('Login failed:', loginData);
    return;
  }

  // 2. Get menu item
  const menuRes = await fetch('https://restaurant-billing-app-kp1p.onrender.com/api/menu', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const menu = await menuRes.json();

  // 3. Place Takeaway Order (tableId: null, orderType: 'takeaway')
  const orderRes = await fetch('https://restaurant-billing-app-kp1p.onrender.com/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tableId: null,
      customerName: 'Takeaway Customer',
      customerMobile: '9876543210',
      waitingToken: 'TK-55',
      orderType: 'takeaway',
      taxPct: 5,
      discount: 0,
      items: [
        { menuItemId: menu[0].id, quantity: 1 }
      ]
    })
  });

  const orderData = await orderRes.json();
  console.log('TAKEAWAY ORDER HTTP STATUS:', orderRes.status);
  console.log('TAKEAWAY ORDER RESPONSE DATA:', orderData);
}

testTakeaway().catch(console.error);
