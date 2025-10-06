const Payment = require('../models/Payment');
const Lease = require('../models/Lease');
const PaymentMode = require('../models/PaymentMode');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/payments');

// Helper to generate invoice numbers
const generateInvoiceNumber = () => {
  const timestamp = Date.now();
  return `INV-${timestamp}-${Math.floor(Math.random() * 1000)}`;
};

// Create a new payment
const createPayment = async (data, file) => {
  const { amount, leaseId, paymentModeId } = data;

  if (!amount || !leaseId || !paymentModeId) {
    throw new Error('Amount, leaseId, and paymentModeId are required');
  }

  const invoiceNumber = generateInvoiceNumber();
  const paymentId = uuidv4();
  const proofDir = path.join(UPLOAD_DIR, paymentId);

  if (!fs.existsSync(proofDir)) fs.mkdirSync(proofDir, { recursive: true });

  let proofUrl = null;
  if (file) {
    const filePath = path.join(proofDir, file.originalname);
    fs.renameSync(file.path, filePath);
    proofUrl = `/uploads/payments/${paymentId}/${file.originalname}`;
  }

  const payment = await Payment.create({
    id: paymentId,
    amount,
    leaseId,
    paymentModeId,
    invoiceNumber,
    proofUrl,
  });

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
  getAllPayments,
  getPaymentById,
  deletePayment,
  restorePayment,
};
