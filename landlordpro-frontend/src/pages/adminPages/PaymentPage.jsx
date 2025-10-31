import React, { useEffect, useState, useMemo } from 'react';
import {
  getAllPayments,
  createPayment,
  updatePayment,
  softDeletePayment,
  restorePayment,
  getPaymentProofUrl,
} from '../../services/paymentService';
import { getAllPaymentModes } from '../../services/paymentModeService';
import leaseService from '../../services/leaseService';
import { Button, Modal, Input, Card, Select } from '../../components';
import { FiTrash, FiSearch, FiPlus, FiRotateCcw, FiEdit, FiCalendar } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const PaymentPage = () => {
  const [payments, setPayments] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [leases, setLeases] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofPreview, setProofPreview] = useState(null);
  const [editData, setEditData] = useState({
    amount: '',
    leaseId: '',
    paymentModeId: '',
    startDate: '',
    endDate: '',
    proof: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  // ✅ Helper to get full proof URL
  const getFullProofUrl = (payment) => {
    if (!payment.proofUrl) return null;
    
    // If it's already a full URL, return as is
    if (payment.proofUrl.startsWith('http')) {
      return payment.proofUrl;
    }
    
    // If it's a relative path starting with /uploads
    if (payment.proofUrl.startsWith('/uploads')) {
      return `${import.meta.env.VITE_API_BASE_URL}${payment.proofUrl}`;
    }
    
    // If it's just a filename, construct the full URL
    if (payment.proofFilename) {
      return getPaymentProofUrl(payment.id, payment.proofFilename);
    }
    
    // Fallback - try to construct from proofUrl
    return `${import.meta.env.VITE_API_BASE_URL}${payment.proofUrl}`;
  };

  // ✅ Fetch all payments with pagination
  const fetchPayments = async (pageNumber = 1, term = '') => {
    try {
      setLoading(true);
      const res = await getAllPayments(term);
      console.log('Payments response:', res);
      
      const paymentsArray = Array.isArray(res) ? res : res?.data || [];
      setPayments(paymentsArray);
      
      // Calculate pagination
      setTotalPages(Math.ceil(paymentsArray.length / PAGE_SIZE));
      setPage(pageNumber);
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
    fetchPayments(page, searchTerm);
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchPayments(page, searchTerm);
  }, [page, searchTerm]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // ✅ Create or Update payment with proper FormData handling
  const handleSubmit = async () => {
    const { amount, leaseId, paymentModeId, startDate, endDate, proof } = editData;
    
    if (!amount || !leaseId || !paymentModeId || !startDate || !endDate) {
      return showError('Amount, Lease, Payment Mode, Start Date, and End Date are required.');
    }

    if (new Date(endDate) < new Date(startDate)) {
      return showError('End date cannot be before start date');
    }

    try {
      const payload = {
        amount: Number(amount),
        leaseId,
        paymentModeId,
        startDate,
        endDate,
        proof: proof || undefined,
      };

      console.log('Submitting payment:', {
        ...payload,
        hasProof: !!proof
      });

      if (selectedPayment) {
        await updatePayment(selectedPayment.id, payload);
        showSuccess('Payment updated successfully!');
      } else {
        await createPayment(payload);
        showSuccess('Payment created successfully!');
      }

      fetchPayments(page, searchTerm);
      setModalOpen(false);
      setSelectedPayment(null);
      setEditData({ 
        amount: '', 
        leaseId: '', 
        paymentModeId: '', 
        startDate: '', 
        endDate: '', 
        proof: null 
      });
      setProofPreview(null);
    } catch (err) {
      console.error('Payment operation error:', err);
      showError(err?.message || 'Failed to save payment');
    }
  };

  // ✅ Edit payment
  const handleEditClick = (payment) => {
    setSelectedPayment(payment);
    setEditData({
      amount: payment.amount || '',
      leaseId: payment.leaseId || '',
      paymentModeId: payment.paymentModeId || '',
      startDate: payment.startDate?.split('T')[0] || '',
      endDate: payment.endDate?.split('T')[0] || '',
      proof: null,
    });
    
    // Show existing proof as preview
    const fullProofUrl = getFullProofUrl(payment);
    if (fullProofUrl) {
      setProofPreview(fullProofUrl);
    }
    setModalOpen(true);
  };

  // ✅ Delete / Restore
  const handleDelete = async (payment) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    try {
      await softDeletePayment(payment.id);
      showInfo('Payment deleted.');
      fetchPayments(page, searchTerm);
    } catch (err) {
      showError(err?.message || 'Failed to delete payment');
    }
  };

  const handleRestore = async (payment) => {
    try {
      await restorePayment(payment.id);
      showSuccess('Payment restored.');
      fetchPayments(page, searchTerm);
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
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('File size must be less than 5MB');
        e.target.value = ''; // Reset input
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Only image files are allowed');
        e.target.value = ''; // Reset input
        return;
      }
      setEditData({ ...editData, proof: file });
      setProofPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Filtered and paginated list
  const filteredPayments = useMemo(
    () =>
      payments.filter((p) => {
        const lease = leases.find((l) => l.id === p.leaseId);
        const leaseName = lease?.reference || lease?.local?.reference_code || '';
        return (
          p.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leaseName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }),
    [payments, searchTerm, leases]
  );

  const paginatedPayments = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredPayments.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPayments, page]);

  // ✅ Prepare options for Select components
  const leasesOptions = leases.map((l) => ({
    value: l.id,
    label: l.reference || `Lease ${l.id}`,
  }));

  const paymentModesOptions = paymentModes.map((pm) => ({
    value: pm.id,
    label: pm.displayName,
  }));

  // ✅ Date range display helper
  const formatDateRange = (start, end) => {
    if (!start || !end) return 'N/A';
    const startDate = new Date(start).toLocaleDateString();
    const endDate = new Date(end).toLocaleDateString();
    return `${startDate} - ${endDate}`;
  };

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* ✅ Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-lg shadow-md text-white">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Payments Management</h1>
          <p className="text-sm opacity-90">View, add, edit, or manage payments with date ranges</p>
        </div>
        <Button
          className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-md text-sm font-medium shadow-sm transition w-full sm:w-auto justify-center"
          onClick={() => {
            setSelectedPayment(null);
            setEditData({ 
              amount: '', 
              leaseId: '', 
              paymentModeId: '', 
              startDate: '', 
              endDate: '', 
              proof: null 
            });
            setProofPreview(null);
            setModalOpen(true);
          }}
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
        ) : paginatedPayments.length === 0 ? (
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
                      <th className="p-3 text-left font-semibold">Period</th>
                      <th className="p-3 text-left font-semibold">Proof</th>
                      <th className="p-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((p) => {
                      const lease = leases.find((l) => l.id === p.leaseId);
                      const leaseName = lease?.reference || `Lease ${p.leaseId}`;
                      const modeName =
                        paymentModes.find((m) => m.id === p.paymentModeId)?.displayName || 'N/A';
                      const fullProofUrl = getFullProofUrl(p);

                      return (
                        <tr key={p.id} className="hover:bg-blue-50 transition">
                          <td className="p-3 font-medium">{p.invoiceNumber}</td>
                          <td className="p-3 text-blue-600 font-semibold">
                            {Number(p.amount).toLocaleString()} RWF
                          </td>
                          <td className="p-3">{leaseName}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                              {modeName}
                            </span>
                          </td>
                          <td className="p-3 text-xs">
                            <div className="flex items-center gap-1 text-gray-600">
                              <FiCalendar className="text-gray-400" />
                              {formatDateRange(p.startDate, p.endDate)}
                            </div>
                          </td>
                          <td className="p-3">
                            {fullProofUrl ? (
                              <img
                                src={fullProofUrl}
                                alt="proof"
                                className="h-12 w-12 object-cover rounded-md shadow cursor-pointer border border-gray-200 hover:scale-110 transition"
                                onClick={() => handleViewProof(fullProofUrl)}
                                onError={(e) => {
                                  console.error('Image load error:', fullProofUrl);
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'inline';
                                }}
                              />
                            ) : null}
                            <span 
                              className="text-gray-400 text-xs" 
                              style={{ display: fullProofUrl ? 'none' : 'inline' }}
                            >
                              No proof
                            </span>
                          </td>
                          <td className="p-3 flex justify-center gap-2">
                            {!p.deleted_at ? (
                              <>
                                <Button
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                                  onClick={() => handleEditClick(p)}
                                >
                                  <FiEdit /> Edit
                                </Button>
                                <Button
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                                  onClick={() => handleDelete(p)}
                                >
                                  <FiTrash /> Delete
                                </Button>
                              </>
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
              {paginatedPayments.map((p) => {
                const lease = leases.find((l) => l.id === p.leaseId);
                const leaseName = lease?.reference || `Lease ${p.leaseId}`;
                const modeName =
                  paymentModes.find((m) => m.id === p.paymentModeId)?.displayName || 'N/A';
                const fullProofUrl = getFullProofUrl(p);

                return (
                  <Card
                    key={p.id}
                    className="p-4 rounded-xl shadow-md border border-gray-100 bg-white hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h2 className="font-semibold text-gray-800">{p.invoiceNumber}</h2>
                        <p className="text-xs text-gray-500">{leaseName}</p>
                      </div>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                        {modeName}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span className="font-medium">Amount:</span>
                        <span className="text-blue-600 font-semibold">
                          {Number(p.amount).toLocaleString()} RWF
                        </span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="font-medium">Period:</span>
                        <span className="text-xs text-right text-gray-600">
                          {formatDateRange(p.startDate, p.endDate)}
                        </span>
                      </div>
                      {fullProofUrl && (
                        <div className="mt-2">
                          <img
                            src={fullProofUrl}
                            alt="proof"
                            className="max-h-40 w-full object-contain rounded-md shadow cursor-pointer border border-gray-200"
                            onClick={() => handleViewProof(fullProofUrl)}
                            onError={(e) => {
                              console.error('Image load error:', fullProofUrl);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      {!p.deleted_at ? (
                        <>
                          <Button
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md text-xs flex items-center justify-center gap-1"
                            onClick={() => handleEditClick(p)}
                          >
                            <FiEdit /> Edit
                          </Button>
                          <Button
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-xs flex items-center justify-center gap-1"
                            onClick={() => handleDelete(p)}
                          >
                            <FiTrash /> Delete
                          </Button>
                        </>
                      ) : (
                        <Button
                          className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-xs flex items-center justify-center gap-1"
                          onClick={() => handleRestore(p)}
                        >
                          <FiRotateCcw /> Restore
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-600 rounded-lg shadow-sm">
        <div className="text-gray-500 mb-2 sm:mb-0">
          Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
            disabled={page <= 1} 
            className={`px-3 py-1 rounded-md border text-xs font-medium transition ${
              page <= 1 
                ? 'text-gray-300 border-gray-200 cursor-not-allowed' 
                : 'text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            ← Prev
          </button>
          <span className="px-2 text-gray-500 text-xs">{page}</span>
          <button 
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} 
            disabled={page >= totalPages} 
            className={`px-3 py-1 rounded-md border text-xs font-medium transition ${
              page >= totalPages 
                ? 'text-gray-300 border-gray-200 cursor-not-allowed' 
                : 'text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            Next →
          </button>
        </div>
      </div>

      {/* ✅ Add/Edit Payment Modal */}
      {modalOpen && (
        <Modal 
          title={selectedPayment ? 'Edit Payment' : 'Add New Payment'}
          onClose={() => {
            setModalOpen(false);
            setProofPreview(null);
            setSelectedPayment(null);
          }} 
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              label="Amount (RWF)"
              type="number"
              value={editData.amount}
              onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
              placeholder="Enter amount"
            />

            <Select
              label="Lease"
              options={leasesOptions}
              value={leasesOptions.find(l => l.value === editData.leaseId) || null}
              onChange={(selected) => setEditData({ ...editData, leaseId: selected?.value || '' })}
              placeholder="Select Lease..."
              isSearchable
            />

            <Select
              label="Payment Mode"
              options={paymentModesOptions}
              value={paymentModesOptions.find(pm => pm.value === editData.paymentModeId) || null}
              onChange={(selected) => setEditData({ ...editData, paymentModeId: selected?.value || '' })}
              placeholder="Select Payment Mode..."
              isSearchable
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={editData.startDate}
                onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={editData.endDate}
                onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Proof {selectedPayment && '(Upload new to replace)'}
              </label>
              <Input 
                type="file" 
                accept="image/*"
                onChange={handleProofChange}
              />
              <p className="text-xs text-gray-500 mt-1">Max file size: 5MB. Supported: JPG, PNG, GIF</p>
            </div>

            {proofPreview && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">
                  {selectedPayment ? 'Current/New Proof:' : 'Preview:'}
                </p>
                <img
                  src={proofPreview}
                  alt="preview"
                  className="max-h-40 rounded-md shadow border border-gray-200"
                  onError={(e) => {
                    console.error('Preview load error:', proofPreview);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ✅ Proof Modal */}
      {proofModalOpen && (
        <Modal 
          title="Payment Proof" 
          onClose={() => setProofModalOpen(false)}
          hideSubmit
        >
          <div className="text-center">
            <img
              src={proofUrl}
              alt="Payment Proof"
              className="max-h-[500px] mx-auto rounded-md shadow-md"
              onError={(e) => {
                console.error('Full image load error:', proofUrl);
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Image not available</text></svg>';
              }}
            />
            <div className="mt-3 text-sm text-gray-500 break-all">{proofUrl.split('/').pop()}</div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PaymentPage;