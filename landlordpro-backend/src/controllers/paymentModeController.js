const paymentModeService = require('../services/paymentModeService');

const getAllPaymentModes = async (req, res) => {
  try {
    const modes = await paymentModeService.getAllPaymentModes();
    res.json(modes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPaymentMode = async (req, res) => {
  try {
    const mode = await paymentModeService.getPaymentModeById(req.params.id);
    if (!mode) return res.status(404).json({ error: 'Payment mode not found' });
    res.json(mode);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPaymentMode = async (req, res) => {
  try {
    const mode = await paymentModeService.createPaymentMode(req.body);
    res.status(201).json(mode);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePaymentMode = async (req, res) => {
  try {
    const mode = await paymentModeService.updatePaymentMode(req.params.id, req.body);
    if (!mode) return res.status(404).json({ error: 'Payment mode not found' });
    res.json(mode);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePaymentMode = async (req, res) => {
  try {
    const mode = await paymentModeService.deletePaymentMode(req.params.id);
    if (!mode) return res.status(404).json({ error: 'Payment mode not found' });
    res.json({ message: 'Payment mode deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllPaymentModes,
  getPaymentMode,
  createPaymentMode,
  updatePaymentMode,
  deletePaymentMode
};
