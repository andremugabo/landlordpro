import React, { useEffect, useState, useMemo } from 'react';
import {
  getAllPayments,
  createPayment,
  softDeletePayment,
  restorePayment,
} from '../../services/paymentService';
import { getAllPaymentModes } from '../../services/paymentModeService';
import leaseService from '../../services/leaseService'; 
import { Button, Modal, Input, Card, Select } from '../../components';
import { FiTrash, FiSearch, FiPlus } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const PaymentPage = () => {
  const [payments, setPayments] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [leases, setLeases] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [editData, setEditData] = useState({ amount: '', leaseId: '', paymentModeId: '', proof: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await getAllPayments();
      setPayments(res || []);
    } catch (err) {
      showError(err?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const modes = await getAllPaymentModes();
      const leasesRes = await leaseService.getLeases();
  
      // Ensure both are arrays
      const leasesArray = Array.isArray(leasesRes) ? leasesRes : leasesRes?.data || [];
      const modesArray = Array.isArray(modes) ? modes : modes?.data || [];
  
      setPaymentModes(modesArray);
      setLeases(leasesArray);
    } catch (err) {
      showError(err?.message || 'Failed to fetch options');
    }
  };
  

  useEffect(() => {
    fetchPayments();
    fetchOptions();
  }, []);

  const handleSubmit = async () => {
    const { amount, leaseId, paymentModeId, proof } = editData;
    if (!amount || !leaseId || !paymentModeId) return showError('Amount, Lease, and Payment Mode are required.');

    try {
      await createPayment({ amount, leaseId, paymentModeId, proof });
      showSuccess('Payment created successfully!');
      fetchPayments();
      setModalOpen(false);
      setEditData({ amount: '', leaseId: '', paymentModeId: '', proof: null });
    } catch (err) {
      showError(err?.message || 'Failed to create payment');
    }
  };

  const handleDelete = async (payment) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    try {
      await softDeletePayment(payment.id);
      showInfo('Payment deleted successfully.');
      fetchPayments();
    } catch (err) { showError(err?.message || 'Failed to delete payment'); }
  };

  const handleRestore = async (payment) => {
    try {
      await restorePayment(payment.id);
      showSuccess('Payment restored successfully.');
      fetchPayments();
    } catch (err) { showError(err?.message || 'Failed to restore payment'); }
  };

  const handleViewProof = (url) => {
    setProofUrl(url);
    setProofModalOpen(true);
  };

  const filteredPayments = useMemo(() => 
    payments.filter(p => {
      const leaseName = Array.isArray(leases)
        ? leases.find(l => l.id === p.leaseId)?.name?.toLowerCase()
        : undefined;
  
      return (
        p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leaseName?.includes(searchTerm.toLowerCase())
      );
    }), [payments, searchTerm, leases]
  );
  

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Payments</h1>
          <p className="text-sm text-gray-500">View, add, or manage payments</p>
        </div>
        <Button
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm transition w-full sm:w-auto justify-center"
          onClick={() => setModalOpen(true)}
        >
          <FiPlus className="text-base" /> Add Payment
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search by invoice or lease..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg"
        />
      </div>

      {/* Payments */}
      <div className="grid gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading payments...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No payments found</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
                <table className="min-w-full text-sm text-gray-700">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="p-3 font-semibold text-left">Invoice</th>
                      <th className="p-3 font-semibold text-left">Amount</th>
                      <th className="p-3 font-semibold text-left">Lease</th>
                      <th className="p-3 font-semibold text-left">Payment Mode</th>
                      <th className="p-3 font-semibold text-left">Proof</th>
                      <th className="p-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(payment => {
                      const lease = leases.find(l => l.id === payment.leaseId);
                      const leaseName = lease?.name || payment.leaseId;
                      const leaseAmount = lease?.leaseAmount ? `(${lease.leaseAmount})` : '';
                      const modeName = paymentModes.find(m => m.id === payment.paymentModeId)?.displayName || payment.paymentModeId;
                      return (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3">{payment.invoiceNumber}</td>
                          <td className="p-3">{payment.amount}</td>
                          <td className="p-3">{leaseName} {leaseAmount}</td>
                          <td className="p-3">{modeName}</td>
                          <td className="p-3">
                            {payment.proofUrl ? (
                              <img
                                src={payment.proofUrl}
                                alt="Proof"
                                className="max-h-20 rounded-md shadow-sm cursor-pointer"
                                onClick={() => handleViewProof(payment.proofUrl)}
                              />
                            ) : 'N/A'}
                          </td>
                          <td className="p-3 flex justify-center gap-2">
                            <Button
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                              onClick={() => handleDelete(payment)}
                            >Delete</Button>
                            {payment.deleted_at && (
                              <Button
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                                onClick={() => handleRestore(payment)}
                              >Restore</Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-4">
              {filteredPayments.map(payment => {
                const lease = leases.find(l => l.id === payment.leaseId);
                const leaseName = lease?.name || payment.leaseId;
                const leaseAmount = lease?.leaseAmount ? `(${lease.leaseAmount})` : '';
                const modeName = paymentModes.find(m => m.id === payment.paymentModeId)?.displayName || payment.paymentModeId;
                return (
                  <Card key={payment.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold">{payment.invoiceNumber}</div>
                      <div className="text-sm">{payment.amount}</div>
                    </div>
                    <div className="text-sm">Lease: {leaseName} {leaseAmount}</div>
                    <div className="text-sm">Mode: {modeName}</div>
                    <div className="text-sm">
                      Proof: {payment.proofUrl ? (
                        <img
                          src={payment.proofUrl}
                          alt="Proof"
                          className="max-h-20 rounded-md shadow-sm cursor-pointer"
                          onClick={() => handleViewProof(payment.proofUrl)}
                        />
                      ) : 'N/A'}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex-1" onClick={() => handleDelete(payment)}>Delete</Button>
                      {payment.deleted_at && (
                        <Button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs flex-1" onClick={() => handleRestore(payment)}>Restore</Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal for Add Payment */}
      {modalOpen && (
        <Modal title="Add New Payment" onClose={() => setModalOpen(false)} onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input label="Amount" type="number" value={editData.amount} onChange={(e) => setEditData({ ...editData, amount: e.target.value })} />
            <Select
              label="Lease"
              value={leases.find(l => l.id === editData.leaseId)}
              options={leases.map(l => ({ value: l.id, label: `${l.name} (${l.leaseAmount})` }))}
              onChange={(selected) => setEditData({ ...editData, leaseId: selected.value })}
            />
            <Select
              label="Payment Mode"
              value={paymentModes.find(pm => pm.id === editData.paymentModeId)}
              options={paymentModes.map(pm => ({ value: pm.id, label: pm.displayName }))}
              onChange={(selected) => setEditData({ ...editData, paymentModeId: selected.value })}
            />
            <Input label="Proof" type="file" onChange={(e) => setEditData({ ...editData, proof: e.target.files[0] })} />
          </div>
        </Modal>
      )}

      {/* Modal for Proof Preview */}
      {proofModalOpen && (
        <Modal title="Payment Proof" onClose={() => setProofModalOpen(false)}>
          <div className="text-center">
            <img src={proofUrl} alt="Payment Proof" className="max-h-[400px] mx-auto rounded-md shadow-md" />
            <div className="mt-2 text-sm text-gray-500">{proofUrl.split('/').pop()}</div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default PaymentPage;
