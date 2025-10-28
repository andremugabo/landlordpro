const floorService = require('../services/floorService');
const { Property } = require('../models')

/**
 * Helper to handle async controller actions
 */
const handleAsync = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err); // optional logging
    res.status(err.status || 500).json({ error: err.message });
  });

// ------------------- CRUD -------------------

// Create a new floor
exports.createFloor = handleAsync(async (req, res) => {
  // Currently not implemented
  res.status(501).json({ message: 'Floor creation is not implemented' });
});

// Get all floors with property name
exports.getAllFloors = handleAsync(async (req, res) => {
    const floors = await floorService.getAllFloors();
  
    // Map results to include property name
    const formattedFloors = floors.map(floor => ({
      id: floor.id,
      name: floor.name,
      level_number: floor.level_number,
      property_id: floor.property_id,
      property_name: floor.propertyForFloor?.name || null, // use correct alias
      localsForFloor: floor.localsForFloor || [],
    }));
  
    res.status(200).json(formattedFloors);
  });
  

// Get a floor by ID
exports.getFloorById = handleAsync(async (req, res) => {
  const floor = await floorService.getFloorById(req.params.id);
  res.status(200).json(floor);
});

// Update a floor
exports.updateFloor = handleAsync(async (req, res) => {
  const floor = await floorService.updateFloor(req.params.id, req.body);
  res.status(200).json(floor);
});

// Delete a floor (soft delete)
exports.deleteFloor = handleAsync(async (req, res) => {
  const result = await floorService.deleteFloor(req.params.id);
  res.status(200).json(result);
});

// ------------------- Occupancy Reports -------------------

// Get occupancy report for one floor
exports.getFloorOccupancy = handleAsync(async (req, res) => {
  const report = await floorService.getFloorOccupancy(req.params.id);
  res.status(200).json(report);
});

// Get occupancy report for all floors
exports.getAllFloorsOccupancy = handleAsync(async (req, res) => {
  const report = await floorService.getAllFloorsOccupancy();
  res.status(200).json(report);
});
