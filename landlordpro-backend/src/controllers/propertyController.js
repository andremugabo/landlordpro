const propertyService = require('../services/propertyService');

// ✅ Create a new property (admin only)
exports.createProperty = async (req, res) => {
  try {
    const result = await propertyService.createProperty(req.body);
    return res.status(201).json({
      success: true,
      message: result.message,
      property: result.property,
      floors: result.floors
    });
  } catch (err) {
    // Distinguish validation vs server errors
    const statusCode = err.message.includes('required') || err.message.includes('Invalid')
      ? 400
      : 500;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
};

// ✅ Get all properties with pagination
exports.getAllProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await propertyService.getAllProperties(page, limit);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get a property by ID (with floors)
exports.getPropertyById = async (req, res) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);
    return res.status(200).json({ success: true, property });
  } catch (err) {
    const statusCode = err.status || 404;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
};

// ✅ Update a property (admin only)
exports.updateProperty = async (req, res) => {
  try {
    const property = await propertyService.updateProperty(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Property updated successfully.',
      property
    });
  } catch (err) {
    const statusCode = err.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
};

// ✅ Soft-delete a property (admin only)
exports.deleteProperty = async (req, res) => {
  try {
    const result = await propertyService.deleteProperty(req.params.id);
    return res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    const statusCode = err.status || 404;
    return res.status(statusCode).json({ success: false, message: err.message });
  }
};


exports.getFloorsByPropertyId = async (req, res) => {
    try {
      const property = await propertyService.getPropertyById(req.params.id);
      return res.status(200).json({ success: true, floors: property.floorsForProperty });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };