const express = require('express');
const router = express.Router();
const leaseController = require('../controllers/leaseController');
const { getLeaseReport } = require('../controllers/leaseReportController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');





router.get('/leases', authenticate, leaseController.getAllLeases);
router.get('/leases/:id', authenticate, leaseController.getLease);
router.post('/leases/', authenticate, leaseController.createLease);
router.put('/leases/:id', authenticate, leaseController.updateLease);
router.delete('/leases/:id', authenticate ,leaseController.deleteLease);
router.get('/report/pdf', authenticate, getLeaseReport);


module.exports = router;

