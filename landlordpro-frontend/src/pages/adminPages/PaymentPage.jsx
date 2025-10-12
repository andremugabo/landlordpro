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
import { FiTrash, FiSearch, FiPlus, FiRotateCcw } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const PaymentPage = () => {
  const [payments, setPayments] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [leases, setLeases] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [proofPreview, setProofPreview] = useState(null);
  const [editData, setEditData] = useState({
    amount: '',
    leaseId: '',
    paymentModeId: '',
    proof: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // ✅ Fetch all payments
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await getAllPayments();
      console.log(res)
      setPayments(res || []);
    } catch (err) {
      showError(err?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch leases and payment modes
  const fetchOptions = async () => {
    try {
      const leasesRes = await leaseService.getLeases();
      const modesRes = await getAllPaymentModes();

      const leasesData = Array.isArray(leasesRes?.data) ? leasesRes.data : leasesRes;
      const modesData = Array.isArray(modesRes?.data) ? modesRes.data : modesRes;

      setLeases(leasesData);
      setPaymentModes(modesData);
    } catch (err) {
      showError(err?.message || 'Failed to fetch options');
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchOptions();
  }, []);

  // ✅ Create payment
  const handleSubmit = async () => {
    const { amount, leaseId, paymentModeId, proof } = editData;
    console.log(editData)
    if (!amount || !leaseId || !paymentModeId)
      return showError('Amount, Lease, and Payment Mode are required.');

    try {
      await createPayment({ amount, leaseId, paymentModeId, proof });
      showSuccess('Payment created successfully!');
      fetchPayments();
      setModalOpen(false);
      setEditData({ amount: '', leaseId: '', paymentModeId: '', proof: null });
      setProofPreview(null);
    } catch (err) {
      showError(err?.message || 'Failed to create payment');
    }
  };

  // ✅ Delete / Restore
  const handleDelete = async (payment) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    try {
      await softDeletePayment(payment.id);
      showInfo('Payment deleted.');
      fetchPayments();
    } catch (err) {
      showError(err?.message || 'Failed to delete payment');
    }
  };

  const handleRestore = async (payment) => {
    try {
      await restorePayment(payment.id);
      showSuccess('Payment restored.');
      fetchPayments();
    } catch (err) {
      showError(err?.message || 'Failed to restore payment');
    }
  };

  // ✅ Proof handling
  const handleViewProof = (url) => {
    setProofUrl(url);
    setProofModalOpen(true);
  };

  const handleProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData({ ...editData, proof: file });
      setProofPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Filtered list
  const filteredPayments = useMemo(
    () =>
      payments.filter((p) => {
        const lease = leases.find((l) => l.id === p.leaseId);
        const leaseName = lease?.localForLease?.reference_code || lease?.name || '';
        return (
          p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leaseName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }),
    [payments, searchTerm, leases]
  );

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* ✅ Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-lg shadow-md text-white">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Payments</h1>
          <p className="text-sm opacity-90">View, add, or manage payments</p>
        </div>
        <Button
          className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-md text-sm font-medium shadow-sm transition w-full sm:w-auto justify-center"
          onClick={() => setModalOpen(true)}
        >
          <FiPlus /> Add Payment
        </Button>
      </div>

      {/* ✅ Search */}
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search by invoice or lease..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* ✅ Payments Table or Cards */}
      <div className="grid gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading payments...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No payments found</div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <Card className="bg-white rounded-xl shadow-md border border-gray-100">
                <table className="min-w-full text-sm text-gray-700">
                  <thead className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-gray-200 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="p-3 text-left font-semibold">Invoice</th>
                      <th className="p-3 text-left font-semibold">Amount</th>
                      <th className="p-3 text-left font-semibold">Lease</th>
                      <th className="p-3 text-left font-semibold">Payment Mode</th>
                      <th className="p-3 text-left font-semibold">Proof</th>
                      <th className="p-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p) => {
                      const lease = leases.find((l) => l.id === p.leaseId);
                      const leaseName =
                        lease?.leaseForPayment?.reference || lease?.leaseForPayment?.reference || 'N/A';
                      const modeName =
                        paymentModes.find((m) => m.id === p.paymentModeId)?.displayName || 'N/A';

                      return (
                        <tr key={p.id} className="hover:bg-blue-50 transition">
                          <td className="p-3 font-medium">{p.invoiceNumber}</td>
                          <td className="p-3 text-blue-600 font-semibold">{p.amount}</td>
                          <td className="p-3">{leaseName}</td>
                          <td className="p-3">{modeName}</td>
                          <td className="p-3">
                          {p.proofUrl ? (
                                  <div className="mt-2 flex flex-col gap-2">
                                    <img
                                      src={p.proofUrl}
                                      alt="proof"
                                      className="max-h-40 w-full object-contain rounded-md shadow cursor-pointer"
                                      onClick={() => handleViewProof(p.proofUrl)}
                                    />
                                    <label className="cursor-pointer text-blue-600 text-xs hover:underline">
                                      Update Proof
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleUpdateProof(p.id, e)}
                                      />
                                    </label>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}

                          </td>
                          <td className="p-3 flex justify-center gap-2">
                            {!p.deleted_at ? (
                              <Button
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                                onClick={() => handleDelete(p)}
                              >
                                <FiTrash /> Delete
                              </Button>
                            ) : (
                              <Button
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                                onClick={() => handleRestore(p)}
                              >
                                <FiRotateCcw /> Restore
                              </Button>
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
          <div className="md:hidden grid gap-3">
            {filteredPayments.map((p) => {
              const lease = leases.find((l) => l.id === p.leaseId);
              const leaseName =
                lease?.localForLease?.reference_code || lease?.localForLease?.name || 'N/A';
              const modeName =
                paymentModes.find((m) => m.id === p.paymentModeId)?.displayName || 'N/A';

              return (
                <Card
                  key={p.id}
                  className="p-4 rounded-xl shadow-md border border-gray-100 bg-white hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="font-semibold text-gray-800">{p.invoiceNumber}</h2>
                      <p className="text-xs text-gray-500">{leaseName}</p>
                    </div>
                    <div className="flex gap-1">
                      {!p.deleted_at ? (
                        <Button
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                          onClick={() => handleDelete(p)}
                        >
                          <FiTrash />
                        </Button>
                      ) : (
                        <Button
                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                          onClick={() => handleRestore(p)}
                        >
                          <FiRotateCcw />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span className="font-medium">Amount:</span>
                      <span className="text-blue-600 font-semibold">{p.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Lease:</span>
                      <span>{leaseName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Mode:</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">{modeName}</span>
                    </div>
                    {p.proofUrl && (
                      <img
                        src={p.proofUrl}
                        alt="proof"
                        className="mt-2 max-h-40 w-full object-contain rounded-md shadow cursor-pointer"
                        onClick={() => handleViewProof(p.proofUrl)}
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          </>
        )}
      </div>

      {/* ✅ Add Payment Modal */}
      {modalOpen && (
        <Modal title="Add New Payment" onClose={() => setModalOpen(false)} onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Amount"
              type="number"
              value={editData.amount}
              onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
            />

            <Select
              label="Lease"
              options={leases.map((l) => ({
                value: l.id,
                label: l.localForLease?.reference_code || l.id,
              }))}
              value={editData.leaseId} // just the string/number
              onChange={(e) => setEditData({ ...editData, leaseId: e.target.value })}
            />

            <Select
              label="Payment Mode"
              options={paymentModes.map((pm) => ({
                value: pm.id,
                label: pm.displayName,
              }))}
              value={editData.paymentModeId}
              onChange={(e) => setEditData({ ...editData, paymentModeId: e.target.value })}
            />


            <Input label="Proof" type="file" onChange={handleProofChange} />
            {proofPreview && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Preview:</p>
                <img
                  src={proofPreview}
                  alt="preview"
                  className="max-h-40 rounded-md shadow border border-gray-200"
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ✅ Proof Modal */}
      {proofModalOpen && (
        <Modal title="Payment Proof" onClose={() => setProofModalOpen(false)}>
          <div className="text-center">
            <img
              src={proofUrl}
              alt="Payment Proof"
              className="max-h-[400px] mx-auto rounded-md shadow-md"
            />
            <div className="mt-2 text-sm text-gray-500 truncate">{proofUrl.split('/').pop()}</div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PaymentPage;
