import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../../services/expenseService';
import { getAllProperties } from '../../services/propertyService';
import { getAllLocals } from '../../services/localService';
import {
  Button,
  Input,
  Modal,
  Card,
  Select,
  ExpenseForm,
} from '../../components';
import {
  FiTrash,
  FiPlus,
  FiEdit,
  FiChevronLeft,
  FiChevronRight,
  FiPaperclip,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';
import debounce from 'lodash.debounce';

const ExpensePage = () => {
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [locals, setLocals] = useState([]);
  const [editData, setEditData] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProperty, setFilterProperty] = useState('');
  const [filterLocal, setFilterLocal] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Fetch Expenses
  const fetchExpenses = useCallback(
    async (search = '') => {
      setLoading(true);
      try {
        const res = await getAllExpenses({
          page,
          limit,
          propertyId: filterProperty,
          localId: filterLocal,
          search,
        });

        setExpenses(Array.isArray(res.data) ? res.data : []);
        setTotalPages(res.pagination?.pages || 1);
        setTotalExpenses(res.pagination?.total || 0);
      } catch (err) {
        showError(err?.message || 'Failed to load expenses');
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, filterProperty, filterLocal]
  );

  // Fetch Properties
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { properties: props } = await getAllProperties();
        setProperties(Array.isArray(props) ? props : []);
      } catch (err) {
        showError(err?.message || 'Failed to load properties');
      }
    };
    fetchInitialData();
  }, []);

  // Fetch Locals when property filter changes
  useEffect(() => {
    const fetchLocals = async () => {
      if (!filterProperty) {
        setLocals([]);
        return;
      }
      try {
        const { locals: locs } = await getAllLocals(filterProperty);
        setLocals(Array.isArray(locs) ? locs : []);
      } catch (err) {
        showError(err?.message || 'Failed to load locals');
        setLocals([]);
      }
    };
    fetchLocals();
  }, [filterProperty]);

  // Fetch expenses on page/filter change
  useEffect(() => {
    fetchExpenses(searchTerm);
  }, [page, limit, filterProperty, filterLocal, fetchExpenses]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setPage(1);
        fetchExpenses(val);
      }, 300),
    [fetchExpenses]
  );

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    }
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  // Summary
  const summary = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    return { total, count: expenses.length };
  }, [expenses]);

  // Add/Edit Expense
  const handleSubmit = async (file) => {
    const { amount, category, propertyId, description } = editData;
    if (!amount || !category || !propertyId || !description)
      return showError('Amount, category, description, and property are required.');

    setSubmitLoading(true);
    try {
      const formData = new FormData();
      Object.entries(editData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });
      if (file) formData.append('proof', file);

      if (editData.id) {
        await updateExpense(editData.id, formData, true);
        showSuccess('Expense updated successfully!');
      } else {
        await createExpense(formData, true);
        showSuccess('Expense created successfully!');
      }

      setModalOpen(false);
      setEditData({});
      fetchExpenses(searchTerm);
    } catch (err) {
      showError(err?.message || 'Failed to save expense');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete
  const handleDelete = async (expense) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteExpense(expense.id);
      showInfo('Expense deleted successfully.');
      if (expenses.length === 1 && page > 1) setPage(page - 1);
      else fetchExpenses(searchTerm);
    } catch (err) {
      showError(err?.message || 'Failed to delete expense');
    }
  };

  // Options
  const propertyOptions = [
    { value: '', label: '— All Properties —' },
    ...properties.map((p) => ({ value: p.id, label: p.name })),
  ];

  const localOptions = [
    { value: '', label: '— All Locals —' },
    ...locals.map((l) => ({ value: l.id, label: l.reference_code })),
  ];

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterProperty('');
    setFilterLocal('');
    setPage(1);
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || 'pending').toLowerCase();
    const map = {
      paid: 'bg-green-100 text-green-700 border border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      overdue: 'bg-red-100 text-red-700 border border-red-200',
      cancelled: 'bg-gray-100 text-gray-700 border border-gray-200',
    };
    return map[statusLower] || map.pending;
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPages = 7; // Show max 7 page numbers

    if (totalPages <= maxPages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-green-500 to-teal-500 p-6 rounded-xl shadow-lg text-white">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Expenses</h1>
          <p className="text-sm opacity-90 mt-1">
            {totalExpenses} expense{totalExpenses !== 1 ? 's' : ''}{' '}
            {summary.count > 0 &&
              ` • Total: FRW ${summary.total.toLocaleString()}`}
          </p>
        </div>
        <Button
          className="flex items-center gap-2 bg-white text-green-600 hover:bg-green-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition w-full sm:w-auto justify-center"
          onClick={() => {
            if (properties.length === 0) {
              return showError('Please wait for properties to load.');
            }
            setEditData({});
            setModalOpen(true);
          }}
        >
          <FiPlus className="w-5 h-5" /> Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Search
            </label>
            <Input
              placeholder="Search by category or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Property
            </label>
            <Select
              value={propertyOptions.find((o) => o.value === filterProperty) || propertyOptions[0]}
              options={propertyOptions}
              onChange={(opt) => {
                setFilterProperty(opt?.value || '');
                setFilterLocal('');
                setPage(1);
              }}
              isSearchable
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Local
            </label>
            <Select
              value={localOptions.find((o) => o.value === filterLocal) || localOptions[0]}
              options={localOptions}
              onChange={(opt) => {
                setFilterLocal(opt?.value || '');
                setPage(1);
              }}
              isDisabled={!filterProperty}
              isSearchable
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleResetFilters}
              className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium transition"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 font-medium">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-md">
            <p className="text-lg font-medium">
              {searchTerm || filterProperty || filterLocal
                ? 'No expenses match your filters'
                : 'No expenses yet. Click "Add Expense" to get started!'}
            </p>
          </div>
        ) : (
          expenses.map((e) => {
            const property = properties.find((p) => p.id === e.propertyId);
            const local = locals.find((l) => l.id === e.localId);

            return (
              <Card
                key={e.id}
                className="p-5 rounded-xl shadow-md border border-gray-200 bg-white hover:shadow-xl transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-bold text-gray-900">{e.category}</h2>
                      {e.payment_status && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                            e.payment_status
                          )}`}
                        >
                          {e.payment_status.charAt(0).toUpperCase() + e.payment_status.slice(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {e.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 shadow-sm transition"
                      onClick={() => {
                        setEditData(e);
                        setModalOpen(true);
                      }}
                    >
                      <FiEdit className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 shadow-sm transition"
                      onClick={() => handleDelete(e)}
                    >
                      <FiTrash className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
                    <span className="font-medium">
                      Amount:{' '}
                      <span className="text-green-600 font-bold">
                        {e.currency || 'FRW'}{' '}
                        {parseFloat(e.amount || 0).toLocaleString()}
                      </span>
                    </span>
                    {e.vat_amount > 0 && (
                      <span>
                        VAT: <span className="font-semibold">{parseFloat(e.vat_amount).toLocaleString()}</span>
                        {e.vat_rate && ` (${e.vat_rate}%)`}
                      </span>
                    )}
                    <span className="font-medium">
                      Total:{' '}
                      <span className="text-gray-900 font-bold">
                        {e.currency || 'FRW'}{' '}
                        {(parseFloat(e.amount || 0) + parseFloat(e.vat_amount || 0)).toLocaleString()}
                      </span>
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span>Property: <span className="font-medium">{property?.name || 'N/A'}</span></span>
                    {e.local_id && <span>Local: <span className="font-medium">{local?.reference_code || 'N/A'}</span></span>}
                    <span>Date: <span className="font-medium">{e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</span></span>
                    {e.due_date && (
                      <span>Due: <span className="font-medium">{new Date(e.due_date).toLocaleDateString()}</span></span>
                    )}
                  </div>

                  {(e.vendor_name || e.payment_method || e.reference_number) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      {e.vendor_name && <span>Vendor: <span className="font-medium">{e.vendor_name}</span></span>}
                      {e.payment_method && (
                        <span>Method: <span className="font-medium">{e.payment_method.replace('_', ' ')}</span></span>
                      )}
                      {e.reference_number && <span>Ref: <span className="font-medium">{e.reference_number}</span></span>}
                    </div>
                  )}
                </div>

                {(e.proof || e.notes) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    {e.proof && (
                      <a
                        href={`${import.meta.env.VITE_API_BASE_URL}/api/expenses/${e.id}/proof/${e.proof}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2 font-medium hover:underline"
                      >
                        <FiPaperclip className="w-4 h-4" /> View Proof Document
                      </a>
                    )}
                    {e.notes && (
                      <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                        <span className="font-semibold">Note:</span> {e.notes}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && expenses.length > 0 && totalPages > 1 && (
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
          <div className="flex flex-col gap-4">
            {/* Pagination Info & Items Per Page */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-sm text-gray-600 font-medium">
                Showing <span className="font-bold text-gray-900">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-bold text-gray-900">{Math.min(page * limit, totalExpenses)}</span> of{' '}
                <span className="font-bold text-gray-900">{totalExpenses}</span> expenses
              </div>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">Items per page:</label>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm font-medium bg-white cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-2">
              {/* First Page */}
              <Button
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
                title="First Page"
              >
                <FiChevronsLeft className="w-4 h-4" />
              </Button>

              {/* Previous Page */}
              <Button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
              >
                <FiChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {pageNumbers.map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                        page === pageNum
                          ? 'bg-green-600 text-white border-green-600 shadow-md'
                          : 'bg-white hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  )
                ))}
              </div>

              {/* Next Page */}
              <Button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
              >
                <span className="hidden sm:inline">Next</span>
                <FiChevronRight className="w-4 h-4" />
              </Button>

              {/* Last Page */}
              <Button
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
                title="Last Page"
              >
                <FiChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <Modal
          title={editData.id ? 'Edit Expense' : 'Add Expense'}
          onClose={() => {
            setModalOpen(false);
            setEditData({});
          }}
          onSubmit={handleSubmit}
          submitLoading={submitLoading}
        >
          <ExpenseForm
            editData={editData}
            setEditData={setEditData}
            properties={properties}
            locals={locals}
            onSubmit={handleSubmit}
            submitLoading={submitLoading}
          />
        </Modal>
      )}
    </div>
  );
};

export default ExpensePage;