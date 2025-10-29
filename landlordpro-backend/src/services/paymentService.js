const Payment = require('../models/Payment');
const Lease = require('../models/Lease');
const PaymentMode = require('../models/PaymentMode');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const sharp = require('sharp');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/payments');

// Allowed types
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const PDF_TYPES = ['application/pdf'];

// Helper: generate invoice numbers
const generateInvoiceNumber = () => {
  const timestamp = Date.now();
  return `INV-${timestamp}-${Math.floor(Math.random() * 1000)}`;
};

// Helper: process proof of payment (image or PDF)
const processProofOfPayment = async (file, paymentId) => {
  if (!file) return null;

  const proofDir = path.join(UPLOAD_DIR, paymentId);
  fs.mkdirSync(proofDir, { recursive: true });

  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
  const filepath = path.join(proofDir, filename);

  // Image: resize & compress
  if (IMAGE_TYPES.includes(file.mimetype)) {
    const format = file.mimetype.split('/')[1];
    let imageSharp = sharp(file.buffer).resize({ width: 800 });

    if (format === 'jpeg' || format === 'jpg') await imageSharp.jpeg({ quality: 80 }).toFile(filepath);
    else if (format === 'png') await imageSharp.png({ compressionLevel: 8 }).toFile(filepath);
    else if (format === 'webp') await imageSharp.webp({ quality: 80 }).toFile(filepath);
    else await imageSharp.toFile(filepath);
  }
  // PDF: save directly
  else if (PDF_TYPES.includes(file.mimetype)) {
    fs.writeFileSync(filepath, file.buffer);
  } else {
    throw new Error('Unsupported file type');
  }

  return `/uploads/payments/${paymentId}/${filename}`;
};

// -------------------- SERVICE FUNCTIONS --------------------

// Create a new payment
const createPayment = async (data, file) => {
  const { amount, leaseId, paymentModeId, startDate, endDate } = data;

  if (!amount || !leaseId || !paymentModeId || !startDate || !endDate) {
    throw new Error('Amount, leaseId, paymentModeId, startDate, and endDate are required');
  }
  if (new Date(startDate) > new Date(endDate)) throw new Error('Start date cannot be after end date');

  const invoiceNumber = generateInvoiceNumber();
  const paymentId = uuidv4();

  const proofUrl = await processProofOfPayment(file, paymentId);

  const payment = await Payment.create({
    id: paymentId,
    amount,
    leaseId,
    paymentModeId,
    startDate,
    endDate,
    invoiceNumber,
    proofUrl,
  });

  return payment;
};

// Update payment (replace proof if new file provided)
const updatePayment = async (paymentId, updates, file) => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw new Error('Payment not found');

  if (updates.startDate && updates.endDate) {
    if (new Date(updates.startDate) > new Date(updates.endDate)) {
      throw new Error('Start date cannot be after end date');
    }
  }

  if (file) {
    // Delete old proof if exists
    if (payment.proofUrl) {
      const oldPath = path.join(__dirname, '../../', payment.proofUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    updates.proofUrl = await processProofOfPayment(file, paymentId);
  }

  await payment.update(updates);
  return payment;
};

// Get all payments with optional search
const getAllPayments = async (term = '') => {
  const whereClause = term
    ? {
        [Op.or]: [
          { invoiceNumber: { [Op.iLike]: `%${term}%` } },
          { '$leaseForPayment.reference$': { [Op.iLike]: `%${term}%` } },
        ],
      }
    : {};

  const payments = await Payment.findAll({
    where: whereClause,
    include: [
      { model: Lease, as: 'leaseForPayment' },
      { model: PaymentMode, as: 'paymentModeForPayment' },
    ],
    order: [['created_at', 'DESC']],
    paranoid: false,
  });

  return payments;
};

// Get payment by ID
const getPaymentById = async (id) => {
  const payment = await Payment.findByPk(id, {
    include: [
      { model: Lease, as: 'leaseForPayment' },
      { model: PaymentMode, as: 'paymentModeForPayment' },
    ],
    paranoid: false,
  });

  if (!payment) throw new Error('Payment not found');
  return payment;
};

// Soft delete payment
const deletePayment = async (id) => {
  const payment = await Payment.findByPk(id);
  if (!payment) throw new Error('Payment not found');

  await payment.destroy();
  return true;
};

// Restore soft-deleted payment
const restorePayment = async (id) => {
  const payment = await Payment.findOne({
    where: { id },
    paranoid: false,
  });
  if (!payment) throw new Error('Payment not found');

  await payment.restore();
  return payment;
};

module.exports = {
  createPayment,
  updatePayment,
  getAllPayments,
  getPaymentById,
  deletePayment,
  restorePayment,
};
