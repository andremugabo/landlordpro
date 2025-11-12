const paymentService = require('../services/paymentService');
const path = require('path');
const fs = require('fs');

// -------------------- CREATE PAYMENT --------------------
const createPayment = async (req, res) => {
  try {
    const { body, file } = req;

    if (!body.startDate || !body.endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }
    if (new Date(body.startDate) > new Date(body.endDate)) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    const payment = await paymentService.createPayment(body, file, req.user);

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment,
    });
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// -------------------- UPDATE PAYMENT --------------------
const updatePayment = async (req, res) => {
  try {
    const { body, file } = req;
    const paymentId = req.params.id;

    if (body.startDate && body.endDate && new Date(body.startDate) > new Date(body.endDate)) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    const updatedPayment = await paymentService.updatePayment(paymentId, body, file);

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: updatedPayment,
    });
  } catch (err) {
    console.error('Error updating payment:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// -------------------- GET ALL PAYMENTS --------------------
const getAllPayments = async (req, res) => {
  try {
    const { term } = req.query;
    const payments = await paymentService.getAllPayments(term, req.user);
    res.json({ success: true, data: payments });
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// -------------------- GET PAYMENT BY ID --------------------
const getPaymentById = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id, req.user);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.json({ success: true, data: payment });
  } catch (err) {
    console.error('Error fetching payment by ID:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// -------------------- DELETE PAYMENT --------------------
const deletePayment = async (req, res) => {
  try {
    await paymentService.deletePayment(req.params.id);
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (err) {
    console.error('Error deleting payment:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// -------------------- RESTORE PAYMENT --------------------
const restorePayment = async (req, res) => {
  try {
    const payment = await paymentService.restorePayment(req.params.id);
    res.json({ success: true, message: 'Payment restored successfully', data: payment });
  } catch (err) {
    console.error('Error restoring payment:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// -------------------- SERVE PROOF FILE --------------------
const getProofFile = async (req, res) => {
  try {
    const { paymentId, filename } = req.params;
    const safeFilename = path.basename(filename);
    const proofPath = path.join(__dirname, '../../uploads/payments', paymentId, safeFilename);

    if (!fs.existsSync(proofPath)) {
      return res.status(404).json({ success: false, message: 'Proof file not found' });
    }

    res.sendFile(proofPath);
  } catch (err) {
    console.error('Error serving proof file:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// -------------------- TRIGGER PAYMENT NOTIFICATIONS --------------------
const triggerPaymentNotifications = async (req, res) => {
  try {
    await paymentService.notifyUpcomingPayments();
    res.json({ success: true, message: 'Payment notifications triggered successfully' });
  } catch (err) {
    console.error('Error triggering notifications:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

module.exports = {
  createPayment,
  updatePayment,
  getAllPayments,
  getPaymentById,
  deletePayment,
  restorePayment,
  getProofFile,
  triggerPaymentNotifications, 
};
