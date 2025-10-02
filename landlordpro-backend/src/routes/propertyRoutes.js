const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController'); // keep it as an object
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// Routes
router.post('/properties', authenticate, adminOnly, propertyController.createProperty);
router.get('/properties', authenticate, propertyController.getAllProperties);
router.get('/properties/:id', authenticate, propertyController.getPropertyById);
router.put('/properties/:id', authenticate, adminOnly, propertyController.updateProperty);
router.delete('/properties/:id', authenticate, adminOnly, propertyController.deleteProperty);

module.exports = router;
