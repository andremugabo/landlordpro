// leaseReportController.js
const { generateProfessionalLeaseReport } = require('../services/leaseReportService');

async function getLeaseReport(req, res) {
  try {
    // The service now handles the response streaming directly
    await generateProfessionalLeaseReport(res);
  } catch (err) {
    console.error('Error in getLeaseReport:', err);
    // Ensure we only send response if headers are not already sent
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
    }
  }
}

module.exports = { getLeaseReport };
