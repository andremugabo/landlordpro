const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const Lease = require('../models/Lease');
const Local = require('../models/Local');
const Tenant = require('../models/Tenant');

function formatLease(lease) {
  return {
    id: lease.id,
    reference: lease.reference,
    startDate: lease.start_date,
    endDate: lease.end_date,
    leaseAmount: lease.lease_amount,
    status: lease.status,
    local: lease.local ? {
      id: lease.local.id,
      referenceCode: lease.local.reference_code,
      status: lease.local.status,
      sizeM2: lease.local.size_m2
    } : null,
    tenant: lease.tenant ? {
      id: lease.tenant.id,
      name: lease.tenant.name,
      email: lease.tenant.email
    } : null,
    createdAt: lease.created_at,
    updatedAt: lease.updated_at
  };
}

/** Helper: Check overlapping active leases */
async function checkOverlap(localId, start, end, excludeLeaseId = null) {
  const overlapping = await Lease.findOne({
    where: {
      local_id: localId,
      status: 'active',
      id: excludeLeaseId ? { [Op.ne]: excludeLeaseId } : undefined,
      [Op.or]: [
        { start_date: { [Op.between]: [start, end] } },
        { end_date: { [Op.between]: [start, end] } },
        { start_date: { [Op.lte]: start }, end_date: { [Op.gte]: end } }
      ]
    }
  });
  if (overlapping) throw new Error('Lease overlaps with an existing active lease for this local');
}

/** Create a new lease */
async function createLease({ startDate, endDate, leaseAmount, localId, tenantId, status = 'active' }) {
  if (!startDate || !endDate || !leaseAmount || !localId || !tenantId) {
    throw new Error('Missing required fields: startDate, endDate, leaseAmount, localId, tenantId');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start >= end) throw new Error('startDate must be before endDate');

  await checkOverlap(localId, start, end);

  // Fetch tenant to get name for reference
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) throw new Error('Tenant not found');

  const tenantNameClean = tenant.name.replace(/\s+/g, '-').toUpperCase();
  const shortId = uuidv4().split('-')[0].toUpperCase();
  const reference = `LEASE-${tenantNameClean}-${shortId}`;

  const lease = await Lease.create({
    start_date: start,
    end_date: end,
    lease_amount: Number(leaseAmount),
    local_id: localId,
    tenant_id: tenantId,
    status,
    reference,
  });

  await lease.reload({
    include: [
      { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'email'] },
      { model: Local, as: 'local', attributes: ['id', 'reference_code', 'status', 'size_m2'] }
    ]
  });

  return formatLease(lease);
}

/** Update lease by ID */
async function updateLease(id, data) {
  const lease = await Lease.findByPk(id, {
    include: [
      { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'email'] },
      { model: Local, as: 'local', attributes: ['id', 'reference_code', 'status', 'size_m2'] }
    ]
  });
  if (!lease) throw new Error('Lease not found');

  const start = data.startDate ? new Date(data.startDate) : lease.start_date;
  const end = data.endDate ? new Date(data.endDate) : lease.end_date;
  if (start >= end) throw new Error('startDate must be before endDate');

  const localId = data.localId || lease.local_id;

  // Check overlapping if dates/local changed
  if (localId !== lease.local_id || start.getTime() !== lease.start_date.getTime() || end.getTime() !== lease.end_date.getTime()) {
    await checkOverlap(localId, start, end, lease.id);
  }

  const updateData = {};
  if (data.startDate) updateData.start_date = start;
  if (data.endDate) updateData.end_date = end;
  if (data.leaseAmount !== undefined) updateData.lease_amount = Number(data.leaseAmount);
  if (data.status) updateData.status = data.status;
  if (data.localId) updateData.local_id = data.localId;
  if (data.tenantId) updateData.tenant_id = data.tenantId;

  if (Object.keys(updateData).length === 0) throw new Error('No valid fields provided for update');

  await lease.update(updateData);
  return formatLease(lease);
}

/** Get all leases with pagination and optional status filter */
async function getAllLeases({ page = 1, limit = 10, status }) {
  const offset = (page - 1) * limit;

  const whereClause = {};
  if (status) {
    if (status === 'expired') whereClause.end_date = { [Op.lt]: new Date() };
    else if (status === 'active') {
      whereClause.end_date = { [Op.gte]: new Date() };
      whereClause.status = 'active';
    } else if (status === 'cancelled') whereClause.status = 'cancelled';
  }

  const { rows, count } = await Lease.findAndCountAll({
    where: whereClause,
    include: [
      { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'email'] },
      { model: Local, as: 'local', attributes: ['id', 'reference_code', 'status', 'size_m2'] }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']],
    paranoid: true
  });

  const data = rows.map(lease => {
    if (lease.status === 'active' && lease.end_date < new Date()) lease.status = 'expired';
    return formatLease(lease);
  });

  return { data, total: count, page, limit, totalPages: Math.ceil(count / limit) };
}

/** Get lease by ID */
async function getLeaseById(id) {
  const lease = await Lease.findByPk(id, {
    include: [
      { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'email'] },
      { model: Local, as: 'local', attributes: ['id', 'reference_code', 'status', 'size_m2'] }
    ],
    paranoid: true
  });
  if (!lease) throw new Error('Lease not found');

  if (lease.status === 'active' && lease.end_date < new Date()) lease.status = 'expired';
  return formatLease(lease);
}

/** Soft-delete lease by ID */
async function deleteLease(id) {
  const lease = await Lease.findByPk(id);
  if (!lease) throw new Error('Lease not found');
  await lease.destroy();
  return { message: 'Lease deleted successfully' };
}

/** Update all active leases that have expired */
async function updateExpiredLeases() {
  const today = new Date();
  const [updatedCount] = await Lease.update(
    { status: 'expired' },
    { where: { status: 'active', end_date: { [Op.lt]: today } } }
  );
  console.log(`LeaseService: ${updatedCount} leases marked as expired.`);
  return { updatedCount };
}

module.exports = {
  createLease,
  updateLease,
  getAllLeases,
  getLeaseById,
  deleteLease,
  updateExpiredLeases 
};
