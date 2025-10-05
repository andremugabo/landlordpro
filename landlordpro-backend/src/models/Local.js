const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');
const Property = require('./Property');

class Local extends Model {}

Local.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    reference_code: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: { type: DataTypes.ENUM('available', 'occupied', 'maintenance'), defaultValue: 'available' },
    size_m2: { type: DataTypes.FLOAT, allowNull: true, validate: { min: 0 } },
    property_id: { type: DataTypes.UUID, allowNull: false }
  },
  {
    sequelize,
    modelName: 'Local',
    tableName: 'locals',
    timestamps: true,
    paranoid: true,
    underscored: true
  }
);

module.exports = Local;
