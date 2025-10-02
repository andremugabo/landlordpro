# 🏠 LandlordPro

**LandlordPro** is a full-stack property management system for landlords and tenants.
It provides tools for managing **properties, tenants, leases, payments, expenses, and notifications** in a modern and scalable way.

---

## 🚀 Tech Stack

* **Frontend**: React + Vite + TailwindCSS
* **Backend**: Node.js + Express + Sequelize
* **Database**: PostgreSQL
* **Authentication**: JWT (JSON Web Tokens)
* **Validation**: Joi
* **API Docs**: Swagger

---

## 📂 Project Structure

```
landlordpro/
│── backend/               # Node.js + Express backend
│   ├── src/               # Models, routes, controllers
│   ├── seeds/             # Seed files
│   ├── db.js              # Sequelize DB connection
│   ├── sync.js            # Sync models with DB
│   ├── seed.js            # Run seeds
│   ├── server.js          # Entry point for backend
│   ├── swagger.js         # Swagger API docs setup
│   └── package.json
│
│── frontend/              # React + Vite frontend
│   ├── src/               # React components & pages
│   ├── public/            # Static assets
│   ├── index.html
│   └── package.json
│
├── README.md
└── .env
```

---

## ⚙️ Backend Setup

### 1️⃣ Install dependencies

```bash
cd backend
npm install
```

### 2️⃣ Configure environment

Create a `.env` file inside `backend/` with:

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

### 3️⃣ Sync Database

This will create/update tables based on Sequelize models.

```bash
npm run sync
```

### 4️⃣ Seed Data

This inserts sample data (users, payment modes, etc).

```bash
npm run seed
```

### 5️⃣ Run Backend

```bash
npm run dev   # Runs with nodemon
# OR
npm start     # Runs normally
```

---

## 🎨 Frontend Setup

### 1️⃣ Install dependencies

```bash
cd frontend
npm install
```

### 2️⃣ Configure environment

Create a `.env` file inside `frontend/` with:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3️⃣ Run Frontend

```bash
npm run dev
```

The frontend will be available at: **[http://localhost:5173](http://localhost:5173)**

---

## 📖 API Documentation

Swagger API docs are available at:

```
http://localhost:3000/api-docs
```

---

## 🛠️ Available NPM Scripts

### Backend (`/backend`)

* `npm run dev` → Start backend in development mode with nodemon
* `npm start` → Start backend normally
* `npm run sync` → Sync database schema
* `npm run seed` → Run database seeders

### Frontend (`/frontend`)

* `npm run dev` → Start React app in dev mode
* `npm run build` → Build production frontend
* `npm run preview` → Preview production build

---

## 🔐 Authentication

* JWT tokens are generated at **login** and must be sent in the `Authorization` header:

  ```
  Authorization: Bearer <token>
  ```
* JWT contains `userId`, `role`, and expiration time.
* Protected routes validate the token using middleware.

---

## 🧪 Validation

All incoming requests are validated with **Joi**. Example:

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

✅ User registration & authentication
✅ Tenant & lease management
✅ Property & local (unit) management
✅ Payment tracking with proof upload
✅ Expense tracking
✅ Notifications for payments, leases, documents
✅ API documentation with Swagger
✅ React + Vite responsive frontend

---

## 🏗️ Future Improvements

* Multi-tenant support for agencies
* Payment gateway integration (e.g. Stripe, Mobile Money)
* Automated rent reminders via email/SMS
* Reporting dashboard with charts


