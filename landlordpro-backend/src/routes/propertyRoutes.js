const express = require('express');
const router = express.Router();

// Controllers
const propertyController = require('../controllers/propertyController');
const localController = require('../controllers/localController');

// Middleware
const { authenticate, adminOnly } = require('../middleware/authMiddleware');



// ------------------------
// Property Routes
// ------------------------

// Create a new property (admin only)
router.post('/properties', authenticate, adminOnly, propertyController.createProperty);

// Get all properties with optional pagination
router.get('/properties', authenticate, propertyController.getAllProperties);

// Get a single property by ID
router.get('/properties/:id', authenticate, propertyController.getPropertyById);

// Update a property by ID (admin only)
router.put('/properties/:id', authenticate, adminOnly, propertyController.updateProperty);

// Soft-delete a property by ID (admin only)
router.delete('/properties/:id', authenticate, adminOnly, propertyController.deleteProperty);

// Get all floors for a specific property
router.get('/properties/:id/floors', authenticate, propertyController.getFloorsByPropertyId);

// Get all locals for a specific property
router.get('/properties/:id/locals', authenticate, localController.getLocalsByPropertyId);

module.exports = router;
