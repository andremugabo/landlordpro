const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// ✅ All routes below require authentication
router.use(authenticate);

// 🔹 Get all expenses (with filters)
router.get('/expenses', expenseController.getAllExpenses);

// 🔹 Get a single expense
router.get('/expenses/:id', expenseController.getExpenseById);

// 🔹 Create an expense
router.post('/expenses', expenseController.createExpense);

// 🔹 Update an expense
router.put('/expenses/:id', expenseController.updateExpense);

// 🔹 Delete an expense (admin only)
router.delete('/expenses/:id', adminOnly, expenseController.deleteExpense);

module.exports = router;
