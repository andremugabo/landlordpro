const express = require('express');
const router = express.Router();
const leaseController = require('../controllers/leaseController');
const { getLeaseReport } = require('../controllers/leaseReportController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// ==================== Lease Routes ==================== //

// ✅ Get all leases (optional status filter and pagination)
router.get('/leases', authenticate, leaseController.getAllLeases);

// ✅ Get single lease by ID
router.get('/leases/:id', authenticate, leaseController.getLease);

// ✅ Create a new lease (any authenticated user)
router.post('/leases', authenticate, leaseController.createLease);

// ✅ Update a lease by ID (any authenticated user or restrict to admin if needed)
router.put('/leases/:id', authenticate, leaseController.updateLease);
router.patch('/leases/:id', authenticate, leaseController.updateLease);

// ✅ Soft-delete a lease by ID (admin only)
router.delete('/leases/:id', authenticate, adminOnly, leaseController.deleteLease);

// ✅ Generate lease report PDF
router.get('/leases/report/pdf', authenticate, getLeaseReport);

// ✅ Manually trigger expired leases update (admin only)
router.post('/leases/trigger-expired', authenticate, adminOnly, leaseController.triggerExpiredLeases);

module.exports = router;
