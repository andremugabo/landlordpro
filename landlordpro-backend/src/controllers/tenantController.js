const tenantService = require('../services/tenantService');

// 📄 Get all tenants
async function getAllTenants(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const result = await tenantService.getAllTenants(+page, +limit, search);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 🔍 Get single tenant
async function getTenantById(req, res) {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    res.json({ tenant });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

// ➕ Create tenant
async function createTenant(req, res) {
  try {
    const tenant = await tenantService.createTenant(req.body);
    res.status(201).json({ tenant });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ✏️ Update tenant
async function updateTenant(req, res) {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    res.json({ tenant });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// 🗑️ Soft delete tenant
async function deleteTenant(req, res) {
  try {
    const result = await tenantService.deleteTenant(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

// ♻️ Restore tenant (Admin only)
async function restoreTenant(req, res) {
  try {
    const tenant = await tenantService.restoreTenant(req.params.id);
    res.json({ tenant });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

module.exports = {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  restoreTenant,
};
