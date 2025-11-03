const expenseService = require('../services/expenseService');
const path = require('path');
const fs = require('fs');
const { validate: isUuid } = require('uuid');

// -------------------- HELPER: STANDARD ERROR RESPONSE --------------------
const handleError = (res, err, context = 'Operation') => {
  console.error(`${context} error:`, err);

  if (err.message === 'Expense not found') {
    return res.status(404).json({ success: false, message: err.message });
  }

  if (err.message.includes('required') || err.message.includes('Invalid')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// -------------------- CREATE EXPENSE --------------------
const createExpense = async (req, res) => {
  try {
    const expense = await expenseService.createExpense(req.body, req.file);

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense,
    });
  } catch (err) {
    handleError(res, err, 'Create expense');
  }
};

// -------------------- UPDATE EXPENSE --------------------
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid expense ID' });
    }

    const updatedExpense = await expenseService.updateExpense(id, req.body, req.file);

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense,
    });
  } catch (err) {
    handleError(res, err, 'Update expense');
  }
};

// -------------------- GET ALL EXPENSES --------------------
const getAllExpenses = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      localId: req.query.localId,
      propertyId: req.query.propertyId,
      paymentStatus: req.query.paymentStatus,
      currency: req.query.currency,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      minAmount: req.query.minAmount,
      maxAmount: req.query.maxAmount,
      search: req.query.search,
      limit: req.query.limit,
      offset: req.query.offset,
      includeDeleted: req.query.includeDeleted === 'true',
    };

    const result = await expenseService.getAllExpenses(filters);

    res.json({
      success: true,
      data: result.expenses,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        pages: Math.ceil(result.total / result.limit),
        currentPage: Math.floor(result.offset / result.limit) + 1,
      }
    });
  } catch (err) {
    handleError(res, err, 'Fetch expenses');
  }
};

// -------------------- GET EXPENSE BY ID --------------------
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid expense ID' });
    }

    const expense = await expenseService.getExpenseById(id);
    res.json({ success: true, data: expense });
  } catch (err) {
    handleError(res, err, 'Fetch expense');
  }
};

// -------------------- DELETE EXPENSE (SOFT) --------------------
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid expense ID' });
    }

    const result = await expenseService.deleteExpense(id);
    res.json({ success: true, message: result.message });
  } catch (err) {
    handleError(res, err, 'Delete expense');
  }
};

// -------------------- HARD DELETE EXPENSE --------------------
const hardDeleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid expense ID' });
    }

    const result = await expenseService.hardDeleteExpense(id);
    res.json({ success: true, message: result.message });
  } catch (err) {
    handleError(res, err, 'Hard delete expense');
  }
};

// -------------------- RESTORE EXPENSE --------------------
const restoreExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid expense ID' });
    }

    const expense = await expenseService.restoreExpense(id);
    res.json({ success: true, message: 'Expense restored successfully', data: expense });
  } catch (err) {
    handleError(res, err, 'Restore expense');
  }
};

// -------------------- GET EXPENSE SUMMARY --------------------
const getExpenseSummary = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      localId: req.query.localId,
      propertyId: req.query.propertyId,
      currency: req.query.currency,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const summary = await expenseService.getExpenseSummary(filters);
    res.json({ success: true, data: summary });
  } catch (err) {
    handleError(res, err, 'Get expense summary');
  }
};

// -------------------- BULK UPDATE PAYMENT STATUS --------------------
const bulkUpdatePaymentStatus = async (req, res) => {
  try {
    const { expenseIds, paymentStatus, paymentDate, paymentMethod } = req.body;

    if (!expenseIds || !paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'expenseIds and paymentStatus are required'
      });
    }

    const result = await expenseService.bulkUpdatePaymentStatus(
      expenseIds,
      paymentStatus,
      paymentDate,
      paymentMethod
    );

    res.json({ success: true, message: result.message, updatedCount: result.updatedCount });
  } catch (err) {
    handleError(res, err, 'Bulk update payment status');
  }
};

// -------------------- GET EXPENSES BY ENTITY --------------------
const getExpensesByEntity = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    if (!['property', 'local'].includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type. Must be "property" or "local"'
      });
    }

    if (!isUuid(entityId)) {
      return res.status(400).json({ success: false, message: 'Invalid entity ID' });
    }

    const filters = {
      category: req.query.category,
      paymentStatus: req.query.paymentStatus,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const expenses = await expenseService.getExpensesByEntity(entityType, entityId, filters);
    res.json({ success: true, data: expenses, count: expenses.length });
  } catch (err) {
    handleError(res, err, 'Get expenses by entity');
  }
};

// -------------------- APPROVE EXPENSE --------------------
const approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    if (!isUuid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid expense ID' });
    }

    if (!approvedBy) {
      return res.status(400).json({ success: false, message: 'approvedBy is required' });
    }

    const expense = await expenseService.approveExpense(id, approvedBy);
    res.json({
      success: true,
      message: 'Expense approved successfully',
      data: expense
    });
  } catch (err) {
    handleError(res, err, 'Approve expense');
  }
};

// -------------------- GET OVERDUE EXPENSES --------------------
const getOverdueExpenses = async (req, res) => {
  try {
    const filters = {
      propertyId: req.query.propertyId,
      localId: req.query.localId,
    };

    // Optional query param to trigger notifications
    const notify = req.query.notify === 'true';

    const expenses = await expenseService.getOverdueExpenses(filters, notify);
    res.json({ success: true, data: expenses, count: expenses.length });
  } catch (err) {
    handleError(res, err, 'Get overdue expenses');
  }
};

// -------------------- SERVE PROOF FILE --------------------
const getProofFile = async (req, res) => {
  try {
    const { expenseId, filename } = req.params;

    if (!isUuid(expenseId)) {
      return res.status(400).json({ success: false, message: 'Invalid expense ID' });
    }

    const safeFilename = path.basename(filename);
    const proofPath = path.join(__dirname, '../../uploads/expenses', expenseId, safeFilename);

    if (!fs.existsSync(proofPath)) {
      return res.status(404).json({ success: false, message: 'Proof file not found' });
    }

    res.sendFile(proofPath);
  } catch (err) {
    handleError(res, err, 'Serve proof file');
  }
};

module.exports = {
  createExpense,
  updateExpense,
  getAllExpenses,
  getExpenseById,
  deleteExpense,
  hardDeleteExpense,
  restoreExpense,
  getExpenseSummary,
  bulkUpdatePaymentStatus,
  getExpensesByEntity,
  approveExpense,
  getOverdueExpenses,
  getProofFile,
};
