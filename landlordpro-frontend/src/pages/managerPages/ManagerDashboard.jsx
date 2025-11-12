// src/pages/ManagerDashboard.jsx
import React, { useMemo } from 'react';
import { Card, Spinner, Button } from '../../components';
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
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Home,
  Users,
  CalendarCheck,
  RefreshCcw,
  Building2,
  CreditCard,
} from 'lucide-react';
import useManagerPortfolio from '../../hooks/useManagerPortfolio';

const COLORS = ['#14B8A6', '#F87171', '#FBBF24'];

const buildMonthlySeries = (items, getDate, getValue, months = 6) => {
  const now = new Date();
  const series = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    series.push({
      key,
      month: date.toLocaleString('default', { month: 'short' }),
      amount: 0,
      count: 0,
    });
  }

  items.forEach((item) => {
    const date = getDate(item);
    if (!date || Number.isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const entry = series.find((item) => item.key === key);
    if (entry) {
      entry.amount += Number(getValue(item)) || 0;
      entry.count += 1;
    }
  });

  return series.map(({ month, amount, count }) => ({
    month,
    payments: Number(amount.toFixed(2)),
    leases: count,
  }));
};

const ManagerDashboard = () => {
  const {
    properties,
    locals,
    leases,
    payments,
    loading,
    refresh,
  } = useManagerPortfolio();

  const propertyNameMap = useMemo(
    () =>
      new Map(properties.map((property) => [property.id, property.name || 'Unnamed Property'])),
    [properties]
  );

  const localMap = useMemo(
    () =>
      new Map(
        locals.map((local) => [
          local.id,
          {
            ...local,
            reference: local.reference_code || local.referenceCode || 'Unknown Unit',
          },
        ])
      ),
    [locals]
  );

  const totalProperties = properties.length;
  const totalUnits = locals.length;
  const occupiedUnits = locals.filter((local) => local.status === 'occupied').length;
  const availableUnits = locals.filter((local) => local.status === 'available').length;
  const maintenanceUnits = totalUnits - occupiedUnits - availableUnits;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const uniqueTenantCount = useMemo(() => {
    const tenantIds = new Set();
    leases.forEach((lease) => {
      if (lease?.tenant?.id) tenantIds.add(lease.tenant.id);
    });
    return tenantIds.size;
  }, [leases]);

  const upcomingPayments = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setDate(now.getDate() + 30);
    return payments.filter((payment) => {
      const end = new Date(payment.endDate || payment.end_date || payment.created_at);
      if (Number.isNaN(end.getTime())) return false;
      return end >= now && end <= nextMonth;
    }).length;
  }, [payments]);

  const paymentTrend = useMemo(
    () =>
      buildMonthlySeries(
        payments,
        (payment) => new Date(payment.endDate || payment.end_date || payment.created_at),
        (payment) => payment.amount
      ),
    [payments]
  );

  const occupancyData = useMemo(
    () => [
      { name: 'Occupied', value: occupiedUnits },
      { name: 'Available', value: availableUnits },
      { name: 'Maintenance', value: maintenanceUnits },
    ],
    [occupiedUnits, availableUnits, maintenanceUnits]
  );

  const recentTenants = useMemo(() => {
    const sorted = [...leases].sort((a, b) => {
      const aDate = new Date(a.updatedAt || a.startDate || a.created_at || 0).getTime();
      const bDate = new Date(b.updatedAt || b.startDate || b.created_at || 0).getTime();
      return bDate - aDate;
    });

    return sorted.slice(0, 8).map((lease) => {
      const localInfo = lease.localId ? localMap.get(lease.localId) : null;
      const propertyName = lease.propertyId ? propertyNameMap.get(lease.propertyId) : '—';
      return {
        id: lease.id,
        tenant: lease.tenant?.name || 'Unknown tenant',
        unit: localInfo?.reference || lease.local?.referenceCode || '—',
        property: propertyName || '—',
        endDate: lease.endDate || lease.end_date,
        status: lease.status || 'active',
      };
    });
  }, [leases, localMap, propertyNameMap]);

  const totalPaymentAmount = payments.reduce(
    (sum, payment) => sum + (Number(payment.amount) || 0),
    0
  );

  const metricCards = [
    {
      title: 'Properties',
      value: totalProperties,
      subtitle: `${totalUnits} managed units`,
      icon: <Home className="w-6 h-6 text-teal-500" />,
      bg: 'bg-teal-50',
    },
    {
      title: 'Tenants',
      value: uniqueTenantCount,
      subtitle: `${leases.length} active leases`,
      icon: <Users className="w-6 h-6 text-blue-500" />,
      bg: 'bg-blue-50',
    },
    {
      title: 'Upcoming Payments',
      value: upcomingPayments,
      subtitle: `FRW ${totalPaymentAmount.toLocaleString()} total inflow`,
      icon: <CalendarCheck className="w-6 h-6 text-amber-500" />,
      bg: 'bg-amber-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Manager Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time overview of your assigned portfolio
          </p>
        </div>
        <Button
          className="self-start flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-md shadow-sm transition"
          onClick={refresh}
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((metric) => (
          <Card key={metric.title} className={`p-6 rounded-xl shadow-sm border ${metric.bg}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{metric.title}</p>
                <h2 className="text-2xl font-bold text-gray-800 mt-1">{metric.value}</h2>
                <p className="text-xs text-gray-500 mt-2">{metric.subtitle}</p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm border">{metric.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-500" />
            Monthly Income & Lease Activity
          </h2>
          {paymentTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={paymentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis yAxisId="left" stroke="#9CA3AF" />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="payments"
                  name="Payments (FRW)"
                  stroke="#14B8A6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="leases"
                  name="New Leases"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-gray-500">No payment activity yet.</div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Occupancy Snapshot
          </h2>
          {totalUnits > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={occupancyData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-3xl font-bold text-gray-900">{occupancyRate}%</p>
                <p className="text-sm text-gray-500">
                  {occupiedUnits} occupied • {availableUnits} available • {maintenanceUnits}{' '}
                  maintenance
                </p>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-gray-500">No unit information available.</div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-500" />
          Recent Tenants
        </h2>
        {recentTenants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="p-3 text-left">Tenant</th>
                  <th className="p-3 text-left">Unit</th>
                  <th className="p-3 text-left">Property</th>
                  <th className="p-3 text-left">Lease Ends</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b last:border-none">
                    <td className="p-3 font-medium text-gray-800">{tenant.tenant}</td>
                    <td className="p-3">{tenant.unit}</td>
                    <td className="p-3">{tenant.property}</td>
                    <td className="p-3">
                      {tenant.endDate
                        ? new Date(tenant.endDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          tenant.status === 'active'
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-yellow-100 text-yellow-700'
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
          <div className="py-12 text-center text-gray-500">No tenant activity to display.</div>
        )}
      </Card>
    </div>
  );
};

export default ManagerDashboard;
