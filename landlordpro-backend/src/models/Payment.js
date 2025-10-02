const { DataTypes } = require('sequelize');
const sequelize = require('../../db');
const Lease = require('./Lease');
const PaymentMode = require('./PaymentMode');


const Payment = sequelize.define('Payment', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
amount: { type: DataTypes.FLOAT, allowNull: false },
date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
payment_mode_id: { type: DataTypes.UUID, allowNull: false },
lease_id: { type: DataTypes.UUID, allowNull: false },
invoice_number: { type: DataTypes.STRING, unique: true }
}, { tableName: 'payments', timestamps: false });


Lease.hasMany(Payment, { foreignKey: 'lease_id' });
Payment.belongsTo(Lease, { foreignKey: 'lease_id' });
PaymentMode.hasMany(Payment, { foreignKey: 'payment_mode_id' });
Payment.belongsTo(PaymentMode, { foreignKey: 'payment_mode_id' });


module.exports = Payment;