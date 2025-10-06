const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Payment routes are under /api/payments
router.use(authenticate);

// Configure multer storage for proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const paymentId = req.params.id || 'temp';
    const uploadPath = path.join(__dirname, '../../uploads/payments', paymentId);

    // Create folder if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}${ext}`;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// 🔹 Get all payments with optional search
router.get('/payments', paymentController.getAllPayments);

// 🔹 Get single payment by ID
router.get('/payments/:id', paymentController.getPaymentById);

// 🔹 Create new payment (with optional proof upload)
router.post('/payments', upload.single('proof'), paymentController.createPayment);

// 🔹 Soft delete a payment
router.delete('/payments/:id', paymentController.deletePayment);

// 🔹 Restore soft-deleted payment (admin only)
router.patch('/payments/:id/restore', adminOnly, paymentController.restorePayment);

// 🔹 Get proof file for a payment
router.get('/proof/:paymentId/:filename', paymentController.getProofFile);

module.exports = router;
