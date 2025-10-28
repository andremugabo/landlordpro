const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floorController');

// ------------------- CRUD -------------------
// Create a new floor (optional)
// router.post('/', floorController.createFloor);

// Get all floors
router.get('/floors', floorController.getAllFloors);

// Get a floor by ID
router.get('/floors/:id', floorController.getFloorById);

// Update a floor
router.put('/floors/:id', floorController.updateFloor);

// Soft-delete a floor
router.delete('/floors/:id', floorController.deleteFloor);

// ------------------- Occupancy -------------------
// Occupancy report for all floors
router.get('/floors/reports/occupancy', floorController.getAllFloorsOccupancy);

// Occupancy report for a single floor
router.get('/floors/:id/occupancy', floorController.getFloorOccupancy);

module.exports = router;
