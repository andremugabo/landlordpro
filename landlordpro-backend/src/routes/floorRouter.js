const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floorController');

// Middleware
const { authenticate, adminOnly, managerOrAdminOnly } = require('../middleware/authMiddleware');
const verifyManagerAccess = require('../middleware/verifyManagerAccess');

// ======================================
// 🔐 All routes protected
// ======================================
router.use(authenticate);

// ================================
// 🏢 PROPERTY-SPECIFIC FLOOR ROUTES
// ================================
router.get(
  '/floors/property/:propertyId',
  managerOrAdminOnly,
  floorController.getFloorsByPropertyId
);

router.get(
  '/floors/property/:propertyId/simple',
  managerOrAdminOnly,
  floorController.getPropertyFloors
);

// ================================
// 📊 ANALYTICS & REPORTS
// ================================
router.get(
  '/floors/summary',
  managerOrAdminOnly,
  floorController.getFloorsSummary
);

router.get(
  '/floors/stats',
  managerOrAdminOnly,
  floorController.getFloorsWithStats
);

router.get(
  '/floors/reports/occupancy',
  managerOrAdminOnly,
  floorController.getAllFloorsOccupancy
);

router.get(
  '/floors/:id/occupancy',
  managerOrAdminOnly,
  verifyManagerAccess({ model: require('../models').Floor, propertyAlias: 'propertyForFloor' }),
  floorController.getFloorOccupancy
);

// ================================
// 🔧 CRUD OPERATIONS
// ================================
router.get(
  '/floors',
  managerOrAdminOnly,
  floorController.getAllFloors
);

router.get(
  '/floors/:id',
  managerOrAdminOnly,
  verifyManagerAccess({ model: require('../models').Floor, propertyAlias: 'propertyForFloor' }),
  floorController.getFloorById
);

router.put(
  '/floors/:id',
  adminOnly,
  floorController.updateFloor
);

router.delete(
  '/floors/:id',
  adminOnly, 
  floorController.deleteFloor
);

module.exports = router;