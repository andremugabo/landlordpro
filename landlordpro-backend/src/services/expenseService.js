const Expense = require('../models/Expense');

const expenseService = {
  async getAllExpenses(filters = {}) {
    const where = {};

    if (filters.category) where.category = filters.category;
    if (filters.date) where.date = filters.date;
    if (filters.localId) where.localId = filters.localId;
    if (filters.propertyId) where.propertyId = filters.propertyId;

    return await Expense.findAll({ where, order: [['date', 'DESC']] });
  },

  async getExpenseById(id) {
    const expense = await Expense.findByPk(id);
    if (!expense) throw new Error('Expense not found');
    return expense;
  },

  async createExpense(data) {
    return await Expense.create(data);
  },

  async updateExpense(id, data) {
    const expense = await Expense.findByPk(id);
    if (!expense) throw new Error('Expense not found');
    await expense.update(data);
    return expense;
  },

  async deleteExpense(id) {
    const expense = await Expense.findByPk(id);
    if (!expense) throw new Error('Expense not found');
    await expense.destroy();
    return { message: 'Expense deleted successfully' };
  }
};

module.exports = expenseService;
