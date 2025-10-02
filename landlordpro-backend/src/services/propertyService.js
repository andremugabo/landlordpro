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

    return await Property.create(value);
}

// Get all properties with pagination
async function getAllProperties(page = 1, limit = 10) {
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const total = await Property.count();

    const properties = await Property.findAll({
        limit,
        offset,
        order: [['created_at', 'DESC']]
    });

    return {
        total,
        page,
        limit,
        properties
    };
}

// Get a property by ID
async function getPropertyById(id) {
    const property = await Property.findByPk(id);
    if (!property) throw new Error('Property not found');
    return property;
}

// Update a property
async function updateProperty(id, data) {
    const { error, value } = propertySchema.validate(data, { presence: 'optional' });
    if (error) throw new Error(error.details[0].message);

    const property = await Property.findByPk(id);
    if (!property) throw new Error('Property not found');

    await property.update(value);
    return property;
}

// Delete a property
async function deleteProperty(id) {
    const deleted = await Property.destroy({ where: { id } });
    if (!deleted) throw new Error('Property not found');
    return { message: 'Property deleted successfully' };
}

module.exports = {
    createProperty,
    getAllProperties,
    getPropertyById,
    updateProperty,
    deleteProperty
};
