const express = require('express');
const router = express.Router();
const paymentModeController = require('../controllers/paymentModeController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// CRUD routes for PaymentMode
router.get('/payment-modes/', authenticate, paymentModeController.getAllPaymentModes);
router.get('/payment-modes/:id', authenticate, paymentModeController.getPaymentMode);
router.post('/payment-modes/', authenticate, adminOnly, paymentModeController.createPaymentMode);
router.put('/payment-modes/:id', authenticate, adminOnly, paymentModeController.updatePaymentMode);
router.delete('/payment-modes/:id', authenticate, adminOnly, paymentModeController.deletePaymentMode);

module.exports = router;
