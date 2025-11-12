// src/pages/AdminDashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiLayers,
  FiDollarSign,
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCcw,
  FiChevronRight,
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Card, Button, Spinner } from '../../components';
import { getLoggedInUser } from '../../services/AuthService';
import { getAllProperties } from '../../services/propertyService';
import { getAllLocals } from '../../services/localService';
import { getAllTenants } from '../../services/tenantService';
import leaseService from '../../services/leaseService';
import { getAllPayments } from '../../services/paymentService';
import { getAllExpenses, getExpenseSummary } from '../../services/expenseService';
import { getAllFloorsOccupancy } from '../../services/floorService';
import { showError } from '../../utils/toastHelper';

const CHART_COLORS = ['#14B8A6', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

const rangeOptions = [
  { value: '3m', label: 'Last 90 Days' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '12m', label: 'Last 12 Months' },
];

const getDateRange = (value) => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);

  if (value === '12m') {
    start.setFullYear(end.getFullYear() - 1);
  } else if (value === '6m') {
    start.setMonth(end.getMonth() - 5);
  } else {
    start.setMonth(end.getMonth() - 2);
  }

  return {
    startDate: new Date(start.getFullYear(), start.getMonth(), 1),
    endDate: end,
  };
};

const initialiseMonthlySeries = (startDate, endDate) => {
  const series = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor <= endDate) {
    series.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      month: cursor.toLocaleString('default', { month: 'short' }),
      income: 0,
      expenses: 0,
      profit: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return series;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(amount);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getLoggedInUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState('6m');
  const [error, setError] = useState(null);

  const [portfolio, setPortfolio] = useState({
    properties: [],
    locals: [],
    tenants: [],
    leases: [],
    payments: [],
    expenses: [],
    occupancy: [],
  });

  const [expenseSummary, setExpenseSummary] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
  });

  const { startDate, endDate } = useMemo(() => getDateRange(range), [range]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const [
        propertiesRes,
        localsRes,
        tenantsRes,
        leasesRes,
        paymentsRes,
        expensesRes,
        expenseSummaryRes,
        occupancyRes,
      ] = await Promise.all([
        getAllProperties(1, 1000),
        getAllLocals({ page: 1, limit: 2000 }),
        getAllTenants(1, 1000),
        leaseService.getLeases(1, 1000),
        getAllPayments(),
        getAllExpenses({ page: 1, limit: 1000, startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] }),
        getExpenseSummary({ startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] }),
        getAllFloorsOccupancy(),
      ]);

      const properties = Array.isArray(propertiesRes?.properties)
        ? propertiesRes.properties
        : Array.isArray(propertiesRes?.data)
        ? propertiesRes.data
        : Array.isArray(propertiesRes)
        ? propertiesRes
        : [];

      const locals = Array.isArray(localsRes?.locals)
        ? localsRes.locals
        : Array.isArray(localsRes?.data)
        ? localsRes.data
        : Array.isArray(localsRes?.rows)
        ? localsRes.rows
        : Array.isArray(localsRes)
        ? localsRes
        : [];

      const tenants = Array.isArray(tenantsRes?.tenants)
        ? tenantsRes.tenants
        : Array.isArray(tenantsRes?.data)
        ? tenantsRes.data
        : Array.isArray(tenantsRes)
        ? tenantsRes
        : [];

      const leases = Array.isArray(leasesRes?.data)
        ? leasesRes.data
        : Array.isArray(leasesRes?.leases)
        ? leasesRes.leases
        : Array.isArray(leasesRes)
        ? leasesRes
        : [];

      const payments = Array.isArray(paymentsRes?.data)
        ? paymentsRes.data
        : Array.isArray(paymentsRes)
        ? paymentsRes
        : [];

      const expenses = Array.isArray(expensesRes?.data)
        ? expensesRes.data
        : Array.isArray(expensesRes?.expenses)
        ? expensesRes.expenses
        : Array.isArray(expensesRes)
        ? expensesRes
        : [];

      let occupancy = [];
      if (Array.isArray(occupancyRes)) occupancy = occupancyRes;
      else if (Array.isArray(occupancyRes?.data)) occupancy = occupancyRes.data;
      else if (Array.isArray(occupancyRes?.floors)) occupancy = occupancyRes.floors;

      setPortfolio({
        properties,
        locals,
        tenants,
        leases,
        payments,
        expenses,
        occupancy,
      });

      setExpenseSummary({
        total: expensesRes?.summary?.totalAmount ?? expenseSummaryRes?.totalAmount ?? 0,
        paid: expensesRes?.summary?.paidAmount ?? expenseSummaryRes?.paidAmount ?? 0,
        pending: expensesRes?.summary?.pendingAmount ?? expenseSummaryRes?.pendingAmount ?? 0,
        overdue: expensesRes?.summary?.overdueAmount ?? expenseSummaryRes?.overdueAmount ?? 0,
      });
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setError(err?.message || 'Failed to load dashboard data');
      showError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const { properties, locals, tenants, leases, payments, expenses, occupancy } = portfolio;

  const totalUnits = locals.length;
  const occupiedUnits = locals.filter((local) => local.status === 'occupied').length;
  const availableUnits = locals.filter((local) => local.status === 'available').length;
  const maintenanceUnits = totalUnits - occupiedUnits - availableUnits;
  const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0.0';

  const totalIncome = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const totalExpenseAmount = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const netProfit = totalIncome - totalExpenseAmount;

  const monthlySeries = useMemo(() => {
    const series = initialiseMonthlySeries(startDate, endDate);
    const seriesMap = new Map(series.map((entry) => [entry.key, entry]));

    payments.forEach((payment) => {
      const date = new Date(payment.endDate || payment.end_date || payment.created_at);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const entry = seriesMap.get(key);
      if (entry) entry.income += Number(payment.amount) || 0;
    });

    expenses.forEach((expense) => {
      const date = new Date(expense.due_date || expense.payment_date || expense.created_at);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const entry = seriesMap.get(key);
      if (entry) entry.expenses += Number(expense.amount) || 0;
    });

    return Array.from(seriesMap.values()).map((entry) => ({
      ...entry,
      income: Number(entry.income.toFixed(2)),
      expenses: Number(entry.expenses.toFixed(2)),
      profit: Number((entry.income - entry.expenses).toFixed(2)),
    }));
  }, [payments, expenses, startDate, endDate]);

  const expenseByCategory = useMemo(() => {
    const totals = new Map();
    expenses.forEach((expense) => {
      const category = expense.category || 'uncategorised';
      totals.set(category, (totals.get(category) || 0) + (Number(expense.amount) || 0));
    });

    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const propertyPerformance = useMemo(() => {
    const map = new Map();

    payments.forEach((payment) => {
      const propertyId = payment.propertyId || payment.property_id;
      if (!propertyId) return;
      const entry = map.get(propertyId) || { income: 0, expenses: 0 };
      entry.income += Number(payment.amount) || 0;
      map.set(propertyId, entry);
    });

    expenses.forEach((expense) => {
      const propertyId = expense.property_id;
      if (!propertyId) return;
      const entry = map.get(propertyId) || { income: 0, expenses: 0 };
      entry.expenses += Number(expense.amount) || 0;
      map.set(propertyId, entry);
    });

    return Array.from(map.entries()).map(([propertyId, entry]) => ({
      property: properties.find((property) => property.id === propertyId)?.name || 'Unknown',
      income: Number(entry.income.toFixed(2)),
      expenses: Number(entry.expenses.toFixed(2)),
      profit: Number((entry.income - entry.expenses).toFixed(2)),
    }));
  }, [payments, expenses, properties]);

  const recentTenants = useMemo(() => {
    return leases
      .filter((lease) => lease.tenant)
      .sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.startDate || a.created_at || 0).getTime();
        const bDate = new Date(b.updatedAt || b.startDate || b.created_at || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 6)
      .map((lease) => ({
        id: lease.id,
        name: lease.tenant?.name || 'Unknown tenant',
        unit:
          lease.local?.reference_code ||
          lease.local?.referenceCode ||
          lease.localId ||
          '—',
        leaseEnd: lease.endDate || lease.end_date || '—',
        status: lease.status || 'active',
      }));
  }, [leases]);

  const recentExpenses = useMemo(() =>
    [...expenses]
      .sort((a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at))
      .slice(0, 5),
  [expenses]);

  const summaryCards = [
    {
      title: 'Total Income',
      value: formatCurrency(totalIncome),
      subtitle: `${payments.length} payments received`,
      icon: <FiTrendingUp className="text-emerald-500" size={24} />, 
      color: 'bg-emerald-50',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(totalExpenseAmount),
      subtitle: `${expenses.length} expense records`,
      icon: <FiTrendingDown className="text-rose-500" size={24} />, 
      color: 'bg-rose-50',
    },
    {
      title: 'Net Result',
      value: formatCurrency(netProfit),
      subtitle: netProfit >= 0 ? 'Positive cash flow' : 'Negative cash flow',
      icon: <FiDollarSign className="text-blue-500" size={24} />, 
      color: 'bg-blue-50',
    },
    {
      title: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      subtitle: `${occupiedUnits}/${totalUnits} units occupied`,
      icon: <FiHome className="text-indigo-500" size={24} />, 
      color: 'bg-indigo-50',
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="xl" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6 pb-8">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Admin'}
          </h1>
          <p className="text-sm text-gray-500">
            Portfolio overview for {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  range === option.value
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
          >
            <FiRefreshCcw className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
          {error}
        </div>
      )}

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
          <h2 className="text-lg font-semibold text-gray-800">Income vs Expense</h2>
          <span className="text-xs text-gray-500">
            {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
          </span>
        </div>
        {monthlySeries.length ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                labelClassName="font-medium"
              />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#14B8A6" strokeWidth={3} dot={{ r: 4 }} name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="#F87171" strokeWidth={3} dot={{ r: 4 }} name="Expenses" />
              <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-12 text-center text-gray-500">No financial activity recorded.</div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Expenses by Category</h2>
          {expenseByCategory.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={105}>
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {expenseByCategory.map((entry, index) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {formatCurrency(entry.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">No expense data available.</div>
          )}
        </Card>

        <Card className="p-6 border rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Property Performance</h2>
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
            <div className="py-12 text-center text-gray-500">
              Not enough data to compare properties.
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Tenants</h2>
            <button
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
              onClick={() => navigate('/admin/tenants')}
            >
              View all <FiChevronRight size={14} />
            </button>
          </div>
          {recentTenants.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="p-3 text-left">Tenant</th>
                    <th className="p-3 text-left">Unit</th>
                    <th className="p-3 text-left">Lease End</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b last:border-none">
                      <td className="p-3 font-medium text-gray-800">{tenant.name}</td>
                      <td className="p-3 text-sm text-gray-500">{tenant.unit}</td>
                      <td className="p-3 text-sm text-gray-500">
                        {tenant.leaseEnd
                          ? new Date(tenant.leaseEnd).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            tenant.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : tenant.status === 'overdue'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-6 text-center text-gray-500">No tenant activity recorded.</div>
          )}
        </Card>

        <Card className="p-6 border rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Expenses</h2>
            <button
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
              onClick={() => navigate('/admin/expenses')}
            >
              View all <FiChevronRight size={14} />
            </button>
          </div>
          {recentExpenses.length ? (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{expense.description}</p>
                    <p className="text-xs text-gray-500">
                      {expense.category || 'uncategorised'} •{' '}
                      {new Date(expense.created_at || expense.updated_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-rose-600">
                    {formatCurrency(Number(expense.amount) || 0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-gray-500">No expense activity recorded.</div>
          )}
        </Card>
      </div>

      <Card className="p-6 border rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Expense Status Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[ 
            { label: 'Total', value: expenseSummary.total, color: 'text-gray-900' },
            { label: 'Paid', value: expenseSummary.paid, color: 'text-emerald-600' },
            { label: 'Pending', value: expenseSummary.pending, color: 'text-amber-600' },
            { label: 'Overdue', value: expenseSummary.overdue, color: 'text-rose-600' },
          ].map((item) => (
            <Card key={item.label} className="p-4 border rounded-lg shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className={`text-lg font-semibold ${item.color}`}>
                {formatCurrency(item.value)}
              </p>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;