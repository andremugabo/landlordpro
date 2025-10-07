const expenseService = require('../services/expenseService');

exports.getAllExpenses = async (req, res) => {
  try {
    const filters = req.query;
    const expenses = await expenseService.getAllExpenses(filters);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id);
    res.json(expense);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const expense = await expenseService.createExpense(req.body);
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const updated = await expenseService.updateExpense(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const result = await expenseService.deleteExpense(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
