import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Building2,
  AlertCircle,
  Filter,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { getAllProperties } from '../../services/propertyService';
import { getAllExpenses, getExpenseSummary } from '../../services/expenseService';

const COLORS = ['#14B8A6', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
  </div>
);

const Report = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('last6months');
  const [selectedProperty, setSelectedProperty] = useState('all');
  
  // Data states
  const [properties, setProperties] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedProperty]);

  const fetchReportData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { startDate, endDate } = getDateRangeParams();
      
      // Fetch properties (limit 100 to get all)
      const propertiesResponse = await getAllProperties(1, 100);
      const propertiesData = propertiesResponse.data || propertiesResponse.properties || [];
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);

      // Fetch expenses with filters
      const expensesParams = {
        startDate,
        endDate,
        limit: 1000,
        ...(selectedProperty !== 'all' && { propertyId: selectedProperty }),
      };
      const expensesResponse = await getAllExpenses(expensesParams);
      const expensesData = expensesResponse.data?.expenses || expensesResponse.expenses || [];
      setExpenses(Array.isArray(expensesData) ? expensesData : []);

      // Fetch summary
      const summaryParams = {
        startDate,
        endDate,
        ...(selectedProperty !== 'all' && { propertyId: selectedProperty }),
      };
      const summaryResponse = await getExpenseSummary(summaryParams);
      setSummary(summaryResponse.data || summaryResponse);

      // Process monthly data
      processMonthlyData(Array.isArray(expensesData) ? expensesData : []);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getDateRangeParams = () => {
    const endDate = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case 'last6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'lastYear':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'thisYear':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const processMonthlyData = (expensesData) => {
    const monthlyMap = {};
    
    expensesData.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthName,
          expenses: 0,
          count: 0,
        };
      }
      
      monthlyMap[monthKey].expenses += parseFloat(expense.amount) || 0;
      monthlyMap[monthKey].count += 1;
    });

    const processed = Object.keys(monthlyMap)
      .sort()
      .map(key => monthlyMap[key]);
    
    setMonthlyData(processed);
  };

  // Calculate summary metrics with fallbacks
  const totalExpenses = summary?.total || 0;
  const totalPaid = summary?.paid || 0;
  const totalPending = summary?.pending || 0;
  const totalOverdue = summary?.overdue || 0;
  const expenseCount = summary?.count || expenses.length || 0;

  const summaryCards = [
    {
      title: 'Total Expenses',
      value: `$${(totalExpenses / 1000).toFixed(1)}K`,
      subtitle: `${expenseCount} entries`,
      icon: <DollarSign className="w-8 h-8 text-rose-500" />,
      bg: 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/20',
      border: 'border-rose-200 dark:border-rose-700',
    },
    {
      title: 'Paid',
      value: `$${(totalPaid / 1000).toFixed(1)}K`,
      subtitle: `${totalExpenses > 0 ? Math.round((totalPaid / totalExpenses) * 100) : 0}% of total`,
      icon: <TrendingUp className="w-8 h-8 text-emerald-500" />,
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20',
      border: 'border-emerald-200 dark:border-emerald-700',
    },
    {
      title: 'Pending',
      value: `$${(totalPending / 1000).toFixed(1)}K`,
      subtitle: `${totalExpenses > 0 ? Math.round((totalPending / totalExpenses) * 100) : 0}% pending`,
      icon: <FileText className="w-8 h-8 text-amber-500" />,
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20',
      border: 'border-amber-200 dark:border-amber-700',
    },
    {
      title: 'Overdue',
      value: `$${(totalOverdue / 1000).toFixed(1)}K`,
      subtitle: 'Needs attention',
      icon: <AlertCircle className="w-8 h-8 text-red-500" />,
      bg: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20',
      border: 'border-red-200 dark:border-red-700',
    },
  ];

  // Process expense breakdown by category
  const expenseBreakdown = summary?.byCategory 
    ? Object.entries(summary.byCategory).map(([name, data]) => ({
        name,
        value: data.count || 0,
        amount: data.total || 0,
      }))
    : [];

  // Process payment status
  const paymentStatus = summary?.byPaymentStatus
    ? Object.entries(summary.byPaymentStatus).map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 100) : 0,
        amount: data.total || 0,
        color: name === 'paid' ? '#10B981' : name === 'pending' ? '#F59E0B' : '#EF4444',
      }))
    : [];

  // Property performance (expenses by property)
  const propertyPerformance = properties.slice(0, 5).map(property => {
    const propertyExpenses = expenses.filter(e => e.property_id === property.id);
    const totalExpense = propertyExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    return {
      property: property.name || 'Unknown',
      expenses: totalExpense,
      count: propertyExpenses.length,
    };
  }).filter(p => p.expenses > 0);

  const handleExport = () => {
    const reportData = {
      dateRange,
      selectedProperty,
      summary: {
        totalExpenses,
        totalPaid,
        totalPending,
        totalOverdue,
        count: expenseCount,
      },
      expenses,
      properties,
    };
    
    // Create downloadable JSON
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    fetchReportData(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-500 dark:from-teal-600 dark:to-blue-600 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-2">Financial Reports</h1>
            <p className="text-teal-50 text-lg">Comprehensive overview of your expenses</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition shadow-md font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-teal-600 rounded-lg transition shadow-md font-semibold"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            >
              <option value="last6months">Last 6 Months</option>
              <option value="lastYear">Last Year</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building2 className="w-4 h-4 inline mr-1" />
              Property
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            >
              <option value="all">All Properties</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, i) => (
          <Card key={i} className={`p-6 ${card.bg} border-2 ${card.border} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{card.title}</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-1">{card.value}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{card.subtitle}</p>
              </div>
              <div className="shrink-0 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">{card.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Monthly Expenses Trend */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
            <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Monthly Expenses Trend</h2>
        </div>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '14px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '14px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Expenses']}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#F59E0B" 
                strokeWidth={3} 
                name="Monthly Expenses" 
                dot={{ fill: '#F59E0B', r: 5 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No expense data available for the selected period</p>
          </div>
        )}
      </Card>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Expenses by Category</h2>
          </div>
          {expenseBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`$${props.payload.amount.toLocaleString()}`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-3">
                {expenseBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({item.value} items)</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-50">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No expense categories to display</p>
            </div>
          )}
        </Card>

        {/* Payment Status */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Payment Status</h2>
          </div>
          {paymentStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={paymentStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`$${props.payload.amount.toLocaleString()}`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-3">
                {paymentStatus.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full shadow-md" style={{ backgroundColor: status.color }}></div>
                      <div>
                        <span className="text-gray-700 dark:text-gray-300 font-semibold text-lg block">{status.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">${status.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-50">{status.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No payment status data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Property Expenses */}
      {propertyPerformance.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Expenses by Property</h2>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={propertyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="property" stroke="#9CA3AF" style={{ fontSize: '13px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '14px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
                formatter={(value, name, props) => [
                  `$${value.toFixed(2)} (${props.payload.count} items)`,
                  'Total Expenses'
                ]}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="expenses" fill="#F59E0B" name="Total Expenses" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Key Insights */}
      <Card className="p-6 bg-gradient-to-r from-teal-50 via-blue-50 to-purple-50 dark:from-teal-900/20 dark:via-blue-900/20 dark:to-purple-900/20 border-2 border-teal-200 dark:border-teal-700">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <AlertCircle className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Key Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-gray-900 dark:text-gray-50 text-lg">Total Tracked</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              ${totalExpenses.toLocaleString()} across {expenseCount} expense {expenseCount === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-900 dark:text-gray-50 text-lg">Action Required</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {totalOverdue > 0 
                ? `$${totalOverdue.toLocaleString()} in overdue expenses` 
                : 'No overdue expenses'}
            </p>
          </div>
          <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-gray-900 dark:text-gray-50 text-lg">Payment Rate</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {totalExpenses > 0 
                ? `${Math.round((totalPaid / totalExpenses) * 100)}% of expenses paid` 
                : 'No payment data'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Report;