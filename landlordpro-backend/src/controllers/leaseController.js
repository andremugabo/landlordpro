const leaseService = require('../services/leaseService');

/**
 * Create a new lease
 */
async function createLease(req, res) {
  try {
    const { startDate, endDate, leaseAmount, localId, tenantId, status } = req.body;

    if (!startDate || !endDate || !leaseAmount || !localId || !tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: startDate, endDate, leaseAmount, localId, tenantId',
      });
    }

    // Call service to create lease with dynamic reference
    const lease = await leaseService.createLease({
      startDate,
      endDate,
      leaseAmount,
      localId,
      tenantId,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Lease created successfully',
      lease, // lease now includes reference as LEASE-TENANT-NAME-XXXX
    });
  } catch (err) {
    console.error('Error creating lease:', err);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Get all leases with optional status filter and pagination
 */
async function getAllLeases(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status } = req.query;

    const result = await leaseService.getAllLeases({ page, limit, status });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Error fetching leases:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get a single lease by ID
 */
async function getLease(req, res) {
  try {
    const lease = await leaseService.getLeaseById(req.params.id);
    res.status(200).json({ success: true, lease });
  } catch (err) {
    console.error('Error fetching lease:', err);
    res.status(404).json({ success: false, message: err.message });
  }
}

/**
 * Update a lease
 */
async function updateLease(req, res) {
  try {
    const lease = await leaseService.updateLease(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Lease updated successfully', lease });
  } catch (err) {
    console.error('Error updating lease:', err);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Soft-delete a lease
 */
async function deleteLease(req, res) {
  try {
    await leaseService.deleteLease(req.params.id);
    res.status(200).json({ success: true, message: 'Lease deleted successfully' });
  } catch (err) {
    console.error('Error deleting lease:', err);
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Manually trigger expired lease updates
 */
async function triggerExpiredLeases(req, res) {
  try {
    const result = await leaseService.updateExpiredLeases();
    res.status(200).json({
      success: true,
      message: `${result.updatedCount} lease(s) marked as expired.`,
    });
  } catch (err) {
    console.error('Error triggering expired leases:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  createLease,
  getAllLeases,
  getLease,
  updateLease,
  deleteLease,
  triggerExpiredLeases,
};
