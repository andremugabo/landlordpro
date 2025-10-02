const { DataTypes } = require('sequelize');
const sequelize = require('../../db');
const Local = require('./Local');
const Tenant = require('./Tenant');


const Lease = sequelize.define('Lease', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
start_date: { type: DataTypes.DATE, allowNull: false },
end_date: { type: DataTypes.DATE, allowNull: false },
status: { type: DataTypes.ENUM('active','expired','cancelled'), defaultValue: 'active' },
local_id: { type: DataTypes.UUID, allowNull: false },
tenant_id: { type: DataTypes.UUID, allowNull: false }
}, { tableName: 'leases', timestamps: false });


Local.hasMany(Lease, { foreignKey: 'local_id' });
Lease.belongsTo(Local, { foreignKey: 'local_id' });
Tenant.hasMany(Lease, { foreignKey: 'tenant_id' });
Lease.belongsTo(Tenant, { foreignKey: 'tenant_id' });


module.exports = Lease;