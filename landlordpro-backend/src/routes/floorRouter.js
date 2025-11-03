const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floorController');

// Middleware
const { authenticate, adminOnly, managerOrAdminOnly } = require('../middleware/authMiddleware');
const verifyManagerAccess = require('../middleware/verifyManagerAccess'); // can verify floor's property

// ======================================
// 🔐 All routes protected
// ======================================
router.use(authenticate);

// ================================
// 📊 Occupancy Reports
// ================================
router.get(
  '/floors/reports/occupancy',
  managerOrAdminOnly,
  floorController.getAllFloorsOccupancy
);
router.get(
  '/floors/:id/occupancy',
  managerOrAdminOnly,
  verifyManagerAccess({ model: require('../models').Floor }),
  floorController.getFloorOccupancy
);

// ================================
// 📋 CRUD (Read/Update/Delete)
// ================================
router.get(
  '/floors',
  managerOrAdminOnly,
  floorController.getAllFloors
);

router.get(
  '/floors/:id',
  managerOrAdminOnly,
  verifyManagerAccess({ model: require('../models').Floor }),
  floorController.getFloorById
);

router.put(
  '/floors/:id',
  adminOnly, // only admins can update floor details
  floorController.updateFloor
);

router.delete(
  '/floors/:id',
  adminOnly, 
  floorController.deleteFloor
);



module.exports = router;
