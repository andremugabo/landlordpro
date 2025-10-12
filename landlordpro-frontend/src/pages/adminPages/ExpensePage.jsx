import React, { useEffect, useState } from 'react';
import {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../../services/expenseService';
import { getAllProperties } from '../../services/propertyService';
import { getAllLocals } from '../../services/localService';
import { Button, Input, Modal, Card, Select, ExpenseForm } from '../../components';
import { FiTrash, FiPlus, FiEdit, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const ExpensePage = () => {
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [locals, setLocals] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);
  const [filterProperty, setFilterProperty] = useState('');
  const [filterLocal, setFilterLocal] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch properties
  const fetchProperties = async () => {
    try {
      const data = await getAllProperties();
    //   console.log(data.properties)
      setProperties(Array.isArray(data.properties) ? data.properties : []);
    } catch (err) {
      showError(err?.message || 'Failed to fetch properties');
      setProperties([]);
    }
  };

  // Fetch locals (optionally filter by property)
  const fetchLocals = async (propertyId = '') => {
    try {
      const data = await getAllLocals(propertyId);
    //   console.log(data.locals)
      setLocals(Array.isArray(data.locals) ? data.locals : []);
    } catch (err) {
      showError(err?.message || 'Failed to fetch locals');
      setLocals([]);
    }
  };

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await getAllExpenses({
        page,
        limit,
        propertyId: filterProperty,
        localId: filterLocal,
      });
    //   console.log(data)
      setExpenses(Array.isArray(data) ? data : []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      showError(err?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchLocals(filterProperty);
  }, [filterProperty]);

  useEffect(() => {
    fetchExpenses();
  }, [page, filterProperty, filterLocal]);

  // Add/Edit Expense
  const handleSubmit = async () => {
    const { amount, category, propertyId } = editData;
    if (!amount || !category || !propertyId)
      return showError('Amount, category, and property are required');

    try {
      setSubmitLoading(true);
      if (editData.id) {
        await updateExpense(editData.id, editData);
        showSuccess('Expense updated!');
      } else {
        await createExpense(editData);
        showSuccess('Expense created!');
      }
      setModalOpen(false);
      setEditData({});
      fetchExpenses();
    } catch (err) {
      showError(err?.message || 'Failed to save expense');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete Expense
  const handleDelete = async (expense) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteExpense(expense.id);
      showInfo('Expense deleted.');
      fetchExpenses();
    } catch (err) {
      showError(err?.message || 'Failed to delete expense');
    }
  };

  // Filtered & searched expenses
  const filteredExpenses = expenses.filter(e =>
    (e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-green-500 to-teal-500 p-4 rounded-lg shadow-md text-white">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Expenses</h1>
          <p className="text-sm opacity-90">Manage property expenses</p>
        </div>
        <Button
          className="flex items-center gap-2 bg-white text-green-600 hover:bg-green-100 px-3 py-2 rounded-md text-sm font-medium shadow-sm transition w-full sm:w-auto justify-center"
          onClick={() => { setEditData({}); setModalOpen(true); }}
        >
          <FiPlus /> Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-end sm:justify-between gap-3">
  {/* Search Input */}
  <div className="flex-1 min-w-[200px]">
    <label className="text-sm font-medium text-gray-600 block mb-1">Search</label>
    <Input
      placeholder="Search by category or description..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
    />
  </div>

  {/* Property Select */}
  <div className="flex-1 min-w-[180px]">
    <label className="text-sm font-medium text-gray-600 block mb-1">Property</label>
    <Select
      options={[
        { value: '', label: 'All Properties' },
        ...(Array.isArray(properties) ? properties.map(p => ({ value: p.id, label: p.name })) : [])
      ]}
      value={filterProperty}
      onChange={(e) => setFilterProperty(e.target.value)}
      className="w-full"
    />
  </div>

  {/* Local Select */}
  <div className="flex-1 min-w-[180px]">
    <label className="text-sm font-medium text-gray-600 block mb-1">Local</label>
    <Select
      options={[
        { value: '', label: 'All Locals' },
        ...(Array.isArray(locals) ? locals.map(l => ({ value: l.id, label: l.reference_code })) : [])
      ]}
      value={filterLocal}
      onChange={(e) => setFilterLocal(e.target.value)}
      className="w-full"
    />
  </div>

  {/* Reset Button */}
  <div className="flex items-center justify-end sm:justify-start w-full sm:w-auto">
    <Button
      onClick={() => {
        setSearchTerm('');
        setFilterProperty('');
        setFilterLocal('');
      }}
      className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition"
    >
      Reset Filters
    </Button>
  </div>
</div>


      {/* Expenses List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No expenses found</div>
        ) : (
          filteredExpenses.map(e => {
            const property = properties.find(p => p.id === e.propertyId);
            const local = locals.find(l => l.id === e.localId);
            return (
              <Card key={e.id} className="p-4 rounded-xl shadow-md border border-gray-100 bg-white hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="font-semibold text-gray-800">{e.category}</h2>
                    <p className="text-xs text-gray-500">{e.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                      onClick={() => { setEditData(e); setModalOpen(true); }}
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
                <div className="flex flex-wrap justify-between text-sm text-gray-700 gap-2">
                  <span>Amount: <span className="text-green-600 font-semibold">{e.amount}</span></span>
                  <span>Property: {property?.name || 'N/A'}</span>
                  <span>Local: {local?.reference_code || 'N/A'}</span>
                  <span>Date: {e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</span>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-4 flex-wrap">
          <Button
            disabled={page <= 1}
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            className="flex items-center gap-1 px-3 py-1 rounded border"
          >
            <FiChevronLeft /> Prev
          </Button>
          <span className="px-2 py-1 border rounded">{page} / {totalPages}</span>
          <Button
            disabled={page >= totalPages}
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            className="flex items-center gap-1 px-3 py-1 rounded border"
          >
            Next <FiChevronRight />
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <Modal
          title={editData.id ? "Edit Expense" : "Add Expense"}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          submitLoading={submitLoading}
        >
          <ExpenseForm
            editData={editData}
            setEditData={setEditData}
            properties={properties}
            locals={locals}
          />
        </Modal>
      )}
    </div>
  );
};

export default ExpensePage;
