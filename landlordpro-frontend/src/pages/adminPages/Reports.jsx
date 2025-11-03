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
  CreditCard,
  ArrowLeft,
} from 'lucide-react';
import { getAllProperties } from '../../services/propertyService';
import { getAllExpenses, getExpenseSummary } from '../../services/expenseService';
import { getAllPayments } from '../../services/paymentService';
import { getAllFloorsOccupancy } from '../../services/floorService';
import { useNavigate } from 'react-router-dom';

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

const SummaryCard = ({ title, value, subtitle, icon, bg, border }) => (
  <Card className={`p-6 ${bg} border-2 ${border} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-1">{value}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <div className="shrink-0 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">{icon}</div>
    </div>
  </Card>
);

const EmptyState = ({ icon: Icon, message }) => (
  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
    <Icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
    <p>{message}</p>
  </div>
);

const SectionHeader = ({ icon: Icon, iconBg, title }) => (
  <div className="flex items-center gap-2 mb-6">
    <div className={`p-2 ${iconBg} rounded-lg`}>
      <Icon className="w-5 h-5" />
    </div>
    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
  </div>
);

const Report = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('last6months');
  const [selectedProperty, setSelectedProperty] = useState('all');
  
  const [properties, setProperties] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [floorsOccupancy, setFloorsOccupancy] = useState([]);
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedProperty]);

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

  const fetchReportData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { startDate, endDate } = getDateRangeParams();
      
      // Fetch properties
      const propertiesResponse = await getAllProperties(1, 100);
      const propertiesData = propertiesResponse.data || propertiesResponse.properties || [];
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);

      // Fetch expenses
      const expensesParams = {
        startDate,
        endDate,
        limit: 1000,
        ...(selectedProperty !== 'all' && { propertyId: selectedProperty }),
      };
      const expensesResponse = await getAllExpenses(expensesParams);
      const expensesData = expensesResponse.data?.expenses || expensesResponse.expenses || [];
      setExpenses(Array.isArray(expensesData) ? expensesData : []);

      // Fetch payments
      const paymentsResponse = await getAllPayments();
      const paymentsData = Array.isArray(paymentsResponse) ? paymentsResponse : [];
      
      const filteredPayments = paymentsData.filter(payment => {
        const paymentDate = new Date(payment.startDate || payment.created_at);
        return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
      });
      setPayments(filteredPayments);

      // Fetch expense summary
      const summaryParams = {
        startDate,
        endDate,
        ...(selectedProperty !== 'all' && { propertyId: selectedProperty }),
      };
      const summaryResponse = await getExpenseSummary(summaryParams);
      setSummary(summaryResponse.data || summaryResponse);

      // Fetch floors occupancy - FIXED DATA HANDLING
      try {
        const floorsOccupancyResponse = await getAllFloorsOccupancy();
        console.log('Floors Occupancy Response:', floorsOccupancyResponse);
        
        let floorsData = [];
        
        // Handle different response structures
        if (Array.isArray(floorsOccupancyResponse)) {
          floorsData = floorsOccupancyResponse;
        } else if (floorsOccupancyResponse?.data) {
          floorsData = Array.isArray(floorsOccupancyResponse.data) ? floorsOccupancyResponse.data : [];
        } else if (floorsOccupancyResponse?.floors) {
          floorsData = Array.isArray(floorsOccupancyResponse.floors) ? floorsOccupancyResponse.floors : [];
        }
        
        console.log('Processed Floors Data:', floorsData);
        setFloorsOccupancy(floorsData);
      } catch (floorError) {
        console.error('Error fetching floors occupancy:', floorError);
        setFloorsOccupancy([]);
      }

      // Process monthly data
      processMonthlyData(Array.isArray(expensesData) ? expensesData : [], filteredPayments);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processMonthlyData = (expensesData, paymentsData) => {
    const monthlyMap = {};
    
    expensesData.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthName, expenses: 0, income: 0, profit: 0 };
      }
      
      monthlyMap[monthKey].expenses += parseFloat(expense.amount) || 0;
    });

    paymentsData.forEach(payment => {
      const date = new Date(payment.startDate || payment.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthName, expenses: 0, income: 0, profit: 0 };
      }
      
      monthlyMap[monthKey].income += parseFloat(payment.amount) || 0;
    });

    Object.keys(monthlyMap).forEach(key => {
      monthlyMap[key].profit = monthlyMap[key].income - monthlyMap[key].expenses;
    });

    const processed = Object.keys(monthlyMap).sort().map(key => monthlyMap[key]);
    setMonthlyData(processed);
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Calculate metrics with safe defaults
  const totalExpenses = summary?.total || expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalPaid = summary?.paid || 0;
  const totalOverdue = summary?.overdue || 0;
  const expenseCount = summary?.count || expenses.length || 0;
  const totalIncome = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0';

  // Calculate occupancy metrics with safe data handling
  const totalUnits = floorsOccupancy.reduce((sum, floor) => {
    return sum + (parseInt(floor.totalLocals) || parseInt(floor.totalUnits) || parseInt(floor.total_units) || 0);
  }, 0);
  
  const occupiedUnits = floorsOccupancy.reduce((sum, floor) => {
    return sum + (parseInt(floor.occupiedLocals) || parseInt(floor.occupiedUnits) || parseInt(floor.occupied_units) || 0);
  }, 0);
  
  const availableUnits = Math.max(0, totalUnits - occupiedUnits);
  const overallOccupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0.0';

  const summaryCards = [
    {
      title: 'Total Income',
      value: `FRW ${(totalIncome / 1000).toFixed(1)}K`,
      subtitle: `${payments.length} payments`,
      icon: <DollarSign className="w-8 h-8 text-teal-500" />,
      bg: 'bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/20',
      border: 'border-teal-200 dark:border-teal-700',
    },
    {
      title: 'Total Expenses',
      value: `FRW ${(totalExpenses / 1000).toFixed(1)}K`,
      subtitle: `${expenseCount} entries`,
      icon: <TrendingDown className="w-8 h-8 text-rose-500" />,
      bg: 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/20',
      border: 'border-rose-200 dark:border-rose-700',
    },
    {
      title: 'Net Profit',
      value: `FRW ${(netProfit / 1000).toFixed(1)}K`,
      subtitle: `${profitMargin}% margin`,
      icon: <TrendingUp className="w-8 h-8 text-emerald-500" />,
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20',
      border: 'border-emerald-200 dark:border-emerald-700',
    },
    {
      title: 'Occupancy Rate',
      value: `${overallOccupancyRate}%`,
      subtitle: `${occupiedUnits}/${totalUnits} units`,
      icon: <Building2 className="w-8 h-8 text-blue-500" />,
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20',
      border: 'border-blue-200 dark:border-blue-700',
    },
  ];

  const expenseBreakdown = summary?.byCategory 
    ? Object.entries(summary.byCategory).map(([name, data]) => ({
        name,
        value: data.count || 0,
        amount: data.total || 0,
      }))
    : [];

  const financialHealth = [
    { name: 'Income', value: totalIncome, color: '#10B981' },
    { name: 'Expenses', value: totalExpenses, color: '#F59E0B' },
  ];

  const occupancyData = [
    { name: 'Occupied', value: occupiedUnits, color: '#14B8A6' },
    { name: 'Available', value: availableUnits, color: '#E5E7EB' },
  ];

  const propertyPerformance = properties.slice(0, 5).map(property => {
    const propertyExpenses = expenses.filter(e => e.property_id === property.id);
    const totalExpense = propertyExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const incomeShare = properties.length > 0 ? totalIncome / properties.length : 0;
    
    return {
      property: property.name || 'Unknown',
      expenses: totalExpense,
      income: incomeShare,
      profit: incomeShare - totalExpense,
    };
  }).filter(p => p.expenses > 0 || p.income > 0);

  const handleExport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      selectedProperty,
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: parseFloat(profitMargin),
        totalPaid,
        totalOverdue,
        expenseCount,
        paymentCount: payments.length,
        occupancyRate: parseFloat(overallOccupancyRate),
        totalUnits,
        occupiedUnits,
      },
      monthlyData,
      expenses: expenses.slice(0, 100), // Limit for file size
      payments: payments.slice(0, 100),
      properties: properties.slice(0, 10),
      floorsOccupancy,
    };
    
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
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-500 dark:from-teal-600 dark:to-blue-600 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition shadow-md font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">Financial Reports</h1>
            <p className="text-teal-50 text-lg">Income, expenses, and occupancy overview</p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="text-white">
            <p className="text-teal-100">
              Data for {dateRange.replace(/([A-Z])/g, ' $1').toLowerCase()} • {selectedProperty === 'all' ? 'All Properties' : 'Selected Property'}
            </p>
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

      {/* Rest of your existing JSX remains the same */}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, i) => (
          <SummaryCard key={i} {...card} />
        ))}
      </div>

      {/* Rest of your charts and components remain the same */}
      <Card className="p-6">
        <SectionHeader 
          icon={TrendingUp} 
          iconBg="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" 
          title="Income vs Expenses Trend" 
        />
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '12px',
                }}
                formatter={(value) => [`FRW ${value.toFixed(2)}`, 'Amount']}
              />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#14B8A6" strokeWidth={3} name="Income" dot={{ r: 5 }} />
              <Line type="monotone" dataKey="expenses" stroke="#F59E0B" strokeWidth={3} name="Expenses" dot={{ r: 5 }} />
              <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} name="Profit" dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={FileText} message="No data available for the selected period" />
        )}
      </Card>

      {/* ... rest of your existing JSX for charts ... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <SectionHeader 
            icon={DollarSign} 
            iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
            title="Expenses by Category" 
          />
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
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`FRW${props.payload.amount.toLocaleString()}`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-3">
                {expenseBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-50">${item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon={DollarSign} message="No expense categories to display" />
          )}
        </Card>

        <Card className="p-6">
          <SectionHeader 
            icon={CreditCard} 
            iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
            title="Financial Health" 
          />
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={financialHealth}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={5}
                dataKey="value"
              >
                {financialHealth.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `FRW${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-6 space-y-3">
            {financialHealth.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">{item.name}</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-50">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {floorsOccupancy.length > 0 && (
        <Card className="p-6">
          <SectionHeader 
            icon={Building2} 
            iconBg="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" 
            title="Occupancy Overview" 
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">{overallOccupancyRate}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overall Occupancy Rate</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{occupiedUnits} of {totalUnits} units occupied</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {floorsOccupancy.map((floor, index) => {
                const floorOccupancyRate = floor.totalLocals > 0 
                  ? ((floor.occupiedLocals / floor.totalLocals) * 100).toFixed(0) 
                  : 0;
                
                return (
                  <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-50">{floor.floorName || `Floor ${floor.floorNumber}`}</h4>
                      <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{floorOccupancyRate}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-teal-500 h-2 rounded-full transition-all" 
                          style={{ width: `${floorOccupancyRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {floor.occupiedLocals}/{floor.totalLocals} units
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {propertyPerformance.length > 0 && (
        <Card className="p-6">
          <SectionHeader 
            icon={Building2} 
            iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" 
            title="Property Performance" 
          />
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={propertyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="property" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '12px',
                }}
                formatter={(value) => `FRW${value.toFixed(2)}`}
              />
              <Legend />
              <Bar dataKey="income" fill="#14B8A6" name="Income" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#F59E0B" name="Expenses" radius={[8, 8, 0, 0]} />
              <Bar dataKey="profit" fill="#10B981" name="Profit" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20">
        <SectionHeader 
          icon={AlertCircle} 
          iconBg="bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400" 
          title="Key Insights" 
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-gray-900 dark:text-gray-50">Profitability</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {netProfit >= 0 ? `Profitable with ${profitMargin}% margin` : `Loss of ${Math.abs(netProfit).toLocaleString()}`}
            </p>
          </div>
          <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-gray-900 dark:text-gray-50">Cash Flow</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {payments.length} payments totaling ${totalIncome.toLocaleString()}
            </p>
          </div>
          <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-teal-500" />
              <h3 className="font-bold text-gray-900 dark:text-gray-50">Occupancy</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {overallOccupancyRate}% occupancy across {floorsOccupancy.length} floors
            </p>
          </div>
        </div>
      </Card>

    </div>
  );
};

export default Report;