# 🍽️ Chit — Restaurant Billing SaaS & Waiter Mobile POS

A complete multi-tenant restaurant management platform with a **Node.js Express backend**, **React + Capacitor Waiter Mobile App**, **Desktop Admin Panel**, and **Razorpay Payment Gateway integration**.

---

## 🌟 Key Features

- **📱 Waiter Mobile POS App** (`waiter-mobile`):
  - Built with React 19 + TypeScript + Vite + Capacitor.
  - Table selection grid & Takeaway order mode.
  - Realtime order tray with dish notes, customer name, mobile #, and waiting token.
  - Smart Food Prep Time estimation algorithm & live delivery elapsed time tracker.
  - Cash, Card, and Online at Desk (UPI) settlement options.

- **🖥️ Desktop Admin Panel** (`restaurant-admin-panel.html`):
  - Standalone single-file dashboard for restaurant owners.
  - Realtime auto-refresh (every 5s) for open orders, menu, and waiters.
  - Order cancellation and table freeing.
  - Integrated Razorpay Payment Gateway modal.
  - Auto-login credential memory.

- **⚡ Backend API** (`backend`):
  - Express.js server with PostgreSQL database.
  - Socket.io for live order notifications across devices.
  - JWT authentication & multi-tenant restaurant isolation.
  - Razorpay Standard Web Checkout order creation & HMAC-SHA256 signature verification.

---

## 📁 Repository Structure

```
.
├── backend/                  # Express REST API, Socket.io, & PostgreSQL DB
│   ├── controllers/          # Order, Invoice, Menu, Waiter controllers
│   ├── db/                   # Schema definitions & pool configuration
│   ├── routes/               # Auth, Orders, Invoices, Payments (Razorpay)
│   ├── .env.example          # Sample environment configuration
│   └── server.js             # Main server entry point
├── waiter-mobile/            # React + TypeScript + Capacitor Android App
│   ├── android/              # Native Android Studio project
│   ├── src/                  # Components, Hooks, API wrapper
│   └── capacitor.config.json # Capacitor native configuration
├── restaurant-admin-panel.html # Desktop Admin Web Panel
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and configure PostgreSQL & Razorpay credentials
npm start
```

### 2. Waiter Mobile App Setup
```bash
cd waiter-mobile
npm install
npm run dev

# For Android Studio Native Build:
npx vite build && npx cap sync android
npx cap open android
```

### 3. Desktop Admin Panel
Simply double-click or open `restaurant-admin-panel.html` in any web browser!

---

## 💳 Payment Gateway Setup (Razorpay)

Add your Razorpay Key ID and Secret to `backend/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_YourKeyId
RAZORPAY_KEY_SECRET=YourSecretKey
```

---

## 📄 License
MIT License
"# restaurant-billing-app" 
