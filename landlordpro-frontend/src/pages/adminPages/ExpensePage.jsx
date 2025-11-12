import React, { useEffect, useState, useMemo } from 'react';
import { 
  getAllExpenses, 
  createExpense, 
  updateExpense, 
  deleteExpense, 
  restoreExpense,
  approveExpense,
  bulkUpdatePaymentStatus,
  getExpenseSummary,
  downloadProof,
  calculateVAT
} from '../../services/expenseService';
import { getAllProperties } from '../../services/propertyService';
import { getAllLocals } from '../../services/localService';
import { Button, Modal, Input, Card, Select, Badge } from '../../components';
import { 
  FiEdit, FiPlus, FiTrash, FiSearch, FiRefreshCcw, 
  FiDollarSign, FiCalendar, FiFileText, FiDownload,
  FiCheckCircle, FiAlertCircle, FiFilter, FiX,FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight
} from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const ExpensePage = () => {
  // State management
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [locals, setLocals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    vatRate: '',
    vatAmount: '',
    category: '',
    paymentStatus: 'pending',
    paymentDate: '',
    paymentMethod: '',
    dueDate: '',
    propertyId: '',
    localId: '',
    currency: 'RWF',
    vendor: '',
    invoiceNumber: '',
    proofFile: null,
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    paymentStatus: '',
    propertyId: '',
    localId: '',
    currency: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Constants
  const categoryOptions = [
    { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
    { value: 'utilities', label: 'Utilities', color: 'blue' },
    { value: 'insurance', label: 'Insurance', color: 'purple' },
    { value: 'taxes', label: 'Taxes', color: 'red' },
    { value: 'repairs', label: 'Repairs', color: 'orange' },
    { value: 'cleaning', label: 'Cleaning', color: 'green' },
    { value: 'security', label: 'Security', color: 'indigo' },
    { value: 'other', label: 'Other', color: 'gray' },
  ];

  const paymentStatusOptions = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'paid', label: 'Paid', color: 'green' },
    { value: 'overdue', label: 'Overdue', color: 'red' },
    { value: 'cancelled', label: 'Cancelled', color: 'gray' },
  ];

  const currencyOptions = [
    { value: 'RWF', label: 'RWF' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
  ];

  const paymentMethodOptions = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'check', label: 'Check' },
    { value: 'credit_card', label: 'Credit Card' },
  ];

  // Fetch data
  const fetchExpenses = async (pageNumber = page) => {
    try {
      setLoading(true);
      const controller = new AbortController();
      
      const result = await getAllExpenses({
        page: pageNumber,
        limit,
        ...filters,
      }, controller.signal);
      
      setExpenses(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setPage(result.pagination?.page || pageNumber);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching expenses:', err);
        showError(err?.message || 'Failed to fetch expenses');
        setExpenses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await getExpenseSummary(filters);
      console.log(data)
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const fetchProperties = async () => {
    try {
      const data = await getAllProperties(1, 100);
      setProperties(data.properties || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setProperties([]);
    }
  };

  const fetchLocals = async () => {
    try {
      const data = await getAllLocals({ page: 1, limit: 1000 });
      setLocals(data.data || data.locals || []);
    } catch (err) {
      console.error('Error fetching locals:', err);
      setLocals([]);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
    fetchProperties();
    fetchLocals();
  }, []);

  useEffect(() => {
    if (Object.values(filters).some(v => v)) {
      fetchExpenses(1);
      fetchSummary();
    }
  }, [filters]);

  // VAT calculation handler
  const handleAmountChange = (value) => {
    const amount = parseFloat(value) || 0;
    setFormData(prev => {
      const vatRate = parseFloat(prev.vatRate) || 0;
      const vatAmount = vatRate > 0 ? calculateVAT(amount, vatRate) : 0;
      return {
        ...prev,
        amount: value,
        vatAmount: vatAmount.toFixed(2),
      };
    });
  };

  const handleVatRateChange = (value) => {
    const vatRate = parseFloat(value) || 0;
    setFormData(prev => {
      const amount = parseFloat(prev.amount) || 0;
      const vatAmount = amount > 0 && vatRate > 0 ? calculateVAT(amount, vatRate) : 0;
      return {
        ...prev,
        vatRate: value,
        vatAmount: vatAmount.toFixed(2),
      };
    });
  };

  // Modal handlers
  const handleEditClick = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      description: expense.description || '',
      amount: expense.amount || '',
      vatRate: expense.vat_rate || '',
      vatAmount: expense.vat_amount || '',
      category: expense.category || '',
      paymentStatus: expense.payment_status || 'pending',
      paymentDate: expense.payment_date?.split('T')[0] || '',
      paymentMethod: expense.payment_method || '',
      dueDate: expense.due_date?.split('T')[0] || '',
      propertyId: expense.property_id || '',
      localId: expense.local_id || '',
      currency: expense.currency || 'RWF',
      vendor: expense.vendor || '',
      invoiceNumber: expense.invoice_number || '',
      proofFile: null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (submitting) return;
  
    // Validation
    if (!formData.description?.trim()) return showError('Description is required');
    if (!formData.amount || parseFloat(formData.amount) <= 0) return showError('Valid amount is required');
    if (!formData.category) return showError('Category is required');
    if (!formData.propertyId) return showError('Property is required');
  
    setSubmitting(true);
    setUploadProgress(0);
  
    try {
      // 1️⃣ Construct FormData
      const formDataToSend = new FormData();
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('amount', parseFloat(formData.amount));
      formDataToSend.append('vatRate', parseFloat(formData.vatRate) || 0);
      formDataToSend.append('vatAmount', parseFloat(formData.vatAmount) || 0);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('paymentStatus', formData.paymentStatus);
      formDataToSend.append('paymentDate', formData.paymentDate || '');
      formDataToSend.append('paymentMethod', formData.paymentMethod || '');
      formDataToSend.append('dueDate', formData.dueDate || '');
      formDataToSend.append('propertyId', formData.propertyId);
      formDataToSend.append('localId', formData.localId || '');
      formDataToSend.append('currency', formData.currency);
      formDataToSend.append('vendor', formData.vendor?.trim() || '');
      formDataToSend.append('invoiceNumber', formData.invoiceNumber?.trim() || '');
  
      if (formData.proofFile) {
        formDataToSend.append('proof', formData.proofFile); // Make sure backend expects 'proof'
      }
  
      // 2️⃣ Send via service
      if (selectedExpense) {
        await updateExpense(selectedExpense.id, formDataToSend, (progress) => setUploadProgress(progress));
        showSuccess('Expense updated successfully!');
      } else {
        await createExpense(formDataToSend, (progress) => setUploadProgress(progress));
        showSuccess('Expense created successfully!');
        setPage(1);
      }
  
      // 3️⃣ Refresh data
      await fetchExpenses(selectedExpense ? page : 1);
      await fetchSummary();
      handleModalClose();
  
    } catch (err) {
      console.error('Error saving expense:', err);
      showError(err?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };
  

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete expense "${expense.description}"?`)) return;
    
    try {
      await deleteExpense(expense.id);
      showInfo('Expense deleted successfully');
      await fetchExpenses(page);
      await fetchSummary();
    } catch (err) {
      console.error('Error deleting expense:', err);
      showError(err?.message || 'Failed to delete expense');
    }
  };

  const handleRestore = async (expense) => {
    try {
      await restoreExpense(expense.id);
      showSuccess('Expense restored successfully');
      await fetchExpenses(page);
      await fetchSummary();
    } catch (err) {
      console.error('Error restoring expense:', err);
      showError(err?.message || 'Failed to restore expense');
    }
  };

  const handleApprove = async (expense) => {
    try {
      await approveExpense(expense.id, 'current_user_id'); // Replace with actual user ID
      showSuccess('Expense approved successfully');
      await fetchExpenses(page);
    } catch (err) {
      console.error('Error approving expense:', err);
      showError(err?.message || 'Failed to approve expense');
    }
  };

  const handleBulkUpdate = async (status, date, method) => {
    if (selectedExpenses.length === 0) {
      return showError('No expenses selected');
    }

    try {
      await bulkUpdatePaymentStatus({
        expenseIds: selectedExpenses,
        paymentStatus: status,
        paymentDate: date,
        paymentMethod: method,
      });
      showSuccess(`${selectedExpenses.length} expense(s) updated`);
      setSelectedExpenses([]);
      setBulkModalOpen(false);
      await fetchExpenses(page);
      await fetchSummary();
    } catch (err) {
      console.error('Error bulk updating:', err);
      showError(err?.message || 'Failed to update expenses');
    }
  };

  const handleDownloadProof = async (expense) => {
    if (!expense.proof_file_name) {
      return showError('No proof file available');
    }

    try {
      await downloadProof(expense.id, expense.proof_file_name);
      showSuccess('File downloaded successfully');
    } catch (err) {
      console.error('Error downloading proof:', err);
      showError(err?.message || 'Failed to download file');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedExpense(null);
    setFormData({
      description: '',
      amount: '',
      vatRate: '',
      vatAmount: '',
      category: '',
      paymentStatus: 'pending',
      paymentDate: '',
      paymentMethod: '',
      dueDate: '',
      propertyId: '',
      localId: '',
      currency: 'RWF',
      vendor: '',
      invoiceNumber: '',
      proofFile: null,
    });
    setUploadProgress(0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showError('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      setFormData(prev => ({ ...prev, proofFile: file }));
    }
  };

  // Bulk selection
  const toggleExpenseSelection = (expenseId) => {
    setSelectedExpenses(prev =>
      prev.includes(expenseId)
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedExpenses.length === expenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(expenses.map(e => e.id));
    }
  };

  // Computed values
  const propertyOptions = useMemo(() => 
    properties.map(p => ({ value: p.id, label: p.name })),
    [properties]
  );

  const localOptions = useMemo(() => {
    if (!formData.propertyId) return [];
    return locals
      .filter(l => l.property_id === formData.propertyId)
      .map(l => ({ value: l.id, label: l.reference_code }));
  }, [locals, formData.propertyId]);

  const getPropertyName = (propertyId) => {
    return properties.find(p => p.id === propertyId)?.name || '-';
  };

  const getLocalName = (localId) => {
    return locals.find(l => l.id === localId)?.reference_code || '-';
  };

  // Format currency
  const formatCurrency = (amount, currency = 'RWF') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Status badge component
  const StatusBadge = ({ status, deleted }) => {
    if (deleted) {
      return <Badge className="bg-red-100 text-red-800" text="Deleted" />;
    }

    const statusOption = paymentStatusOptions.find(opt => opt.value === status);
    const colorClass = `bg-${statusOption?.color || 'gray'}-100 text-${statusOption?.color || 'gray'}-800`;
    
    return <Badge className={colorClass} text={statusOption?.label || status} />;
  };

  const CategoryBadge = ({ category }) => {
    const categoryOption = categoryOptions.find(opt => opt.value === category);
    const colorClass = `bg-${categoryOption?.color || 'gray'}-100 text-${categoryOption?.color || 'gray'}-800`;
    
    return <Badge className={colorClass} text={categoryOption?.label || category} />;
  };

  // Mobile card
  const MobileCard = ({ expense }) => (
    <Card className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              checked={selectedExpenses.includes(expense.id)}
              onChange={() => toggleExpenseSelection(expense.id)}
              className="rounded border-gray-300"
            />
            <h3 className="font-semibold text-gray-800 text-sm">
              {expense.description}
            </h3>
          </div>
          <p className="text-xs text-gray-500">{getPropertyName(expense.property_id)}</p>
        </div>
        <StatusBadge status={expense.payment_status} deleted={!!expense.deleted_at} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <span className="text-gray-500 text-xs">Amount:</span>
          <div className="font-bold text-gray-800">
            {formatCurrency(expense.amount, expense.currency)}
          </div>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Category:</span>
          <div><CategoryBadge category={expense.category} /></div>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Due Date:</span>
          <div className="text-gray-700">
            {expense.due_date ? new Date(expense.due_date).toLocaleDateString() : '-'}
          </div>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Vendor:</span>
          <div className="text-gray-700">{expense.vendor || '-'}</div>
        </div>
      </div>

      {!expense.deleted_at && (
        <div className="flex gap-2 pt-3 border-t">
          <Button 
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-xs"
            onClick={() => handleEditClick(expense)}
          >
            <FiEdit className="inline mr-1" /> Edit
          </Button>
          {expense.proof_file_name && (
            <Button 
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs"
              onClick={() => handleDownloadProof(expense)}
            >
              <FiDownload className="inline mr-1" /> Proof
            </Button>
          )}
          <Button 
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs"
            onClick={() => handleDelete(expense)}
          >
            <FiTrash className="inline mr-1" /> Delete
          </Button>
        </div>
      )}

      {expense.deleted_at && (
        <Button 
          className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-xs"
          onClick={() => handleRestore(expense)}
        >
          <FiRefreshCcw className="inline mr-1" /> Restore
        </Button>
      )}
    </Card>
  );

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
          {/* Left: Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
              Expense Management
            </h1>
            <p className="text-sm text-gray-500 truncate">
              Track and manage property expenses
            </p>
          </div>

          {/* Right: Buttons */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
            <Button
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm min-w-[120px]"
              onClick={() => setFilterModalOpen(true)}
            >
              <FiFilter /> Filters
            </Button>
            <Button
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm min-w-[120px]"
              onClick={() => setModalOpen(true)}
            >
              <FiPlus /> Add Expense
            </Button>
          </div>
        </div>


      {/* Summary Cards */}
      {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
                {formatCurrency(summary.total || 0)}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Total Expenses</div>
            </Card>
            
            <Card className="p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 truncate">
                {formatCurrency(summary.paid || 0)}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Paid</div>
            </Card>
            
            <Card className="p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 truncate">
                {formatCurrency(summary.pending || 0)}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Pending</div>
            </Card>
            
            <Card className="p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 truncate">
                {formatCurrency(summary.overdue || 0)}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Overdue</div>
            </Card>
            
            
          </div>
        )}

      {/* Bulk Actions */}
      {selectedExpenses.length > 0 && (
        <Card className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span className="text-sm text-blue-800 font-medium">
              {selectedExpenses.length} expense(s) selected
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-xs"
                onClick={() => setBulkModalOpen(true)}
              >
                Update Status
              </Button>
              <Button
                className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-xs"
                onClick={() => setSelectedExpenses([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="bg-white rounded-xl shadow-md border overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No expenses found</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b text-xs uppercase text-gray-600">
                <tr>
                  <th className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.length === expenses.length}
                      onChange={toggleAllSelection}
                      className="rounded"
                    />
                  </th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Property</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Due Date</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50 border-b">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.includes(expense.id)}
                        onChange={() => toggleExpenseSelection(expense.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3 font-medium text-gray-800">
                      <div>{expense.description}</div>
                      {expense.vendor && (
                        <div className="text-xs text-gray-500">Vendor: {expense.vendor}</div>
                      )}
                    </td>
                    <td className="p-3">{getPropertyName(expense.property_id)}</td>
                    <td className="p-3"><CategoryBadge category={expense.category} /></td>
                    <td className="p-3 text-right font-semibold">
                      {formatCurrency(expense.amount, expense.currency)}
                      {expense.vat_amount > 0 && (
                        <div className="text-xs text-gray-500">
                          VAT: {formatCurrency(expense.vat_amount, expense.currency)}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={expense.payment_status} deleted={!!expense.deleted_at} />
                    </td>
                    <td className="p-3">
                      {expense.due_date ? new Date(expense.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        {!expense.deleted_at ? (
                          <>
                            <Button 
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                              onClick={() => handleEditClick(expense)}
                            >
                              <FiEdit />
                            </Button>
                            {expense.proof_file_name && (
                              <Button 
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                                onClick={() => handleDownloadProof(expense)}
                              >
                                <FiDownload />
                              </Button>
                            )}
                            <Button 
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                              onClick={() => handleDelete(expense)}
                            >
                              <FiTrash />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                            onClick={() => handleRestore(expense)}
                          >
                            <FiRefreshCcw />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No expenses found</div>
        ) : (
          expenses.map(expense => <MobileCard key={expense.id} expense={expense} />)
        )}
      </div>

      {/* Pagination */}
      {!loading && expenses.length > 0 && (
          <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-4 sm:px-6 py-4 bg-white border border-gray-200 rounded-xl shadow-sm">

            {/* Page Info */}
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <span className="text-sm text-gray-900 font-semibold">
                Page {page} of {totalPages}
              </span>
              <span className="text-xs text-gray-500">
                Showing {((page - 1) * 10) + 1}-{Math.min(page * 10, totalPages * 10)} results
              </span>
            </div>

            {/* Pagination Bar */}
            <nav className="flex flex-row justify-center sm:justify-end gap-2 w-full sm:w-auto" aria-label="Pagination">

              {/* First */}
              <Button
                onClick={() => fetchExpenses(1)}
                disabled={page <= 1}
                aria-label="Go to first page"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <FiChevronsLeft className="w-4 h-4" />
                <span className="hidden md:inline">First</span>
              </Button>

              {/* Prev */}
              <Button
                onClick={() => fetchExpenses(page - 1)}
                disabled={page <= 1}
                aria-label="Go to previous page"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <FiChevronLeft className="w-4 h-4" />
                <span className="hidden md:inline">Prev</span>
              </Button>

              {/* Current Page Indicator */}
              <span className="flex items-center justify-center min-w-10 px-3 sm:px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-semibold shadow-sm ring-2 ring-yellow-300" aria-current="page">
                {page}
              </span>

              {/* Next */}
              <Button
                onClick={() => fetchExpenses(page + 1)}
                disabled={page >= totalPages}
                aria-label="Go to next page"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <span className="hidden md:inline">Next</span>
                <FiChevronRight className="w-4 h-4" />
              </Button>

              {/* Last */}
              <Button
                onClick={() => fetchExpenses(totalPages)}
                disabled={page >= totalPages}
                aria-label="Go to last page"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <span className="hidden md:inline">Last</span>
                <FiChevronsRight className="w-4 h-4" />
              </Button>

            </nav>
          </div>
        )}


      {/* Create/Edit Modal */}
      {modalOpen && (
        <Modal
          title={selectedExpense ? 'Edit Expense' : 'Add New Expense'}
          onClose={handleModalClose}
          onSubmit={handleSubmit}
          submitText={submitting ? 'Saving...' : (selectedExpense ? 'Update' : 'Create')}
          disabled={submitting}
          size="large"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-blue-800 mb-1">Uploading... {uploadProgress}%</div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <Input
              label="Description *"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Monthly utilities payment"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Amount (Total including VAT) *"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="1180.00"
                required
              />

              <Input
                label="VAT Rate (%)"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.vatRate}
                onChange={(e) => handleVatRateChange(e.target.value)}
                placeholder="18"
              />
            </div>

            {formData.vatAmount && parseFloat(formData.vatAmount) > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span className="font-semibold">
                      {formatCurrency(parseFloat(formData.amount) - parseFloat(formData.vatAmount), formData.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT Amount ({formData.vatRate}%):</span>
                    <span className="font-semibold">
                      {formatCurrency(parseFloat(formData.vatAmount), formData.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-blue-300 pt-1 mt-1">
                    <span className="font-bold">Total Amount:</span>
                    <span className="font-bold">
                      {formatCurrency(parseFloat(formData.amount), formData.currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category *"
                value={categoryOptions.find(opt => opt.value === formData.category)}
                options={categoryOptions}
                onChange={(selected) => setFormData({ ...formData, category: selected?.value || '' })}
                placeholder="Select category..."
                required
              />

              <Select
                label="Currency *"
                value={currencyOptions.find(opt => opt.value === formData.currency)}
                options={currencyOptions}
                onChange={(selected) => setFormData({ ...formData, currency: selected?.value || 'RWF' })}
                isSearchable={false}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Property *"
                value={propertyOptions.find(p => p.value === formData.propertyId)}
                options={propertyOptions}
                onChange={(selected) => setFormData({ 
                  ...formData, 
                  propertyId: selected?.value || '',
                  localId: '' // Reset local when property changes
                })}
                placeholder="Select property..."
                isSearchable
                required
              />

              <Select
                label="Local (Optional)"
                value={localOptions.find(l => l.value === formData.localId)}
                options={localOptions}
                onChange={(selected) => setFormData({ ...formData, localId: selected?.value || '' })}
                placeholder="Select local..."
                isSearchable
                isDisabled={!formData.propertyId}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="Vendor name"
              />

              <Input
                label="Invoice Number"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="INV-001"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Payment Status *"
                value={paymentStatusOptions.find(opt => opt.value === formData.paymentStatus)}
                options={paymentStatusOptions}
                onChange={(selected) => setFormData({ ...formData, paymentStatus: selected?.value || 'pending' })}
                isSearchable={false}
                required
              />

              <Select
                label="Payment Method"
                value={paymentMethodOptions.find(opt => opt.value === formData.paymentMethod)}
                options={paymentMethodOptions}
                onChange={(selected) => setFormData({ ...formData, paymentMethod: selected?.value || '' })}
                placeholder="Select method..."
                isSearchable={false}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />

              <Input
                label="Payment Date"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proof File {selectedExpense?.proof_file_name && '(Optional - Current file will be kept if not replaced)'}
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max file size: 5MB. Supported: PDF, JPG, PNG, DOC, DOCX
              </p>
              {selectedExpense?.proof_file_name && (
                <p className="text-xs text-blue-600 mt-1">
                  Current file: {selectedExpense.proof_file_name}
                </p>
              )}
              {formData.proofFile && (
                <p className="text-xs text-green-600 mt-1">
                  New file selected: {formData.proofFile.name}
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Update Modal */}
      {bulkModalOpen && (
        <Modal
          title="Bulk Update Payment Status"
          onClose={() => setBulkModalOpen(false)}
          onSubmit={() => {
            const status = document.getElementById('bulk-status').value;
            const date = document.getElementById('bulk-date').value;
            const method = document.getElementById('bulk-method').value;
            handleBulkUpdate(status, date, method);
          }}
          submitText="Update All"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Update payment status for {selectedExpenses.length} selected expense(s)
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status *
              </label>
              <select
                id="bulk-status"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                defaultValue="paid"
              >
                {paymentStatusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                id="bulk-date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                id="bulk-method"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select method...</option>
                {paymentMethodOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Filter Modal */}
      {filterModalOpen && (
        <Modal
          title="Filter Expenses"
          onClose={() => setFilterModalOpen(false)}
          onSubmit={() => {
            setFilterModalOpen(false);
            setPage(1);
          }}
          submitText="Apply Filters"
          size="large"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <Input
              label="Search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search description, vendor, invoice..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category"
                value={categoryOptions.find(opt => opt.value === filters.category)}
                options={categoryOptions}
                onChange={(selected) => setFilters({ ...filters, category: selected?.value || '' })}
                placeholder="All categories"
                isClearable
              />

              <Select
                label="Payment Status"
                value={paymentStatusOptions.find(opt => opt.value === filters.paymentStatus)}
                options={paymentStatusOptions}
                onChange={(selected) => setFilters({ ...filters, paymentStatus: selected?.value || '' })}
                placeholder="All statuses"
                isClearable
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Property"
                value={propertyOptions.find(p => p.value === filters.propertyId)}
                options={propertyOptions}
                onChange={(selected) => setFilters({ ...filters, propertyId: selected?.value || '' })}
                placeholder="All properties"
                isSearchable
                isClearable
              />

              <Select
                label="Currency"
                value={currencyOptions.find(opt => opt.value === filters.currency)}
                options={currencyOptions}
                onChange={(selected) => setFilters({ ...filters, currency: selected?.value || '' })}
                placeholder="All currencies"
                isClearable
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />

              <Input
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Min Amount"
                type="number"
                min="0"
                step="0.01"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                placeholder="0.00"
              />

              <Input
                label="Max Amount"
                type="number"
                min="0"
                step="0.01"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                placeholder="10000.00"
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                onClick={() => {
                  setFilters({
                    search: '',
                    category: '',
                    paymentStatus: '',
                    propertyId: '',
                    localId: '',
                    currency: '',
                    startDate: '',
                    endDate: '',
                    minAmount: '',
                    maxAmount: '',
                  });
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExpensePage;