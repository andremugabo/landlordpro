const paymentService = require('../services/paymentService');
const path = require('path');
const fs = require('fs');

// ✅ Create a new payment with optional proof upload
const createPayment = async (req, res) => {
  try {
    const { body, file } = req;
    const payment = await paymentService.createPayment(body, file);

    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all payments with optional search
const getAllPayments = async (req, res) => {
  try {
    const { term } = req.query;
    const payments = await paymentService.getAllPayments(term);

    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get single payment by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Soft delete a payment
const deletePayment = async (req, res) => {
  try {
    await paymentService.deletePayment(req.params.id);
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Restore a soft-deleted payment
const restorePayment = async (req, res) => {
  try {
    await paymentService.restorePayment(req.params.id);
    res.json({ success: true, message: 'Payment restored successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Serve proof files
const getProofFile = async (req, res) => {
  try {
    const { paymentId, filename } = req.params;
    const proofPath = path.join(__dirname, '../uploads/payments', paymentId, filename);

    if (!fs.existsSync(proofPath)) {
      return res.status(404).json({ message: 'Proof file not found' });
    }

    res.sendFile(proofPath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
  deletePayment,
  restorePayment,
  getProofFile,
};
