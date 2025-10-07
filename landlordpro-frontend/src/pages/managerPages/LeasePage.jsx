import React, { useState, useEffect, useMemo } from 'react';
import leaseService from '../../services/leaseService';
import { getAllTenants } from '../../services/tenantService';
import { getAllLocals } from '../../services/localService';
import { Button, Input, Modal, Card, Select } from '../../components';
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
    tenantId: undefined, 
    localId: undefined,  
    leaseAmount: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  // Fetch tenants and locals
  const fetchTenantsAndLocals = async () => {
    try {
      const tenantsData = await getAllTenants(1, 100);
      const localsData = await getAllLocals(1, 100);
      setTenants(tenantsData.tenants || []);
      setLocals(localsData.locals || []);
    } catch {
      showError('Failed to fetch tenants or locals');
    }
  };

  // Fetch leases
  const fetchLeases = async (pageNumber = 1, term = '') => {
    try {
      setLoading(true);
      const res = await leaseService.getLeases(pageNumber, PAGE_SIZE, term);
      const leasesData = res.data || [];
      setLeases(leasesData);
      setPage(pageNumber);
      setTotalPages(Math.ceil((res.total || leasesData.length) / PAGE_SIZE));
    } catch {
      showError('Failed to fetch leases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantsAndLocals();
  }, []);

  useEffect(() => {
    fetchLeases(page, searchTerm);
  }, [page, searchTerm]);

  const tenantsOptions = tenants.map(t => ({ value: t.id, label: t.name }));
  const localsOptions = locals.map(l => ({ value: l.id, label: l.reference_code }));

  const filteredLeases = useMemo(
    () =>
      leases.filter(
        l =>
          l.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.local?.reference_code?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [leases, searchTerm]
  );

  const handleEditClick = lease => {
    setSelectedLease(lease);
    setEditData({
      startDate: lease.startDate?.split('T')[0] || '',
      endDate: lease.endDate?.split('T')[0] || '',
      status: lease.status || 'active',
      tenantId: lease.tenant?.id || undefined,
      localId: lease.local?.id || undefined,
      leaseAmount: lease.leaseAmount || '',
    });
    setModalOpen(true);
  };
  

  const handleSubmit = async () => {
    const { startDate, endDate, status, tenantId, localId, leaseAmount } = editData;
    console.log(editData)
    // Validate fields
    if (!startDate || !endDate || !tenantId || !localId || !leaseAmount) {
      showError('All fields are required');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      showError('End date cannot be before start date.');
      return;
    }

    try {
      const payload = { startDate, endDate, status, tenantId, localId, leaseAmount: Number(leaseAmount) };
      if (selectedLease) {
        await leaseService.updateLease(selectedLease.id, payload);
        showSuccess('Lease updated successfully!');
      } else {
        await leaseService.createLease(payload);
        showSuccess('Lease created successfully!');
      }
      fetchLeases(page, searchTerm);
      setModalOpen(false);
      setSelectedLease(null);
      setEditData({ startDate: '', endDate: '', status: 'active', tenantId: '', localId: '', leaseAmount: '' });
    } catch {
      showError('Failed to save lease');
    }
  };

  const handleDelete = async lease => {
    if (!window.confirm('Are you sure you want to delete this lease?')) return;
    try {
      await leaseService.deleteLease(lease.id);
      showInfo('Lease deleted successfully');
      fetchLeases(page, searchTerm);
    } catch {
      showError('Failed to delete lease');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await leaseService.downloadPdfReport();
      showSuccess('PDF report downloaded!');
    } catch {
      showError('Failed to download PDF');
    }
  };

  const statusBadge = status => {
    const colors = { active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-800', expired: 'bg-red-100 text-red-800' };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Lease Management</h1>
          <p className="text-sm text-gray-500">Manage leases, tenants, and locals efficiently</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            onClick={() => {
              setSelectedLease(null);
              setEditData({ startDate: '', endDate: '', status: 'active', tenantId: '', localId: '', leaseAmount: '' });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm"
          >
            <FiPlus /> Add Lease
          </Button>
          <Button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm"
          >
            <FiDownload /> Download PDF
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input placeholder="Search by tenant or local..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-full border-gray-300 rounded-lg" />
      </div>

      {/* Lease Table - Desktop */}
      <div className="hidden md:block">
        <Card className="bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
              <tr>
                <th className="p-3 font-semibold text-left">Tenant</th>
                <th className="p-3 font-semibold text-left">Local</th>
                <th className="p-3 font-semibold text-left">Amount (RWF)</th>
                <th className="p-3 font-semibold text-left">Start</th>
                <th className="p-3 font-semibold text-left">End</th>
                <th className="p-3 font-semibold text-left">Status</th>
                <th className="p-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading leases...</td></tr>
              ) : filteredLeases.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No leases found</td></tr>
              ) : filteredLeases.map(lease => (
                <tr key={lease.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3">{lease.tenant?.name || '-'}</td>
                  <td className="p-3">{lease.local?.referenceCode || '-'}</td>
                  <td className="p-3">{lease.leaseAmount ? `${lease.leaseAmount.toLocaleString()} RWF` : '-'}</td>
                  <td className="p-3">{lease.startDate?.split('T')[0]}</td>
                  <td className="p-3">{lease.endDate?.split('T')[0]}</td>
                  <td className="p-3">{statusBadge(lease.status)}</td>
                  <td className="p-3 flex justify-center gap-2">
                    <Button onClick={() => handleEditClick(lease)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"><FiEdit /> Edit</Button>
                    <Button onClick={() => handleDelete(lease)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"><FiTrash /> Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredLeases.map(lease => (
          <Card key={lease.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-gray-800">{lease.tenant?.name || '-'}</div>
              <div className="text-sm text-gray-500">{lease.local?.reference_code || '-'}</div>
            </div>
            <div className="text-sm text-gray-600">Amount: {lease.leaseAmount ? `${lease.leaseAmount.toLocaleString()} RWF` : '-'}</div>
            <div className="text-sm text-gray-600">From {lease.startDate?.split('T')[0]} to {lease.endDate?.split('T')[0]}</div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button onClick={() => handleEditClick(lease)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex-1 flex items-center justify-center gap-1"><FiEdit /> Edit</Button>
              <Button onClick={() => handleDelete(lease)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex-1 flex items-center justify-center gap-1"><FiTrash /> Delete</Button>
            </div>
          </Card>
        ))}
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
          <Modal
            title={selectedLease ? 'Edit Lease' : 'Add New Lease'}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubmit}
          >
            <div className="space-y-4">
              {/* Start Date */}
              <Input
                type="date"
                label="Start Date"
                value={editData.startDate}
                onChange={e => setEditData({ ...editData, startDate: e.target.value })}
              />

              {/* End Date */}
              <Input
                type="date"
                label="End Date"
                value={editData.endDate}
                onChange={e => setEditData({ ...editData, endDate: e.target.value })}
              />

              {/* Lease Amount */}
              <Input
                type="number"
                label="Lease Amount (RWF)"
                value={editData.leaseAmount}
                onChange={e => setEditData({ ...editData, leaseAmount: e.target.value })}
              />

                <Select
                  label="Tenant"
                  value={tenantsOptions.find(t => t.value === editData.tenantId) || undefined}
                  onChange={selected => setEditData({ ...editData, tenantId: selected?.value || undefined })}
                  options={tenantsOptions}
                  placeholder="Select Tenant..."
                  isSearchable
                />
                <Select
                  label="Local"
                  value={localsOptions.find(l => l.value === editData.localId) || undefined}
                  onChange={selected => setEditData({ ...editData, localId: selected?.value || undefined })}
                  options={localsOptions}
                  placeholder="Select Local..."
                  isSearchable
                />


              {/* Status Select */}
              <Select
                label="Status"
                value={{
                  value: editData.status || 'active',
                  label: (editData.status || 'active').charAt(0).toUpperCase() + (editData.status || 'active').slice(1),
                }}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'expired', label: 'Expired' },
                ]}
                onChange={s => setEditData({ ...editData, status: s.value })}
                isSearchable={false}
              />
            </div>
          </Modal>
        )}

    </div>
  );
};

export default LeasePage;
