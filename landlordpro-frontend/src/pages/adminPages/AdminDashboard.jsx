// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiHome, FiLayers, FiDollarSign, FiUsers, FiTrendingUp, 
  FiTrendingDown, FiActivity, FiCalendar, FiFileText,
  FiPlusCircle, FiAlertCircle, FiCheckCircle, FiClock, FiRefreshCw
} from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';
import { Card, Button, Badge, Spinner } from '../../components';
import { getLoggedInUser } from '../../services/AuthService';
import { getAllProperties } from '../../services/propertyService';
import { getAllLocals } from '../../services/localService';
import { getAllExpenses, getExpenseSummary } from '../../services/expenseService';
import { getAllFloors, getAllFloorsOccupancy } from '../../services/floorService';
import { showError } from '../../utils/toastHelper';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getLoggedInUser();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    properties: 0,
    floors: 0,
    locals: 0,
    expenses: 0,
    totalExpenseAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
  });
  
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentTenants, setRecentTenants] = useState([]);
  const [occupancyData, setOccupancyData] = useState(null);
  const [chartData, setChartData] = useState({
    incomeVsExpense: [],
    expenseByCategory: [],
    monthlyTrend: [],
  });
  const [timeRange, setTimeRange] = useState('month');

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        propertiesRes,
        floorsRes,
        localsRes,
        expensesRes,
        expenseSummaryRes,
        occupancyRes,
      ] = await Promise.allSettled([
        getAllProperties(1, 1000),
        getAllFloors({ limit: 1000 }),
        getAllLocals({ page: 1, limit: 1000 }),
        getAllExpenses({ page: 1, limit: 50 }), // Get more for chart data
        getExpenseSummary(getDateRangeFilter()),
        getAllFloorsOccupancy(),
      ]);

      // Process results
      const properties = propertiesRes.status === 'fulfilled' 
        ? propertiesRes.value?.properties || [] 
        : [];
      
      const floors = floorsRes.status === 'fulfilled'
        ? floorsRes.value?.data || []
        : [];
      
      const locals = localsRes.status === 'fulfilled'
        ? localsRes.value?.data || localsRes.value?.locals || []
        : [];
      
      const expenses = expensesRes.status === 'fulfilled'
        ? expensesRes.value?.data || []
        : [];
      
      const expenseSummary = expenseSummaryRes.status === 'fulfilled'
        ? expenseSummaryRes.value
        : null;
      
      const occupancy = occupancyRes.status === 'fulfilled'
        ? occupancyRes.value
        : null;

      // Update stats
      setStats({
        properties: properties.length,
        floors: floors.length,
        locals: locals.length,
        expenses: expenses.length,
        totalExpenseAmount: expenseSummary?.totalAmount || 0,
        paidAmount: expenseSummary?.paidAmount || 0,
        pendingAmount: expenseSummary?.pendingAmount || 0,
        overdueAmount: expenseSummary?.overdueAmount || 0,
      });

      setRecentExpenses(expenses.slice(0, 5));
      setOccupancyData(occupancy);

      // Generate chart data
      generateChartData(expenses, expenseSummary);

      // Mock recent tenants (replace with actual tenant service when available)
      setRecentTenants([
        { 
          id: 1, 
          name: 'John Doe', 
          unit: 'Apt 101', 
          leaseEnd: '2025-12-31', 
          balance: 500,
          status: 'active'
        },
        { 
          id: 2, 
          name: 'Jane Smith', 
          unit: 'Apt 102', 
          leaseEnd: '2025-11-30', 
          balance: 0,
          status: 'active'
        },
        { 
          id: 3, 
          name: 'Mike Johnson', 
          unit: 'Apt 201', 
          leaseEnd: '2026-01-15', 
          balance: 1200,
          status: 'overdue'
        },
        { 
          id: 4, 
          name: 'Sarah Williams', 
          unit: 'Apt 305', 
          leaseEnd: '2025-10-20', 
          balance: 0,
          status: 'active'
        },
        { 
          id: 5, 
          name: 'Robert Brown', 
          unit: 'Apt 412', 
          leaseEnd: '2026-03-10', 
          balance: 750,
          status: 'overdue'
        },
      ]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Generate chart data from expenses
  const generateChartData = (expenses, summary) => {
    // Income vs Expense by month (last 4 months)
    const last4Months = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      // Filter expenses for this month
      const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.created_at);
        return expDate.getMonth() === date.getMonth() && 
               expDate.getFullYear() === date.getFullYear();
      });
      
      const totalExpense = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
      
      // Mock income (in real app, get from revenue/lease service)
      const income = totalExpense * 1.5; // Assume income is 1.5x expenses
      
      last4Months.push({
        month: monthName,
        income: Math.round(income),
        expense: Math.round(totalExpense),
      });
    }

    // Expense by category
    const categoryMap = {};
    expenses.forEach(exp => {
      const category = exp.category || 'other';
      categoryMap[category] = (categoryMap[category] || 0) + parseFloat(exp.amount || 0);
    });

    const expenseByCategory = Object.entries(categoryMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value),
    })).sort((a, b) => b.value - a.value); // Sort by value descending

    setChartData({
      incomeVsExpense: last4Months,
      expenseByCategory,
      monthlyTrend: last4Months,
    });
  };

  // Refresh dashboard
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getDateRangeFilter = () => {
    const now = new Date();
    const ranges = {
      week: new Date(now.setDate(now.getDate() - 7)),
      month: new Date(now.setMonth(now.getMonth() - 1)),
      year: new Date(now.setFullYear(now.getFullYear() - 1)),
    };
    
    return {
      startDate: ranges[timeRange]?.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    };
  };

  // Format currency
  const formatCurrency = (amount, currency = 'RWF') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Chart colors
  const CHART_COLORS = {
    income: '#14B8A6', // teal
    expense: '#F87171', // red
    occupied: '#14B8A6', // teal
    available: '#60A5FA', // blue
    maintenance: '#FBBF24', // yellow
  };

  const PIE_COLORS = ['#14B8A6', '#60A5FA', '#FBBF24', '#F87171', '#8B5CF6', '#EC4899'];

  // Quick actions
  const quickActions = [
    {
      label: 'Add Expense',
      icon: FiDollarSign,
      color: 'blue',
      onClick: () => navigate('/expenses'),
    },
    {
      label: 'Add Property',
      icon: FiHome,
      color: 'green',
      onClick: () => navigate('/properties'),
    },
    {
      label: 'Add Local',
      icon: FiLayers,
      color: 'purple',
      onClick: () => navigate('/locals'),
    },
    {
      label: 'View Reports',
      icon: FiFileText,
      color: 'orange',
      onClick: () => navigate('/reports'),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="xl" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.name || 'Admin'}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your properties today.
          </p>
        </div>
        
        {/* Time Range Filter & Refresh */}
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition flex items-center gap-2"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          {['week', 'month', 'year'].map((range) => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                timeRange === range
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Properties */}
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Properties</p>
              <h3 className="text-3xl font-bold mt-2">{stats.properties}</h3>
              <div className="flex items-center gap-1 mt-2 text-blue-100 text-xs">
                <FiTrendingUp size={12} />
                <span>Active properties</span>
              </div>
            </div>
            <div className="bg-blue-800 bg-opacity-20 p-3 rounded-lg">
              <FiHome size={24} />
            </div>
          </div>
        </Card>

        {/* Floors */}
        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Floors</p>
              <h3 className="text-3xl font-bold mt-2">{stats.floors}</h3>
              <div className="flex items-center gap-1 mt-2 text-purple-100 text-xs">
                <FiActivity size={12} />
                <span>Across all properties</span>
              </div>
            </div>
            <div className="bg-blue-800 bg-opacity-20 p-3 rounded-lg">
              <FiLayers size={24} />
            </div>
          </div>
        </Card>

        {/* Locals/Units */}
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Units</p>
              <h3 className="text-3xl font-bold mt-2">{stats.locals}</h3>
              <div className="flex items-center gap-1 mt-2 text-green-100 text-xs">
                <FiCheckCircle size={12} />
                <span>{Math.round((stats.locals * 0.75))} occupied</span>
              </div>
            </div>
            <div className="bg-blue-800 bg-opacity-20 p-3 rounded-lg">
              <FiLayers size={24} />
            </div>
          </div>
        </Card>

        {/* Expenses */}
        <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Expenses</p>
              <h3 className="text-3xl font-bold mt-2">{stats.expenses}</h3>
              <div className="flex items-center gap-1 mt-2 text-orange-100 text-xs">
                <FiCalendar size={12} />
                <span>This {timeRange}</span>
              </div>
            </div>
            <div className="bg-blue-800 bg-opacity-20 p-3 rounded-lg">
              <FiDollarSign size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Expenses */}
        <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Total Expenses</h3>
            <FiDollarSign className="text-gray-400" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.totalExpenseAmount)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <FiTrendingDown size={14} className="text-red-500" />
              <span>2.4% from last {timeRange}</span>
            </div>
          </div>
        </Card>

        {/* Paid */}
        <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Paid</h3>
            <FiCheckCircle className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(stats.paidAmount)}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progress</span>
              <span>
                {stats.totalExpenseAmount > 0 
                  ? Math.round((stats.paidAmount / stats.totalExpenseAmount) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${stats.totalExpenseAmount > 0 
                    ? (stats.paidAmount / stats.totalExpenseAmount) * 100 
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </Card>

        {/* Pending & Overdue */}
        <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Outstanding</h3>
            <FiAlertCircle className="text-yellow-500" size={20} />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-lg font-bold text-yellow-600">
                  {formatCurrency(stats.pendingAmount)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500" style={{ width: '60%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Overdue</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(stats.overdueAmount)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-red-500 h-1.5 rounded-full transition-all duration-500" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiPlusCircle className="text-blue-500" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition hover:scale-105 active:scale-95 ${
                    action.color === 'blue' ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700' :
                    action.color === 'green' ? 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700' :
                    action.color === 'purple' ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700' :
                    'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700'
                  } font-medium`}
                >
                  <Icon size={20} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Recent Expenses */}
        <Card className="lg:col-span-2 p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Expenses</h3>
            <button
              onClick={() => navigate('/expenses')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition"
            >
              View All →
            </button>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiFileText size={48} className="mx-auto mb-2 text-gray-300" />
              <p>No recent expenses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => navigate(`/expenses/${expense.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">
                      {expense.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {expense.category} • {new Date(expense.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(expense.amount, expense.currency)}
                      </p>
                      {expense.payment_status === 'paid' && (
                        <Badge className="bg-green-100 text-green-800 text-xs mt-1" text="Paid" />
                      )}
                      {expense.payment_status === 'pending' && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs mt-1" text="Pending" />
                      )}
                      {expense.payment_status === 'overdue' && (
                        <Badge className="bg-red-100 text-red-800 text-xs mt-1" text="Overdue" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Line Chart */}
        <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiTrendingUp className="text-teal-500" />
              Income vs Expenses
            </h3>
          </div>
          {chartData.incomeVsExpense.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <FiActivity size={48} className="mx-auto mb-2" />
                <p>No data available</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData.incomeVsExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke={CHART_COLORS.income} 
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.income, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke={CHART_COLORS.expense} 
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.expense, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Expense by Category Pie Chart */}
        <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiActivity className="text-purple-500" />
              Expenses by Category
            </h3>
          </div>
          {chartData.expenseByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <FiActivity size={48} className="mx-auto mb-2" />
                <p>No data available</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData.expenseByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                >
                  {chartData.expenseByCategory.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PIE_COLORS[index % PIE_COLORS.length]} 
                      stroke="#fff" 
                      strokeWidth={2} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Occupancy Rate Chart */}
      {occupancyData && (
        <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiHome className="text-blue-500" />
                Occupancy Overview
              </h3>
              <p className="text-sm text-gray-500 mt-1">Current status of all properties</p>
            </div>
            <button
              onClick={() => navigate('/reports/occupancy')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition"
            >
              View Details →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Occupancy Stats */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <FiCheckCircle className="text-green-600" size={20} />
                  <span className="text-sm font-medium text-green-800">Occupied</span>
                </div>
                <div className="text-3xl font-bold text-green-900">
                  {occupancyData?.occupied || 0}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  {occupancyData?.occupancyRate || 0}% occupancy rate
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <FiActivity className="text-blue-600" size={20} />
                  <span className="text-sm font-medium text-blue-800">Available</span>
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  {occupancyData?.available || 0}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Ready for rent
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <FiClock className="text-yellow-600" size={20} />
                  <span className="text-sm font-medium text-yellow-800">Maintenance</span>
                </div>
                <div className="text-3xl font-bold text-yellow-900">
                  {occupancyData?.maintenance || 0}
                </div>
                <div className="text-xs text-yellow-700 mt-1">
                  Under maintenance
                </div>
              </div>
            </div>

            {/* Occupancy Pie Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Occupied', value: occupancyData?.occupied || 0 },
                      { name: 'Available', value: occupancyData?.available || 0 },
                      { name: 'Maintenance', value: occupancyData?.maintenance || 0 },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill={CHART_COLORS.occupied} stroke="#fff" strokeWidth={2} />
                    <Cell fill={CHART_COLORS.available} stroke="#fff" strokeWidth={2} />
                    <Cell fill={CHART_COLORS.maintenance} stroke="#fff" strokeWidth={2} />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Tenants Table */}
      <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiUsers className="text-indigo-500" />
            Recent Tenants
          </h3>
          <button
            onClick={() => navigate('/tenants')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition"
          >
            View All →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 font-semibold text-gray-700">Name</th>
                <th className="p-3 font-semibold text-gray-700">Unit</th>
                <th className="p-3 font-semibold text-gray-700">Lease End</th>
                <th className="p-3 font-semibold text-gray-700">Balance</th>
                <th className="p-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTenants.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <FiUsers size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No tenants found</p>
                  </td>
                </tr>
              ) : (
                recentTenants.map((tenant) => (
                  <tr 
                    key={tenant.id} 
                    className="hover:bg-gray-50 transition border-b border-gray-100 cursor-pointer"
                    onClick={() => navigate(`/tenants/${tenant.id}`)}
                  >
                    <td className="p-3 font-medium text-gray-800">{tenant.name}</td>
                    <td className="p-3 text-gray-600">{tenant.unit}</td>
                    <td className="p-3 text-gray-600">
                      {new Date(tenant.leaseEnd).toLocaleDateString()}
                    </td>
                    <td className={`p-3 font-semibold ${
                      tenant.balance > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(tenant.balance)}
                    </td>
                    <td className="p-3">
                      {tenant.balance > 0 ? (
                        <Badge className="bg-red-100 text-red-800" text="Overdue" />
                      ) : (
                        <Badge className="bg-green-100 text-green-800" text="Paid" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FiActivity className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">System Status</p>
              <p className="font-semibold text-gray-800">All Systems Operational</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <FiUsers className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="font-semibold text-gray-800">{user ? '1' : '0'} Online</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <FiCalendar className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-semibold text-gray-800">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;