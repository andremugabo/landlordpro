const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// ✅ All tenant routes are under /api/tenants (defined in server.js)
router.use(authenticate);

// 🔹 Get all tenants with pagination & optional search
router.get('/tenants/', tenantController.getAllTenants);

// 🔹 Get single tenant by ID
router.get('/tenants/:id', tenantController.getTenantById);

// 🔹 Create new tenant
router.post('/tenants/', tenantController.createTenant);

// 🔹 Update tenant (full or partial)
router.put('/tenants/:id', tenantController.updateTenant);
router.patch('/tenants/:id', tenantController.updateTenant);

// 🔹 Soft delete tenant
router.delete('/tenants/:id', tenantController.deleteTenant);

// 🔹 Restore soft-deleted tenant (admin only)
router.patch('/tenants/:id/restore', adminOnly, tenantController.restoreTenant);

module.exports = router;
