const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');

class Tenant extends Model {}

Tenant.init(
  {
    id: { 
      type: DataTypes.UUID, 
      defaultValue: DataTypes.UUIDV4, 
      primaryKey: true 
    },
    name: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      comment: 'Representative name if tenant is a company' 
    },
    company_name: { 
      type: DataTypes.STRING, 
      allowNull: true, 
      comment: 'Name of the company (optional)' 
    },
    tin_number: { 
      type: DataTypes.STRING, 
      allowNull: true, 
      comment: 'Tax Identification Number (optional)' 
    },
    email: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    phone: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    deletedAt: { 
      type: DataTypes.DATE, 
      allowNull: true 
    }
  },
  {
    sequelize,
    modelName: 'Tenant',
    tableName: 'tenants',
    timestamps: true,         
    paranoid: true, 
    underscored: true,          
    deletedAt: 'deleted_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

module.exports = Tenant;
