// routes/propertyRoutes.js
const express = require('express');
const router = express.Router();

// =======================
// 📦 Controllers
// =======================
const propertyController = require('../controllers/propertyController');
const localController = require('../controllers/localController');

// =======================
// 🧱 Middleware
// =======================
const { authenticate, adminOnly, managerOrAdminOnly } = require('../middleware/authMiddleware');
const verifyPropertyAccess = require('../middleware/verifyManagerAccess');

// ======================================================
// 🔐 All routes require authentication
// ======================================================
router.use(authenticate);

// ======================================================
// 🏠 PROPERTY ROUTES (all prefixed with /properties)
// ======================================================

// ------------------------------------------------------
// 🔸 Create a new property → Admin only
// ------------------------------------------------------
router.post('/properties', adminOnly, propertyController.createProperty);

// ------------------------------------------------------
// 🔸 Get all properties
//     → Admin sees all
//     → Manager sees only assigned property
// ------------------------------------------------------
router.get('/properties', managerOrAdminOnly, propertyController.getAllProperties);

// ------------------------------------------------------
// 🔸 Get a single property
//     → Admin or assigned Manager only
// ------------------------------------------------------
router.get(
  '/properties/:id',
  managerOrAdminOnly,
  verifyPropertyAccess,
  propertyController.getPropertyById
);

// ------------------------------------------------------
// 🔸 Update a property
//     → Admin only (can be extended for assigned Manager if needed)
// ------------------------------------------------------
router.put('/properties/:id', adminOnly, propertyController.updateProperty);

// ------------------------------------------------------
// 🔸 Soft-delete a property
//     → Admin only
// ------------------------------------------------------
router.delete('/properties/:id', adminOnly, propertyController.deleteProperty);

// ------------------------------------------------------
// 🔸 Get all floors for a property
//     → Admin or assigned Manager only
// ------------------------------------------------------
router.get(
  '/properties/:id/floors',
  managerOrAdminOnly,
  verifyPropertyAccess,
  propertyController.getFloorsByPropertyId
);

// ------------------------------------------------------
// 🔸 Get all locals for a property
//     → Admin or assigned Manager only
// ------------------------------------------------------
router.get(
  '/properties/:id/locals',
  managerOrAdminOnly,
  verifyPropertyAccess,
  localController.getLocalsByPropertyId
);

module.exports = router;
