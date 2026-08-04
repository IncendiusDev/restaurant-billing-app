require('dotenv').config();
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

app.get('/', (req, res) => res.json({ status: 'ok', message: 'Chit Restaurant Billing Backend API is Live!' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

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
