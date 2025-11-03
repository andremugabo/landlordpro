// controllers/propertyController.js
const propertyService = require('../services/propertyService');

// =====================================================
// 🧩 Helper: Centralized Error Handler
// =====================================================
const handleError = (res, err, defaultMessage, defaultStatus = 500) => {
  console.error('❌ Property Controller Error:', err);
  const status = err.status || defaultStatus;
  res.status(status).json({
    success: false,
    message: err.message || defaultMessage,
  });
};

// =====================================================
// ✅ Create a New Property
// =====================================================
exports.createProperty = async (req, res) => {
  try {
    const result = await propertyService.createProperty(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err, 'Failed to create property.', 400);
  }
};

// =====================================================
// ✅ Get All Properties (with pagination)
// =====================================================
exports.getAllProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await propertyService.getAllProperties(req.user, page, limit);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, 'Failed to fetch properties.');
  }
};

// =====================================================
// ✅ Get Property by ID (restricted for managers)
// =====================================================
exports.getPropertyById = async (req, res) => {
  try {
    const result = await propertyService.getPropertyById(req.params.id, req.user);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, 'Property not found.', 404);
  }
};

// =====================================================
// ✅ Update Property (admin or assigned manager only)
// =====================================================
exports.updateProperty = async (req, res) => {
  try {
    const result = await propertyService.updateProperty(req.params.id, req.body, req.user);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, 'Failed to update property.', 400);
  }
};

// =====================================================
// ✅ Soft Delete Property (admin or assigned manager only)
// =====================================================
exports.deleteProperty = async (req, res) => {
  try {
    const result = await propertyService.deleteProperty(req.params.id, req.user);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, 'Failed to delete property.', 404);
  }
};

// =====================================================
// ✅ Get Floors by Property ID (restricted for managers)
// =====================================================
exports.getFloorsByPropertyId = async (req, res) => {
  try {
    const result = await propertyService.getPropertyById(req.params.id, req.user);

    // Handle missing floors array safely
    const floors = result?.data?.floorsForProperty || [];

    res.status(200).json({
      success: true,
      data: floors,
    });
  } catch (err) {
    handleError(res, err, 'Failed to fetch floors.');
  }
};
