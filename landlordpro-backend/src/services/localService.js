const Local = require('../models/Local');
const Property = require('../models/Property');

/**
 * Get all locals with optional pagination and filtering by property
 * Excludes soft-deleted entries automatically because of `paranoid: true`
 */
async function getAllLocals({ page = 1, limit = 10, propertyId = null } = {}) {
  const offset = (page - 1) * limit;
  const where = propertyId ? { property_id: propertyId } : {};

  const { count, rows } = await Local.findAndCountAll({
    where,
    limit,
    offset,
    include: [{ model: Property, as: 'property' }],
    order: [['created_at', 'DESC']],
  });

  return {
    locals: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Get a single local by ID
 */
async function getLocalById(id) {
  const local = await Local.findByPk(id, {
    include: [{ model: Property, as: 'property' }],
  });
  if (!local) throw new Error('Local not found');
  return local;
}

/**
 * Create a new local
 */
async function createLocal({ reference_code, status, size_m2, property_id }) {
  return await Local.create({ reference_code, status, size_m2, property_id });
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
  return await local.destroy(); 
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
  
    return await local.restore();
  }

  async function updateLocalStatus(id, status) {
    const local = await Local.findByPk(id);
    if (!local) {
      const err = new Error('Local not found');
      err.status = 404;
      throw err;
    }
  
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
