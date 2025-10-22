const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');

class Expense extends Model {}

Expense.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    description: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

    // Foreign keys (nullable to prevent sync errors)
    property_id: { type: DataTypes.UUID, allowNull: true },
    local_id: { type: DataTypes.UUID, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Expense',
    tableName: 'expenses',
    timestamps: true,
    paranoid: true,          // enables soft delete
    underscored: true,       // snake_case for columns
    deletedAt: 'deleted_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Expense;
