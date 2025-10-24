const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { Property, Floor } = require('../models'); 

// ✅ Validation schema
const propertySchema = Joi.object({
  name: Joi.string().required(),
  location: Joi.string().required(),
  description: Joi.string().optional(),
  number_of_floors: Joi.number().integer().min(1).required(),
  has_basement: Joi.boolean().required()
});

// ✅ Create a property (with floors)
async function createProperty(data) {
  // Validate input
  const { error, value } = propertySchema.validate(data);
  if (error) throw new Error(error.details[0].message);

  // Assign UUID
  value.id = uuidv4();

  // Create property
  const property = await Property.create(value);

  // Automatically create floors
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
    success: true,
    message: 'Property created successfully with floors.',
    property,
    floors
  };
}

// ✅ Get all properties
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

// ✅ Get property by ID
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

// ✅ Update property
// ✅ Update property and sync floors
async function updateProperty(id, data) {
  const { error, value } = propertySchema.validate(data, { presence: 'optional', abortEarly: false });
  if (error) throw new Error(error.details[0].message);

  // Find property
  const property = await Property.findOne({
    where: { id, deleted_at: null },
    include: [{ model: Floor, as: 'floorsForProperty' }]
  });

  if (!property) {
    const err = new Error('Property not found');
    err.status = 404;
    throw err;
  }

  // Save old values before update
  const oldNumFloors = property.number_of_floors;
  const oldHasBasement = property.has_basement;

  // Update property
  await property.update(value);

  // Fetch updated property values
  const newNumFloors = property.number_of_floors;
  const newHasBasement = property.has_basement;

  // ===============================
  // 🧱 FLOOR SYNCHRONIZATION LOGIC
  // ===============================
  const { Op } = require('sequelize');

  // ✅ Handle basement addition/removal
  if (newHasBasement && !oldHasBasement) {
    // Add basement
    await Floor.create({
      id: uuidv4(),
      property_id: property.id,
      level_number: -1,
      name: 'Basement'
    });
  } else if (!newHasBasement && oldHasBasement) {
    // Remove basement
    await Floor.destroy({
      where: { property_id: property.id, level_number: -1 }
    });
  }

  // ✅ Handle change in number of floors above ground
  if (newNumFloors > oldNumFloors) {
    // Add new floors
    for (let i = oldNumFloors + 1; i <= newNumFloors; i++) {
      await Floor.create({
        id: uuidv4(),
        property_id: property.id,
        level_number: i,
        name: i === 0 ? 'Ground Floor' : `Floor ${i}`
      });
    }
  } else if (newNumFloors < oldNumFloors) {
    // Remove extra floors
    await Floor.destroy({
      where: {
        property_id: property.id,
        level_number: { [Op.gt]: newNumFloors }
      }
    });
  }

  // ✅ Return updated property
  const updated = await Property.findOne({
    where: { id },
    include: [{ model: Floor, as: 'floorsForProperty' }]
  });

  return {
    success: true,
    message: 'Property and floors updated successfully.',
    property: updated
  };
}


// ✅ Soft delete property
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
