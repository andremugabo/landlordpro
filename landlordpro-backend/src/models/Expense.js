const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const Expense = sequelize.define(
  'Expense',
  {
    id: { 
      type: DataTypes.UUID, 
      defaultValue: DataTypes.UUIDV4, 
      primaryKey: true 
    },
    amount: { 
      type: DataTypes.DECIMAL(12, 2), 
      allowNull: false 
    },
    category: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    description: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    date: { 
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW 
    },
    propertyId: { 
      type: DataTypes.UUID, 
      allowNull: true, 
      field: 'property_id' 
    },
    localId: { 
      type: DataTypes.UUID, 
      allowNull: true, 
      field: 'local_id' 
    }
  },
  {
    tableName: 'expenses',
    timestamps: true,
    underscored: true
  }
);

module.exports = Expense;
