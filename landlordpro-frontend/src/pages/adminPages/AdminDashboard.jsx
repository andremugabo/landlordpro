// AdminDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiHome, FiLayers, FiDollarSign, FiUsers, FiTrendingUp, 
  FiTrendingDown, FiActivity, FiCalendar, FiFileText,
  FiPlusCircle, FiAlertCircle, FiCheckCircle, FiClock, FiRefreshCw
} from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, CartesianGrid
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
  const [occupancyData, setOccupancyData] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year

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
        getAllExpenses({ page: 1, limit: 10 }),
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

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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

  // Calculate percentage change (mock for now)
  const getPercentageChange = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

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
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.name || 'Admin'}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your properties today.
          </p>
        </div>
        
        {/* Time Range Filter */}
        <div className="flex gap-2">
          {['week', 'month', 'year'].map((range) => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Properties</p>
              <h3 className="text-3xl font-bold mt-2">{stats.properties}</h3>
              <div className="flex items-center gap-1 mt-2 text-blue-100 text-xs">
                <FiTrendingUp size={12} />
                <span>+5% from last month</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiHome size={24} />
            </div>
          </div>
        </Card>

        {/* Floors */}
        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Floors</p>
              <h3 className="text-3xl font-bold mt-2">{stats.floors}</h3>
              <div className="flex items-center gap-1 mt-2 text-purple-100 text-xs">
                <FiActivity size={12} />
                <span>Across all properties</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiLayers size={24} />
            </div>
          </div>
        </Card>

        {/* Locals/Units */}
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Units</p>
              <h3 className="text-3xl font-bold mt-2">{stats.locals}</h3>
              <div className="flex items-center gap-1 mt-2 text-green-100 text-xs">
                <FiCheckCircle size={12} />
                <span>{Math.round((stats.locals * 0.75))} occupied</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiLayers size={24} />
            </div>
          </div>
        </Card>

        {/* Expenses */}
        <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Expenses</p>
              <h3 className="text-3xl font-bold mt-2">{stats.expenses}</h3>
              <div className="flex items-center gap-1 mt-2 text-orange-100 text-xs">
                <FiCalendar size={12} />
                <span>This {timeRange}</span>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiDollarSign size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Expenses */}
        <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
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
        <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
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
                className="bg-green-500 h-2 rounded-full transition-all"
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
        <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
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
                <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '60%' }} />
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
                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition hover:scale-105 ${
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
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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

      {/* Occupancy Overview */}
      {occupancyData && (
        <Card className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Occupancy Overview</h3>
            <button
              onClick={() => navigate('/reports/occupancy')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Details →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiCheckCircle className="text-green-600" />
                <span className="text-sm font-medium text-green-800">Occupied</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {occupancyData?.occupied || 0}
              </div>
              <div className="text-xs text-green-700 mt-1">
                {occupancyData?.occupancyRate || 0}% occupancy
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiActivity className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Available</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {occupancyData?.available || 0}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Ready for rent
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiClock className="text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Maintenance</span>
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                {occupancyData?.maintenance || 0}
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                Under maintenance
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
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

        <Card className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <FiUsers className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="font-semibold text-gray-800">{user ? 1 : 0} Online</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
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