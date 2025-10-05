const Lease = require('../models/Lease');
const Local = require('../models/Local');
const Tenant = require('../models/Tenant');

async function createLease(data) {
  return Lease.create(data);
}

async function getAllLeases(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const { rows, count } = await Lease.findAndCountAll({
    include: [
      { model: Local, as: 'local' },
      { model: Tenant, as: 'tenant' }
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });
  return { data: rows, total: count, page, limit };
}

async function getLeaseById(id) {
  return Lease.findByPk(id, {
    include: [
      { model: Local, as: 'local' },
      { model: Tenant, as: 'tenant' }
    ]
  });
}

async function updateLease(id, data) {
  const lease = await Lease.findByPk(id);
  if (!lease) throw new Error('Lease not found');
  return lease.update(data);
}

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
  deleteLease
};
