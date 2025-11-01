const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floorController');

// ------------------- Occupancy Reports (static first!) -------------------
router.get('/floors/reports/occupancy', floorController.getAllFloorsOccupancy);
router.get('/floors/:id/occupancy', floorController.getFloorOccupancy);

// ------------------- CRUD -------------------
router.get('/floors', floorController.getAllFloors);       // list all floors
router.get('/floors/:id', floorController.getFloorById);  // single floor
router.put('/floors/:id', floorController.updateFloor);
router.delete('/floors/:id', floorController.deleteFloor);

// Optional: create
// router.post('/floors', floorController.createFloor);

module.exports = router;
