const { DataTypes } = require('sequelize');
const sequelize = require('../../db');
const Local = require('./Local');
const Tenant = require('./Tenant');

const Lease = sequelize.define(
  'Lease',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date',
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      defaultValue: 'active',
      allowNull: false,
    },
    localId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'local_id',
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tenant_id',
    }
  },
  {
    tableName: 'leases',
    timestamps: true,  // automatically adds createdAt & updatedAt
    paranoid: true     // automatically adds deletedAt for soft deletes
  }
);

// Associations
Local.hasMany(Lease, { foreignKey: 'localId', as: 'leases' });
Lease.belongsTo(Local, { foreignKey: 'localId', as: 'local' });

Tenant.hasMany(Lease, { foreignKey: 'tenantId', as: 'leases' });
Lease.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

module.exports = Lease;
