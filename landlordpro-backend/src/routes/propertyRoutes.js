const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController'); // keep as object
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// Create a new property (admin only)
router.post('/properties', authenticate, adminOnly, propertyController.createProperty);

// Get all properties with optional pagination
router.get('/properties', authenticate, propertyController.getAllProperties);

// Get a single property by ID
router.get('/properties/:id', authenticate, propertyController.getPropertyById);

// Update a property by ID (admin only)
router.put('/properties/:id', authenticate, adminOnly, propertyController.updateProperty);

// Delete a property by ID (admin only, soft delete)
router.delete('/properties/:id', authenticate, adminOnly, propertyController.deleteProperty);

module.exports = router;
