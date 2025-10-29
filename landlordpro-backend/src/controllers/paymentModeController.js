const paymentModeService = require('../services/paymentModeService');

// Get all payment modes
const getAllPaymentModes = async (req, res) => {
  try {
    const modes = await paymentModeService.getAllPaymentModes();
    res.status(200).json(modes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single payment mode by ID
const getPaymentMode = async (req, res) => {
  try {
    const mode = await paymentModeService.getPaymentModeById(req.params.id);
    res.status(200).json(mode);
  } catch (err) {
    if (err.message === 'Payment mode not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// Create a new payment mode
const createPaymentMode = async (req, res) => {
  try {
    const { code, displayName, requiresProof, description } = req.body;

    // Basic validation
    if (!code?.trim() || !displayName?.trim()) {
      return res.status(400).json({ error: 'Code and display name are required.' });
    }

    const mode = await paymentModeService.createPaymentMode({
      code,
      displayName,
      requiresProof: !!requiresProof,
      description: description || null,
    });

    res.status(201).json(mode);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a payment mode
const updatePaymentMode = async (req, res) => {
  try {
    const mode = await paymentModeService.updatePaymentMode(req.params.id, req.body);
    res.status(200).json(mode);
  } catch (err) {
    if (err.message === 'Payment mode not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// Delete a payment mode
const deletePaymentMode = async (req, res) => {
  try {
    await paymentModeService.deletePaymentMode(req.params.id);
    res.status(200).json({ message: 'Payment mode deleted successfully' });
  } catch (err) {
    if (err.message === 'Payment mode not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllPaymentModes,
  getPaymentMode,
  createPaymentMode,
  updatePaymentMode,
  deletePaymentMode,
};
