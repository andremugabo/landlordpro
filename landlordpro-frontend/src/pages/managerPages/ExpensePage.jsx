import React, { useCallback, useMemo, useState } from 'react';
import { Card, Input, Select, Spinner, Button } from '../../components';
import { getAllExpenses } from '../../services/expenseService';
import { showError } from '../../utils/toastHelper';
import useAccessibleProperties from '../../hooks/useAccessibleProperties';

const ManagerExpensePage = () => {
  const {
    isManager,
    properties,
    propertyOptions,
    accessiblePropertyIds,
  } = useAccessibleProperties();

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);

  const propertyNameMap = useMemo(
    () =>
      new Map(properties.map((property) => [property.id, property.name || 'Unnamed Property'])),
    [properties]
  );

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [];

      if (selectedPropertyId) {
        requests.push(getAllExpenses({ page: 1, limit: 500, propertyId: selectedPropertyId }));
      } else if (isManager && accessiblePropertyIds.length > 0) {
        accessiblePropertyIds.forEach((propertyId) => {
          requests.push(getAllExpenses({ page: 1, limit: 500, propertyId }));
        });
      } else {
        requests.push(getAllExpenses({ page: 1, limit: 500 }));
      }

      const responses = await Promise.all(requests);
      const combined = responses.flatMap((response) => {
        if (Array.isArray(response?.data?.expenses)) return response.data.expenses;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.expenses)) return response.expenses;
        if (Array.isArray(response)) return response;
        return [];
      });

      const deduped = Array.from(
        new Map(combined.filter(Boolean).map((expense) => [expense.id, expense])).values()
      );

      setExpenses(deduped);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      showError(error?.message || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [accessiblePropertyIds, isManager, selectedPropertyId]);

  React.useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const filteredExpenses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return expenses.filter((expense) => {
      if (selectedPropertyId && expense.property_id !== selectedPropertyId) return false;

      if (!search) return true;

      const description = expense.description?.toLowerCase() || '';
      const category = expense.category?.toLowerCase() || '';
      const vendor = expense.vendor?.toLowerCase() || '';
      return (
        description.includes(search) ||
        category.includes(search) ||
        vendor.includes(search) ||
        expense.invoice_number?.toLowerCase().includes(search)
      );
    });
  }, [expenses, searchTerm, selectedPropertyId]);

  const totals = useMemo(() => {
    let total = 0;
    let paid = 0;
    let pending = 0;
    let overdue = 0;

    filteredExpenses.forEach((expense) => {
      const amount = Number(expense.amount) || 0;
      const status = expense.payment_status || 'pending';

      total += amount;
      if (status === 'paid') paid += amount;
      else if (status === 'overdue') overdue += amount;
      else pending += amount;
    });

    return {
      total,
      paid,
      pending,
      overdue,
    };
  }, [filteredExpenses]);

  const summaryCards = [
    {
      title: 'Total Expenses',
      value: `FRW ${totals.total.toLocaleString()}`,
      subtitle: `${filteredExpenses.length} records`,
      className: 'bg-rose-50',
    },
    {
      title: 'Paid',
      value: `FRW ${totals.paid.toLocaleString()}`,
      subtitle: 'Expenses marked as paid',
      className: 'bg-emerald-50',
    },
    {
      title: 'Pending',
      value: `FRW ${totals.pending.toLocaleString()}`,
      subtitle: 'Awaiting payment',
      className: 'bg-amber-50',
    },
    {
      title: 'Overdue',
      value: `FRW ${totals.overdue.toLocaleString()}`,
      subtitle: 'Past due date',
      className: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Expense Overview</h1>
          <p className="text-sm text-gray-500">
            Monitor expenses for the properties assigned to you
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select
            label="Filter by Property"
            value={propertyOptions.find((option) => option.value === selectedPropertyId) ?? null}
            options={[{ value: '', label: 'All Properties' }, ...propertyOptions]}
            onChange={(option) => setSelectedPropertyId(option?.value || '')}
            isSearchable
          />
          <Button
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md border"
            onClick={() => {
              setSelectedPropertyId('');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className={`p-5 border rounded-xl shadow-sm ${card.className}`}>
            <p className="text-sm text-gray-500">{card.title}</p>
            <h2 className="text-xl font-bold text-gray-800 mt-1">{card.value}</h2>
            <p className="text-xs text-gray-500 mt-2">{card.subtitle}</p>
          </Card>
        ))}
      </div>

      <div className="relative w-full">
        <Input
          placeholder="Search by description, vendor, or invoice..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-3 w-full border-gray-300 rounded-lg"
        />
      </div>

      <Card className="border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No expenses match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Property</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b last:border-none hover:bg-gray-50">
                    <td className="p-3">
                      <span className="font-medium text-gray-800">{expense.description}</span>
                      {expense.vendor && (
                        <span className="block text-xs text-gray-500">
                          Vendor: {expense.vendor}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {propertyNameMap.get(expense.property_id) || '—'}
                    </td>
                    <td className="p-3 capitalize">{expense.category || '—'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          expense.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : expense.payment_status === 'overdue'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {(expense.payment_status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-rose-600 font-semibold">
                      FRW {Number(expense.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-xs text-gray-600">
                      {expense.due_date
                        ? new Date(expense.due_date).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ManagerExpensePage;

