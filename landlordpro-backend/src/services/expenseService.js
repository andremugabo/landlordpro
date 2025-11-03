const Expense = require('../models/Expense');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const Notification = require('../models/Notification'); // Added for notifications

// -------------------- HELPER: DELETE FILE --------------------
const deleteProofFile = async (proofPath) => {
  if (!proofPath) return;
  
  try {
    const fullPath = path.join(__dirname, '../../', proofPath);
    if (fsSync.existsSync(fullPath)) {
      await fs.unlink(fullPath);
    }
  } catch (error) {
    console.error('Error deleting proof file:', error);
  }
};

// -------------------- SERVICE FUNCTIONS --------------------

// 🧾 Get all expenses with advanced filtering
const getAllExpenses = async (filters = {}) => {
  const where = {};

  if (filters.category) where.category = filters.category;
  if (filters.localId) where.local_id = filters.localId;
  if (filters.propertyId) where.property_id = filters.propertyId;
  if (filters.paymentStatus) where.payment_status = filters.paymentStatus;
  if (filters.currency) where.currency = filters.currency;

  // Date range filtering
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date[Op.gte] = new Date(filters.startDate);
    if (filters.endDate) where.date[Op.lte] = new Date(filters.endDate);
  }

  // Amount range filtering
  if (filters.minAmount || filters.maxAmount) {
    where.amount = {};
    if (filters.minAmount) where.amount[Op.gte] = filters.minAmount;
    if (filters.maxAmount) where.amount[Op.lte] = filters.maxAmount;
  }

  // Search by description, vendor, or reference number
  if (filters.search) {
    where[Op.or] = [
      { description: { [Op.iLike]: `%${filters.search}%` } },
      { vendor_name: { [Op.iLike]: `%${filters.search}%` } },
      { reference_number: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  const limit = parseInt(filters.limit) || 50;
  const offset = parseInt(filters.offset) || 0;

  const { count, rows } = await Expense.findAndCountAll({
    where,
    order: [['date', 'DESC']],
    limit,
    offset,
    paranoid: !filters.includeDeleted,
  });

  return {
    expenses: rows,
    total: count,
    limit,
    offset,
  };
};

// 🔍 Get expense by ID
const getExpenseById = async (id) => {
  const expense = await Expense.findByPk(id, { paranoid: false });
  if (!expense) throw new Error('Expense not found');
  return expense;
};

// ➕ Create expense (file already processed by middleware)
const createExpense = async (data, file) => {
  const {
    description,
    amount,
    date,
    category,
    vatRate,
    vatAmount,
    currency,
    paymentStatus,
    paymentDate,
    paymentMethod,
    dueDate,
    notes,
    referenceNumber,
    vendorName,
    vendorContact,
    propertyId,
    localId,
    createdBy,
  } = data;

  // Basic validation
  if (!description || !amount || !category) {
    throw new Error('Description, amount, and category are required');
  }

  if (!propertyId && !localId) {
    throw new Error('Either propertyId or localId must be provided');
  }

  const expenseId = uuidv4();

  // Use processed file path from middleware
  const proofUrl = file ? file.path : null;

  // Calculate VAT amount if rate is provided
  let calculatedVatAmount = vatAmount;
  if (vatRate && !vatAmount) {
    calculatedVatAmount = (parseFloat(amount) * parseFloat(vatRate)) / 100;
  }

  const expense = await Expense.create({
    id: expenseId,
    description,
    amount,
    date: date || new Date(),
    category,
    vat_rate: vatRate || 0,
    vat_amount: calculatedVatAmount || 0,
    currency: currency || 'USD',
    payment_status: paymentStatus || 'pending',
    payment_date: paymentDate || null,
    payment_method: paymentMethod || null,
    due_date: dueDate || null,
    proof: proofUrl,
    notes: notes || null,
    reference_number: referenceNumber || null,
    vendor_name: vendorName || null,
    vendor_contact: vendorContact || null,
    property_id: propertyId || null,
    local_id: localId || null,
    created_by: createdBy || null,
  });

  return expense;
};

// ✏️ Update expense (file already processed by middleware)
const updateExpense = async (id, updates, file) => {
  const expense = await Expense.findByPk(id);
  if (!expense) throw new Error('Expense not found');

  if (file) {
    // Delete old proof if exists
    await deleteProofFile(expense.proof);
    updates.proof = file.path;
  }

  // Calculate VAT amount if rate is updated
  if (updates.vatRate && !updates.vatAmount) {
    const amount = updates.amount || expense.amount;
    updates.vatAmount = (parseFloat(amount) * parseFloat(updates.vatRate)) / 100;
  }

  await expense.update({
    description: updates.description ?? expense.description,
    amount: updates.amount ?? expense.amount,
    date: updates.date ?? expense.date,
    category: updates.category ?? expense.category,
    vat_rate: updates.vatRate ?? expense.vat_rate,
    vat_amount: updates.vatAmount ?? expense.vat_amount,
    currency: updates.currency ?? expense.currency,
    payment_status: updates.paymentStatus ?? expense.payment_status,
    payment_date: updates.paymentDate ?? expense.payment_date,
    payment_method: updates.paymentMethod ?? expense.payment_method,
    due_date: updates.dueDate ?? expense.due_date,
    proof: updates.proof ?? expense.proof,
    notes: updates.notes ?? expense.notes,
    reference_number: updates.referenceNumber ?? expense.reference_number,
    vendor_name: updates.vendorName ?? expense.vendor_name,
    vendor_contact: updates.vendorContact ?? expense.vendor_contact,
    property_id: updates.propertyId ?? expense.property_id,
    local_id: updates.localId ?? expense.local_id,
    approved_by: updates.approvedBy ?? expense.approved_by,
    approval_date: updates.approvalDate ?? expense.approval_date,
  });

  return expense;
};

// 🗑️ Soft delete
const deleteExpense = async (id) => {
  const expense = await Expense.findByPk(id);
  if (!expense) throw new Error('Expense not found');

  await expense.destroy();
  return { message: 'Expense deleted successfully' };
};

// 💣 Hard delete (permanently delete)
const hardDeleteExpense = async (id) => {
  const expense = await Expense.findOne({ where: { id }, paranoid: false });
  if (!expense) throw new Error('Expense not found');

  // Delete proof file if exists
  await deleteProofFile(expense.proof);

  await expense.destroy({ force: true });
  return { message: 'Expense permanently deleted' };
};

// ♻️ Restore soft-deleted expense
const restoreExpense = async (id) => {
  const expense = await Expense.findOne({ where: { id }, paranoid: false });
  if (!expense) throw new Error('Expense not found');

  await expense.restore();
  return expense;
};

// 💰 Get expense summary/statistics
const getExpenseSummary = async (filters = {}) => {
  const where = {};

  if (filters.category) where.category = filters.category;
  if (filters.localId) where.local_id = filters.localId;
  if (filters.propertyId) where.property_id = filters.propertyId;
  if (filters.currency) where.currency = filters.currency;

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date[Op.gte] = new Date(filters.startDate);
    if (filters.endDate) where.date[Op.lte] = new Date(filters.endDate);
  }

  const expenses = await Expense.findAll({
    where,
    paranoid: true,
  });

  const summary = {
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalWithVat: 0,
    count: expenses.length,
    byCategory: {},
    byCurrency: {},
    byPaymentStatus: {},
  };

  expenses.forEach((expense) => {
    const amount = parseFloat(expense.amount) || 0;
    const vatAmount = parseFloat(expense.vat_amount) || 0;
    const totalAmount = amount + vatAmount;

    summary.total += amount;
    summary.totalWithVat += totalAmount;

    // By payment status
    if (expense.payment_status === 'paid') summary.paid += amount;
    else if (expense.payment_status === 'pending') summary.pending += amount;
    else if (expense.payment_status === 'overdue') summary.overdue += amount;

    // By category
    if (!summary.byCategory[expense.category]) {
      summary.byCategory[expense.category] = { total: 0, count: 0 };
    }
    summary.byCategory[expense.category].total += amount;
    summary.byCategory[expense.category].count += 1;

    // By currency
    if (!summary.byCurrency[expense.currency]) {
      summary.byCurrency[expense.currency] = { total: 0, count: 0 };
    }
    summary.byCurrency[expense.currency].total += amount;
    summary.byCurrency[expense.currency].count += 1;

    // By payment status (detailed)
    const status = expense.payment_status || 'unknown';
    if (!summary.byPaymentStatus[status]) {
      summary.byPaymentStatus[status] = { total: 0, count: 0 };
    }
    summary.byPaymentStatus[status].total += amount;
    summary.byPaymentStatus[status].count += 1;
  });

  return summary;
};

// 💳 Bulk update payment status
const bulkUpdatePaymentStatus = async (expenseIds, paymentStatus, paymentDate = null, paymentMethod = null) => {
  if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
    throw new Error('Expense IDs array is required');
  }

  const updateData = {
    payment_status: paymentStatus,
  };

  if (paymentDate) updateData.payment_date = paymentDate;
  if (paymentMethod) updateData.payment_method = paymentMethod;

  const [updatedCount] = await Expense.update(updateData, {
    where: {
      id: {
        [Op.in]: expenseIds,
      },
    },
  });

  return { 
    message: `${updatedCount} expense(s) updated successfully`,
    updatedCount 
  };
};

// 📊 Get expenses by property or local
const getExpensesByEntity = async (entityType, entityId, filters = {}) => {
  if (!['property', 'local'].includes(entityType)) {
    throw new Error('Invalid entity type. Must be "property" or "local"');
  }

  const where = {
    [entityType === 'property' ? 'property_id' : 'local_id']: entityId,
  };

  if (filters.category) where.category = filters.category;
  if (filters.paymentStatus) where.payment_status = filters.paymentStatus;

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date[Op.gte] = new Date(filters.startDate);
    if (filters.endDate) where.date[Op.lte] = new Date(filters.endDate);
  }

  const expenses = await Expense.findAll({
    where,
    order: [['date', 'DESC']],
    paranoid: true,
  });

  return expenses;
};

// ✅ Approve expense
const approveExpense = async (id, approvedBy) => {
  const expense = await Expense.findByPk(id);
  if (!expense) throw new Error('Expense not found');

  await expense.update({
    approved_by: approvedBy,
    approval_date: new Date(),
  });

  return expense;
};

// 📅 Get overdue expenses and create notifications
const getOverdueExpenses = async (filters = {}, notify = false) => {
  const where = {
    payment_status: {
      [Op.in]: ['pending', 'overdue'],
    },
    due_date: {
      [Op.lt]: new Date(),
    },
  };

  if (filters.propertyId) where.property_id = filters.propertyId;
  if (filters.localId) where.local_id = filters.localId;

  const expenses = await Expense.findAll({
    where,
    order: [['due_date', 'ASC']],
    paranoid: true,
  });

  if (notify && expenses.length > 0) {
    for (const expense of expenses) {
      // Check if notification already exists in last 2 days
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const existingNotification = await Notification.findOne({
        where: {
          expense_id: expense.id,
          createdAt: { [Op.gte]: twoDaysAgo },
        },
      });

      if (!existingNotification) {
        await Notification.create({
          id: uuidv4(),
          user_id: expense.created_by || null,
          message: `Expense "${expense.description}" is overdue. Amount: ${expense.amount} ${expense.currency}`,
          type: 'expense-overdue',
          payment_id: null,
          lease_id: null,
          document_id: null,
        });
      }
    }
  }

  return expenses;
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  hardDeleteExpense,
  restoreExpense,
  getExpenseSummary,
  bulkUpdatePaymentStatus,
  getExpensesByEntity,
  approveExpense,
  getOverdueExpenses,
};
