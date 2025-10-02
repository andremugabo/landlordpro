const { DataTypes } = require('sequelize');
const sequelize = require('../../db');
const Property = require('./Property');


const Local = sequelize.define('Local', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
reference_code: { type: DataTypes.STRING, allowNull: false },
status: { type: DataTypes.ENUM('available','occupied','maintenance'), defaultValue: 'available' },
size_m2: { type: DataTypes.FLOAT, allowNull: true },
property_id: { type: DataTypes.UUID, allowNull: false }
}, { tableName: 'locals', timestamps: false });


Property.hasMany(Local, { foreignKey: 'property_id' });
Local.belongsTo(Property, { foreignKey: 'property_id' });


module.exports = Local;