// src/pages/ManagerDashboard.jsx
import React from 'react';
import { Card } from '../../components/';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Legend
} from 'recharts';
import { Home, Users, CalendarCheck } from 'lucide-react';

// Data
const occupancyData = [
  { name: 'Occupied', value: 75 },
  { name: 'Available', value: 25 },
];

const COLORS = ['#14B8A6', '#F87171'];

const metrics = [
  {
    title: 'Total Properties',
    value: '12',
    icon: <Home className="w-6 h-6 text-teal-500" />,
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    trend: [10, 11, 12, 12, 12], // example trend
    color: '#14B8A6',
  },
  {
    title: 'Total Tenants',
    value: '45',
    icon: <Users className="w-6 h-6 text-blue-500" />,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    trend: [40, 42, 43, 45, 45],
    color: '#3B82F6',
  },
  {
    title: 'Upcoming Payments',
    value: '5',
    icon: <CalendarCheck className="w-6 h-6 text-amber-500" />,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    trend: [3, 4, 5, 5, 5],
    color: '#F59E0B',
  },
];

const paymentTrend = [
  { month: 'Jan', occupied: 70, payments: 4 },
  { month: 'Feb', occupied: 72, payments: 6 },
  { month: 'Mar', occupied: 74, payments: 5 },
  { month: 'Apr', occupied: 75, payments: 7 },
];

const tenants = [
  { name: 'Alice Brown', unit: 'Unit 201', lease: '2025-10-31', balance: 200 },
  { name: 'Bob Green', unit: 'Unit 202', lease: '2025-11-15', balance: 0 },
  { name: 'Charlie Black', unit: 'Unit 203', lease: '2025-12-10', balance: 350 },
];

const ManagerDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
        Manager Dashboard
      </h1>

      {/* Metric Cards with Trend Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((m, i) => (
          <Card
            key={i}
            className={`flex flex-col justify-between p-5 rounded-xl shadow hover:shadow-lg transition ${m.bg}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{m.title}</p>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{m.value}</h2>
              </div>
              {m.icon}
            </div>
            <div className="mt-3 w-full h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={m.trend.map((v, idx) => ({ idx, value: v }))}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={m.color}
                    strokeWidth={2}
                    dot={false}
                  />
                  <XAxis dataKey="idx" hide />
                  <YAxis hide />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Pie Chart */}
        <Card className="p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Occupancy Rate
          </h2>
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

        {/* Combined Occupancy vs Payments */}
        <Card className="p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Occupancy vs Payments
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={paymentTrend}>
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis yAxisId="left" stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="occupied"
                stroke="#14B8A6"
                strokeWidth={2}
                name="Occupied Units"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="payments"
                stroke="#F87171"
                strokeWidth={2}
                name="Payments"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Tenants Table */}
      <Card className="p-5">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Recent Tenants
        </h2>
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
              {tenants.map((tenant, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="p-3 border-b">{tenant.name}</td>
                  <td className="p-3 border-b">{tenant.unit}</td>
                  <td className="p-3 border-b">{tenant.lease}</td>
                  <td
                    className={`p-3 border-b font-semibold ${
                      tenant.balance === 0 ? 'text-teal-500' : 'text-rose-500'
                    }`}
                  >
                    ${tenant.balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ManagerDashboard;
