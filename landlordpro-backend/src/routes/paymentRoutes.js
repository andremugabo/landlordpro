const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Secure all routes
router.use(authenticate);

// ✅ Configure Multer for proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const paymentId = req.params.id || 'temp';
    const uploadPath = path.join(__dirname, '../../uploads/payments', paymentId);

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only .png, .jpg, .jpeg, and .pdf files are allowed!'));
    }
    cb(null, true);
  },
});

// ✅ Payment Routes
// Example: /api/payments/payments
router.get('/payments', paymentController.getAllPayments);

// Example: /api/payments/payments/:id
router.get('/payments/:id', paymentController.getPaymentById);

// Example: /api/payments/payments (with proof upload)
router.post('/payments', upload.single('proof'), paymentController.createPayment);

// Example: /api/payments/payments/:id
router.delete('/payments/:id', paymentController.deletePayment);

// Example: /api/payments/payments/:id/restore
router.patch('/payments/:id/restore', adminOnly, paymentController.restorePayment);

// Example: /api/payments/proof/:paymentId/:filename
router.get('/payments/proof/:paymentId/:filename', paymentController.getProofFile);

module.exports = router;
