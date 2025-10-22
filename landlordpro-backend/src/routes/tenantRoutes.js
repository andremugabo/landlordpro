const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// 🔹 All tenant routes are protected
router.use(authenticate);

/**
 * @route GET /tenants
 * @desc Get all tenants (with pagination & optional search)
 * @access Authenticated users
 */
router.get('/tenants', tenantController.getAllTenants);

/**
 * @route GET /tenants/:id
 * @desc Get a single tenant by ID
 * @access Authenticated users
 */
router.get('/tenants/:id', tenantController.getTenantById);

/**
 * @route POST /tenants
 * @desc Create a new tenant
 * @access Admin only (optional, currently all authenticated users)
 */
router.post('/tenants', tenantController.createTenant);

/**
 * @route PUT /tenants/:id
 * @desc Fully update a tenant
 * @access Authenticated users (consider admin only)
 */
router.put('/tenants/:id', tenantController.updateTenant);

/**
 * @route PATCH /tenants/:id
 * @desc Partially update a tenant
 * @access Authenticated users (consider admin only)
 */
router.patch('/tenants/:id', tenantController.updateTenant);

/**
 * @route DELETE /tenants/:id
 * @desc Soft delete a tenant
 * @access Admin only (optional, consider restricting)
 */
router.delete('/tenants/:id', tenantController.deleteTenant);

/**
 * @route PATCH /tenants/:id/restore
 * @desc Restore a soft-deleted tenant
 * @access Admin only
 */
router.patch('/tenants/:id/restore', adminOnly, tenantController.restoreTenant);

module.exports = router;
