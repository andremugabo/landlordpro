const leaseService = require('../services/leaseService');
const { Notification } = require('../models');

// Create a new lease
async function createLease(req, res) {
  try {
    const { startDate, endDate, leaseAmount, localId, tenantId, status } = req.body;

    // Basic validation
    if (!startDate || !endDate || !leaseAmount || !localId || !tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: startDate, endDate, leaseAmount, localId, tenantId',
      });
    }

    const lease = await leaseService.createLease({
      startDate,
      endDate,
      leaseAmount,
      localId,
      tenantId,
      status,
    });

    // Optional: create notification for tenant
    if (tenantId) {
      await Notification.create({
        user_id: tenantId,
        message: `A new lease has been created for local ${localId}.`,
        type: 'lease_create',
        is_read: false
      });
    }

    res.status(201).json({ success: true, lease });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// Get all leases (paginated)
async function getAllLeases(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await leaseService.getAllLeases(Number(page), Number(limit));
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Get lease by ID
async function getLease(req, res) {
  try {
    const lease = await leaseService.getLeaseById(req.params.id);
    if (!lease)
      return res.status(404).json({ success: false, message: 'Lease not found' });
    res.json({ success: true, lease });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Update lease
async function updateLease(req, res) {
  try {
    const lease = await leaseService.updateLease(req.params.id, req.body);
    if (!lease) {
      return res.status(404).json({ success: false, message: 'Lease not found' });
    }

    // Create notification for the tenant if tenantId exists
    if (lease.tenantId) {
      await Notification.create({
        user_id: lease.tenantId,
        message: `Your lease for local ${lease.localId} has been updated.`,
        type: 'lease_update',
        is_read: false
      });
    }

    res.json({ success: true, lease });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// Delete (soft-delete) lease
async function deleteLease(req, res) {
  try {
    await leaseService.deleteLease(req.params.id);
    res.status(204).send(); // No content
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  createLease,
  getAllLeases,
  getLease,
  updateLease,
  deleteLease,
};
