// leaseReportController.js
const { generateProfessionalLeaseReport } = require('../services/leaseReportService');

/**
 * Generate and send a professional lease report (PDF)
 */
async function getLeaseReport(req, res) {
  try {
    // The service now handles streaming the PDF directly to the response
    await generateProfessionalLeaseReport(res);
  } catch (err) {
    console.error('Error generating lease report:', err);

    // Send error response only if headers have not been sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate lease PDF report',
      });
    }
  }
}

module.exports = {
  getLeaseReport,
};
