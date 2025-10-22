const Local = require('../models/Local');
const Property = require('../models/Property');
const Floor = require('../models/Floor');

/**
 * Get all locals with optional pagination and filtering by property and floor
 * Excludes soft-deleted entries automatically because of `paranoid: true`
 */
async function getAllLocals({ page = 1, limit = 10, propertyId = null, floorId = null } = {}) {
  const offset = (page - 1) * limit;

  // Build filter
  const where = {};
  if (propertyId) where.property_id = propertyId;
  if (floorId) where.floor_id = floorId;

  const { count, rows } = await Local.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      { model: Property, as: 'property' },
      { model: Floor, as: 'floor' }
    ],
    order: [['created_at', 'DESC']],
  });

  return {
    locals: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Get a single local by ID
 */
async function getLocalById(id) {
  const local = await Local.findByPk(id, {
    include: [
      { model: Property, as: 'property' },
      { model: Floor, as: 'floor' }
    ],
  });
  if (!local) {
    const err = new Error('Local not found');
    err.status = 404;
    throw err;
  }
  return local;
}

/**
 * Create a new local
 */
async function createLocal({ reference_code, status = 'available', size_m2, property_id, floor_id }) {
  return await Local.create({ reference_code, status, size_m2, property_id, floor_id });
}

/**
 * Update a local
 */
async function updateLocal(id, data) {
  const local = await getLocalById(id);
  return await local.update(data);
}

/**
 * Soft delete a local
 */
async function deleteLocal(id) {
  const local = await getLocalById(id);
  await local.destroy(); // soft delete
  return { message: 'Local deleted successfully' };
}

/**
 * Restore a soft-deleted local (Admins only)
 */
async function restoreLocal(id, user) {
  if (user.role !== 'admin') {
    const err = new Error('Forbidden: only admins can restore locals');
    err.status = 403;
    throw err;
  }

  const local = await Local.findByPk(id, { paranoid: false });
  if (!local) {
    const err = new Error('Local not found');
    err.status = 404;
    throw err;
  }

  await local.restore();
  return { message: 'Local restored successfully' };
}

/**
 * Update the status of a local
 */
async function updateLocalStatus(id, status) {
  const local = await getLocalById(id);

  if (!['available', 'occupied', 'maintenance'].includes(status)) {
    const err = new Error('Invalid status value');
    err.status = 400;
    throw err;
  }

  local.status = status;
  await local.save();

  return local;
}

module.exports = {
  getAllLocals,
  getLocalById,
  createLocal,
  updateLocal,
  deleteLocal,
  restoreLocal,
  updateLocalStatus,
};
