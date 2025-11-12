const Payment = require('../models/Payment');
const Lease = require('../models/Lease');
const PaymentMode = require('../models/PaymentMode');
const Notification = require('../models/Notification');
const { Local, Property } = require('../models');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const sharp = require('sharp');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/payments');

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const PDF_TYPES = ['application/pdf'];

// -------------------- HELPERS --------------------

const generateInvoiceNumber = () => `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const processProofOfPayment = async (file, paymentId) => {
  if (!file) return null;

  const proofDir = path.join(UPLOAD_DIR, paymentId);
  fs.mkdirSync(proofDir, { recursive: true });

  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
  const filepath = path.join(proofDir, filename);

  if (IMAGE_TYPES.includes(file.mimetype)) {
    const format = file.mimetype.split('/')[1];
    let imageSharp = sharp(file.buffer).resize({ width: 800 });

    if (format === 'jpeg' || format === 'jpg') await imageSharp.jpeg({ quality: 80 }).toFile(filepath);
    else if (format === 'png') await imageSharp.png({ compressionLevel: 8 }).toFile(filepath);
    else if (format === 'webp') await imageSharp.webp({ quality: 80 }).toFile(filepath);
    else await imageSharp.toFile(filepath);
  } else if (PDF_TYPES.includes(file.mimetype)) {
    fs.writeFileSync(filepath, file.buffer);
  } else {
    throw new Error('Unsupported file type');
  }

  return `/uploads/payments/${paymentId}/${filename}`;
};

// -------------------- PAYMENT SERVICE --------------------

const createPayment = async (data, file, user) => {
  const { amount, leaseId, paymentModeId, startDate, endDate } = data;

  if (!amount || !leaseId || !paymentModeId || !startDate || !endDate) {
    throw new Error('Amount, leaseId, paymentModeId, startDate, and endDate are required');
  }
  if (new Date(startDate) > new Date(endDate)) throw new Error('Start date cannot be after end date');

  const lease = await Lease.findByPk(leaseId, {
    include: [
      {
        model: Local,
        as: 'local',
        include: [{ model: Property, as: 'property', attributes: ['id', 'manager_id'] }],
      },
    ],
  });

  if (!lease) {
    throw new Error('Lease not found');
  }

  const leaseProperty = lease.local?.property;

  if (!leaseProperty) {
    throw new Error('Unable to resolve property associated with this lease');
  }

  if (user?.role === 'manager' && leaseProperty.manager_id !== user.id) {
    throw new Error('Access denied: You cannot create payments for this property');
  }

  const invoiceNumber = generateInvoiceNumber();
  const paymentId = uuidv4();
  const proofUrl = await processProofOfPayment(file, paymentId);

  const payment = await Payment.create({
    id: paymentId,
    amount,
    leaseId,
    paymentModeId,
    propertyId: leaseProperty.id,
    startDate,
    endDate,
    invoiceNumber,
    proofUrl,
  });

  return payment;
};

const updatePayment = async (paymentId, updates, file) => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw new Error('Payment not found');

  if (updates.startDate && updates.endDate) {
    if (new Date(updates.startDate) > new Date(updates.endDate)) {
      throw new Error('Start date cannot be after end date');
    }
  }

  if (file) {
    if (payment.proofUrl) {
      const oldPath = path.join(__dirname, '../../', payment.proofUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    updates.proofUrl = await processProofOfPayment(file, paymentId);
  }

  await payment.update(updates);

  // ✅ Mark existing payment_due notifications as read once payment is updated
  await Notification.update(
    { is_read: true },
    { where: { lease_id: payment.leaseId, type: 'payment_due' } }
  );

  return payment;
};

// -------------------- NOTIFICATIONS --------------------

// Check for payments ending within 1 month and send notifications every 2 days
const notifyUpcomingPayments = async () => {
  const today = new Date();
  const oneMonthAhead = new Date();
  oneMonthAhead.setMonth(today.getMonth() + 1);

  const payments = await Payment.findAll({
    where: {
      endDate: { [Op.between]: [today, oneMonthAhead] },
    },
    include: [{ model: Lease, as: 'leaseForPayment' }],
  });

  for (const payment of payments) {
    const existing = await Notification.findOne({
      where: {
        lease_id: payment.leaseId,
        type: 'payment_due',
        is_read: false,
      },
    });

    // Send notification if none exists or last one was older than 2 days
    if (!existing || (existing && (today - existing.updatedAt) / (1000 * 60 * 60 * 24) >= 2)) {
      await Notification.create({
        user_id: payment.leaseForPayment.tenant_id,
        message: `Payment for lease ${payment.leaseForPayment.reference} will expire on ${payment.endDate.toDateString()}. Please update your payment.`,
        type: 'payment_due',
        lease_id: payment.leaseId,
      });
    }
  }
};

// -------------------- OTHER SERVICE FUNCTIONS --------------------

const getAllPayments = async (term = '', user = null) => {
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
      {
        model: Lease,
        as: 'leaseForPayment',
        include: [
          {
            model: Local,
            as: 'local',
            attributes: ['id', 'reference_code', 'property_id'],
            required: user?.role === 'manager',
            include: [
              {
                model: Property,
                as: 'property',
                attributes: ['id', 'name', 'location', 'manager_id'],
                required: user?.role === 'manager',
                where: user?.role === 'manager' ? { manager_id: user.id } : undefined,
              },
            ],
          },
        ],
      },
      { model: PaymentMode, as: 'paymentModeForPayment' },
    ],
    order: [['created_at', 'DESC']],
    paranoid: false,
  });
  return payments.map((payment) => {
    const plain = payment.toJSON();
    const property = plain.leaseForPayment?.local?.property;
    return {
      ...plain,
      propertyId: plain.propertyId || property?.id || plain.leaseForPayment?.propertyId || null,
      propertyName: property?.name || null,
    };
  });
};

const getPaymentById = async (id, user = null) => {
  const payment = await Payment.findByPk(id, {
    include: [
      {
        model: Lease,
        as: 'leaseForPayment',
        include: [
          {
            model: Local,
            as: 'local',
            attributes: ['id', 'reference_code', 'property_id'],
            include: [{ model: Property, as: 'property', attributes: ['id', 'name', 'manager_id', 'location'] }],
          },
        ],
      },
      { model: PaymentMode, as: 'paymentModeForPayment' },
    ],
    paranoid: false,
  });
  if (!payment) throw new Error('Payment not found');
  const property = payment.leaseForPayment?.local?.property;
  if (user?.role === 'manager' && property?.manager_id !== user.id) {
    throw new Error('Access denied: You cannot view this payment');
  }
  return payment;
};

const deletePayment = async (id) => {
  const payment = await Payment.findByPk(id);
  if (!payment) throw new Error('Payment not found');
  await payment.destroy();
  return true;
};

const restorePayment = async (id) => {
  const payment = await Payment.findOne({ where: { id }, paranoid: false });
  if (!payment) throw new Error('Payment not found');
  await payment.restore();
  return payment;
};

// -------------------- EXPORT --------------------

module.exports = {
  createPayment,
  updatePayment,
  getAllPayments,
  getPaymentById,
  deletePayment,
  restorePayment,
  notifyUpcomingPayments,
};
