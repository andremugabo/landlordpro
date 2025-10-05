const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');

class Tenant extends Model {}

Tenant.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    deletedAt: { type: DataTypes.DATE, allowNull: true }
  },
  {
    sequelize,
    modelName: 'Tenant',
    tableName: 'tenants',
    timestamps: true,         // Automatically adds createdAt & updatedAt
    paranoid: true,           // Enables soft deletes using deletedAt
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
);

module.exports = Tenant;
