const express = require('express');
const router = express.Router();
const leaseController = require('../controllers/leaseController');
const { getLeaseReport } = require('../controllers/leaseReportController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// ==================== Lease Routes ==================== //

// Get all leases (with optional status filter and pagination)
router.get('/leases', authenticate, leaseController.getAllLeases);

// Get single lease by ID
router.get('/leases/:id', authenticate, leaseController.getLease);

// Create a new lease
router.post('/leases', authenticate, leaseController.createLease);

// Update a lease by ID
router.put('/leases/:id', authenticate, leaseController.updateLease);

// Soft-delete a lease by ID
router.delete('/leases/:id', authenticate, leaseController.deleteLease);

// Generate lease report PDF
router.get('/report/pdf', authenticate, getLeaseReport);

// Manually trigger expired leases update (admin only)
router.post('/leases/trigger-expired', authenticate, adminOnly, leaseController.triggerExpiredLeases);

module.exports = router;
