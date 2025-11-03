const tenantService = require('../services/tenantService');

// 📄 Get all tenants (with pagination + optional search)
async function getAllTenants(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';

    const result = await tenantService.getAllTenants({ page, limit, search });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Error fetching tenants:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// 🔍 Get single tenant by ID
async function getTenantById(req, res) {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    res.status(200).json({ success: true, tenant });
  } catch (err) {
    console.error('Error fetching tenant:', err);
    res.status(404).json({ success: false, message: err.message });
  }
}

// ➕ Create tenant
async function createTenant(req, res) {
  try {
    const { name, email, phone, company_name, tin_number } = req.body;

    const tenant = await tenantService.createTenant({
      name,
      email,
      phone,
      company_name,
      tin_number,
    });

    res.status(201).json({ success: true, message: 'Tenant created successfully', tenant });
  } catch (err) {
    console.error('Error creating tenant:', err);
    res.status(400).json({ success: false, message: err.message });
  }
}

// ✏️ Update tenant
async function updateTenant(req, res) {
  try {
    const { name, email, phone, company_name, tin_number } = req.body;

    const tenant = await tenantService.updateTenant(req.params.id, {
      name,
      email,
      phone,
      company_name,
      tin_number,
    });

    res.status(200).json({ success: true, message: 'Tenant updated successfully', tenant });
  } catch (err) {
    console.error('Error updating tenant:', err);
    res.status(400).json({ success: false, message: err.message });
  }
}

// 🗑️ Soft delete tenant
async function deleteTenant(req, res) {
  try {
    const result = await tenantService.deleteTenant(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    console.error('Error deleting tenant:', err);
    res.status(404).json({ success: false, message: err.message });
  }
}

// ♻️ Restore tenant (Admin only)
async function restoreTenant(req, res) {
  try {
    const tenant = await tenantService.restoreTenant(req.params.id);
    res.status(200).json({ success: true, message: 'Tenant restored successfully', tenant });
  } catch (err) {
    console.error('Error restoring tenant:', err);
    res.status(404).json({ success: false, message: err.message });
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
