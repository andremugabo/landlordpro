const localService = require('../services/localService');

/**
 * Get all locals (optional filtering by property or floor)
 */
async function getAllLocals(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const propertyId = req.query.propertyId || null;
    const floorId = req.query.floorId || null;

    const data = await localService.getAllLocals({ page, limit, propertyId, floorId });
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get locals by property ID
 */
async function getLocalsByPropertyId(req, res) {
  try {
    const { id: propertyId } = req.params;
    const data = await localService.getAllLocals({ page: 1, limit: 1000, propertyId });
    res.status(200).json({ success: true, locals: data.locals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get a single local by ID
 */
async function getLocalById(req, res) {
  try {
    const { id } = req.params;
    const local = await localService.getLocalById(id);
    res.status(200).json({ success: true, local });
  } catch (err) {
    res.status(err.status || 404).json({ success: false, message: err.message });
  }
}

/**
 * Create a new local
 */
async function createLocal(req, res) {
  try {
    const { reference_code, status, size_m2, property_id, floor_id } = req.body;
    const local = await localService.createLocal({ reference_code, status, size_m2, property_id, floor_id });
    res.status(201).json({ success: true, message: 'Local created successfully', local });
  } catch (err) {
    res.status(err.status || 400).json({ success: false, message: err.message });
  }
}

/**
 * Update a local
 */
async function updateLocal(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const local = await localService.updateLocal(id, data);
    res.status(200).json({ success: true, message: 'Local updated successfully', local });
  } catch (err) {
    res.status(err.status || 400).json({ success: false, message: err.message });
  }
}

/**
 * Soft delete a local
 */
async function deleteLocal(req, res) {
  try {
    const { id } = req.params;
    await localService.deleteLocal(id);
    res.status(200).json({ success: true, message: 'Local deleted (soft) successfully' });
  } catch (err) {
    res.status(err.status || 400).json({ success: false, message: err.message });
  }
}

/**
 * Restore a soft-deleted local (Admins only)
 */
async function restoreLocal(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;
    const local = await localService.restoreLocal(id, user);
    res.status(200).json({ success: true, message: 'Local restored successfully', local });
  } catch (err) {
    res.status(err.status || 400).json({ success: false, message: err.message });
  }
}

/**
 * Update local status
 */
async function updateLocalStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const local = await localService.updateLocalStatus(id, status);
    res.status(200).json({ success: true, message: 'Local status updated successfully', local });
  } catch (err) {
    res.status(err.status || 400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getAllLocals,
  getLocalById,
  createLocal,
  updateLocal,
  deleteLocal,
  restoreLocal,
  updateLocalStatus,
  getLocalsByPropertyId, 
};
