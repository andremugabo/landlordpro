const leaseService = require('../services/leaseService');

async function createLease(req, res) {
  try {
    const lease = await leaseService.createLease(req.body);
    res.status(201).json({ success: true, lease });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getAllLeases(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await leaseService.getAllLeases(Number(page), Number(limit));
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getLease(req, res) {
  try {
    const lease = await leaseService.getLeaseById(req.params.id);
    if (!lease) return res.status(404).json({ success: false, message: 'Lease not found' });
    res.json({ success: true, lease });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateLease(req, res) {
  try {
    const lease = await leaseService.updateLease(req.params.id, req.body);
    res.json({ success: true, lease });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function deleteLease(req, res) {
  try {
    await leaseService.deleteLease(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  createLease,
  getAllLeases,
  getLease,
  updateLease,
  deleteLease
};
