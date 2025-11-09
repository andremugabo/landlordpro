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
* **Containerization**: Docker + Docker Compose

---

## 📂 Project Structure

```
landlordpro/
│
├── landlordpro-backend/   # Node.js + Express backend
│   ├── src/               # Models, routes, controllers
│   ├── services/          # Business logic and helpers
│   ├── db.js              # Sequelize DB connection
│   ├── sync.js            # Sync models with DB
│   ├── seed.js            # Run seed data
│   ├── swagger.js         # Swagger API docs setup
│   ├── server.js          # Backend entry point
│   ├── Dockerfile         # Backend Docker configuration
│   ├── .dockerignore      # Backend Docker ignore file
│   └── package.json
│
├── landlordpro-frontend/  # React + Vite frontend
│   ├── src/               # Components, pages, hooks
│   ├── public/            # Static assets
│   ├── index.html
│   ├── Dockerfile         # Frontend Docker configuration
│   ├── nginx.conf         # Nginx configuration
│   ├── .dockerignore      # Frontend Docker ignore file
│   └── package.json
│
├── docker-compose.yml     # Docker Compose orchestration
└── README.md
```

---

## 🐳 Docker Setup (Recommended)

The easiest way to run LandlordPro is using Docker. This will automatically set up PostgreSQL, the backend, and frontend with a single command.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed
- Docker Compose installed (included with Docker Desktop)

### 1️⃣ Configure Environment Variables

**Backend** (`landlordpro-backend/.env`):
```env
DB_NAME=landlordpro_db
DB_USER=postgres
DB_PASS=123
DB_HOST=postgres
DB_PORT=5432

PORT=3000

JWT_SECRET=f27f8e82284cf5eb873a2044ee9fcc7da7f5791da1ed51ad9066c7a55d11b09c
JWT_EXPIRES_IN=1h
```

**Frontend** (`landlordpro-frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_ENV=production
```

### 2️⃣ Run with Docker Compose

From the root `landlordpro` directory:

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

### 3️⃣ Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432

### 4️⃣ Useful Docker Commands

```bash
# Stop all services
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Restart a specific service
docker-compose restart backend

# Access PostgreSQL CLI
docker exec -it landlordpro-postgres psql -U postgres -d landlordpro_db
```

### 🗄️ Database Management

**Backup Database:**
```bash
docker exec landlordpro-postgres pg_dump -U postgres landlordpro_db > backup.sql
```

**Restore Database:**
```bash
docker exec -i landlordpro-postgres psql -U postgres landlordpro_db < backup.sql
```

---

## 💻 Manual Setup (Without Docker)

If you prefer to run the application without Docker:

### ⚙️ Backend Setup

#### 1️⃣ Install Dependencies

```bash
cd landlordpro-backend
npm install
```

#### 2️⃣ Configure Environment Variables

Create a `.env` file inside `/landlordpro-backend`:

```env
DB_NAME=landlordpro_db
DB_USER=postgres
DB_PASS=123
DB_HOST=localhost
DB_PORT=5432

PORT=3000

JWT_SECRET=f27f8e82284cf5eb873a2044ee9fcc7da7f5791da1ed51ad9066c7a55d11b09c
JWT_EXPIRES_IN=1h
```

#### 3️⃣ Set Up PostgreSQL

Install PostgreSQL and create the database:

```bash
psql -U postgres
CREATE DATABASE landlordpro_db;
\q
```

#### 4️⃣ Sync Database

```bash
npm run sync
```

#### 5️⃣ Seed Data

```bash
npm run seed
```

#### 6️⃣ Run the Backend

```bash
npm run dev    # Development (with nodemon)
npm start      # Production
```

Backend available at:
👉 **[http://localhost:3000](http://localhost:3000)**

---

### 🎨 Frontend Setup

#### 1️⃣ Install Dependencies

```bash
cd landlordpro-frontend
npm install
```

#### 2️⃣ Configure Environment Variables

Create a `.env` file in `/landlordpro-frontend`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_ENV=development
```

For **production**:

```env
VITE_API_BASE_URL=/api
VITE_APP_ENV=production
```

#### 3️⃣ Run the Frontend

```bash
npm run dev
```

Frontend available at:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🛠️ NPM Scripts

### **Backend (`/landlordpro-backend`)**

| Script         | Description                              |
| -------------- | ---------------------------------------- |
| `npm run dev`  | Start backend with Nodemon (development) |
| `npm start`    | Start backend normally                   |
| `npm run sync` | Sync database schema                     |
| `npm run seed` | Seed database                            |

### **Frontend (`/landlordpro-frontend`)**

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
✅ **Fully Dockerized** with PostgreSQL, Backend, and Frontend  
✅ **One-command deployment** using Docker Compose  

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

---

## 🔧 Troubleshooting

### Docker Issues

**Port Already in Use**
```bash
# Change ports in docker-compose.yml
postgres:
  ports:
    - "5433:5432"
backend:
  ports:
    - "3001:3000"
frontend:
  ports:
    - "8080:80"
```

**Database Connection Issues**
- Ensure `DB_HOST=postgres` in backend `.env` when using Docker
- Wait for postgres healthcheck: `docker-compose logs postgres`

**Reset Everything**
```bash
docker-compose down -v
docker-compose up --build
```

### Manual Setup Issues

**Database Connection Refused**
- Ensure PostgreSQL is running: `sudo service postgresql status`
- Check credentials in `.env` match your PostgreSQL setup

**Port 3000 or 5173 Already in Use**
- Kill the process: `lsof -ti:3000 | xargs kill -9`
- Or change ports in `.env` and `vite.config.js`

---

## 📄 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

## 👨‍💻 Author

Built with ❤️ by the LandlordPro Team