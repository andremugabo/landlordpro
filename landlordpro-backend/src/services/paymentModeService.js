const PaymentMode = require('../models/PaymentMode');

const getAllPaymentModes = async () => {
  return await PaymentMode.findAll();
};

const getPaymentModeById = async (id) => {
  return await PaymentMode.findByPk(id);
};

const createPaymentMode = async (data) => {
  return await PaymentMode.create(data);
};

const updatePaymentMode = async (id, data) => {
  const paymentMode = await PaymentMode.findByPk(id);
  if (!paymentMode) return null;
  return await paymentMode.update(data);
};

const deletePaymentMode = async (id) => {
  const paymentMode = await PaymentMode.findByPk(id);
  if (!paymentMode) return null;
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
