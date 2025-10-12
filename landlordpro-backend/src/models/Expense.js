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
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01
      }
    },
    category: { 
      type: DataTypes.STRING(100), 
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    date: { 
      type: DataTypes.DATEONLY,  
      defaultValue: DataTypes.NOW
    },
    propertyId: { 
      type: DataTypes.UUID, 
      allowNull: true, 
      field: 'property_id',
      references: {
        model: 'properties',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    localId: { 
      type: DataTypes.UUID, 
      allowNull: true, 
      field: 'local_id',
      references: {
        model: 'locals',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  },
  {
    tableName: 'expenses',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['category'] },
      { fields: ['date'] }
    ]
  }
);

module.exports = Expense;
