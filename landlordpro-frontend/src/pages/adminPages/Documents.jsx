import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getAllExpenses } from '../../services/expenseService';
import { getAllPayments, getPaymentProofUrl } from '../../services/paymentService';
import { getAllProperties } from '../../services/propertyService';
import { Button, Input, Card, Select, Modal } from '../../components';
import {
  FiDownload,
  FiPrinter,
  FiFileText,
  FiPaperclip,
  FiDollarSign,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { showError, showSuccess } from '../../utils/toastHelper';

const Documents = () => {
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('expenses');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProperty, setFilterProperty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowFilters(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterProperty, filterStatus, dateFrom, dateTo, activeTab]);

  // Helper to escape HTML
  const escapeHtml = (text) => {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  };

  // Helper to get full proof URL for payments
  const getFullPaymentProofUrl = (payment) => {
    if (!payment) return null;

    const proofField = payment.proof || payment.proofUrl || payment.proofFilename || payment.attachment || payment.proof_url;
    
    if (!proofField) return null;
    
    if (typeof proofField === 'string' && proofField.startsWith('http')) {
      return proofField;
    }
    
    if (typeof proofField === 'string' && proofField.startsWith('/uploads')) {
      return `${import.meta.env.VITE_API_BASE_URL}${proofField}`;
    }
    
    if (payment.id && typeof proofField === 'string') {
      try {
        return getPaymentProofUrl(payment.id, proofField);
      } catch (error) {
        console.error('Error constructing payment proof URL:', error);
        return null;
      }
    }
    
    return null;
  };

  // Helper to get full proof URL for expenses
  const getFullExpenseProofUrl = (expense) => {
    if (!expense || !expense.proof) return null;
    
    if (expense.proof.startsWith('http')) {
      return expense.proof;
    }
    
    if (expense.proof.startsWith('/uploads')) {
      return `${import.meta.env.VITE_API_BASE_URL}${expense.proof}`;
    }
    
    return `${import.meta.env.VITE_API_BASE_URL}/api/expenses/${expense.id}/proof/${expense.proof}`;
  };

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPayments(searchTerm);
      let filteredData = Array.isArray(data) ? data : [];

      if (dateFrom) {
        filteredData = filteredData.filter(p => new Date(p.startDate) >= new Date(dateFrom));
      }
      if (dateTo) {
        filteredData = filteredData.filter(p => new Date(p.endDate) <= new Date(dateTo));
      }

      setPayments(filteredData);
    } catch (err) {
      showError(err?.message || 'Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, dateFrom, dateTo]);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllExpenses({
        page: 1,
        limit: 1000,
        propertyId: filterProperty,
        search: searchTerm,
      });

      let filteredData = Array.isArray(res?.data) ? res.data : [];

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
    } catch (err) {
      showError(err?.message || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [filterProperty, searchTerm, filterStatus, dateFrom, dateTo]);

  // Fetch properties
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

  // Fetch data
  useEffect(() => {
    if (activeTab === 'expenses') {
      fetchExpenses();
    } else {
      fetchPayments();
    }
  }, [activeTab, fetchExpenses, fetchPayments]);

  // Proof modal handler
  const handleViewProof = (url) => {
    if (!url) {
      showError('No proof available for this document');
      return;
    }
    setProofUrl(url);
    setProofModalOpen(true);
  };

  // ✅ FIXED: Invoice generator with correct VAT calculation
  const generateExpenseInvoice = (expense) => {
    const property = properties.find(p => p.id === expense.property_id);
    
    // NEW VAT CALCULATION: amount already includes VAT
    const total = parseFloat(expense.amount || 0);
    const vatAmount = total - (total / 1.18); // Extract 18% VAT
    const subtotal = total - vatAmount; // Amount without VAT
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Expense Invoice - ${escapeHtml(expense.reference_number || expense.id)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
          .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 8px; }
          .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
          .company-info h1 { color: #10b981; font-size: 28px; margin-bottom: 5px; font-weight: 700; }
          .company-info p { color: #666; font-size: 14px; margin: 2px 0; }
          .invoice-info { text-align: right; min-width: 250px; }
          .invoice-info h2 { color: #333; font-size: 24px; margin-bottom: 10px; font-weight: 700; }
          .invoice-info p { color: #666; font-size: 14px; line-height: 1.8; margin: 4px 0; }
          .status-badge { display: inline-block; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-overdue { background: #fee2e2; color: #991b1b; }
          .details { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; margin-bottom: 40px; padding: 20px; background: #f9fafb; border-radius: 6px; }
          .details-section h3 { color: #10b981; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
          .details-section p { color: #666; font-size: 14px; line-height: 1.8; margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          thead { background: #f9fafb; }
          th { text-align: left; padding: 14px 12px; font-size: 13px; color: #374151; border-bottom: 2px solid #e5e7eb; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
          td { padding: 14px 12px; font-size: 14px; color: #666; border-bottom: 1px solid #e5e7eb; }
          .text-right { text-align: right; }
          .totals { margin-left: auto; width: 350px; margin-top: 20px; }
          .totals tr td { padding: 10px 12px; font-size: 15px; }
          .totals tr:last-child { border-top: 2px solid #10b981; font-weight: 700; font-size: 18px; }
          .totals tr:last-child td { color: #10b981; padding-top: 15px; }
          .notes { background: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 30px 0; border-radius: 4px; }
          .notes h4 { color: #333; font-size: 14px; margin-bottom: 10px; font-weight: 600; }
          .notes p { color: #666; font-size: 14px; line-height: 1.8; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #999; font-size: 12px; }
          @media print { body { padding: 0; background: white; } .invoice-container { box-shadow: none; border-radius: 0; } }
          @media (max-width: 768px) { body { padding: 20px; } .invoice-container { padding: 20px; } .header { flex-direction: column; } .invoice-info { text-align: left; } .details { grid-template-columns: 1fr; } .totals { width: 100%; } }
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
              <h2>EXPENSE INVOICE</h2>
              <p><strong>Invoice #:</strong> ${escapeHtml(expense.reference_number || expense.id?.substring(0, 8) || 'N/A')}</p>
              <p><strong>Date:</strong> ${expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}</p>
              ${expense.due_date ? `<p><strong>Due Date:</strong> ${new Date(expense.due_date).toLocaleDateString()}</p>` : ''}
              <p style="margin-top: 12px;">
                <span class="status-badge status-${expense.payment_status || 'pending'}">
                  ${escapeHtml((expense.payment_status || 'pending').toUpperCase())}
                </span>
              </p>
            </div>
          </div>

          <div class="details">
            <div class="details-section">
              <h3>Property</h3>
              ${property ? `
                <p><strong>${escapeHtml(property.name)}</strong></p>
                ${property.address ? `<p>${escapeHtml(property.address)}</p>` : ''}
              ` : '<p>No property information</p>'}
            </div>
            
            ${expense.vendor_name ? `
            <div class="details-section">
              <h3>Vendor</h3>
              <p><strong>${escapeHtml(expense.vendor_name)}</strong></p>
              ${expense.vendor_contact ? `<p>${escapeHtml(expense.vendor_contact)}</p>` : ''}
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
                <td>${escapeHtml(expense.description || 'Expense')}</td>
                <td>${escapeHtml(expense.category || 'Uncategorized')}</td>
                <td class="text-right">${expense.currency || 'FRW'} ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <table class="totals">
            <tr>
              <td>Subtotal (Excl. VAT):</td>
              <td class="text-right">${expense.currency || 'FRW'} ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>VAT (18%):</td>
              <td class="text-right">${expense.currency || 'FRW'} ${vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>TOTAL (Incl. VAT):</td>
              <td class="text-right">${expense.currency || 'FRW'} ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </table>

          ${expense.notes ? `
          <div class="notes">
            <h4>Notes</h4>
            <p>${escapeHtml(expense.notes)}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p style="margin-top: 10px; font-size: 11px; color: #bbb;">
              This is a computer-generated document. No signature is required.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generatePaymentReceipt = (payment) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt - ${payment.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
          .receipt-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 8px; }
          .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
          .company-info h1 { color: #3b82f6; font-size: 28px; margin-bottom: 5px; font-weight: 700; }
          .company-info p { color: #666; font-size: 14px; }
          .receipt-info { text-align: right; min-width: 250px; }
          .receipt-info h2 { color: #333; font-size: 24px; margin-bottom: 10px; font-weight: 700; }
          .receipt-info p { color: #666; font-size: 14px; line-height: 1.8; }
          .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #666; font-size: 14px; }
          .detail-value { color: #333; font-size: 14px; font-weight: 600; }
          .amount-box { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0; }
          .amount-box p { font-size: 14px; margin-bottom: 10px; opacity: 0.9; }
          .amount-box h3 { font-size: 36px; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #999; font-size: 12px; }
          @media print { body { padding: 0; background: white; } .receipt-container { box-shadow: none; border-radius: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="company-info">
              <h1>Property Management</h1>
              <p>Payment Receipt</p>
            </div>
            <div class="receipt-info">
              <h2>RECEIPT</h2>
              <p><strong>Receipt #:</strong> ${payment.id?.substring(0, 8)?.toUpperCase() || 'N/A'}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div class="amount-box">
            <p>Amount Paid</p>
            <h3>FRW ${parseFloat(payment.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Payment Period:</span>
              <span class="detail-value">${payment.startDate ? new Date(payment.startDate).toLocaleDateString() : 'N/A'} - ${payment.endDate ? new Date(payment.endDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Lease ID:</span>
              <span class="detail-value">${payment.leaseId || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Mode:</span>
              <span class="detail-value">${payment.paymentMode?.name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span class="detail-value">${payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p style="margin-top: 10px; font-size: 11px; color: #bbb;">
              This is a computer-generated document. No signature is required.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Print Document
  const handlePrint = (item, type) => {
    const printWindow = window.open('', '_blank');
    const html = type === 'expense' ? generateExpenseInvoice(item) : generatePaymentReceipt(item);
    
    if (!printWindow) {
      showError('Please allow popups to print documents');
      return;
    }
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Download Document
  const handleDownload = (item, type) => {
    const html = type === 'expense' ? generateExpenseInvoice(item) : generatePaymentReceipt(item);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${item.reference_number || item.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('Document downloaded successfully!');
  };

  // Toggle selections
  const toggleSelection = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const items = paginatedItems;
    if (selectedItems.length === items.length && items.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i.id).filter(Boolean));
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

  const itemsPerPageOptions = [
    { value: 10, label: '10 per page' },
    { value: 25, label: '25 per page' },
    { value: 50, label: '50 per page' },
    { value: 100, label: '100 per page' },
  ];

  // ✅ FIXED: Summary calculations with correct VAT
  const expenseSummary = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const withProof = expenses.filter(e => e.proof).length;
    return { total, count: expenses.length, withProof };
  }, [expenses]);

  const paymentSummary = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const withProof = payments.filter(p => 
      p.proof || p.proofUrl || p.proofFilename || p.attachment
    ).length;
    return { total, count: payments.length, withProof };
  }, [payments]);

  const currentItems = activeTab === 'expenses' ? expenses : payments;
  const currentSummary = activeTab === 'expenses' ? expenseSummary : paymentSummary;

  // ✅ PAGINATION LOGIC
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = currentItems.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedItems([]); // Clear selections when changing pages
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
    setSelectedItems([]);
  };

  // Mobile card view component
  const MobileItemCard = ({ item, type }) => {
    const isExpense = type === 'expense';
    const property = isExpense ? properties.find(p => p.id === item.property_id) : null;
    
    // ✅ FIXED: Use correct total calculation
    const total = parseFloat(item.amount || 0);
    
    const proofUrl = isExpense 
      ? getFullExpenseProofUrl(item)
      : getFullPaymentProofUrl(item);

    const hasProof = isExpense ? !!item.proof : !!(item.proof || item.proofUrl || item.proofFilename || item.attachment);

    return (
      <Card className="p-4 mb-3 border-l-4 border-l-blue-500">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={selectedItems.includes(item.id)} 
              onChange={() => toggleSelection(item.id)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <div>
              <p className="font-semibold text-gray-900">
                {isExpense ? (item.reference_number || item.id?.substring(0, 8)) : (item.id?.substring(0, 8)?.toUpperCase())}
              </p>
              <p className="text-sm text-gray-500">
                {isExpense ? (item.date ? new Date(item.date).toLocaleDateString() : 'N/A') : (item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A')}
              </p>
            </div>
          </div>
          {isExpense && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              item.payment_status === 'paid'
                ? 'bg-green-100 text-green-700'
                : item.payment_status === 'overdue'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {(item.payment_status || 'pending').toUpperCase()}
            </span>
          )}
        </div>

        <div className="space-y-2 mb-3">
          <p className="text-gray-700">
            {isExpense ? item.description : `Payment for lease: ${item.leaseId?.substring(0, 8)}`}
          </p>
          {isExpense && property && (
            <p className="text-sm text-gray-600">
              Property: {property.name}
            </p>
          )}
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">
              FRW {total.toLocaleString()}
            </span>
            {hasProof ? (
              <button
                onClick={() => handleViewProof(proofUrl)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="View Proof"
              >
                <FiPaperclip className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-gray-400 text-sm">No proof</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-3">
          <Button 
            onClick={() => handlePrint(item, type)} 
            className="p-2 text-blue-600 hover:bg-blue-50"
            title="Print"
          >
            <FiPrinter className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => handleDownload(item, type)} 
            className="p-2 text-green-600 hover:bg-green-50"
            title="Download"
          >
            <FiDownload className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  };

  // Pagination Component
  const PaginationControls = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4">
        {/* Items per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <Select
            options={itemsPerPageOptions}
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="w-32"
          />
        </div>

        {/* Page info */}
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(endIndex, currentItems.length)} of {currentItems.length} items
        </div>

        {/* Pagination buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            className="p-2"
            title="Previous page"
          >
            <FiChevronLeft className="w-4 h-4" />
          </Button>

          {startPage > 1 && (
            <>
              <Button
                onClick={() => handlePageChange(1)}
                variant="outline"
                className="px-3 py-2"
              >
                1
              </Button>
              {startPage > 2 && <span className="text-gray-500">...</span>}
            </>
          )}

          {pageNumbers.map(page => (
            <Button
              key={page}
              onClick={() => handlePageChange(page)}
              variant={currentPage === page ? 'primary' : 'outline'}
              className={`px-3 py-2 ${currentPage === page ? 'bg-blue-600 text-white' : ''}`}
            >
              {page}
            </Button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
              <Button
                onClick={() => handlePageChange(totalPages)}
                variant="outline"
                className="px-3 py-2"
              >
                {totalPages}
              </Button>
            </>
          )}

          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            className="p-2"
            title="Next page"
          >
            <FiChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6 mt-3">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage expenses and payments</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('expenses')} 
            className={activeTab === 'expenses' ? 'bg-red-500 hover:bg-red-600 text-white border-blue-200' : ''}
          >
            Expenses
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab('payments')} 
            className={activeTab === 'payments' ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-blue-200' : ''}
          >
            Payments
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-0">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter Toggle for Mobile */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="sm:hidden flex items-center gap-2"
          >
            <FiFilter className="w-4 h-4" />
            <span>Filters</span>
            {showFilters ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Filters - Responsive */}
        <div className={`${showFilters || !isMobile ? 'block' : 'hidden'} mt-4 sm:mt-0 sm:block`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              options={propertyOptions}
              value={filterProperty}
              onChange={(value) => setFilterProperty(value)}
            />
            {activeTab === 'expenses' && (
              <Select
                options={statusOptions}
                value={filterStatus}
                onChange={(value) => setFilterStatus(value)}
              />
            )}
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To"
            />
          </div>
        </div>
      </Card>

      {/* Content */}
      {isMobile ? (
        /* Mobile View - Card Layout */
        <div>
          {/* Select All for Mobile */}
          {paginatedItems.length > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <input 
                type="checkbox" 
                checked={paginatedItems.length > 0 && selectedItems.length === paginatedItems.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">
                {selectedItems.length} of {paginatedItems.length} selected
              </span>
            </div>
          )}

          {loading ? (
            <Card className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading...</p>
            </Card>
          ) : paginatedItems.length === 0 ? (
            <Card className="p-8 text-center">
              <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents</h3>
              <p className="mt-1 text-sm text-gray-500">
                No {activeTab} found matching your criteria.
              </p>
            </Card>
          ) : (
            <div>
              {paginatedItems.map(item => (
                <MobileItemCard 
                  key={item.id} 
                  item={item} 
                  type={activeTab === 'expenses' ? 'expense' : 'payment'} 
                />
              ))}
            </div>
          )}

          {/* Mobile Pagination */}
          {!loading && paginatedItems.length > 0 && <PaginationControls />}
        </div>
      ) : (
        /* Desktop View - Table Layout */
        <>
          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={paginatedItems.length > 0 && selectedItems.length === paginatedItems.length}
                        onChange={toggleSelectAll} 
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                    {activeTab === 'expenses' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Property</th>}
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    {activeTab === 'expenses' && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Proof</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={activeTab === 'expenses' ? 9 : 8} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                          <p className="text-gray-600">Loading...</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'expenses' ? 9 : 8} className="text-center py-8 text-gray-500">
                        No {activeTab} found
                      </td>
                    </tr>
                  ) : activeTab === 'expenses' ? (
                    paginatedItems.map(expense => {
                      const property = properties.find(p => p.id === expense.property_id);
                      const total = parseFloat(expense.amount || 0);
                      const proofUrl = getFullExpenseProofUrl(expense);
                      const hasProof = !!expense.proof;

                      return (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input 
                              type="checkbox" 
                              checked={selectedItems.includes(expense.id)} 
                              onChange={() => toggleSelection(expense.id)} 
                              className="w-4 h-4 text-blue-600 rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3">{expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-4 py-3">{expense.reference_number || expense.id?.substring(0, 8) || 'N/A'}</td>
                          <td className="px-4 py-3">{expense.description || 'N/A'}</td>
                          <td className="px-4 py-3">{property?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-right">FRW {total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              expense.payment_status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : expense.payment_status === 'overdue'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {(expense.payment_status || 'pending').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {hasProof ? (
                              <button
                                onClick={() => handleViewProof(proofUrl)}
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                title="View Proof"
                              >
                                <FiPaperclip className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button 
                                onClick={() => handlePrint(expense, 'expense')} 
                                className="p-2 text-blue-600 hover:bg-blue-50"
                                title="Print"
                              >
                                <FiPrinter />
                              </Button>
                              <Button 
                                onClick={() => handleDownload(expense, 'expense')} 
                                className="p-2 text-green-600 hover:bg-green-50"
                                title="Download"
                              >
                                <FiDownload />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    paginatedItems.map(payment => {
                      const proofUrl = getFullPaymentProofUrl(payment);
                      const hasProof = !!(payment.proof || payment.proofUrl || payment.proofFilename || payment.attachment);

                      return (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input 
                              type="checkbox" 
                              checked={selectedItems.includes(payment.id)} 
                              onChange={() => toggleSelection(payment.id)} 
                              className="w-4 h-4 text-blue-600 rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3">{payment.startDate ? new Date(payment.startDate).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-4 py-3">{payment.id?.substring(0, 8)?.toUpperCase() || 'N/A'}</td>
                          <td className="px-4 py-3">Payment for lease: {payment.leaseId?.substring(0, 8) || 'N/A'}</td>
                          <td className="px-4 py-3 text-right">FRW {parseFloat(payment.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            {hasProof ? (
                              <button
                                onClick={() => handleViewProof(proofUrl)}
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                title="View Proof"
                              >
                                <FiPaperclip className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button 
                                onClick={() => handlePrint(payment, 'payment')} 
                                className="p-2 text-blue-600 hover:bg-blue-50"
                                title="Print"
                              >
                                <FiPrinter />
                              </Button>
                              <Button 
                                onClick={() => handleDownload(payment, 'payment')} 
                                className="p-2 text-green-600 hover:bg-green-50"
                                title="Download"
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

          {/* Desktop Pagination */}
          {!loading && paginatedItems.length > 0 && <PaginationControls />}
        </>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-blue-600">{currentSummary.count}</p>
            </div>
            <FiFileText className="text-4xl text-blue-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Proof</p>
              <p className="text-2xl font-bold text-green-600">{currentSummary.withProof}</p>
            </div>
            <FiPaperclip className="text-4xl text-green-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-purple-600">
                FRW {currentSummary.total.toLocaleString()}
              </p>
            </div>
            <FiDollarSign className="text-4xl text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Proof Modal */}
      {proofModalOpen && (
        <Modal 
          title="Document Proof" 
          onClose={() => setProofModalOpen(false)}
          hideSubmit
          size="lg"
        >
          <div className="text-center">
            <img
              src={proofUrl}
              alt="Document Proof"
              className="max-h-[500px] max-w-full mx-auto rounded-md shadow-md"
              onError={(e) => {
                console.error('Proof image load error:', proofUrl);
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Proof not available</text></svg>';
              }}
            />
            <div className="mt-3 text-sm text-gray-500 break-all">
              {proofUrl.split('/').pop()}
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                onClick={() => window.open(proofUrl, '_blank')}
                className="flex items-center gap-2"
              >
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                onClick={() => setProofModalOpen(false)}
                className="flex items-center gap-2"
              >
                <FiX className="w-4 h-4" />
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Documents;