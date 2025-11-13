const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floorController');

// Middleware
const { authenticate, adminOnly, managerOrAdminOnly } = require('../middleware/authMiddleware');

// ======================================
// 🔐 All routes protected
// ======================================
router.use(authenticate);

// ================================
// 🏢 PROPERTY-SPECIFIC FLOOR ROUTES
// ================================

// Get floors by property ID (with full details)
// ✅ Service handles manager access control
router.get(
  '/floors/property/:propertyId',
  managerOrAdminOnly,
  floorController.getFloorsByPropertyId
);

// Get floors by property ID (simple list)
// ✅ Service handles manager access control
router.get(
  '/floors/property/:propertyId/simple',
  managerOrAdminOnly,
  floorController.getPropertyFloors
);

// ================================
// 📊 ANALYTICS & REPORTS
// ================================

// Get summary statistics (dashboard)
// ✅ Service handles manager access control
router.get(
  '/floors/summary',
  managerOrAdminOnly,
  floorController.getFloorsSummary
);

// Get detailed statistics for all floors
// ✅ Service handles manager access control
router.get(
  '/floors/stats',
  managerOrAdminOnly,
  floorController.getFloorsWithStats
);

// Get occupancy report for all floors
// ✅ Service handles manager access control
router.get(
  '/floors/reports/occupancy',
  managerOrAdminOnly,
  floorController.getAllFloorsOccupancy
);

// Get occupancy report for single floor
// ✅ Service handles manager access control
router.get(
  '/floors/:id/occupancy',
  managerOrAdminOnly,
  floorController.getFloorOccupancy
);

// ================================
// 🔧 CRUD OPERATIONS
// ================================

// Get all floors (with optional property filter via query param)
// ✅ Service handles manager access control
router.get(
  '/floors',
  managerOrAdminOnly,
  floorController.getAllFloors
);

// Get single floor by ID
// ✅ Service handles manager access control
router.get(
  '/floors/:id',
  managerOrAdminOnly,
  floorController.getFloorById
);

// Update floor (admin only - managers can't modify floor structure)
// ✅ Service still verifies manager access for consistency
router.put(
  '/floors/:id',
  adminOnly,
  floorController.updateFloor
);

// Delete floor (admin only - managers can't delete floors)
// ✅ Service still verifies manager access for consistency
router.delete(
  '/floors/:id',
  adminOnly, 
  floorController.deleteFloor
);

// ================================
// 🚫 DISABLED: Create Floor
// ================================
// Floors are auto-created with properties
// Manual creation disabled in controller
router.post(
  '/floors',
  adminOnly,
  floorController.createFloor
);

module.exports = router;