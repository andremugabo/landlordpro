const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');
const { uploadProof, processProof } = require('../utils/fileUpload');

// Secure all routes
router.use(authenticate);

// GET all payments
router.get('/payments', paymentController.getAllPayments);

// GET single payment by ID
router.get('/payments/:id', paymentController.getPaymentById);

// POST create payment
router.post(
  '/payments',
  uploadProof.single('proof'), // Multer memory storage
  processProof,                // Sharp resize/compress for images
  paymentController.createPayment
);

// PUT update payment
router.put(
  '/payments/:id',
  uploadProof.single('proof'),
  processProof,
  paymentController.updatePayment
);

// DELETE soft delete payment
router.delete('/payments/:id', paymentController.deletePayment);

// PATCH restore soft-deleted payment (admin only)
router.patch('/payments/:id/restore', adminOnly, paymentController.restorePayment);

// GET proof file
router.get('/payments/proof/:paymentId/:filename', paymentController.getProofFile);

module.exports = router;
