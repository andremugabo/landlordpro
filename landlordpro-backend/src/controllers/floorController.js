const floorService = require('../services/floorService');

/**
 * Helper for unified async error handling
 */
const handleAsync = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error('Floor Controller Error:', err);
    res.status(err.statusCode || 500).json({
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
// 📋 Get All Floors with Property Info (with optional property filter)
// ================================
exports.getAllFloors = handleAsync(async (req, res) => {
  const { propertyId } = req.query;
  
  const floors = await floorService.getAllFloors(propertyId || null);

  const formattedFloors = floors.map((floor) => ({
    id: floor.id,
    name: floor.name,
    level_number: floor.level_number,
    property_id: floor.property_id,
    property_name: floor.propertyForFloor?.name || null,
    property_location: floor.propertyForFloor?.location || null,
    locals: floor.localsForFloor || [],
    locals_count: floor.localsForFloor?.length || 0,
    // Include local details if available
    locals_details: (floor.localsForFloor || []).map(local => ({
      id: local.id,
      status: local.status,
      local_number: local.local_number || `LOC-${local.id.substring(0, 8)}`,
      area: local.area || null
    }))
  }));

  res.status(200).json({
    success: true,
    total: formattedFloors.length,
    data: formattedFloors,
    filtered_by_property: !!propertyId,
    property_id: propertyId || null
  });
});

// ================================
// 🏢 Get Floors by Property ID
// ================================
exports.getFloorsByPropertyId = handleAsync(async (req, res) => {
  const { propertyId } = req.params;
  
  const floors = await floorService.getFloorsByPropertyId(propertyId);

  const formattedFloors = floors.map((floor) => {
    const locals = floor.localsForFloor || [];
    const total = locals.length;
    const occupied = locals.filter(l => l.status === 'occupied').length;
    const available = locals.filter(l => l.status === 'available').length;
    const maintenance = locals.filter(l => l.status === 'maintenance').length;
    const occupancyRate = total > 0 ? parseFloat(((occupied / total) * 100).toFixed(2)) : 0;

    return {
      id: floor.id,
      name: floor.name,
      level_number: floor.level_number,
      property_id: floor.property_id,
      property_name: floor.propertyForFloor?.name || null,
      property_location: floor.propertyForFloor?.location || null,
      locals: locals,
      locals_count: total,
      locals_details: locals.map(local => ({
        id: local.id,
        status: local.status,
        local_number: local.local_number || `LOC-${local.id.substring(0, 8)}`,
        area: local.area || null,
        rent_price: local.rent_price || null
      })),
      // Enhanced occupancy stats
      occupancy: {
        total,
        occupied,
        available,
        maintenance,
        occupancy_rate: occupancyRate
      }
    };
  });

  // Get property info from first floor (all floors belong to same property)
  const propertyInfo = floors.length > 0 ? {
    id: floors[0]?.propertyForFloor?.id,
    name: floors[0]?.propertyForFloor?.name,
    location: floors[0]?.propertyForFloor?.location,
  } : null;

  res.status(200).json({
    success: true,
    total: formattedFloors.length,
    property: propertyInfo,
    data: formattedFloors,
  });
});

// ================================
// 📊 Get Floors with Detailed Statistics (with optional property filter)
// ================================
exports.getFloorsWithStats = handleAsync(async (req, res) => {
  const { propertyId } = req.query;
  
  const floors = await floorService.getFloorsWithStats(propertyId || null);

  // Format the response to include both floor data and statistics
  const formattedFloors = floors.map(floor => ({
    id: floor.id,
    name: floor.name,
    level_number: floor.level_number,
    property_id: floor.property_id,
    property_name: floor.propertyForFloor?.name || null,
    property_location: floor.propertyForFloor?.location || null,
    locals: floor.localsForFloor || [],
    locals_count: floor.localsForFloor?.length || 0,
    statistics: floor.statistics || {
      total_locals: 0,
      occupied: 0,
      available: 0,
      maintenance: 0,
      occupancy_rate: 0,
      total_area: 0,
      total_rent: 0,
      occupied_rent: 0,
      revenue_percentage: 0
    }
  }));

  res.status(200).json({
    success: true,
    total: formattedFloors.length,
    data: formattedFloors,
    filtered_by_property: !!propertyId,
    property_id: propertyId || null
  });
});

// ================================
// 🔍 Get a Floor by ID
// ================================
exports.getFloorById = handleAsync(async (req, res) => {
  const floor = await floorService.getFloorById(req.params.id);
  
  // Format the response
  const formattedFloor = {
    id: floor.id,
    name: floor.name,
    level_number: floor.level_number,
    property_id: floor.property_id,
    property_name: floor.propertyForFloor?.name || null,
    property_location: floor.propertyForFloor?.location || null,
    property_floors_count: floor.propertyForFloor?.number_of_floors || 0,
    locals: floor.localsForFloor || [],
    locals_count: floor.localsForFloor?.length || 0,
    locals_details: (floor.localsForFloor || []).map(local => ({
      id: local.id,
      status: local.status,
      local_number: local.local_number || `LOC-${local.id.substring(0, 8)}`,
      area: local.area || null,
      rent_price: local.rent_price || null
    }))
  };

  res.status(200).json({
    success: true,
    data: formattedFloor,
  });
});

// ================================
// ✏️ Update Floor Info
// ================================
exports.updateFloor = handleAsync(async (req, res) => {
  const updated = await floorService.updateFloor(req.params.id, req.body);
  
  // Format the updated floor response
  const formattedFloor = {
    id: updated.id,
    name: updated.name,
    level_number: updated.level_number,
    property_id: updated.property_id,
    updatedAt: updated.updatedAt
  };

  res.status(200).json({
    success: true,
    message: 'Floor updated successfully.',
    data: formattedFloor,
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
// 📊 Occupancy Reports (with optional property filter)
// ================================

// Single floor occupancy
exports.getFloorOccupancy = handleAsync(async (req, res) => {
  const report = await floorService.getFloorOccupancy(req.params.id);
  
  // Ensure consistent response structure
  const formattedReport = {
    floor_id: report.floor_id,
    floor_name: report.floor_name,
    level_number: report.level_number,
    property_name: report.property_name,
    total_locals: report.total_locals || 0,
    occupied: report.occupied || 0,
    available: report.available || 0,
    maintenance: report.maintenance || 0,
    occupancy_rate: report.occupancy_rate || 0,
    total_area: report.total_area || 0,
    total_rent: report.total_rent || 0,
    occupied_rent: report.occupied_rent || 0,
    revenue_percentage: report.revenue_percentage || 0,
    locals: report.locals || []
  };

  res.status(200).json({
    success: true,
    data: formattedReport,
  });
});

// All floors occupancy (with optional property filter)
exports.getAllFloorsOccupancy = handleAsync(async (req, res) => {
  const { propertyId } = req.query;
  
  const report = await floorService.getAllFloorsOccupancy(propertyId || null);
  
  // Ensure consistent response structure for all items
  const formattedReport = report.map(item => ({
    floor_id: item.floor_id,
    floor_name: item.floor_name,
    level_number: item.level_number,
    property_id: item.property_id,
    property_name: item.property_name,
    total_locals: item.total_locals || 0,
    occupied: item.occupied || 0,
    available: item.available || 0,
    maintenance: item.maintenance || 0,
    occupancy_rate: item.occupancy_rate || 0,
    total_area: item.total_area || 0,
    total_rent: item.total_rent || 0,
    occupied_rent: item.occupied_rent || 0,
    revenue_percentage: item.revenue_percentage || 0
  }));
  
  res.status(200).json({
    success: true,
    total: formattedReport.length,
    data: formattedReport,
    filtered_by_property: !!propertyId,
    property_id: propertyId || null
  });
});

// ================================
// 🏠 Get Floors for a Specific Property (Simple list)
// ================================
exports.getPropertyFloors = handleAsync(async (req, res) => {
  const { propertyId } = req.params;
  
  const floors = await floorService.getAllFloors(propertyId);

  const simpleFloors = floors.map((floor) => {
    const locals = floor.localsForFloor || [];
    const total = locals.length;
    const occupied = locals.filter(l => l.status === 'occupied').length;
    const available = locals.filter(l => l.status === 'available').length;
    const maintenance = locals.filter(l => l.status === 'maintenance').length;
    const occupancyRate = total > 0 ? parseFloat(((occupied / total) * 100).toFixed(2)) : 0;

    return {
      id: floor.id,
      name: floor.name,
      level_number: floor.level_number,
      locals_count: total,
      occupancy: {
        total,
        occupied,
        available,
        maintenance,
        occupancy_rate: occupancyRate
      }
    };
  });

  res.status(200).json({
    success: true,
    total: simpleFloors.length,
    property_id: propertyId,
    data: simpleFloors,
  });
});

// ================================
// 🔄 Get Floor Summary for Dashboard
// ================================
exports.getFloorsSummary = handleAsync(async (req, res) => {
  const { propertyId } = req.query;
  
  const floors = await floorService.getAllFloors(propertyId || null);
  
  // Calculate summary statistics
  const summary = {
    total_floors: floors.length,
    total_locals: floors.reduce((sum, floor) => sum + (floor.localsForFloor?.length || 0), 0),
    occupied_locals: floors.reduce((sum, floor) => {
      const locals = floor.localsForFloor || [];
      return sum + locals.filter(l => l.status === 'occupied').length;
    }, 0),
    available_locals: floors.reduce((sum, floor) => {
      const locals = floor.localsForFloor || [];
      return sum + locals.filter(l => l.status === 'available').length;
    }, 0),
    maintenance_locals: floors.reduce((sum, floor) => {
      const locals = floor.localsForFloor || [];
      return sum + locals.filter(l => l.status === 'maintenance').length;
    }, 0)
  };

  summary.occupancy_rate = summary.total_locals > 0 
    ? parseFloat(((summary.occupied_locals / summary.total_locals) * 100).toFixed(2))
    : 0;

  res.status(200).json({
    success: true,
    data: summary,
    filtered_by_property: !!propertyId,
    property_id: propertyId || null
  });
});