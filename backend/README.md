# CloudPOS — Full-Stack Local POS System

Production-ready Point of Sale platform built with **NestJS + Prisma + PostgreSQL + React**.

## 📁 Project Structure

```
cloudpos/
├── backend/          # NestJS API (TypeScript + Prisma + PostgreSQL)
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── auth/         # JWT auth, RBAC guards
│       ├── users/        # User management
│       ├── products/     # Inventory CRUD
│       ├── invoices/     # Billing, returns, voids
│       ├── shifts/       # Cash drawer management
│       ├── audit/        # Audit log
│       └── prisma/       # Prisma service
├── frontend/         # React + Vite + Tailwind
│   └── src/
│       ├── pages/        # Dashboard, POS, Inventory, etc.
│       ├── components/
│       ├── store/        # Zustand state
│       ├── db/           # Dexie (offline IndexedDB)
│       └── i18n/         # Arabic/English
└── README.md
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+
- PostgreSQL (or Docker)
- VS Code

### 1. Database (PostgreSQL)
```bash
# Option A: Install PostgreSQL locally
# Create database:
createdb cloudpos

# Option B: Docker
docker run --name cloudpos-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cloudpos -p 5432:5432 -d postgres:16
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env        # Edit DATABASE_URL if needed
npx prisma generate
npx prisma migrate dev --name init
npm run seed                # Seeds users: admin/admin123, cashier/cashier123, etc.
npm run start:dev           # Runs on http://localhost:3000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev                 # Runs on http://localhost:5173
```

### 4. Default Login Credentials
| Role     | Email              | Password     |
|----------|--------------------|--------------|
| Admin    | admin@cloudpos.com | admin123     |
| Supervisor| supervisor@cloudpos.com | supervisor123 |
| Stock Mgr| stock@cloudpos.com | stock123     |
| Cashier  | cashier@cloudpos.com | cashier123 |

## 📋 Features
- ✅ Billing with barcode/SKU scanning
- ✅ Item & invoice-level discounts (percentage/fixed)
- ✅ Automatic VAT calculation with tax-exempt support
- ✅ Split payment (cash + card)
- ✅ Returns & void invoices (admin/supervisor only)
- ✅ Thermal receipt + A4 printing
- ✅ Shift/cash drawer management with discrepancy tracking
- ✅ Inventory CRUD with minimum stock alerts
- ✅ Stock movement history
- ✅ Customer & Supplier CRM
- ✅ RBAC (4 roles: Admin, Supervisor, Stock Manager, Cashier)
- ✅ Audit log (every action tracked)
- ✅ JWT auth + 30-min session timeout
- ✅ Offline mode (IndexedDB via Dexie)
- ✅ Multi-language (Arabic RTL + English LTR)
- ✅ Dark/Light mode