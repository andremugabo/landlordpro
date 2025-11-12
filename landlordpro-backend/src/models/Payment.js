const { DataTypes } = require('sequelize');
const sequelize = require('../../db');
const Lease = require('./Lease');
const PaymentMode = require('./PaymentMode');

const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: 'invoice_number',
    },
    proofUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'proof_url',
    },
    leaseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'lease_id',
    },
    paymentModeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'payment_mode_id',
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'property_id',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date',
      defaultValue: DataTypes.NOW, // optional default
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date',
    },
  },
  {
    tableName: 'payments',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Payment;
