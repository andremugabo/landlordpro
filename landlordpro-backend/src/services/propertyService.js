const { v4: uuidv4 } = require('uuid');
const Property = require('../models/Property');
const Joi = require('joi');

// Validation schema
const propertySchema = Joi.object({
  name: Joi.string().required(),
  location: Joi.string().required(),
  description: Joi.string().optional()
});

// Create a property
async function createProperty(data) {
  const { error, value } = propertySchema.validate(data);
  if (error) throw new Error(error.details[0].message);

  // Assign a UUID if the model does not auto-generate it
  value.id = uuidv4();

  return await Property.create(value);
}

// Get all properties with pagination (excluding soft-deleted)
async function getAllProperties(page = 1, limit = 10) {
  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  const total = await Property.count({ where: { deleted_at: null } });

  const properties = await Property.findAll({
    where: { deleted_at: null },
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    properties
  };
}

// Get a property by ID
async function getPropertyById(id) {
  const property = await Property.findOne({ where: { id, deleted_at: null } });
  if (!property) {
    const error = new Error('Property not found');
    error.status = 404;
    throw error;
  }
  return property;
}

// Update a property
async function updateProperty(id, data) {
  // Only validate provided fields
  const { error, value } = propertySchema.validate(data, { presence: 'optional', abortEarly: false });
  if (error) throw new Error(error.details[0].message);

  const property = await Property.findOne({ where: { id, deleted_at: null } });
  if (!property) {
    const error = new Error('Property not found');
    error.status = 404;
    throw error;
  }

  await property.update(value);
  return property;
}

// Soft-delete a property
async function deleteProperty(id) {
  const property = await Property.findOne({ where: { id, deleted_at: null } });
  if (!property) {
    const error = new Error('Property not found');
    error.status = 404;
    throw error;
  }

  await property.update({ deleted_at: new Date() });
  return { message: 'Property deleted successfully (soft delete)' };
}

module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
};
