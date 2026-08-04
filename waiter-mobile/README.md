# Waiter Mobile POS — Restaurant Billing Android Application

Mobile-first Waiter Application for Android smartphones & tablets built with **React 19 + TypeScript + Vite + Socket.io + Capacitor**.

## Features

1. **Live Table Map**:
   - Color-coded real-time table statuses: `Free` (Emerald), `Occupied` (Amber), `Reserved` (Purple).
   - Real-time Socket.io synchronization with kitchen display and desktop admin panel.
2. **Mobile POS Order Creator**:
   - Filter menu items by Category tabs & instant Search bar.
   - Add custom item notes ("extra spicy", "no onions", "sauce on side").
   - Live Order Tray drawer with Tax & Discount adjustments.
3. **Active Order Management**:
   - View occupied table order details, add extra items on the fly, adjust quantities.
4. **Billing & Instant Payment**:
   - Generate itemized receipt snapshot (`POST /api/orders/:id/invoice`).
   - Accept Cash, Card/POS, or UPI/QR payments.
   - Automatically free up table upon payment confirmation.
5. **Flexible Server Connection**:
   - Change API Server Base URL directly on the login screen or settings tab (e.g. `http://192.168.X.X:4000` for Wi-Fi or production URL).

---

## How to Run locally

```bash
cd waiter-mobile

# 1. Install dependencies (if not already installed)
npm install

# 2. Run Vite local dev server (accessible across your local Wi-Fi network)
cmd /c "npm run dev"
```

App runs on `http://localhost:3000` or `http://192.168.X.X:3000`.

---

## Native Android Packaging with Capacitor

To build and run as a native Android App on an Android device or emulator:

```bash
# 1. Build web distribution bundle
cmd /c "npx vite build"

# 2. Add Android platform (runs once)
cmd /c "npx cap add android"

# 3. Sync dist assets to Android Studio project
cmd /c "npx cap sync android"

# 4. Open in Android Studio or build APK
cmd /c "npx cap open android"
```

Once opened in Android Studio, click **Run** or **Build APK / Bundle**.
