const { Op } = require('sequelize');
const Tenant = require('../models/Tenant'); 

// 🧾 Get all tenants (with pagination + optional search)
async function getAllTenants(page = 1, limit = 10, search = '') {
  const offset = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(search && {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { company_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { tin_number: { [Op.iLike]: `%${search}%` } },
      ],
    }),
  };

  const { rows: tenants, count } = await Tenant.findAndCountAll({
    where,
    limit,
    offset,
    order: [['name', 'DESC']],
  });

  return {
    tenants,
    totalPages: Math.ceil(count / limit),
    page,
  };
}

// 🔍 Get single tenant
async function getTenantById(id) {
  const tenant = await Tenant.findOne({ where: { id, deletedAt: null } });
  if (!tenant) throw new Error('Tenant not found');
  return tenant;
}

// ➕ Create tenant (individual or company)
async function createTenant(data) {
  // Validate required fields
  if (!data.name) throw new Error('Representative name is required');

  // If company_name or tin_number is provided, treat as company
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
  const tenant = await Tenant.findOne({ where: { id, deletedAt: null } });
  if (!tenant) throw new Error('Tenant not found');

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
  const tenant = await Tenant.findOne({ where: { id, deletedAt: null } });
  if (!tenant) throw new Error('Tenant not found');
  await tenant.update({ deletedAt: new Date() });
  return { message: 'Tenant soft deleted successfully' };
}

// ♻️ Restore tenant (admin)
async function restoreTenant(id) {
  const tenant = await Tenant.findOne({ where: { id, deletedAt: { [Op.ne]: null } } });
  if (!tenant) throw new Error('Tenant not found or already active');
  await tenant.update({ deletedAt: null });
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
