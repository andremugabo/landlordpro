// src/pages/AdminDashboard.jsx
import React from 'react';
import { Card } from '../../components';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Home, Users, DollarSign, CalendarCheck, TrendingUp, TrendingDown } from 'lucide-react';

const incomeData = [
  { month: 'Jan', income: 5000, expense: 3000 },
  { month: 'Feb', income: 7000, expense: 4000 },
  { month: 'Mar', income: 6000, expense: 3500 },
  { month: 'Apr', income: 8000, expense: 4500 },
];

const occupancyData = [
  { name: 'Occupied', value: 70 },
  { name: 'Available', value: 30 },
];

const COLORS = ['#14B8A6', '#F87171'];

// Metric Cards (Total Properties, Tenants, Payments, Balances)
const metrics = [
  { title: 'Total Properties', value: '50', icon: <Home className="w-6 h-6 text-teal-500" />, bg: 'bg-teal-50 dark:bg-teal-900/20' },
  { title: 'Total Tenants', value: '200', icon: <Users className="w-6 h-6 text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { title: 'Upcoming Payments', value: '12', icon: <CalendarCheck className="w-6 h-6 text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { title: 'Outstanding Balances', value: '$5,000', icon: <DollarSign className="w-6 h-6 text-rose-500" />, bg: 'bg-rose-50 dark:bg-rose-900/20' },
];

// Summary Cards for Charts Section
const summary = [
  {
    title: 'Monthly Income',
    value: '$7,500',
    icon: <TrendingUp className="w-5 h-5 text-teal-500" />,
    bg: 'bg-teal-50 dark:bg-teal-900/20',
  },
  {
    title: 'Monthly Expenses',
    value: '$4,250',
    icon: <TrendingDown className="w-5 h-5 text-rose-500" />,
    bg: 'bg-rose-50 dark:bg-rose-900/20',
  },
  {
    title: 'Occupancy Rate',
    value: '70%',
    icon: <Users className="w-5 h-5 text-blue-500" />,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
];

const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h1>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <Card key={i} className={`flex items-center justify-between p-5 rounded-xl shadow hover:shadow-lg transition ${m.bg}`}>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{m.title}</p>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{m.value}</h2>
            </div>
            {m.icon}
          </Card>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {summary.map((s, i) => (
          <Card key={i} className={`flex items-center justify-between p-4 rounded-xl shadow hover:shadow-md transition ${s.bg}`}>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.title}</p>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{s.value}</h3>
            </div>
            {s.icon}
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <Card className="p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Income vs Expenses</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={incomeData}>
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#14B8A6" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#F87171" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Occupancy Rate */}
        <Card className="p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Occupancy Rate</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={occupancyData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {occupancyData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Tenants Table */}
      <Card className="p-5">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Recent Tenants</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Lease End</th>
                <th className="p-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'John Doe', unit: 'Apt 101', lease: '2025-12-31', balance: '$500', color: 'text-rose-500' },
                { name: 'Jane Smith', unit: 'Apt 102', lease: '2025-11-30', balance: '$0', color: 'text-teal-500' },
              ].map((tenant, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="p-3 border-b">{tenant.name}</td>
                  <td className="p-3 border-b">{tenant.unit}</td>
                  <td className="p-3 border-b">{tenant.lease}</td>
                  <td className={`p-3 border-b font-semibold ${tenant.color}`}>{tenant.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
