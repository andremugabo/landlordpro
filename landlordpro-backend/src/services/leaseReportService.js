const PDFDocument = require('pdfkit');
const Lease = require('../models/Lease');
const path = require('path');

async function generateProfessionalLeaseReport(res) {
  try {
    const leases = await Lease.findAll({ include: ['tenant', 'local'] });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Send directly to response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=leases_report_${new Date().toISOString().split('T')[0]}.pdf`
    );

    doc.pipe(res);

    // ---- Optional: Add logo ----
    const logoPath = path.join(__dirname, '../assets/logo.png');
    doc.image(logoPath, 50, 20, { width: 100 });

    // ---- Header ----
    doc.fontSize(22).text('Lease Report', { align: 'center', underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // ---- Table headers ----
    const tableTop = doc.y;
    const rowHeight = 25;

    function generateTableHeader(y) {
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Tenant', 50, y);
      doc.text('Local', 180, y);
      doc.text('Start Date', 300, y);
      doc.text('End Date', 400, y);
      doc.text('Status', 500, y);
      doc.font('Helvetica');
      return y + 20;
    }

    let y = generateTableHeader(tableTop);

    leases.forEach((lease, i) => {
      // Alternating row colors
      if (i % 2 === 0) {
        doc.rect(45, y - 5, 520, rowHeight).fillOpacity(0.1).fill('#f2f2f2').fillOpacity(1);
      }

      doc.fillColor('#000000');
      doc.text(lease.tenant?.name || '-', 50, y);
      doc.text(lease.local?.reference_code || '-', 180, y);
      doc.text(lease.startDate.toISOString().split('T')[0], 300, y);
      doc.text(lease.endDate.toISOString().split('T')[0], 400, y);
      doc.text(lease.status, 500, y);

      y += rowHeight;

      // Add new page if near bottom
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
    // Ensure response is not sent twice
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
    }
  }
}

module.exports = { generateProfessionalLeaseReport };
