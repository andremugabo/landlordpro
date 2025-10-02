const { DataTypes } = require('sequelize');
const sequelize = require('../../db');


const PaymentMode = sequelize.define('PaymentMode', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
code: { type: DataTypes.STRING, allowNull: false },
display_name: { type: DataTypes.STRING, allowNull: false },
requires_proof: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'payment_modes', timestamps: false });


module.exports = PaymentMode;