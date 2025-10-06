const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const PaymentMode = sequelize.define(
  'PaymentMode',
  {
    id: { 
      type: DataTypes.UUID, 
      defaultValue: DataTypes.UUIDV4, 
      primaryKey: true 
    },
    code: { 
      type: DataTypes.STRING, 
      allowNull: false,
      unique: true
    },
    displayName: { 
      type: DataTypes.STRING, 
      allowNull: false,
      field: 'display_name'
    },
    requiresProof: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false,
      field: 'requires_proof'
    },
    description: { 
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: 'payment_modes',
    timestamps: true
  }
);

module.exports = PaymentMode;
