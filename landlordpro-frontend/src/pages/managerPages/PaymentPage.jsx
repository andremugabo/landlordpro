import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Select, Modal, Spinner } from '../../components';
import { FiSearch, FiEye, FiPlus, FiUpload } from 'react-icons/fi';
import { CreditCard, CalendarDays, Home } from 'lucide-react';
import useManagerPortfolio from '../../hooks/useManagerPortfolio';
import { getPaymentProofUrl, createPayment } from '../../services/paymentService';
import { getAllPaymentModes } from '../../services/paymentModeService';
import { showError, showSuccess } from '../../utils/toastHelper';

const ManagerPaymentPage = () => {
  const { payments, leases, properties, propertyOptions, loading, refresh } = useManagerPortfolio();

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [proofModal, setProofModal] = useState({ open: false, url: '', name: '' });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [paymentModes, setPaymentModes] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newPayment, setNewPayment] = useState({
    lease: null,
    paymentMode: null,
    amount: '',
    startDate: '',
    endDate: '',
    proof: null,
  });

  useEffect(() => {
    const loadPaymentModes = async () => {
      try {
        const response = await getAllPaymentModes(1, 100);
        const modes = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        setPaymentModes(
          modes.map((mode) => ({
            value: mode.id,
            label: mode.displayName || mode.code,
            requiresProof: mode.requiresProof,
          }))
        );
      } catch (error) {
        showError(error?.message || 'Failed to load payment modes');
      }
    };

    loadPaymentModes();
  }, []);

  const propertyNameMap = useMemo(
    () => new Map(properties.map((property) => [property.id, property.name || 'Unnamed Property'])),
    [properties]
  );

  const leaseMap = useMemo(
    () =>
      new Map(
        leases.map((lease) => [
          lease.id,
          {
            reference:
              lease.reference ||
              lease.referenceCode ||
              lease.local?.referenceCode ||
              lease.local?.reference_code ||
              `Lease ${lease.id}`,
            tenant: lease.tenant?.name || 'Unknown tenant',
            propertyId: lease.propertyId,
          },
        ])
      ),
    [leases]
  );

  const filteredPayments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return payments.filter((payment) => {
      const paymentPropertyId = payment.propertyId ? String(payment.propertyId) : '';
      if (selectedPropertyId && paymentPropertyId !== String(selectedPropertyId)) return false;

      if (!search) return true;

      const leaseInfo = leaseMap.get(payment.leaseId);
      const invoice = payment.invoiceNumber?.toLowerCase() || '';
      const tenantName = leaseInfo?.tenant?.toLowerCase() || '';
      const leaseRef = leaseInfo?.reference?.toLowerCase() || '';

      return invoice.includes(search) || tenantName.includes(search) || leaseRef.includes(search);
    });
  }, [payments, leaseMap, selectedPropertyId, searchTerm]);

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const upcomingPayments = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setDate(now.getDate() + 30);
    return filteredPayments.filter((payment) => {
      const end = new Date(payment.endDate || payment.end_date || payment.created_at);
      if (Number.isNaN(end.getTime())) return false;
      return end >= now && end <= nextMonth;
    }).length;
  }, [filteredPayments]);

  const summaryCards = [
    {
      title: 'Visible Payments',
      value: filteredPayments.length,
      subtitle: `${payments.length} total in your portfolio`,
      icon: <CreditCard className="w-6 h-6 text-teal-500" />,
      bg: 'bg-teal-50',
    },
    {
      title: 'Upcoming (30 days)',
      value: upcomingPayments,
      subtitle: 'Payments ending within the next month',
      icon: <CalendarDays className="w-6 h-6 text-amber-500" />,
      bg: 'bg-amber-50',
    },
    {
      title: 'Total Amount',
      value: `FRW ${totalAmount.toLocaleString()}`,
      subtitle: 'Sum of filtered payments',
      icon: <Home className="w-6 h-6 text-blue-500" />,
      bg: 'bg-blue-50',
    },
  ];

  const eligibleLeases = useMemo(
    () =>
      leases.filter((lease) => {
        if (!lease?.tenant?.id) return false;
        if (!selectedPropertyId) return true;
        return String(lease.propertyId) === String(selectedPropertyId);
      }),
    [leases, selectedPropertyId]
  );

  const leaseOptions = useMemo(
    () =>
      eligibleLeases.map((lease) => {
        const info = leaseMap.get(lease.id);
        return {
          value: lease.id,
          label: `${info?.reference || 'Lease'} • ${info?.tenant || 'Tenant'} (${propertyNameMap.get(
            lease.propertyId
          ) || '—'})`,
          propertyId: lease.propertyId,
        };
      }),
    [eligibleLeases, leaseMap, propertyNameMap]
  );

  const handleOpenCreateModal = () => {
    setNewPayment({ lease: null, paymentMode: null, amount: '', startDate: '', endDate: '', proof: null });
    setCreateModalOpen(true);
  };

  const handleCreatePayment = async () => {
    if (creating) return;

    if (!newPayment.lease) {
      showError('Please choose a lease');
      return;
    }

    if (!newPayment.paymentMode) {
      showError('Please choose a payment mode');
      return;
    }

    if (!newPayment.amount || Number(newPayment.amount) <= 0) {
      showError('Enter a valid amount');
      return;
    }

    if (!newPayment.startDate || !newPayment.endDate) {
      showError('Select the covered period');
      return;
    }

    if (new Date(newPayment.startDate) > new Date(newPayment.endDate)) {
      showError('Start date cannot be after end date');
      return;
    }

    const requiresProof = newPayment.paymentMode?.requiresProof;
    if (requiresProof && !newPayment.proof) {
      showError('This payment mode requires an attachment');
      return;
    }

    try {
      setCreating(true);
      await createPayment({
        leaseId: newPayment.lease.value,
        paymentModeId: newPayment.paymentMode.value,
        amount: newPayment.amount,
        startDate: newPayment.startDate,
        endDate: newPayment.endDate,
        proof: newPayment.proof || undefined,
        propertyId: newPayment.lease.propertyId,
      });
      showSuccess('Payment recorded successfully');
      setCreateModalOpen(false);
      setNewPayment({ lease: null, paymentMode: null, amount: '', startDate: '', endDate: '', proof: null });
      await refresh();
    } catch (error) {
      showError(error?.message || 'Failed to create payment');
    } finally {
      setCreating(false);
    }
  };

  const showProofModal = (payment) => {
    if (!payment?.proofUrl && !payment?.proofFilename) return;

    const url = payment.proofUrl?.startsWith('http')
      ? payment.proofUrl
      : payment.proofUrl?.startsWith('/uploads')
      ? `${import.meta.env.VITE_API_BASE_URL}${payment.proofUrl}`
      : payment.proofFilename
      ? getPaymentProofUrl(payment.id, payment.proofFilename)
      : '';

    if (!url) return;

    setProofModal({
      open: true,
      url,
      name: payment.proofFilename || payment.proofUrl?.split('/').pop() || 'proof',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Payments Overview</h1>
          <p className="text-sm text-white">Track payments tied to your managed leases.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 w-full">
  {/* Property Filter */}
  <div className="flex-1 min-w-[220px]">
    <Select
      label="Filter by Property"
      value={propertyOptions.find(option => option.value === selectedPropertyId) ?? null}
      options={[{ value: '', label: 'All Properties' }, ...propertyOptions]}
      isSearchable
      onChange={(option) => setSelectedPropertyId(option?.value || '')}
      classNamePrefix="react-select"
      styles={{
        control: (provided) => ({
          ...provided,
          borderRadius: '0.5rem',
          borderColor: '#cbd5e1', // Tailwind gray-300
          minHeight: '2.75rem',
        }),
      }}
    />
  </div>

  {/* Record Payment Button */}
  <Button
    onClick={handleOpenCreateModal}
    disabled={!leases.length}
    className={`w-full sm:w-auto flex items-center gap-2 justify-center px-5 py-2 rounded-lg text-white shadow-md transition-colors duration-200
      ${leases.length ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-300 cursor-not-allowed'}`}
  >
    <FiPlus className="text-lg" />
    Record Payment
  </Button>
</div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className={`p-5 border rounded-xl shadow-sm ${card.bg}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{card.value}</h2>
                <p className="text-xs text-gray-500 mt-2">{card.subtitle}</p>
              </div>
              <div className="bg-white border rounded-lg p-3 shadow-sm">{card.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 border rounded-xl shadow-sm">
        <div className="relative w-full">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search by invoice, tenant, or lease reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full border-gray-300 rounded-lg"
          />
        </div>
      </Card>

      <Card className="overflow-hidden border rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3 text-left">Invoice</th>
                <th className="p-3 text-left">Tenant</th>
                <th className="p-3 text-left">Property</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Period</th>
                <th className="p-3 text-left">Proof</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No payments match the current filters.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const leaseInfo = leaseMap.get(payment.leaseId);
                  const propertyName = payment.propertyId ? propertyNameMap.get(payment.propertyId) : '—';
                  const periodStart = payment.startDate || payment.start_date;
                  const periodEnd = payment.endDate || payment.end_date;

                  return (
                    <tr key={payment.id} className="border-b last:border-none hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{payment.invoiceNumber || '—'}</td>
                      <td className="p-3">
                        <span className="block font-medium text-gray-900">
                          {leaseInfo?.tenant || 'Unknown tenant'}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {leaseInfo?.reference || '—'}
                        </span>
                      </td>
                      <td className="p-3">{propertyName || '—'}</td>
                      <td className="p-3 text-teal-600 font-semibold">
                        FRW {Number(payment.amount).toLocaleString()}
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {periodStart ? new Date(periodStart).toLocaleDateString() : '—'} –{' '}
                        {periodEnd ? new Date(periodEnd).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3">
                        {payment.proofUrl || payment.proofFilename ? (
                          <Button
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs"
                            onClick={() => showProofModal(payment)}
                          >
                            <FiEye /> View
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">No proof</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {proofModal.open && (
        <Modal
          title={proofModal.name}
          onClose={() => setProofModal({ open: false, url: '', name: '' })}
          hideSubmit
        >
          <div className="text-center">
            <img
              src={proofModal.url}
              alt="Payment proof"
              className="max-h-[480px] mx-auto rounded-lg shadow"
            />
            <p className="text-xs text-gray-500 mt-2 break-all">{proofModal.url}</p>
          </div>
        </Modal>
      )}

      {createModalOpen && (
        <Modal
          title="Record Payment"
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreatePayment}
          submitDisabled={creating}
          submitText={creating ? 'Saving...' : 'Save Payment'}
        >
          <div className="space-y-4">
            <Select
              label="Lease"
              placeholder="Select lease"
              value={newPayment.lease}
              options={leaseOptions}
              onChange={(option) => setNewPayment((prev) => ({ ...prev, lease: option }))}
              isDisabled={!leaseOptions.length}
              required
            />

            <Select
              label="Payment Mode"
              placeholder="Select payment mode"
              value={newPayment.paymentMode}
              options={paymentModes}
              onChange={(option) => setNewPayment((prev) => ({ ...prev, paymentMode: option }))}
              isDisabled={!paymentModes.length}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Amount (FRW)"
                type="number"
                min="0"
                value={newPayment.amount}
                onChange={(e) => setNewPayment((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Proof of payment</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setNewPayment((prev) => ({ ...prev, proof: e.target.files?.[0] || null }))}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors duration-200 border-gray-300 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  {newPayment.paymentMode?.requiresProof ? 'Attachment required for this mode.' : 'Optional attachment (PDF or image).'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Period start"
                type="date"
                value={newPayment.startDate}
                onChange={(e) => setNewPayment((prev) => ({ ...prev, startDate: e.target.value }))}
                required
              />
              <Input
                label="Period end"
                type="date"
                value={newPayment.endDate}
                onChange={(e) => setNewPayment((prev) => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManagerPaymentPage;

