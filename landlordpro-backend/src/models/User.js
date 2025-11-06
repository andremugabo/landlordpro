const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db'); 
const Joi = require('joi');

class User extends Model {}

User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  full_name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'manager', 'employee'), defaultValue: 'employee' },
  picture: {type: DataTypes.STRING, allowNull:true},
  phone: {type: DataTypes.STRING,allowNull:true},
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: false
});

// Joi Schemas
const registerSchema = Joi.object({
  full_name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'manager','employee').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateSchema = Joi.object({
  full_name: Joi.string().min(3).max(100).optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid('admin', 'manager','employee').optional(),
  is_active: Joi.boolean().optional(),
  picture: Joi.string().uri().optional(),
});

const disableSchema = Joi.object({
  id: Joi.string().uuid().required()
});

module.exports = User;
module.exports.schemas = { registerSchema, loginSchema, updateSchema, disableSchema };
