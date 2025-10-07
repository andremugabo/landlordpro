const Lease = require('../models/Lease');
const Local = require('../models/Local');
const Tenant = require('../models/Tenant');

/**
 * Create a new lease
 */
async function createLease(data) {
  try {
    const { startDate, endDate, leaseAmount, localId, tenantId, status } = data;

    if (!startDate || !endDate || !leaseAmount || !localId || !tenantId) {
      throw new Error('Missing required fields: startDate, endDate, leaseAmount, localId, tenantId');
    }

    const lease = await Lease.create({
      start_date: startDate,
      end_date: endDate,
      lease_amount: Number(leaseAmount),
      local_id: localId,
      tenant_id: tenantId,
      status: status || 'active',
    });

    return lease;
  } catch (err) {
    console.error('Error creating lease:', err);
    throw err;
  }
}

/**
 * Get all leases with pagination
 */
async function getAllLeases(page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;

    const { rows, count } = await Lease.findAndCountAll({
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'email'] },
        { model: Local, as: 'local', attributes: ['id', 'reference_code', 'status', 'size_m2'] }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
      paranoid: true,
    });

    // Map underscored fields to camelCase for frontend
    const data = rows.map(r => ({
      id: r.id,
      startDate: r.start_date,
      endDate: r.end_date,
      leaseAmount: r.lease_amount,
      status: r.status,
      local: {
        id: r.local?.id,
        referenceCode: r.local?.reference_code,
        status: r.local?.status,
        sizeM2: r.local?.size_m2
      },
      tenant: r.tenant ? { id: r.tenant.id, name: r.tenant.name, email: r.tenant.email } : null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return {
      data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  } catch (err) {
    console.error('Error fetching leases:', err);
    throw err;
  }
}

/**
 * Get lease by ID
 */
async function getLeaseById(id) {
  try {
    const lease = await Lease.findByPk(id, {
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'email'] },
        { model: Local, as: 'local', attributes: ['id', 'reference_code', 'status', 'size_m2'] }
      ],
      paranoid: true,
    });

    if (!lease) throw new Error('Lease not found');

    return {
      id: lease.id,
      startDate: lease.start_date,
      endDate: lease.end_date,
      leaseAmount: lease.lease_amount,
      status: lease.status,
      local: {
        id: lease.local?.id,
        referenceCode: lease.local?.reference_code,
        status: lease.local?.status,
        sizeM2: lease.local?.size_m2
      },
      tenant: lease.tenant ? { id: lease.tenant.id, name: lease.tenant.name, email: lease.tenant.email } : null,
      createdAt: lease.created_at,
      updatedAt: lease.updated_at,
    };
  } catch (err) {
    console.error('Error fetching lease by ID:', err);
    throw err;
  }
}

/**
 * Update lease by ID
 */
async function updateLease(id, data) {
  try {
    const lease = await Lease.findByPk(id);
    if (!lease) throw new Error('Lease not found');

    const updateData = {};
    if (data.startDate) updateData.start_date = data.startDate;
    if (data.endDate) updateData.end_date = data.endDate;
    if (data.leaseAmount !== undefined) updateData.lease_amount = Number(data.leaseAmount);
    if (data.status) updateData.status = data.status;
    if (data.localId) updateData.local_id = data.localId;
    if (data.tenantId) updateData.tenant_id = data.tenantId;

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    await lease.update(updateData);
    return lease;
  } catch (err) {
    console.error('Error updating lease:', err);
    throw err;
  }
}

/**
 * Soft-delete lease by ID
 */
async function deleteLease(id) {
  try {
    const lease = await Lease.findByPk(id);
    if (!lease) throw new Error('Lease not found');
    return lease.destroy();
  } catch (err) {
    console.error('Error deleting lease:', err);
    throw err;
  }
}

module.exports = {
  createLease,
  getAllLeases,
  getLeaseById,
  updateLease,
  deleteLease,
};
