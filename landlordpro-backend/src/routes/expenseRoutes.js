const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');
const { uploadProof, processProof } = require('../utils/fileUpload');

// ✅ All routes below require authentication
router.use(authenticate);

// 📊 AGGREGATE/SUMMARY ROUTES (must come before parameterized routes)
router.get('/expenses/summary', expenseController.getExpenseSummary);
router.get('/expenses/overdue', expenseController.getOverdueExpenses);
router.get('/expenses/entity/:entityType/:entityId', expenseController.getExpensesByEntity);

// 🔄 BULK OPERATIONS (admin only)
router.patch('/expenses/bulk/payment-status', adminOnly, expenseController.bulkUpdatePaymentStatus);

// 📝 COLLECTION ROUTES
router.get('/expenses', expenseController.getAllExpenses);
router.post('/expenses', uploadProof.single('proof'), processProof, expenseController.createExpense);

// 🔍 INDIVIDUAL RESOURCE ROUTES
router.get('/expenses/:id', expenseController.getExpenseById);
router.put('/expenses/:id', uploadProof.single('proof'), processProof, expenseController.updateExpense);
router.delete('/expenses/:id', adminOnly, expenseController.deleteExpense);

// 🎯 SPECIFIC ACTIONS ON INDIVIDUAL RESOURCES
router.patch('/expenses/:id/restore', adminOnly, expenseController.restoreExpense);
router.patch('/expenses/:id/approve', adminOnly, expenseController.approveExpense);
router.delete('/expenses/:id/hard', adminOnly, expenseController.hardDeleteExpense);

// 📎 FILE SERVING
router.get('/expenses/:expenseId/proof/:filename', expenseController.getProofFile);

module.exports = router;