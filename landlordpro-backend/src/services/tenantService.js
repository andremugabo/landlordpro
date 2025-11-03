const { Op } = require('sequelize');
const Tenant = require('../models/Tenant');

// 🧾 Get all tenants (pagination + optional search)
async function getAllTenants({ page = 1, limit = 10, search = '' }) {
  const offset = (page - 1) * limit;

  const where = {};
  
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { company_name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
      { tin_number: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows: tenants, count } = await Tenant.findAndCountAll({
    where,
    limit,
    offset,
    order: [['name', 'ASC']],
    paranoid: true, // ensures deleted tenants are excluded
  });

  return {
    tenants,
    total: count,
    totalPages: Math.ceil(count / limit),
    page,
    limit,
  };
}

// 🔍 Get single tenant
async function getTenantById(id) {
  const tenant = await Tenant.findByPk(id, { paranoid: true });
  if (!tenant) throw new Error('Tenant not found');
  return tenant;
}

// ➕ Create tenant (individual or company)
async function createTenant(data) {
  if (!data.name) throw new Error('Representative name is required');

  return await Tenant.create({
    name: data.name,
    company_name: data.company_name || null,
    tin_number: data.tin_number || null,
    email: data.email || null,
    phone: data.phone || null,
  });
}

// ✏️ Update tenant
async function updateTenant(id, data) {
  const tenant = await Tenant.findByPk(id, { paranoid: false });
  if (!tenant || tenant.deletedAt) throw new Error('Tenant not found');

  const fieldsToUpdate = {
    name: data.name ?? tenant.name,
    company_name: data.company_name ?? tenant.company_name,
    tin_number: data.tin_number ?? tenant.tin_number,
    email: data.email ?? tenant.email,
    phone: data.phone ?? tenant.phone,
  };

  await tenant.update(fieldsToUpdate);
  return tenant;
}

// 🗑️ Soft delete tenant
async function deleteTenant(id) {
  const tenant = await Tenant.findByPk(id, { paranoid: true });
  if (!tenant) throw new Error('Tenant not found');

  await tenant.destroy(); // uses Sequelize paranoid soft delete
  return { message: 'Tenant soft deleted successfully' };
}

// ♻️ Restore tenant (admin)
async function restoreTenant(id) {
  const tenant = await Tenant.findByPk(id, { paranoid: false });
  if (!tenant || !tenant.deletedAt) throw new Error('Tenant not found or already active');

  await tenant.restore();
  return tenant;
}

module.exports = {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  restoreTenant,
};
