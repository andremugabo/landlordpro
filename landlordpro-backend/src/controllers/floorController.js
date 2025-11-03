const floorService = require('../services/floorService');

/**
 * Helper for unified async error handling
 */
const handleAsync = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'An unexpected error occurred.',
    });
  });

// ================================
// 🚫 Create Floor (Disabled)
// ================================
exports.createFloor = handleAsync(async (req, res) => {
  return res.status(405).json({
    success: false,
    message: 'Floors are automatically created with properties. Manual creation is not allowed.',
  });
});

// ================================
// 📋 Get All Floors with Property Info
// ================================
exports.getAllFloors = handleAsync(async (req, res) => {
  const floors = await floorService.getAllFloors();

  const formattedFloors = floors.map((floor) => ({
    id: floor.id,
    name: floor.name,
    level_number: floor.level_number,
    property_id: floor.property_id,
    property_name: floor.propertyForFloor?.name || null,
    locals: floor.localsForFloor || [],
  }));

  res.status(200).json({
    success: true,
    total: formattedFloors.length,
    data: formattedFloors,
  });
});

// ================================
// 🔍 Get a Floor by ID
// ================================
exports.getFloorById = handleAsync(async (req, res) => {
  const floor = await floorService.getFloorById(req.params.id);
  res.status(200).json({
    success: true,
    data: floor,
  });
});

// ================================
// ✏️ Update Floor Info
// ================================
exports.updateFloor = handleAsync(async (req, res) => {
  const updated = await floorService.updateFloor(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Floor updated successfully.',
    data: updated,
  });
});

// ================================
// 🗑️ Delete (Soft Delete) Floor
// ================================
exports.deleteFloor = handleAsync(async (req, res) => {
  const result = await floorService.deleteFloor(req.params.id);
  res.status(200).json({
    success: true,
    ...result,
  });
});

// ================================
// 📊 Occupancy Reports
// ================================

// Single floor occupancy
exports.getFloorOccupancy = handleAsync(async (req, res) => {
  const report = await floorService.getFloorOccupancy(req.params.id);
  res.status(200).json({
    success: true,
    data: report,
  });
});

// All floors occupancy
exports.getAllFloorsOccupancy = handleAsync(async (req, res) => {
  const report = await floorService.getAllFloorsOccupancy();
  res.status(200).json({
    success: true,
    total: report.length,
    data: report,
  });
});
