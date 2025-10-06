const Lease = require('../models/Lease');
const Local = require('../models/Local');
const Tenant = require('../models/Tenant');

// Create a new lease
async function createLease(data) {
  const { startDate, endDate, leaseAmount, localId, tenantId, status } = data;

  if (!leaseAmount) {
    throw new Error('Lease amount is required');
  }

  return Lease.create({
    startDate,
    endDate,
    leaseAmount,
    localId,
    tenantId,
    status: status || 'active',
  });
}

// Get all leases (with pagination)
async function getAllLeases(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const { rows, count } = await Lease.findAndCountAll({
    include: [
      { model: Tenant, as: 'tenantForLease' }, 
      { model: Local, as: 'localForLease' } 
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });

  return { data: rows, total: count, page, limit };
}

// Get lease by ID
async function getLeaseById(id) {
  return Lease.findByPk(id, {
    include: [
      { model: Tenant, as: 'tenantForLease' }, 
      { model: Local, as: 'localForLease' } 
    ],
  });
}

// Update lease
async function updateLease(id, data) {
  const lease = await Lease.findByPk(id);
  if (!lease) throw new Error('Lease not found');

  const updatableFields = ['startDate', 'endDate', 'leaseAmount', 'status', 'localId', 'tenantId'];
  const updateData = {};

  for (const key of updatableFields) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }

  return lease.update(updateData);
}

// Soft-delete lease
async function deleteLease(id) {
  const lease = await Lease.findByPk(id);
  if (!lease) throw new Error('Lease not found');
  return lease.destroy();
}

module.exports = {
  createLease,
  getAllLeases,
  getLeaseById,
  updateLease,
  deleteLease,
};
