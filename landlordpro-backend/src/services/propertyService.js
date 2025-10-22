const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const Property = require('../models/Property');
const Floor = require('../models/Floor');

// ✅ Validation schema
const propertySchema = Joi.object({
  name: Joi.string().required(),
  location: Joi.string().required(),
  description: Joi.string().optional(),
  number_of_floors: Joi.number().integer().min(1).required(),
  has_basement: Joi.boolean().required()
});

// ✅ Create a property (and its floors)
async function createProperty(data) {
  const { error, value } = propertySchema.validate(data);
  if (error) throw new Error(error.details[0].message);

  // Assign a UUID if not automatically handled by Sequelize
  value.id = uuidv4();

  // 🏢 Create the property
  const property = await Property.create(value);

  // 🧱 Automatically create floor records (basement + all floors)
  const floors = [];

  if (value.has_basement) {
    floors.push({
      id: uuidv4(),
      property_id: property.id,
      level_number: -1,
      name: 'Basement'
    });
  }

  // Floors: 0 = Ground, 1 = First, etc.
  for (let i = 0; i <= value.number_of_floors; i++) {
    floors.push({
      id: uuidv4(),
      property_id: property.id,
      level_number: i,
      name: i === 0 ? 'Ground Floor' : `Floor ${i}`
    });
  }

  await Floor.bulkCreate(floors);

  return {
    message: 'Property created successfully with floors.',
    property,
    floors
  };
}

// ✅ Get all properties with pagination (excluding soft-deleted)
async function getAllProperties(page = 1, limit = 10) {
  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  const total = await Property.count({ where: { deleted_at: null } });

  const properties = await Property.findAll({
    where: { deleted_at: null },
    limit,
    offset,
    order: [['created_at', 'DESC']],
    include: [{ model: Floor, as: 'floorsForProperty' }]
  });

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    properties
  };
}

// ✅ Get a property by ID (with floors)
async function getPropertyById(id) {
  const property = await Property.findOne({
    where: { id, deleted_at: null },
    include: [{ model: Floor, as: 'floorsForProperty' }]
  });

  if (!property) {
    const error = new Error('Property not found');
    error.status = 404;
    throw error;
  }

  return property;
}

// ✅ Update a property (with validation)
async function updateProperty(id, data) {
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

// ✅ Soft-delete a property (mark deleted_at)
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
