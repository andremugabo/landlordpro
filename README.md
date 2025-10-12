# 🏠 LandlordPro

**LandlordPro** is a full-stack property management system for landlords and tenants.  
It provides tools for managing **properties, tenants, leases, payments, expenses, and notifications** — all in one modern and scalable platform.

---

## 🚀 Tech Stack

* **Frontend**: React 19.1.1 + Vite 7.1.7 + TailwindCSS 4.1.13  
* **Backend**: Node.js + Express + Sequelize  
* **Database**: PostgreSQL  
* **Authentication**: JWT (JSON Web Tokens)  
* **Validation**: Joi  
* **State Management**: Redux Toolkit 2.9.0  
* **Routing**: React Router DOM 7.9.3  
* **Forms & Validation**: React Hook Form 7.63.0 + Zod 4.1.11  
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
│   ├── src/               # Components, pages, hooks
│   ├── public/            # Static assets
│   ├── index.html
│   └── package.json
│
├── README.md
└── .env

````

---

## ⚙️ Backend Setup

### 1️⃣ Install Dependencies

```bash
cd backend
npm install
````

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

### 3️⃣ Sync Database

```bash
npm run sync
```

### 4️⃣ Seed Data

```bash
npm run seed
```

### 5️⃣ Run the Backend

```bash
npm run dev    # Development (with nodemon)
npm start      # Production
```

Backend available at:
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
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_ENV=development
```

For **production**:

```env
VITE_API_BASE_URL=/api
VITE_APP_ENV=production
```

### 3️⃣ Run the Frontend

```bash
npm run dev
```

Frontend available at:
👉 **[http://localhost:5173](http://localhost:5173)**

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
| `npm run lint`    | Run ESLint checks           |

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
✅ State management with Redux Toolkit
✅ Form handling & validation with React Hook Form + Zod

---

## 👤 Profile & Notifications

### **Profile API**

| Endpoint       | Method | Description                       | Auth |
| -------------- | ------ | --------------------------------- | ---- |
| `/api/profile` | GET    | Get current logged-in user's info | JWT  |
| `/api/profile` | PUT    | Update profile details            | JWT  |

**Example: Get Profile**

```bash
curl -X GET "http://localhost:3000/api/profile" \
-H "Authorization: Bearer <token>"
```

**Example: Update Profile**

```bash
curl -X PUT "http://localhost:3000/api/profile" \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{"full_name":"New Name","email":"newemail@example.com"}'
```

---

### **Notifications API**

| Endpoint                       | Method | Description                        | Auth        |
| ------------------------------ | ------ | ---------------------------------- | ----------- |
| `/api/notifications`           | GET    | Get all notifications for the user | JWT         |
| `/api/notifications/unread`    | GET    | Get unread notifications           | JWT         |
| `/api/notifications/{id}/read` | PUT    | Mark a notification as read        | JWT         |
| `/api/notifications/all`       | GET    | Get all notifications (admin only) | JWT + Admin |

**Example: Get Unread Notifications**

```bash
curl -X GET "http://localhost:3000/api/notifications/unread" \
-H "Authorization: Bearer <token>"
```

**Example: Mark Notification as Read**

```bash
curl -X PUT "http://localhost:3000/api/notifications/notification_id/read" \
-H "Authorization: Bearer <token>"
```



