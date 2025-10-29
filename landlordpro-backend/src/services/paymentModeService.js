const PaymentMode = require('../models/PaymentMode');

const getAllPaymentModes = async () => {
  try {
    return await PaymentMode.findAll();
  } catch (err) {
    throw new Error('Failed to fetch payment modes');
  }
};

const getPaymentModeById = async (id) => {
  const paymentMode = await PaymentMode.findByPk(id);
  if (!paymentMode) throw new Error('Payment mode not found');
  return paymentMode;
};

const createPaymentMode = async (data) => {
  try {
    return await PaymentMode.create(data);
  } catch (err) {
    throw new Error('Failed to create payment mode');
  }
};

const updatePaymentMode = async (id, data) => {
  const paymentMode = await PaymentMode.findByPk(id);
  if (!paymentMode) throw new Error('Payment mode not found');
  return await paymentMode.update(data);
};

const deletePaymentMode = async (id) => {
  const paymentMode = await PaymentMode.findByPk(id);
  if (!paymentMode) throw new Error('Payment mode not found');
  await paymentMode.destroy();
  return paymentMode;
};

module.exports = {
  getAllPaymentModes,
  getPaymentModeById,
  createPaymentMode,
  updatePaymentMode,
  deletePaymentMode
};
