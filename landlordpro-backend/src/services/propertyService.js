const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { Op } = require('sequelize');
const { Property, Floor } = require('../models');

// ================================
// ✅ Validation Schema
// ================================
const propertySchema = Joi.object({
  name: Joi.string().required(),
  location: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  number_of_floors: Joi.number().integer().min(1).required(),
  has_basement: Joi.boolean().required(),
  manager_id: Joi.string().uuid().optional() // for linking to manager
});

// ================================
// ✅ Create Property (with Floors)
// ================================
async function createProperty(data, user) {
  const { error, value } = propertySchema.validate(data);
  if (error) {
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  // If manager is creating the property, automatically assign them as manager
  if (user.role === 'manager') {
    value.manager_id = user.id;
  }

  value.id = uuidv4();

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
    data: { property, floors }
  };
}

// ================================
// ✅ Get All Properties (with Pagination)
// ================================
async function getAllProperties(user, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const whereClause = { deleted_at: null };
  if (user.role === 'manager') {
    whereClause.manager_id = user.id; // Restrict to manager’s properties
  }

  const [total, properties] = await Promise.all([
    Property.count({ where: whereClause }),
    Property.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [{ model: Floor, as: 'floorsForProperty' }]
    })
  ]);

  return {
    success: true,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    },
    data: properties
  };
}

// ================================
// ✅ Get Property by ID (Restricted Access)
// ================================
async function getPropertyById(id, user) {
  const whereClause = { id, deleted_at: null };
  if (user.role === 'manager') {
    whereClause.manager_id = user.id; // Restrict access
  }

  const property = await Property.findOne({
    where: whereClause,
    include: [{ model: Floor, as: 'floorsForProperty' }]
  });

  if (!property) {
    const err = new Error('Property not found or access denied.');
    err.status = 404;
    throw err;
  }

  return { success: true, data: property };
}

// ================================
// ✅ Update Property + Sync Floors
// ================================
async function updateProperty(id, data, user) {
  const { error, value } = propertySchema.validate(data, {
    presence: 'optional',
    abortEarly: false
  });
  if (error) {
    const err = new Error(error.details.map(e => e.message).join(', '));
    err.status = 400;
    throw err;
  }

  // Restrict managers to their own properties
  const whereClause = { id, deleted_at: null };
  if (user.role === 'manager') whereClause.manager_id = user.id;

  const property = await Property.findOne({
    where: whereClause,
    include: [{ model: Floor, as: 'floorsForProperty' }]
  });

  if (!property) {
    const err = new Error('Property not found or access denied.');
    err.status = 404;
    throw err;
  }

  const oldNumFloors = property.number_of_floors;
  const oldHasBasement = property.has_basement;

  await property.update(value);

  const newNumFloors = property.number_of_floors;
  const newHasBasement = property.has_basement;

  // ===============================
  // 🧱 FLOOR SYNCHRONIZATION LOGIC
  // ===============================

  // Basement addition/removal
  if (newHasBasement && !oldHasBasement) {
    await Floor.create({
      id: uuidv4(),
      property_id: property.id,
      level_number: -1,
      name: 'Basement'
    });
  } else if (!newHasBasement && oldHasBasement) {
    await Floor.destroy({ where: { property_id: property.id, level_number: -1 } });
  }

  // Floors above ground
  if (newNumFloors > oldNumFloors) {
    for (let i = oldNumFloors + 1; i <= newNumFloors; i++) {
      await Floor.create({
        id: uuidv4(),
        property_id: property.id,
        level_number: i,
        name: i === 0 ? 'Ground Floor' : `Floor ${i}`
      });
    }
  } else if (newNumFloors < oldNumFloors) {
    await Floor.destroy({
      where: { property_id: property.id, level_number: { [Op.gt]: newNumFloors } }
    });
  }

  const updated = await Property.findOne({
    where: { id },
    include: [{ model: Floor, as: 'floorsForProperty' }]
  });

  return {
    success: true,
    message: 'Property and floors updated successfully.',
    data: updated
  };
}

// ================================
// ✅ Soft Delete Property
// ================================
async function deleteProperty(id, user) {
  const whereClause = { id, deleted_at: null };
  if (user.role === 'manager') whereClause.manager_id = user.id;

  const property = await Property.findOne({ where: whereClause });
  if (!property) {
    const err = new Error('Property not found or access denied.');
    err.status = 404;
    throw err;
  }

  await property.update({ deleted_at: new Date() });
  return {
    success: true,
    message: 'Property deleted successfully (soft delete).'
  };
}

module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
};
