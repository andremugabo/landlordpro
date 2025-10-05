# 🏠 LandlordPro

**LandlordPro** is a full-stack property management system for landlords and tenants.
It provides tools for managing **properties, tenants, leases, payments, expenses, and notifications** — all in one modern and scalable platform.

---

## 🚀 Tech Stack

* **Frontend**: React + Vite + TailwindCSS
* **Backend**: Node.js + Express + Sequelize
* **Database**: PostgreSQL
* **Authentication**: JWT (JSON Web Tokens)
* **Validation**: Joi
* **API Documentation**: Swagger

---

## 📂 Project Structure

```
landlordpro/
│
├── backend/               # Node.js + Express backend
│   ├── src/               # Models, routes, controllers
│   ├── services/          # Business logic and helpers
│   ├── db.js              # Sequelize DB connection
│   ├── sync.js            # Sync models with DB
│   ├── seed.js            # Run seed data
│   ├── swagger.js         # Swagger API docs setup
│   ├── server.js          # Backend entry point
│   └── package.json
│
├── frontend/              # React + Vite frontend
│   ├── src/               # Components, pages, and hooks
│   ├── public/            # Static assets
│   ├── index.html
│   └── package.json
│
├── README.md
└── .env
```

---

## ⚙️ Backend Setup

### 1️⃣ Install Dependencies

```bash
cd backend
npm install
```

### 2️⃣ Configure Environment Variables

Create a `.env` file inside `/backend`:

```env
DB_NAME=landlordpro_db
DB_USER=postgres
DB_PASS=123
DB_HOST=localhost
DB_PORT=5432

PORT=3000

JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=1h
```

---

### 3️⃣ Sync Database

This will create or update database tables based on your Sequelize models:

```bash
npm run sync
```

---

### 4️⃣ Seed Data

Seed sample users, payment modes, and default data:

```bash
npm run seed
```

---

### 5️⃣ Run the Backend

```bash
npm run dev    # Development (with nodemon)
# or
npm start      # Production
```

Backend will run at:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🎨 Frontend Setup

### 1️⃣ Install Dependencies

```bash
cd frontend
npm install
```

### 2️⃣ Configure Environment Variables

Create a `.env` file in `/frontend`:

```env
# Base URL for backend API
VITE_API_BASE_URL=http://localhost:3000

# Optional: environment mode
VITE_APP_ENV=development
```

For **production**, use:

```env
VITE_API_BASE_URL=/api
VITE_APP_ENV=production
```

✅ This ensures that when deployed, the frontend correctly targets your backend API (e.g., [https://saintmichel.rw/api](https://saintmichel.rw/api)).

---

### 3️⃣ Run the Frontend

```bash
npm run dev
```

Frontend available at:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 📖 API Documentation

Swagger UI is available at:
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

---

## 🛠️ NPM Scripts

### **Backend (`/backend`)**

| Script         | Description                              |
| -------------- | ---------------------------------------- |
| `npm run dev`  | Start backend with Nodemon (development) |
| `npm start`    | Start backend normally                   |
| `npm run sync` | Sync database schema                     |
| `npm run seed` | Seed database                            |

### **Frontend (`/frontend`)**

| Script            | Description                 |
| ----------------- | --------------------------- |
| `npm run dev`     | Run Vite development server |
| `npm run build`   | Build production frontend   |
| `npm run preview` | Preview built frontend      |

---

## 🔐 Authentication

* JWT tokens are issued at login and required for protected routes.
* Include them in requests like:

```
Authorization: Bearer <token>
```

Each token contains:

* `userId`
* `role`
* `expiration`

Middleware ensures only valid tokens can access protected resources.

---

## 🧪 Validation

All incoming requests are validated using **Joi** for data consistency and security.

Example:

```js
const Joi = require("joi");

const registerSchema = Joi.object({
  full_name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});
```

---

## 📌 Features

✅ User authentication & role management (Admin, Landlord, Tenant)
✅ Tenant and lease tracking
✅ Property and unit management
✅ Payment management with proof uploads
✅ Expense tracking
✅ Real-time notifications
✅ API documentation (Swagger)
✅ Modern responsive frontend (React + TailwindCSS)

---




