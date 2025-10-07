const PDFDocument = require('pdfkit');
const Lease = require('../models/Lease');
const Tenant = require('../models/Tenant');
const Local = require('../models/Local');
const Payment = require('../models/Payment');
const path = require('path');

async function generateProfessionalLeaseReport(res) {
  try {
    // Fetch leases with tenants, locals, and payments
    const leases = await Lease.findAll({
      include: [
        { model: Tenant, as: 'tenant' },
        { model: Local, as: 'local' },
        { model: Payment, as: 'paymentsForLease' }
      ]
    });

    // ---- Landscape A4 ----
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

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

    // ---- Table setup ----
    const tableTop = doc.y;
    const rowHeight = 30;
    const tableLeft = 45;
    const tableWidth = 720;

    function generateTableHeader(y) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');

      const headers = ['Tenant', 'Local', 'Start Date', 'End Date', 'Lease Amount', 'Paid', 'Balance', 'Status'];
      const xPositions = [50, 160, 280, 360, 440, 510, 580, 650];

      // Header background
      doc.rect(tableLeft, y - 5, tableWidth, rowHeight).fill('#4f81bd');

      headers.forEach((header, i) => {
        doc.fillColor('#ffffff').text(header, xPositions[i], y, {
          width: xPositions[i + 1] ? xPositions[i + 1] - xPositions[i] : 80,
          align: 'left'
        });
      });

      doc.font('Helvetica').fillColor('#000000'); // reset for rows
      return y + rowHeight;
    }

    let y = generateTableHeader(tableTop);

    // ---- Table rows ----
    leases.forEach((lease, i) => {
      // Check for page break
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 30) {
        doc.addPage({ layout: 'landscape' });
        y = generateTableHeader(50);
      }

      // Alternate row shading
      if (i % 2 === 0) {
        doc.rect(tableLeft, y - 5, tableWidth, rowHeight).fillOpacity(0.1).fill('#d9e1f2').fillOpacity(1);
      }

      // Calculate payments
      const totalPaid = lease.paymentsForLease?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
      const leaseAmount = Number(lease.lease_amount) || 0;
      const balance = leaseAmount - totalPaid;

      // Text color based on status
      let statusColor = '#000000';
      if (lease.status === 'active') statusColor = '#228b22';
      else if (lease.status === 'expired') statusColor = '#ff4500';
      else if (lease.status === 'cancelled') statusColor = '#808080';

      doc.fillColor('#000000').fontSize(10);

      // ---- Table content ----
      doc.text(lease.tenant?.name || '-', 50, y);
      doc.text(lease.local?.reference_code || '-', 160, y);
      doc.text(lease.start_date ? lease.start_date.toISOString().split('T')[0] : '-', 280, y);
      doc.text(lease.end_date ? lease.end_date.toISOString().split('T')[0] : '-', 360, y);
      doc.text(leaseAmount.toFixed(2), 440, y);
      doc.text(totalPaid.toFixed(2), 510, y);
      doc.text(balance.toFixed(2), 580, y);
      doc.fillColor(statusColor).text(lease.status || '-', 650, y);

      y += rowHeight;
    });

    // ---- Footer / page numbers ----
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(10).fillColor('#555')
        .text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 30, { align: 'center', width: tableWidth });
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
