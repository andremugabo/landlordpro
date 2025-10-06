const PDFDocument = require('pdfkit');
const Lease = require('../models/Lease');
const Tenant = require('../models/Tenant');
const Local = require('../models/Local');
const path = require('path');

async function generateProfessionalLeaseReport(res) {
  try {
    // ✅ Fetch leases with correct associations
    const leases = await Lease.findAll({
      include: [
        { model: Tenant, as: 'tenantForLease' },
        { model: Local, as: 'localForLease' }
      ]
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Send PDF directly to response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=leases_report_${new Date().toISOString().split('T')[0]}.pdf`
    );

    doc.pipe(res);

    // ---- Logo ----
    const logoPath = path.join(__dirname, '../assets/logo.png');
    doc.image(logoPath, 50, 20, { width: 100 });

    // ---- Title ----
    doc.fontSize(22).fillColor('#1f4e79').text('Lease Report', { align: 'center', underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#333').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // ---- Table header ----
    const tableTop = doc.y;
    const rowHeight = 30;

    function generateTableHeader(y) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff');

      const headers = ['Tenant', 'Local', 'Start Date', 'End Date', 'Status'];
      const xPositions = [50, 180, 300, 400, 500];

      // Header background
      doc.rect(45, y - 5, 520, rowHeight).fill('#4f81bd');

      headers.forEach((header, i) => {
        doc.text(header, xPositions[i], y, { width: xPositions[i + 1] ? xPositions[i + 1] - xPositions[i] : 100, align: 'left' });
      });

      doc.font('Helvetica').fillColor('#000000');
      return y + rowHeight;
    }

    let y = generateTableHeader(tableTop);

    // ---- Table rows ----
    leases.forEach((lease, i) => {
      // Alternate row shading
      if (i % 2 === 0) {
        doc.rect(45, y - 5, 520, rowHeight).fillOpacity(0.1).fill('#d9e1f2').fillOpacity(1);
      }

      // Text color based on status
      let statusColor = '#000000';
      if (lease.status === 'active') statusColor = '#228b22';
      else if (lease.status === 'expired') statusColor = '#ff4500';
      else if (lease.status === 'cancelled') statusColor = '#808080';

      doc.fillColor('#000000');
      doc.text(lease.tenantForLease?.name || '-', 50, y);
      doc.text(lease.localForLease?.reference_code || '-', 180, y);
      doc.text(lease.start_date?.toISOString().split('T')[0] || '-', 300, y);
      doc.text(lease.end_date?.toISOString().split('T')[0] || '-', 400, y);
      doc.fillColor(statusColor).text(lease.status || '-', 500, y);

      y += rowHeight;

      // New page if bottom reached
      if (y > 750) {
        doc.addPage();
        y = generateTableHeader(50);
      }
    });

    // ---- Footer / page numbers ----
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(10).fillColor('#555')
        .text(`Page ${i + 1} of ${range.count}`, 50, 780, { align: 'center', width: 500 });
    }

    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
    }
  }
}

module.exports = { generateProfessionalLeaseReport };
