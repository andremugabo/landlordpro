const { DataTypes } = require('sequelize');
const sequelize = require('../../db');


const Expense = sequelize.define('Expense', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
amount: { type: DataTypes.FLOAT, allowNull: false },
category: { type: DataTypes.STRING, allowNull: false },
description: { type: DataTypes.TEXT, allowNull: true },
date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
property_id: { type: DataTypes.UUID, allowNull: true },
local_id: { type: DataTypes.UUID, allowNull: true }
}, { tableName: 'expenses', timestamps: false });


module.exports = Expense;