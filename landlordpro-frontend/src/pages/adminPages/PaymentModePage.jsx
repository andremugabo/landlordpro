import React, { useEffect, useState, useMemo } from 'react';
import {
  getAllPaymentModes,
  createPaymentMode,
  updatePaymentMode,
  deletePaymentMode,
  restorePaymentMode
} from '../../services/paymentModeService';
import { Button, Modal, Input, Card, Select } from '../../components';
import { FiEdit, FiPlus, FiTrash, FiSearch, FiRefreshCcw } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const PaymentModePage = () => {
  const [paymentModes, setPaymentModes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [editData, setEditData] = useState({ code: '', displayName: '', requiresProof: false, description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPaymentModes = async (pageNumber = 1, term = '') => {
    try {
      setLoading(true);
      const res = await getAllPaymentModes(pageNumber, 10, term);
      const modes = Array.isArray(res) ? res : res.data || [];
      const total = modes.length;
      const limit = 10;

      setPaymentModes(modes);
      setTotalPages(Math.ceil(total / limit));
      setPage(pageNumber);
    } catch (err) {
      showError(err?.message || 'Failed to fetch payment modes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPaymentModes(page, searchTerm); }, [page, searchTerm]);
  useEffect(() => { setPage(1); }, [searchTerm]);

  const handleEditClick = (mode) => {
    setSelectedMode(mode);
    setEditData({
      code: mode.code,
      displayName: mode.displayName,
      requiresProof: mode.requiresProof,
      description: mode.description || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const { code, displayName, requiresProof, description } = editData;
    if (!code?.trim() || !displayName?.trim()) { showError('Code and Display Name are required.'); return; }

    try {
      if (selectedMode) {
        await updatePaymentMode(selectedMode.id, { code, displayName, requiresProof, description });
        showSuccess('Payment mode updated successfully!');
      } else {
        await createPaymentMode({ code, displayName, requiresProof, description });
        showSuccess('Payment mode added successfully!');
        setPage(1);
      }
      fetchPaymentModes(selectedMode ? page : 1, searchTerm);
      setModalOpen(false);
      setSelectedMode(null);
      setEditData({ code: '', displayName: '', requiresProof: false, description: '' });
    } catch (err) { showError(err?.message || 'Failed to save payment mode'); }
  };

  const handleDelete = async (mode) => {
    if (!window.confirm('Are you sure you want to delete this payment mode?')) return;
    try { await deletePaymentMode(mode.id); showInfo('Payment mode deleted successfully.'); fetchPaymentModes(page, searchTerm); }
    catch (err) { showError(err?.message || 'Failed to delete payment mode'); }
  };

  const handleRestore = async (mode) => {
    try { await restorePaymentMode(mode.id); showSuccess('Payment mode restored successfully.'); fetchPaymentModes(page, searchTerm); }
    catch (err) { showError(err?.message || 'Failed to restore payment mode'); }
  };

  const filteredModes = useMemo(() => paymentModes.filter(pm =>
    pm.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pm.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [paymentModes, searchTerm]);

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Payment Modes</h1>
          <p className="text-sm text-gray-500">View, add, or manage payment modes</p>
        </div>
        <Button
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm transition w-full sm:w-auto justify-center"
          onClick={() => { setSelectedMode(null); setEditData({ code: '', displayName: '', requiresProof: false, description: '' }); setModalOpen(true); }}
        >
          <FiPlus className="text-base" /><span>Add Payment Mode</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search by code or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg"
        />
      </div>

      {/* Payment Modes - Responsive */}
      <div className="grid gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading payment modes...</div>
        ) : filteredModes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No payment modes found</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
                <table className="min-w-full text-sm text-gray-700">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="p-3 font-semibold text-left">Code</th>
                      <th className="p-3 font-semibold text-left">Display Name</th>
                      <th className="p-3 font-semibold text-left">Requires Proof</th>
                      <th className="p-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModes.map(mode => (
                      <tr key={mode.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium text-gray-800">{mode.code}</td>
                        <td className="p-3">{mode.displayName}</td>
                        <td className="p-3">{mode.requiresProof ? 'Yes' : 'No'}</td>
                        <td className="p-3 flex justify-center gap-2">
                          <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1" onClick={() => handleEditClick(mode)}><FiEdit className="text-sm" /> Edit</Button>
                          {mode.deleted_at ? (
                            <Button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1" onClick={() => handleRestore(mode)}><FiRefreshCcw className="text-sm" /> Restore</Button>
                          ) : (
                            <Button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1" onClick={() => handleDelete(mode)}><FiTrash className="text-sm" /> Delete</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-4">
              {filteredModes.map(mode => (
                <Card key={mode.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-gray-800">{mode.displayName}</div>
                    <div className="text-sm text-gray-500">{mode.code}</div>
                  </div>
                  <div className="text-sm text-gray-600">Requires Proof: {mode.requiresProof ? 'Yes' : 'No'}</div>
                  <div className="text-sm text-gray-500">{mode.description}</div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex-1 flex items-center justify-center gap-1" onClick={() => handleEditClick(mode)}><FiEdit className="text-sm" /> Edit</Button>
                    {mode.deleted_at ? (
                      <Button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs flex-1 flex items-center justify-center gap-1" onClick={() => handleRestore(mode)}><FiRefreshCcw className="text-sm" /> Restore</Button>
                    ) : (
                      <Button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex-1 flex items-center justify-center gap-1" onClick={() => handleDelete(mode)}><FiTrash className="text-sm" /> Delete</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-600 rounded-lg shadow-sm">
        <div className="text-gray-500 mb-2 sm:mb-0">Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span></div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page <= 1} className={`px-3 py-1 rounded-md border text-xs font-medium transition ${page <= 1 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}>← Prev</button>
          <span className="px-2 text-gray-500 text-xs">{page}</span>
          <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page >= totalPages} className={`px-3 py-1 rounded-md border text-xs font-medium transition ${page >= totalPages ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}>Next →</button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal title={selectedMode ? 'Edit Payment Mode' : 'Add New Payment Mode'} onClose={() => setModalOpen(false)} onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input label="Code" value={editData.code} onChange={(e) => setEditData({ ...editData, code: e.target.value })} />
            <Input label="Display Name" value={editData.displayName} onChange={(e) => setEditData({ ...editData, displayName: e.target.value })} />
            <Select
              label="Requires Proof"
              value={editData.requiresProof ? { value: 'true', label: 'Yes' } : { value: 'false', label: 'No' }}
              options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
              onChange={(selected) => setEditData({ ...editData, requiresProof: selected.value === 'true' })}
            />
            <Input label="Description" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PaymentModePage;
