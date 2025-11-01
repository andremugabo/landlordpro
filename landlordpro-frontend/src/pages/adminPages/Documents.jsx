import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getAllExpenses } from '../../services/expenseService';
import { getAllProperties } from '../../services/propertyService';
import { Button, Input, Card, Select } from '../../components';
import {
  FiDownload,
  FiPrinter,
  FiFileText,
  FiFile,
  FiFilter,
  FiCalendar,
  FiDollarSign,
  FiPaperclip,
  FiEye,
} from 'react-icons/fi';
import { showError, showSuccess } from '../../utils/toastHelper';
import debounce from 'lodash.debounce';

const Documents = () => {
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProperty, setFilterProperty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Fetch data
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllExpenses({
        page,
        limit,
        propertyId: filterProperty,
        search: searchTerm,
      });

      let filteredData = Array.isArray(res.data) ? res.data : [];
      
      // Apply additional filters
      if (filterStatus) {
        filteredData = filteredData.filter(e => e.payment_status === filterStatus);
      }
      if (dateFrom) {
        filteredData = filteredData.filter(e => new Date(e.date) >= new Date(dateFrom));
      }
      if (dateTo) {
        filteredData = filteredData.filter(e => new Date(e.date) <= new Date(dateTo));
      }

      setExpenses(filteredData);
      setTotalPages(res.pagination?.pages || 1);
      setTotalExpenses(res.pagination?.total || 0);
    } catch (err) {
      showError(err?.message || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterProperty, searchTerm, filterStatus, dateFrom, dateTo]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { properties: props } = await getAllProperties();
        setProperties(Array.isArray(props) ? props : []);
      } catch (err) {
        showError(err?.message || 'Failed to load properties');
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Generate Invoice HTML
  const generateInvoiceHTML = (expense) => {
    const property = properties.find(p => p.id === expense.property_id);
    const total = parseFloat(expense.amount || 0) + parseFloat(expense.vat_amount || 0);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${expense.reference_number || expense.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
          .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .company-info h1 { color: #10b981; font-size: 28px; margin-bottom: 5px; }
          .company-info p { color: #666; font-size: 14px; }
          .invoice-info { text-align: right; }
          .invoice-info h2 { color: #333; font-size: 24px; margin-bottom: 10px; }
          .invoice-info p { color: #666; font-size: 14px; line-height: 1.6; }
          .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .details-section h3 { color: #333; font-size: 14px; font-weight: bold; margin-bottom: 10px; }
          .details-section p { color: #666; font-size: 13px; line-height: 1.8; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-overdue { background: #fee2e2; color: #991b1b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          thead { background: #f9fafb; }
          th { text-align: left; padding: 12px; font-size: 13px; color: #374151; border-bottom: 2px solid #e5e7eb; }
          td { padding: 12px; font-size: 14px; color: #666; border-bottom: 1px solid #e5e7eb; }
          .text-right { text-align: right; }
          .totals { margin-left: auto; width: 300px; }
          .totals tr td { padding: 8px 12px; }
          .totals tr:last-child { border-top: 2px solid #10b981; font-weight: bold; font-size: 16px; }
          .totals tr:last-child td { color: #10b981; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #999; font-size: 12px; }
          .notes { background: #f9fafb; padding: 15px; border-left: 3px solid #10b981; margin: 20px 0; }
          .notes h4 { color: #333; font-size: 14px; margin-bottom: 8px; }
          .notes p { color: #666; font-size: 13px; line-height: 1.6; }
          @media print { body { padding: 0; background: white; } .invoice-container { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-info">
              <h1>Property Management</h1>
              <p>Expense Invoice</p>
            </div>
            <div class="invoice-info">
              <h2>INVOICE</h2>
              <p><strong>Invoice #:</strong> ${expense.reference_number || expense.id.substring(0, 8)}</p>
              <p><strong>Date:</strong> ${new Date(expense.date).toLocaleDateString()}</p>
              ${expense.due_date ? `<p><strong>Due Date:</strong> ${new Date(expense.due_date).toLocaleDateString()}</p>` : ''}
              <p style="margin-top: 10px;">
                <span class="status-badge status-${expense.payment_status || 'pending'}">
                  ${(expense.payment_status || 'pending').toUpperCase()}
                </span>
              </p>
            </div>
          </div>

          <div class="details">
            <div class="details-section">
              <h3>BILLED TO:</h3>
              <p>
                ${property?.name || 'N/A'}<br>
                ${property?.address || ''}<br>
                ${property?.city || ''}, ${property?.country || ''}
              </p>
            </div>
            ${expense.vendor_name ? `
            <div class="details-section">
              <h3>VENDOR:</h3>
              <p>
                ${expense.vendor_name}<br>
                ${expense.vendor_contact || ''}
              </p>
            </div>
            ` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${expense.description || 'Expense'}</td>
                <td>${expense.category}</td>
                <td class="text-right">${expense.currency || 'FRW'} ${parseFloat(expense.amount || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <table class="totals">
            <tr>
              <td>Subtotal:</td>
              <td class="text-right">${expense.currency || 'FRW'} ${parseFloat(expense.amount || 0).toLocaleString()}</td>
            </tr>
            ${expense.vat_rate ? `
            <tr>
              <td>VAT (${expense.vat_rate}%):</td>
              <td class="text-right">${expense.currency || 'FRW'} ${parseFloat(expense.vat_amount || 0).toLocaleString()}</td>
            </tr>
            ` : ''}
            <tr>
              <td>TOTAL:</td>
              <td class="text-right">${expense.currency || 'FRW'} ${total.toLocaleString()}</td>
            </tr>
          </table>

          ${expense.payment_method ? `
          <div class="notes">
            <h4>Payment Information</h4>
            <p>
              <strong>Payment Method:</strong> ${expense.payment_method.replace('_', ' ').toUpperCase()}<br>
              ${expense.payment_date ? `<strong>Payment Date:</strong> ${new Date(expense.payment_date).toLocaleDateString()}` : ''}
            </p>
          </div>
          ` : ''}

          ${expense.notes ? `
          <div class="notes">
            <h4>Notes</h4>
            <p>${expense.notes}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>This is a computer-generated invoice. No signature is required.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Print Invoice
  const handlePrintInvoice = (expense) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateInvoiceHTML(expense));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Download Invoice as HTML
  const handleDownloadInvoice = (expense) => {
    const html = generateInvoiceHTML(expense);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${expense.reference_number || expense.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('Invoice downloaded successfully!');
  };

  // Bulk Download
  const handleBulkDownload = () => {
    if (selectedExpenses.length === 0) {
      return showError('Please select at least one expense');
    }
    selectedExpenses.forEach(expenseId => {
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) {
        setTimeout(() => handleDownloadInvoice(expense), 100);
      }
    });
    showSuccess(`Downloading ${selectedExpenses.length} invoice(s)...`);
  };

  // Toggle selection
  const toggleSelection = (id) => {
    setSelectedExpenses(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedExpenses.length === expenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(expenses.map(e => e.id));
    }
  };

  // Options
  const propertyOptions = [
    { value: '', label: '— All Properties —' },
    ...properties.map(p => ({ value: p.id, label: p.name })),
  ];

  const statusOptions = [
    { value: '', label: '— All Status —' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
  ];

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0) + parseFloat(e.vat_amount || 0), 0);
    const withProof = expenses.filter(e => e.proof).length;
    return { total, count: expenses.length, withProof };
  }, [expenses]);

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-lg shadow-md text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FiFileText className="text-3xl" />
              Documents & Invoices
            </h1>
            <p className="text-sm opacity-90 mt-1">
              {summary.count} documents • {summary.withProof} with proof • Total: {expenses[0]?.currency || 'FRW'} {summary.total.toLocaleString()}
            </p>
          </div>
          {selectedExpenses.length > 0 && (
            <Button
              onClick={handleBulkDownload}
              className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md font-medium shadow-sm transition"
            >
              <FiDownload /> Download Selected ({selectedExpenses.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <Select
            value={propertyOptions.find(o => o.value === filterProperty) || propertyOptions[0]}
            options={propertyOptions}
            onChange={(opt) => setFilterProperty(opt?.value || '')}
          />

          <Select
            value={statusOptions.find(o => o.value === filterStatus) || statusOptions[0]}
            options={statusOptions}
            onChange={(opt) => setFilterStatus(opt?.value || '')}
          />

          <Input
            type="date"
            placeholder="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />

          <Input
            type="date"
            placeholder="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            onClick={() => {
              setSearchTerm('');
              setFilterProperty('');
              setFilterStatus('');
              setDateFrom('');
              setDateTo('');
            }}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md text-sm"
          >
            Reset Filters
          </Button>
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Property</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Proof</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2">Loading documents...</p>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    No documents found
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => {
                  const property = properties.find(p => p.id === expense.property_id);
                  const total = parseFloat(expense.amount || 0) + parseFloat(expense.vat_amount || 0);
                  
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={() => toggleSelection(expense.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {expense.reference_number || expense.id.substring(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="max-w-xs truncate">{expense.description}</div>
                        <div className="text-xs text-gray-400">{expense.category}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {property?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {expense.currency || 'FRW'} {total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          expense.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                          expense.payment_status === 'overdue' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {expense.payment_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {expense.proof ? (
                          <a
                            href={`${import.meta.env.VITE_API_BASE_URL}/api/expenses/${expense.id}/proof/${expense.proof}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiPaperclip className="inline text-lg" />
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            onClick={() => handlePrintInvoice(expense)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Print Invoice"
                          >
                            <FiPrinter />
                          </Button>
                          <Button
                            onClick={() => handleDownloadInvoice(expense)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                            title="Download Invoice"
                          >
                            <FiDownload />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4">
          <Button
            disabled={page <= 1}
            onClick={() => setPage(prev => prev - 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </Button>
          <span className="px-4 py-2 border rounded">
            Page {page} of {totalPages}
          </span>
          <Button
            disabled={page >= totalPages}
            onClick={() => setPage(prev => prev + 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Documents;