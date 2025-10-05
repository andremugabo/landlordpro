import React, { useState, useEffect, useMemo } from 'react';
import leaseService from '../../services/leaseService';
import { getAllTenants } from '../../services/tenantService';
import { getAllLocals } from '../../services/localService';
import { Button, Input, Modal, Card } from '../../components';
import Select from 'react-select';
import { FiEdit, FiPlus, FiTrash, FiSearch, FiDownload } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const LeasePage = () => {
  const [leases, setLeases] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [locals, setLocals] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState(null);
  const [editData, setEditData] = useState({
    startDate: '',
    endDate: '',
    status: 'active',
    tenantId: '',
    localId: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- Fetch leases ---
  const fetchLeases = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const data = await leaseService.getLeases(pageNumber, 10);
      setLeases(data.data || []);
      setPage(data.page || 1);
      setTotalPages(Math.ceil((data.total || 1) / (data.limit || 10)));
    } catch (err) {
      showError(err?.message || 'Failed to fetch leases');
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch tenants and locals ---
  const fetchTenantsAndLocals = async () => {
    try {
      const tenantsData = await getAllTenants(1, 100);
      const localsData = await getAllLocals(1, 100);

      setTenants(tenantsData.data || []);
      setLocals(localsData.data || []);
    } catch (err) {
      showError('Failed to fetch tenants or locals');
    }
  };

  useEffect(() => {
    fetchLeases(page);
    fetchTenantsAndLocals();
  }, [page]);

  // --- Map for react-select ---
  const tenantsOptions = tenants.map(t => ({ value: t.id, label: t.name }));
  const localsOptions = locals.map(l => ({ value: l.id, label: l.reference_code }));

  // --- Filter leases by search ---
  const filteredLeases = useMemo(() => {
    return leases.filter(
      l =>
        l.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.local?.reference_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leases, searchTerm]);

  // --- Handle edit ---
  const handleEditClick = lease => {
    setSelectedLease(lease);
    setEditData({
      startDate: lease.startDate?.split('T')[0],
      endDate: lease.endDate?.split('T')[0],
      status: lease.status,
      tenantId: lease.tenantId,
      localId: lease.localId,
    });
    setModalOpen(true);
  };

  // --- Handle submit ---
  const handleSubmit = async () => {
    const { startDate, endDate, status, tenantId, localId } = editData;
    if (!startDate || !endDate || !tenantId || !localId) {
      showError('All fields are required');
      return;
    }

    try {
      if (selectedLease) {
        await leaseService.updateLease(selectedLease.id, { startDate, endDate, status, tenantId, localId });
        showSuccess('Lease updated successfully!');
      } else {
        await leaseService.createLease({ startDate, endDate, status, tenantId, localId });
        showSuccess('Lease created successfully!');
      }
      fetchLeases(page);
      setModalOpen(false);
      setSelectedLease(null);
      setEditData({ startDate: '', endDate: '', status: 'active', tenantId: '', localId: '' });
    } catch (err) {
      showError(err?.message || 'Failed to save lease');
    }
  };

  // --- Handle delete ---
  const handleDelete = async lease => {
    if (!window.confirm('Are you sure you want to delete this lease?')) return;
    try {
      await leaseService.deleteLease(lease.id);
      showInfo('Lease deleted successfully');
      fetchLeases(page);
    } catch (err) {
      showError(err?.message || 'Failed to delete lease');
    }
  };

  // --- Download PDF ---
  const handleDownloadPdf = async () => {
    try {
      await leaseService.downloadPdfReport();
      showSuccess('PDF report downloaded!');
    } catch (err) {
      showError(err?.message || 'Failed to download PDF report');
    }
  };

  return (
    <div className="space-y-6 pt-12 px-4 sm:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl shadow-md border border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Lease Management</h1>
          <p className="text-gray-500 mt-1">Manage leases, tenants, and locals efficiently</p>
        </div>
        <div className="flex gap-3 mt-3 sm:mt-0">
          <Button
            onClick={() => { setModalOpen(true); setSelectedLease(null); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            <FiPlus /> Add Lease
          </Button>
          <Button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition"
          >
            <FiDownload /> Download PDF
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search by tenant or local..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg"
        />
      </div>

      {/* Lease Table */}
      <Card className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading leases...</div>
        ) : (
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
              <tr>
                <th className="p-3 font-semibold text-left">Tenant</th>
                <th className="p-3 font-semibold text-left">Local</th>
                <th className="p-3 font-semibold text-left">Start Date</th>
                <th className="p-3 font-semibold text-left">End Date</th>
                <th className="p-3 font-semibold text-left">Status</th>
                <th className="p-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">No leases found</td>
                </tr>
              ) : (
                filteredLeases.map((lease, index) => (
                  <tr key={lease.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="p-3">{lease.tenant?.name || '-'}</td>
                    <td className="p-3">{lease.local?.reference_code || '-'}</td>
                    <td className="p-3">{lease.startDate?.split('T')[0]}</td>
                    <td className="p-3">{lease.endDate?.split('T')[0]}</td>
                    <td className="p-3 capitalize">{lease.status}</td>
                    <td className="p-3 flex justify-center gap-2">
                      <Button
                        onClick={() => handleEditClick(lease)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                      >
                        <FiEdit /> Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(lease)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                      >
                        <FiTrash /> Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-600 rounded-lg shadow-sm">
        <div>Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span></div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page <= 1} className="px-3 py-1 rounded-md border text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-300 disabled:border-gray-200 disabled:cursor-not-allowed">← Prev</button>
          <span className="px-2 text-gray-500 text-xs">{page}</span>
          <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page >= totalPages} className="px-3 py-1 rounded-md border text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-300 disabled:border-gray-200 disabled:cursor-not-allowed">Next →</button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal
          title={selectedLease ? 'Edit Lease' : 'Add New Lease'}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              type="date"
              label="Start Date"
              value={editData.startDate}
              onChange={e => setEditData({ ...editData, startDate: e.target.value })}
            />
            <Input
              type="date"
              label="End Date"
              value={editData.endDate}
              onChange={e => setEditData({ ...editData, endDate: e.target.value })}
            />
            <Select
              placeholder="Select Tenant..."
              value={tenantsOptions.find(o => o.value === editData.tenantId) || null}
              onChange={selected => setEditData({ ...editData, tenantId: selected?.value })}
              options={tenantsOptions}
              isSearchable
            />
            <Select
              placeholder="Select Local..."
              value={localsOptions.find(o => o.value === editData.localId) || null}
              onChange={selected => setEditData({ ...editData, localId: selected?.value })}
              options={localsOptions}
              isSearchable
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeasePage;
