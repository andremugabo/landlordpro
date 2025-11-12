import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Card, Select, Button, Spinner } from '../../components';
import {
  getAllProperties,
} from '../../services/propertyService';
import { getAllLocals } from '../../services/localService';
import leaseService from '../../services/leaseService';
import { getAllPayments } from '../../services/paymentService';
import { getAllExpenses } from '../../services/expenseService';
import { showError, showSuccess } from '../../utils/toastHelper';
import { FiDownload, FiRefreshCw, FiFilter, FiBarChart2, FiDollarSign, FiHome } from 'react-icons/fi';

const COLORS = ['#14B8A6', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981'];

const RANGE_OPTIONS = [
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last 12 Months', value: '12m' },
];

const computeRange = (value) => {
  const end = new Date();
  const start = new Date(end);
  switch (value) {
    case '12m':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case '6m':
      start.setMonth(end.getMonth() - 5);
      break;
    default:
      start.setMonth(end.getMonth() - 2);
  }
  start.setDate(1);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const initMonthlySeries = (start, end) => {
  const cursor = new Date(start);
  const series = [];
  while (cursor <= end) {
    series.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      month: cursor.toLocaleString('default', { month: 'short', year: '2-digit' }),
      income: 0,
      expenses: 0,
      profit: 0,
      leases: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return series;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(
    value || 0
  );

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [properties, setProperties] = useState([]);
  const [locals, setLocals] = useState([]);
  const [leases, setLeases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [range, setRange] = useState('6m');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  const { start, end } = useMemo(() => computeRange(range), [range]);

  const propertyOptions = useMemo(
    () => [{ label: 'All Properties', value: '' }, ...properties.map((property) => ({
      label: property.name || 'Unnamed property',
      value: String(property.id),
    }))],
    [properties]
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [propertiesRes, localsRes, leasesRes, paymentsRes, expensesRes] = await Promise.all([
        getAllProperties(1, 1000),
        getAllLocals({ page: 1, limit: 2000 }),
        leaseService.getLeases(1, 1000),
        getAllPayments(),
        getAllExpenses({ page: 1, limit: 2000 }),
      ]);

      const props = Array.isArray(propertiesRes?.properties)
        ? propertiesRes.properties
        : Array.isArray(propertiesRes?.data)
        ? propertiesRes.data
        : Array.isArray(propertiesRes)
        ? propertiesRes
        : [];
      setProperties(props);

      const localsData = Array.isArray(localsRes?.locals)
        ? localsRes.locals
        : Array.isArray(localsRes?.data)
        ? localsRes.data
        : Array.isArray(localsRes)
        ? localsRes
        : [];
      setLocals(localsData);

      const leasesData = Array.isArray(leasesRes?.data)
        ? leasesRes.data
        : Array.isArray(leasesRes?.leases)
        ? leasesRes.leases
        : Array.isArray(leasesRes)
        ? leasesRes
        : [];
      setLeases(leasesData);

      const paymentsData = Array.isArray(paymentsRes?.data)
        ? paymentsRes.data
        : Array.isArray(paymentsRes)
        ? paymentsRes
        : [];
      setPayments(paymentsData);

      const expensesData = Array.isArray(expensesRes?.data)
        ? expensesRes.data
        : Array.isArray(expensesRes?.expenses)
        ? expensesRes.expenses
        : Array.isArray(expensesRes)
        ? expensesRes
        : [];
      setExpenses(expensesData);
    } catch (error) {
      console.error(error);
      showError(error?.message || 'Failed to load reports data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const date = new Date(payment.endDate || payment.end_date || payment.created_at);
      if (Number.isNaN(date.getTime())) return false;
      if (date < start || date > end) return false;
      if (selectedPropertyId) {
        const propertyId = String(payment.propertyId || payment.property_id || '');
        return propertyId === selectedPropertyId;
      }
      return true;
    });
  }, [payments, start, end, selectedPropertyId]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const date = new Date(expense.due_date || expense.payment_date || expense.created_at);
      if (Number.isNaN(date.getTime())) return false;
      if (date < start || date > end) return false;
      if (selectedPropertyId) {
        return String(expense.property_id || '') === selectedPropertyId;
      }
      return true;
    });
  }, [expenses, start, end, selectedPropertyId]);

  const monthlySeries = useMemo(() => {
    const series = initMonthlySeries(start, end);
    const map = new Map(series.map((entry) => [entry.key, entry]));

    filteredPayments.forEach((payment) => {
      const date = new Date(payment.endDate || payment.end_date || payment.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const entry = map.get(key);
      if (entry) {
        entry.income += Number(payment.amount) || 0;
        entry.leases += 1;
      }
    });

    filteredExpenses.forEach((expense) => {
      const date = new Date(expense.due_date || expense.payment_date || expense.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const entry = map.get(key);
      if (entry) entry.expenses += Number(expense.amount) || 0;
    });

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      income: Number(entry.income.toFixed(2)),
      expenses: Number(entry.expenses.toFixed(2)),
      profit: Number((entry.income - entry.expenses).toFixed(2)),
    }));
  }, [filteredPayments, filteredExpenses, start, end]);

  const expenseByCategory = useMemo(() => {
    const totals = new Map();
    filteredExpenses.forEach((expense) => {
      const category = expense.category || 'uncategorised';
      totals.set(category, (totals.get(category) || 0) + (Number(expense.amount) || 0));
    });
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const propertyPerformance = useMemo(() => {
    const map = new Map();

    filteredPayments.forEach((payment) => {
      const propertyId = String(payment.propertyId || payment.property_id || '');
      if (!propertyId) return;
      const entry = map.get(propertyId) || { income: 0, expenses: 0 };
      entry.income += Number(payment.amount) || 0;
      map.set(propertyId, entry);
    });

    filteredExpenses.forEach((expense) => {
      const propertyId = String(expense.property_id || '');
      if (!propertyId) return;
      const entry = map.get(propertyId) || { income: 0, expenses: 0 };
      entry.expenses += Number(expense.amount) || 0;
      map.set(propertyId, entry);
    });

    return Array.from(map.entries()).map(([propertyId, entry]) => ({
      property: properties.find((property) => String(property.id) === propertyId)?.name || 'Unknown',
      income: Number(entry.income.toFixed(2)),
      expenses: Number(entry.expenses.toFixed(2)),
      profit: Number((entry.income - entry.expenses).toFixed(2)),
    }));
  }, [filteredPayments, filteredExpenses, properties]);

  const totalIncome = useMemo(
    () => filteredPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0),
    [filteredPayments]
  );
  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0),
    [filteredExpenses]
  );
  const netResult = totalIncome - totalExpenses;

  const occupancyStats = useMemo(() => {
    const relevantLocals = selectedPropertyId
      ? locals.filter((local) => String(local.property_id || local.propertyId) === selectedPropertyId)
      : locals;
    const total = relevantLocals.length;
    const occupied = relevantLocals.filter((local) => local.status === 'occupied').length;
    const available = relevantLocals.filter((local) => local.status === 'available').length;
    const maintenance = relevantLocals.filter((local) => local.status === 'maintenance').length;
    const rate = total ? Math.round((occupied / total) * 100) : 0;
    return { total, occupied, available, maintenance, rate };
  }, [locals, selectedPropertyId]);

  const summaryCards = [
    {
      title: 'Income',
      value: formatCurrency(totalIncome),
      subtitle: `${filteredPayments.length} payments`,
      icon: <FiDollarSign className="text-emerald-500" size={20} />,
      color: 'bg-emerald-50',
    },
    {
      title: 'Expenses',
      value: formatCurrency(totalExpenses),
      subtitle: `${filteredExpenses.length} expense records`,
      icon: <FiBarChart2 className="text-rose-500" size={20} />,
      color: 'bg-rose-50',
    },
    {
      title: 'Net Result',
      value: formatCurrency(netResult),
      subtitle: netResult >= 0 ? 'Positive cash flow' : 'Negative cash flow',
      icon: <FiDollarSign className="text-blue-500" size={20} />,
      color: netResult >= 0 ? 'bg-blue-50' : 'bg-amber-50',
    },
    {
      title: 'Occupancy',
      value: `${occupancyStats.rate}%`,
      subtitle: `${occupancyStats.occupied}/${occupancyStats.total} units occupied`,
      icon: <FiHome className="text-indigo-500" size={20} />,
      color: 'bg-indigo-50',
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    showSuccess('Reports refreshed');
  };

  const handleExport = () => {
    const payload = {
      range,
      propertyId: selectedPropertyId,
      totals: { income: totalIncome, expenses: totalExpenses, profit: netResult },
      payments: filteredPayments,
      expenses: filteredExpenses,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `admin-reports-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Reports</h1>
          <p className="text-sm text-gray-500">
            Financial and occupancy insights across all managed properties.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            label="Period"
            value={RANGE_OPTIONS.find((item) => item.value === range)}
            options={RANGE_OPTIONS}
            onChange={(option) => setRange(option.value)}
            isSearchable={false}
            className="min-w-[180px]"
          />
          <Select
            label="Property"
            value={propertyOptions.find((option) => option.value === selectedPropertyId)}
            options={propertyOptions}
            onChange={(option) => setSelectedPropertyId(option?.value || '')}
            className="min-w-[220px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </Button>
            <Button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg"
            >
              <FiDownload /> Export JSON
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className={`p-5 border rounded-xl shadow-sm ${card.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">{card.value}</h2>
                <p className="text-xs text-gray-500 mt-2">{card.subtitle}</p>
              </div>
              <div className="p-3 bg-white border rounded-lg shadow-sm">{card.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 border rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FiFilter className="text-blue-500" /> Income vs Expenses
          </h2>
          <span className="text-xs text-gray-500">
            {start.toLocaleDateString()} – {end.toLocaleDateString()}
          </span>
        </div>
        {monthlySeries.length ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#14B8A6" strokeWidth={3} dot={{ r: 4 }} name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="#F87171" strokeWidth={3} dot={{ r: 4 }} name="Expenses" />
              <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-12 text-center text-gray-500">No activity recorded for this period.</div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
          {expenseByCategory.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie dataKey="value" data={expenseByCategory} nameKey="name" cx="50%" cy="50%" outerRadius={110}>
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {expenseByCategory.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">{entry.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">No expense data for the selected filters.</div>
          )}
        </Card>

        <Card className="p-6 border rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Performance</h2>
          {propertyPerformance.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="property" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="income" fill="#14B8A6" name="Income" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#F59E0B" name="Expenses" radius={[6, 6, 0, 0]} />
                <Bar dataKey="profit" fill="#3B82F6" name="Profit" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-gray-500">No transactions recorded for comparison.</div>
          )}
        </Card>
      </div>

      <Card className="p-6 border rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Occupancy Snapshot</h2>
        {occupancyStats.total ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">{occupancyStats.total}</p>
            </Card>
            <Card className="p-4 border rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Occupied</p>
              <p className="text-2xl font-bold text-emerald-600">{occupancyStats.occupied}</p>
            </Card>
            <Card className="p-4 border rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Available</p>
              <p className="text-2xl font-bold text-blue-600">{occupancyStats.available}</p>
            </Card>
            <Card className="p-4 border rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Maintenance</p>
              <p className="text-2xl font-bold text-amber-600">{occupancyStats.maintenance}</p>
            </Card>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">No local data available.</div>
        )}
      </Card>
    </div>
  );
};

export default AdminReports;