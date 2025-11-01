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
  const [limit] = useState(5);
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
  }, [page, filterProperty, filterLocal, fetchExpenses]);

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
    const { amount, category, propertyId } = editData;
    if (!amount || !category || !propertyId)
      return showError('Amount, category, and property are required.');

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
        showSuccess('Expense updated!');
      } else {
        await createExpense(formData, true);
        showSuccess('Expense created!');
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
      showInfo('Expense deleted.');
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
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      overdue: 'bg-red-100 text-red-700',
    };
    return map[statusLower] || map.pending;
  };

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-green-500 to-teal-500 p-4 rounded-lg shadow-md text-white">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Expenses</h1>
          <p className="text-sm opacity-90">
            {totalExpenses} expense{totalExpenses !== 1 ? 's' : ''}{' '}
            {summary.count > 0 &&
              ` • Total: RWF ${summary.total.toLocaleString()}`}
          </p>
        </div>
        <Button
          className="flex items-center gap-2 bg-white text-green-600 hover:bg-green-100 px-3 py-2 rounded-md text-sm font-medium shadow-sm transition w-full sm:w-auto justify-center"
          onClick={() => {
            if (properties.length === 0) {
              return showError('Please wait for properties to load.');
            }
            setEditData({});
            setModalOpen(true);
          }}
        >
          <FiPlus /> Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-end sm:justify-between gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-gray-600 block mb-1">
            Search
          </label>
          <Input
            placeholder="Search by category or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="text-sm font-medium text-gray-600 block mb-1">
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

        <div className="flex-1 min-w-[180px]">
          <label className="text-sm font-medium text-gray-600 block mb-1">
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

        <div className="flex items-center justify-end sm:justify-start w-full sm:w-auto">
          <Button
            onClick={handleResetFilters}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Expense List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || filterProperty || filterLocal
              ? 'No expenses match your filters'
              : 'No expenses yet. Click "Add Expense" to get started!'}
          </div>
        ) : (
          expenses.map((e) => {
            const property = properties.find((p) => p.id === e.propertyId);
            const local = locals.find((l) => l.id === e.localId);

            return (
              <Card
                key={e.id}
                className="p-4 rounded-xl shadow-md border border-gray-100 bg-white hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-gray-800">{e.category}</h2>
                      {e.paymentStatus && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                            e.paymentStatus
                          )}`}
                        >
                          {e.paymentStatus.charAt(0).toUpperCase() + e.paymentStatus.slice(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {e.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                      onClick={() => {
                        setEditData(e);
                        setModalOpen(true);
                      }}
                    >
                      <FiEdit />
                    </Button>
                    <Button
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleDelete(e)}
                    >
                      <FiTrash />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
                    <span>
                      Amount:{' '}
                      <span className="text-green-600 font-semibold">
                        {e.currency || 'FRW'}{' '}
                        {parseFloat(e.amount || 0).toLocaleString()}
                      </span>
                    </span>
                    {e.vat_amount > 0 && (
                      <span>
                        VAT: <span className="font-medium">{parseFloat(e.vat_amount).toLocaleString()}</span>
                        {e.vat_rate && ` (${e.vat_rate}%)`}
                      </span>
                    )}
                    <span>
                      Total:{' '}
                      <span className="font-semibold">
                        {e.currency || 'FRW'}{' '}
                        {(parseFloat(e.amount || 0) + parseFloat(e.vat_amount || 0)).toLocaleString()}
                      </span>
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span>Property: {property?.name || 'N/A'}</span>
                    {e.local_id && <span>Local: {local?.reference_code || 'N/A'}</span>}
                    <span>Date: {e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</span>
                    {e.due_date && (
                      <span>Due: {new Date(e.due_date).toLocaleDateString()}</span>
                    )}
                  </div>

                  {(e.vendor_name || e.payment_method || e.reference_number) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {e.vendor_name && <span>Vendor: {e.vendor_name}</span>}
                      {e.payment_method && (
                        <span>Method: {e.payment_method.replace('_', ' ')}</span>
                      )}
                      {e.reference_number && <span>Ref: {e.reference_number}</span>}
                    </div>
                  )}
                </div>

                {(e.proof || e.notes) && (
                  <div className="mt-2 pt-2 border-t space-y-1">
                    {e.proof && (
                      <a
                        href={`${import.meta.env.VITE_API_BASE_URL}/api/expenses/${e.id}/proof/${e.proof}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                      >
                        <FiPaperclip /> View Proof Document
                      </a>
                    )}
                    {e.notes && (
                      <p className="text-xs text-gray-500 italic">Note: {e.notes}</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && expenses.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Pagination Info */}
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalExpenses)} of {totalExpenses} expenses
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              {/* First Page */}
              <Button
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="px-3 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="First Page"
              >
                &laquo;
              </Button>

              {/* Previous Page */}
              <Button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="flex items-center gap-1 px-3 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <FiChevronLeft /> Prev
              </Button>

              {/* Page Numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 rounded border text-sm ${
                        page === pageNum
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              {/* Current Page (mobile) */}
              <span className="sm:hidden px-3 py-2 border rounded bg-white text-sm font-medium">
                {page} / {totalPages}
              </span>

              {/* Next Page */}
              <Button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className="flex items-center gap-1 px-3 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next <FiChevronRight />
              </Button>

              {/* Last Page */}
              <Button
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="px-3 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Last Page"
              >
                &raquo;
              </Button>
            </div>

            {/* Items Per Page (Optional) */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  // Note: You'll need to make 'limit' a state variable instead of const
                  // setLimit(Number(e.target.value));
                }}
                className="px-2 py-1 border rounded focus:ring-2 focus:ring-green-400 focus:border-green-400"
                disabled
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
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