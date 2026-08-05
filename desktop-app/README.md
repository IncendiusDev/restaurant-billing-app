# 🖥️ Chit Restaurant POS - Standalone Desktop Application

High-performance native Desktop POS Application for **Chit Restaurant Billing & Management System** built with **Electron.js**.

---

## 🌟 Key Desktop Features

1. **🖨️ Direct Hardware ESC/POS Thermal Printing**:
   - Sends Kitchen Order Tickets (KOT) & Customer Receipts directly to connected 80mm / 58mm thermal printers without browser print dialog popups.
2. **⚡ Numpad & Keyboard Shortcuts**:
   - `F1`: Quick Search
   - `F2`: Live Orders
   - `F3`: Table Grid
   - `F5`: Live Refresh
   - `F11`: Toggle Fullscreen Cashier Mode
3. **📶 Multi-Tenant Cloud & Local Network Support**:
   - Syncs seamlessly with Render Backend Cloud API (`https://restaurant-billing-app-kp1p.onrender.com`).

---

## 🚀 How to Run Locally in Development

```bash
cd desktop-app
npm install
npm run dev
```

---

## 📦 How to Build Windows `.exe` Installer & Portable App

```bash
cd desktop-app
npm run build
```

This compiles:
- 📦 **Windows Setup Installer**: `dist-desktop/Chit Restaurant POS Setup 1.0.0.exe`
- 🏃 **Portable Standalone Executable**: `dist-desktop/Chit Restaurant POS 1.0.0.exe`
