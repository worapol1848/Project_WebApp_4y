# 📦 Velin Inventory System

A comprehensive Full-Stack E-commerce and Inventory Management System with Biometric Face Recognition. 

---

## 🌟 Key Features

### 👤 Users & Security
- **Biometric Authentication:** Log in using Face Recognition (powered by Face-api.js) or standard credentials.
- **Role-based Access Control (RBAC):**
  - **Super Admin:** Manage admins, access top-level system logs, and modify core settings. (Requires Biometric Face Scan to log in).
  - **Admin:** Manage inventory, track orders, approve payments, and view sales analytics.
  - **User (Customer):** Browse products, manage carts, and track order statuses.
- **Isolated Localization:** User language preferences are bound to the account, loading immediately upon login.
- **Profile Management:** Address pin-pointing via map integration (Latitude/Longitude).

### 🛒 E-commerce & Logistics
- **Dynamic Product Catalog:** Real-time stock, promotional carousels, and accurate Brand Filtering (e.g., Nike, Adidas).
- **Smart Shopping Cart:** Live cart updates and automatic shipping cost calculations (based on delivery region).
- **Order Tracking:** Complete lifecycle visibility (`Pending` -> `Slip Check` -> `Shipped` -> `Arrived` -> `Delivered`).
- **Cancellation & Refunds:** In-app workflow for canceling orders, submitting bank details, and verifying refunds.
- **Historical Snapshots:** Order addresses are locked at checkout; later profile updates won't alter past receipts.

### 📊 Reports & Analytics
- **Admin Dashboard:** Visual sales data and system metrics metrics.
- **PDF Generation:** Downloadable, beautifully formatted Order Receipts using jsPDF.
- **System Activity Logs:** Comprehensive tracking for auditing.

---

## 🛠️ Technology Stack

### Frontend (User & Admin Portals)
- **Framework:** React + Vite
- **Routing:** React Router v6
- **Styling:** Vanilla CSS & Material UI (`@mui/material`)
- **State Management:** React Hooks
- **Maps & Location:** React-Leaflet (`react-leaflet`, `leaflet`)
- **Biometric Authentication:** Face-API (`@vladmandic/face-api`)
- **Analytics & Charts:** Recharts
- **Drag & Drop:** `@hello-pangea/dnd`
- **PDF Generation:** `jspdf`, `jspdf-autotable`

### Backend (Server & Database)
- **Framework:** Node.js with Express.js
- **Database:** MySQL (Managed via XAMPP)
- **ORM:** Sequelize
- **Authentication:** JSON Web Token (JWT) & Bcryptjs
- **File Uploads:** Multer (for slip & product image uploads)

---

## 🚀 Installation & Setup

### 1. Database Configuration (Using XAMPP)
1. Open the **XAMPP Control Panel**.
2. Start both **Apache** and **MySQL** services.
3. Open your browser and navigate to [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
4. Create a new database named `velin_inventory`.
5. Import the `VELIN_database_mysql.sql` file (located in the project root) into the newly created database.

### 2. Backend Setup
1. Navigate to the `backend` directory.
2. Create or modify the `.env` file with the following configuration:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=         # Leave blank if no password is set in XAMPP
   DB_NAME=velin_inventory
   JWT_SECRET=super_secret_jwt_key_velin_inventory
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🏃 Running the Application

You can easily start the full system (Backend + 2 Frontend Sessions) using the provided batch file:

1. Double-click the **`start_dual_sessions.bat`** file in the project directory.
2. This will automatically open 3 terminal windows working simultaneously:
   - **Backend Server:** API running on Port `5000`
   - **Frontend (Admin Interface):** [http://localhost:5173](http://localhost:5173)
   - **Frontend (Customer Interface):** [http://localhost:5174](http://localhost:5174)

---

## 📁 Project Structure Overview

```text
Web App 4y/
├── backend/            # Express.js API Server
│   ├── config/         # Database connection setup
│   ├── routes/         # API endpoints (Auth, Products, Orders, etc.)
│   ├── middlewares/    # Security and auth tokens filtering
│   ├── uploads/        # Local storage for images and slips
│   └── server.js       # Backend entry point
├── frontend/           # React + Vite Client
│   ├── src/
│   │   ├── pages/      # Pages separated by user roles (Admin vs User)
│   │   ├── components/ # Reusable UI components
│   │   ├── assets/     # Static assets, fonts, css
│   │   └── App.jsx     # Main React Tree
├── VELIN_database_mysql.sql # MySQL Database Schema + Seed Data
└── start_dual_sessions.bat  # Quick-start script
```

---

*Note: Allow browser camera permissions to enable Biometric Face Authentication for Super Admin logins.*
