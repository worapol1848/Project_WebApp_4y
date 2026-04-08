# Velin Inventory & E-Commerce System

Velin is a comprehensive web-based platform serving as both an E-Commerce storefront for customers and a robust Inventory and Business Management system for administrators. The platform seamlessly integrates online shopping capabilities with advanced backend management, analytics, biometric authentication, and multi-language support.

## 🚀 Tech Stack

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

### Backend
- **Framework:** Node.js with Express.js
- **Database:** MySQL
- **ORM:** Sequelize
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **File Uploads:** Multer
- **API Communication:** CORS enabled, centralized routing

## 🌟 Key Features

### 🛒 Customer E-Commerce Portal
- **Product Catalog & Discovery:** Clean, modern UI with interactive brand filtering, category browsing, and a dynamic best-selling product carousel.
- **Cart System:** Fully functional and secure shopping cart exclusively for authenticated users (requires login to add items).
- **Checkout & Payment:** robust order placement with shipping address tracking (supporting address snapshots so historical orders remain accurate even if profiles are updated).
- **User Profiles:** order history tracking, wishlist management, and isolated language settings to prevent state leakage between accounts.
- **Reviews & Ratings:** ability for users to comment and review products.

### 💼 Admin & Inventory Management Dashboard
- **Role-Based Access Control:** Distinct roles for `Admin` and `Superadmin`.
- **Biometric Security:** Exclusive `Superadmin` login and registration using Face Scanner logic (`FaceScanner.jsx`).
- **Comprehensive Dashboard:** Real-time data visualization via Recharts for revenue, sales, and system statistics.
- **Inventory Control:** full CRUD operations for product catalogs, stock tracking (`AdminInventory`), and image uploads.
- **Order Management:** Tracking orders from placement to fulfillment.
- **System Logs & Auditing:** Track user activities and administrative actions (`AdminLogs`).
- **PDF Reports:** Automatic generation of receipts and business reports.

## 📁 Project Structure

```
Velin Web App/
├── backend/                  # Node.js + Express backend
│   ├── routes/               # API routes (auth, products, orders, cart, etc.)
│   ├── models/               # Sequelize DB Models
│   ├── controllers/          # Business logic
│   ├── config/               # DB & system configurations
│   ├── server.js             # Entry point
│   └── package.json
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/
│   │   │   ├── admin/        # Admin dashboard, products, revenue, face scanner
│   │   │   └── user/         # E-commerce store, cart, payment, profile
│   │   ├── App.jsx           # App routing logic
│   │   └── main.jsx          # React DOM render
│   └── package.json
├── VELIN_database_mysql.sql  # Database schema & initial data
├── start_app.bat             # Single window startup script
└── start_dual_sessions.bat   # Startup script for simultaneous dual-role testing
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16+ recommended)
- MySQL Server (XAMPP/WAMP or standalone)

### 1. Database Setup
1. Open your MySQL client (e.g., phpMyAdmin, MySQL Workbench).
2. Create a database named `velin_database` (or match your `.env` configuration).
3. Import the provided `VELIN_database_mysql.sql` file into the new database.

### 2. Environment Variables (.env)
You will need `.env` files in both backend and frontend directories (if applicable).
For `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=velin_database
JWT_SECRET=your_secret_key
```

### 3. Installation
Open a terminal and install dependencies for both sides:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Running the Application

**Option A: Using Batch Scripts (Windows)**
- Run `start_app.bat` to launch both backend and frontend in a shared terminal structure.
- Run `start_dual_sessions.bat` to launch the backend and TWO isolated frontend instances (Ports 5173 and 5174). This is perfect for testing Customer and Admin interactions simultaneously!

**Option B: Manual Start**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📝 Recent Updates & Refactoring
- **Address Snapshotting:** Historical data persistence implemented securely for shipping addresses during checkout.
- **Cart Security:** Enforced strict authentication checks before allowing users to add anything to their cart.
- **Admin UI Polish:** shadow-free aesthetics, dynamic sliders, and removal of intrusive language switchers in admin routes.
- **Scoped Language Isolation:** Fixed state bugs ensuring that logging into different accounts reflects correct locale settings.
