import React, { useCallback, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Card, Select, Spinner, Button } from '../../components';
import useManagerPortfolio from '../../hooks/useManagerPortfolio';
import { getAllExpenses } from '../../services/expenseService';
import { showError } from '../../utils/toastHelper';
import { CalendarDays, Building2, DollarSign, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#14B8A6', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];

const dateRanges = [
  { value: '6m', label: 'Last 6 Months' },
  { value: '12m', label: 'Last 12 Months' },
  { value: 'ytd', label: 'Year to Date' },
];

const getDateRange = (value) => {
  const now = new Date();
  let start = new Date(now);

  if (value === '12m') {
    start.setFullYear(now.getFullYear() - 1);
  } else if (value === 'ytd') {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    start.setMonth(now.getMonth() - 5);
  }

  return {
    startDate: new Date(start.getFullYear(), start.getMonth(), 1),
    endDate: now,
  };
};

const fillMonthlySeries = (startDate, endDate) => {
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

const ManagerReportsPage = () => {
  const {
    properties,
    propertyOptions,
    locals,
    payments,
    leases,
    loading: portfolioLoading,
  } = useManagerPortfolio();

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [range, setRange] = useState('6m');
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [expenses, setExpenses] = useState([]);

  const propertyNameMap = useMemo(
    () =>
      new Map(properties.map((property) => [property.id, property.name || 'Unnamed Property'])),
    [properties]
  );

  const { startDate, endDate } = useMemo(() => getDateRange(range), [range]);

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const params = {
        page: 1,
        limit: 1000,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };
      if (selectedPropertyId) params.propertyId = selectedPropertyId;

      const response = await getAllExpenses(params);
      let data = [];
      if (Array.isArray(response?.data?.expenses)) data = response.data.expenses;
      else if (Array.isArray(response?.data)) data = response.data;
      else if (Array.isArray(response?.expenses)) data = response.expenses;
      else if (Array.isArray(response)) data = response;
      setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses for reports:', error);
      showError(error?.message || 'Failed to load expense data for reports');
      setExpenses([]);
    } finally {
      setLoadingExpenses(false);
    }
  }, [selectedPropertyId, startDate, endDate]);

  React.useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (selectedPropertyId && payment.propertyId !== selectedPropertyId) return false;
      const date = new Date(payment.endDate || payment.end_date || payment.created_at);
      if (Number.isNaN(date.getTime())) return false;
      return date >= startDate && date <= endDate;
    });
  }, [payments, selectedPropertyId, startDate, endDate]);

  const monthlySeries = useMemo(() => {
    const baseSeries = fillMonthlySeries(startDate, endDate);
    const seriesMap = new Map(baseSeries.map((entry) => [entry.key, entry]));

    filteredPayments.forEach((payment) => {
      const date = new Date(payment.endDate || payment.end_date || payment.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const entry = seriesMap.get(key);
      if (entry) {
        entry.income += Number(payment.amount) || 0;
      }
    });

    expenses.forEach((expense) => {
      const date = new Date(expense.due_date || expense.payment_date || expense.created_at);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const entry = seriesMap.get(key);
      if (entry) {
        entry.expenses += Number(expense.amount) || 0;
      }
    });

    return Array.from(seriesMap.values()).map((entry) => ({
      ...entry,
      income: Number(entry.income.toFixed(2)),
      expenses: Number(entry.expenses.toFixed(2)),
      profit: Number((entry.income - entry.expenses).toFixed(2)),
    }));
  }, [filteredPayments, expenses, startDate, endDate]);

  const expenseByCategory = useMemo(() => {
    const totals = new Map();
    expenses.forEach((expense) => {
      const category = expense.category || 'uncategorised';
      const amount = Number(expense.amount) || 0;
      totals.set(category, (totals.get(category) || 0) + amount);
    });
    return Array.from(totals.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));
  }, [expenses]);

  const occupancyStats = useMemo(() => {
    const filteredLocals = selectedPropertyId
      ? locals.filter((local) => local.property_id === selectedPropertyId)
      : locals;
    const total = filteredLocals.length;
    const occupied = filteredLocals.filter((local) => local.status === 'occupied').length;
    const available = filteredLocals.filter((local) => local.status === 'available').length;
    const maintenance = total - occupied - available;
    const rate = total > 0 ? Number(((occupied / total) * 100).toFixed(1)) : 0;
    return { total, occupied, available, maintenance, rate };
  }, [locals, selectedPropertyId]);

  const propertyPerformance = useMemo(() => {
    const map = new Map();
    filteredPayments.forEach((payment) => {
      const propertyId = payment.propertyId;
      if (!propertyId) return;
      const entry = map.get(propertyId) || { income: 0, expenses: 0, propertyId };
      entry.income += Number(payment.amount) || 0;
      map.set(propertyId, entry);
    });
    expenses.forEach((expense) => {
      const propertyId = expense.property_id;
      if (!propertyId) return;
      if (selectedPropertyId && propertyId !== selectedPropertyId) return;
      const entry = map.get(propertyId) || { income: 0, expenses: 0, propertyId };
      entry.expenses += Number(expense.amount) || 0;
      map.set(propertyId, entry);
    });
    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        property: propertyNameMap.get(entry.propertyId) || 'Unknown Property',
        profit: Number((entry.income - entry.expenses).toFixed(2)),
      }))
      .sort((a, b) => b.income - a.income)
      .slice(0, 6);
  }, [filteredPayments, expenses, propertyNameMap, selectedPropertyId]);

  const totalIncome = filteredPayments.reduce(
    (sum, payment) => sum + (Number(payment.amount) || 0),
    0
  );
  const totalExpenses = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  const summaryCards = [
    {
      title: 'Income',
      value: `FRW ${totalIncome.toLocaleString()}`,
      subtitle: `${filteredPayments.length} payments`,
      className: 'bg-emerald-50',
      icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
    },
    {
      title: 'Expenses',
      value: `FRW ${totalExpenses.toLocaleString()}`,
      subtitle: `${expenses.length} records`,
      className: 'bg-rose-50',
      icon: <PieChartIcon className="w-5 h-5 text-rose-500" />,
    },
    {
      title: 'Net Result',
      value: `FRW ${netProfit.toLocaleString()}`,
      subtitle: netProfit >= 0 ? 'Positive cash flow' : 'Negative cash flow',
      className: netProfit >= 0 ? 'bg-blue-50' : 'bg-red-100',
      icon: <DollarSign className="w-5 h-5 text-blue-500" />,
    },
    {
      title: 'Occupancy',
      value: `${occupancyStats.rate}%`,
      subtitle: `${occupancyStats.occupied}/${occupancyStats.total} occupied`,
      className: 'bg-indigo-50',
      icon: <Building2 className="w-5 h-5 text-indigo-500" />,
    },
  ];

  const isLoading = portfolioLoading || loadingExpenses;

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Portfolio Reports</h1>
          <p className="text-sm text-white">
            Financial and occupancy insights for your assigned properties
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select
            label="Date Range"
            value={dateRanges.find((option) => option.value === range)}
            options={dateRanges}
            onChange={(option) => setRange(option.value)}
            isSearchable={false}
          />
          <Select
            label="Property"
            value={propertyOptions.find((option) => option.value === selectedPropertyId) ?? null}
            options={[{ value: '', label: 'All Properties' }, ...propertyOptions]}
            onChange={(option) => setSelectedPropertyId(option?.value || '')}
            isSearchable
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className={`p-5 border rounded-xl shadow-sm ${card.className}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <h2 className="text-xl font-bold text-gray-800 mt-1">{card.value}</h2>
                <p className="text-xs text-gray-500 mt-2">{card.subtitle}</p>
              </div>
              <div className="bg-white border rounded-lg p-2 shadow-sm">{card.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          <Card className="p-6 border rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-teal-500" />
                Income vs Expenses
              </h2>
              <span className="text-xs text-gray-500">
                {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
              </span>
            </div>
            {monthlySeries.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#14B8A6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Income"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Expenses"
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Profit"
                  />
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
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `FRW ${Number(value).toLocaleString()}`} />
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
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {entry.name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          FRW {entry.value.toLocaleString()}
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
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip formatter={(value) => `FRW ${Number(value).toLocaleString()}`} />
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

          <Card className="p-6 border rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Occupancy Overview</h2>
            {occupancyStats.total > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    Total Units: <span className="font-medium text-gray-800">{occupancyStats.total}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Occupied:{' '}
                    <span className="font-medium text-emerald-600">{occupancyStats.occupied}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Available:{' '}
                    <span className="font-medium text-blue-600">{occupancyStats.available}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Maintenance:{' '}
                    <span className="font-medium text-amber-600">{occupancyStats.maintenance}</span>
                  </p>
                  <p className="text-lg font-semibold text-gray-800 mt-4">
                    Overall Occupancy Rate:{' '}
                    <span className="text-teal-600">{occupancyStats.rate}%</span>
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Occupied', value: occupancyStats.occupied },
                        { name: 'Available', value: occupancyStats.available },
                        { name: 'Maintenance', value: occupancyStats.maintenance },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#14B8A6" />
                      <Cell fill="#3B82F6" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-6 text-center text-gray-500">No unit information available.</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default ManagerReportsPage;

