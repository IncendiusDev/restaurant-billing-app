require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const tableRoutes = require('./routes/tables');
const waiterRoutes = require('./routes/waiters');
const orderRoutes = require('./routes/orders');
const invoiceRoutes = require('./routes/invoices');
const publicRoutes = require('./routes/public');
const paymentRoutes = require('./routes/payment');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Waiter/admin clients join a room per restaurant so kitchen/admin screens
// get realtime pushes (e.g. "order:new") scoped to just their own restaurant.
io.on('connection', (socket) => {
  socket.on('join', (restaurantId) => {
    socket.join(`restaurant:${restaurantId}`);
  });
});
app.set('io', io);

const { seedDemoAccounts } = require('./controllers/authController');

app.get('/', (req, res) => res.json({ status: 'ok', message: 'Chit Restaurant Billing Backend API is Live!' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/seed-demo', seedDemoAccounts);
app.post('/seed-demo', seedDemoAccounts);

app.get('/migrate-schema', async (req, res) => {
  try {
    const pool = require('./db/pool');
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50),
      ADD COLUMN IF NOT EXISTS waiting_token VARCHAR(50);
    `);
    await pool.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;`);
    await pool.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT orders_order_type_check 
      CHECK (order_type IN ('dine_in', 'takeaway', 'online', 'delivery'));
    `);
    const check = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders';
    `);
    res.json({ success: true, columns: check.rows.map(r => r.column_name) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/migrate-takeaway', async (req, res) => {
  try {
    const pool = require('./db/pool');
    await pool.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;`);
    await pool.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT orders_order_type_check 
      CHECK (order_type IN ('dine_in', 'takeaway', 'online', 'delivery'));
    `);
    res.json({ success: true, message: 'Constraint updated to allow takeaway and delivery.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/waiters', waiterRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/payments', paymentRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON payload. Object keys must be wrapped in double quotes. Example: { "invoiceId": 1, "amount": 250 }'
    });
  }
  console.error('SERVER ERROR:', err);
  res.status(500).json({ error: err.message || 'Something went wrong on our end.' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => console.log(`Chit backend running on port ${PORT} (0.0.0.0)`));
