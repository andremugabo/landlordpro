const propertyService = require('../services/propertyService');

// Create a new property (admin only)
exports.createProperty = async (req, res) => {
    try {
        const property = await propertyService.createProperty(req.body);
        return res.status(201).json({ success: true, property });
    } catch (err) {
        // 400 if validation error, 500 for server error
        return res.status(400).json({ success: false, message: err.message });
    }
};

// Get all properties with pagination
exports.getAllProperties = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await propertyService.getAllProperties(page, limit);
        return res.status(200).json({ success: true, ...result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Get property by ID
exports.getPropertyById = async (req, res) => {
    try {
        const property = await propertyService.getPropertyById(req.params.id);
        return res.status(200).json({ success: true, property });
    } catch (err) {
        return res.status(404).json({ success: false, message: err.message });
    }
};

// Update a property (admin only)
exports.updateProperty = async (req, res) => {
    try {
        const property = await propertyService.updateProperty(req.params.id, req.body);
        return res.status(200).json({ success: true, property });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

// Delete a property (admin only)
exports.deleteProperty = async (req, res) => {
    try {
        const result = await propertyService.deleteProperty(req.params.id);
        return res.status(200).json({ success: true, message: result.message });
    } catch (err) {
        return res.status(404).json({ success: false, message: err.message });
    }
};
