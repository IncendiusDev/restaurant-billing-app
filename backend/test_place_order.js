async function testPlaceOrder() {
  console.log('Testing place order on live Render backend...');

  // First login to get a waiter token
  const loginRes = await fetch('https://restaurant-billing-app-kp1p.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'waiter@krishna.com', password: '3846' })
  });

  const loginData = await loginRes.json();
  console.log('LOGIN STATUS:', loginRes.status);
  const token = loginData.token;

  if (!token) {
    console.error('Failed to get token:', loginData);
    return;
  }

  // Next, get menu items to find valid menuItemId
  const menuRes = await fetch('https://restaurant-billing-app-kp1p.onrender.com/api/menu', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const menu = await menuRes.json();
  console.log('MENU ITEMS COUNT:', Array.isArray(menu) ? menu.length : 0);

  if (!Array.isArray(menu) || menu.length === 0) {
    console.error('No menu items found!');
    return;
  }

  const firstItem = menu[0];
  console.log('USING MENU ITEM:', firstItem.id, firstItem.name);

  // Now test placing order
  const orderRes = await fetch('https://restaurant-billing-app-kp1p.onrender.com/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tableId: 1,
      customerName: 'Test Customer',
      customerMobile: '9876543210',
      waitingToken: 'T-101',
      orderType: 'dine_in',
      taxPct: 5,
      discount: 50,
      items: [
        { menuItemId: firstItem.id, quantity: 1, notes: 'Extra spicy' }
      ]
    })
  });

  const orderData = await orderRes.json();
  console.log('PLACE ORDER HTTP STATUS:', orderRes.status);
  console.log('PLACE ORDER RESPONSE DATA:', orderData);
}

testPlaceOrder().catch(console.error);
