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
    leaseAmount: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch leases
  const fetchLeases = async (pageNumber = 1) => {
    try {
      setLoading(true);
  
      // Fetch tenants and locals first
      const tenantsData = await getAllTenants(1, 100);
      const localsData = await getAllLocals(1, 100);
  
      const tenantsList = tenantsData.tenants || [];
      const localsList = localsData.locals || [];
  
      setTenants(tenantsList);
      setLocals(localsList);
  
      // Fetch leases
      const res = await leaseService.getLeases(pageNumber, 10);
      const leasesData = res.data || [];
  
      // Map leases with tenant and local objects
      const mappedLeases = leasesData.map(l => {
        const tenant = tenantsList.find(t => t.id === l.tenant_id) || {};
        const local = localsList.find(lc => lc.id === l.local_id) || {};
  
        return {
          ...l,
          startDate: l.start_date,
          endDate: l.end_date,
          leaseAmount: parseFloat(l.lease_amount),
          tenantId: l.tenant_id,
          localId: l.local_id,
          tenant,
          local,
        };
      });
  
      setLeases(mappedLeases);
      setPage(res.page || 1);
      setTotalPages(Math.ceil((res.total || 1) / (res.limit || 10)));
    } catch (err) {
      showError(err?.message || 'Failed to fetch leases');
    } finally {
      setLoading(false);
    }
  };
  
  

  // Fetch tenants & locals
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

  useEffect(() => {
    fetchLeases(page);
    fetchTenantsAndLocals();
  }, [page]);

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
      startDate: lease.startDate?.split('T')[0],
      endDate: lease.endDate?.split('T')[0],
      status: lease.status,
      tenantId: lease.tenantId,
      localId: lease.localId,
      leaseAmount: lease.leaseAmount || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const { startDate, endDate, status, tenantId, localId, leaseAmount } = editData;
    if (!startDate || !endDate || !tenantId || !localId || !leaseAmount) {
      showError('All fields are required');
      return;
    }

    try {
      const payload = {
        start_date: startDate,
        end_date: endDate,
        status,
        tenant_id: tenantId,
        local_id: localId,
        lease_amount: leaseAmount,
      };

      if (selectedLease) {
        await leaseService.updateLease(selectedLease.id, payload);
        showSuccess('Lease updated successfully!');
      } else {
        await leaseService.createLease(payload);
        showSuccess('Lease created successfully!');
      }

      fetchLeases(page);
      setModalOpen(false);
      setSelectedLease(null);
      setEditData({
        startDate: '',
        endDate: '',
        status: 'active',
        tenantId: '',
        localId: '',
        leaseAmount: '',
      });
    } catch (err) {
      showError(err?.message || 'Failed to save lease');
    }
  };

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

  const handleDownloadPdf = async () => {
    try {
      await leaseService.downloadPdfReport();
      showSuccess('PDF report downloaded!');
    } catch (err) {
      showError(err?.message || 'Failed to download PDF report');
    }
  };

  const statusBadge = status => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6 pt-10 px-4 sm:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lease Management</h1>
          <p className="text-gray-500 mt-1">Manage leases, tenants, and locals efficiently</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 sm:mt-0">
          <Button
            onClick={() => { setModalOpen(true); setSelectedLease(null); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg h-10"
          >
            <FiPlus /> Add Lease
          </Button>
          <Button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg h-10"
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
          className="pl-10 w-full border-gray-300 rounded-full focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Lease Table Desktop */}
      <div className="hidden md:block">
        <Card className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full text-left text-gray-700 text-sm">
            <thead className="bg-gray-50 border-b text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-3 font-semibold">Tenant</th>
                <th className="p-3 font-semibold">Local</th>
                <th className="p-3 font-semibold">Amount (RWF)</th>
                <th className="p-3 font-semibold">Start</th>
                <th className="p-3 font-semibold">End</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeases.map((lease, idx) => (
                <tr key={lease.id} className={`hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="p-3">{lease.tenant?.name || '-'}</td>
                  <td className="p-3">{lease.local?.reference_code || '-'}</td>
                  <td className="p-3">{lease.leaseAmount ? `${lease.leaseAmount.toLocaleString()} RWF` : '-'}</td>
                  <td className="p-3">{lease.startDate?.split('T')[0]}</td>
                  <td className="p-3">{lease.endDate?.split('T')[0]}</td>
                  <td className="p-3">{statusBadge(lease.status)}</td>
                  <td className="p-3 text-center flex justify-center gap-2">
                    <Button onClick={() => handleEditClick(lease)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1">
                      <FiEdit /> Edit
                    </Button>
                    <Button onClick={() => handleDelete(lease)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1">
                      <FiTrash /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {filteredLeases.map(lease => (
          <Card key={lease.id} className="p-4 border border-gray-200 rounded-lg shadow-sm space-y-2 bg-white">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">{lease.tenant?.name || '-'}</h2>
              <span>{statusBadge(lease.status)}</span>
            </div>
            <p className="text-gray-600 text-sm">{lease.local?.reference_code || '-'}</p>
            <p className="text-gray-600 text-sm">Amount: {lease.leaseAmount ? `${lease.leaseAmount.toLocaleString()} RWF` : '-'}</p>
            <p className="text-gray-600 text-sm">From {lease.startDate?.split('T')[0]} to {lease.endDate?.split('T')[0]}</p>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => handleEditClick(lease)} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm flex items-center justify-center gap-1">
                <FiEdit /> Edit
              </Button>
              <Button onClick={() => handleDelete(lease)} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm flex items-center justify-center gap-1">
                <FiTrash /> Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal
          title={selectedLease ? 'Edit Lease' : 'Add Lease'}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          className="max-w-full sm:max-w-md w-full"
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
            <Input
              type="number"
              label="Lease Amount (RWF)"
              value={editData.leaseAmount}
              onChange={e => setEditData({ ...editData, leaseAmount: e.target.value })}
            />
            <Select
              value={tenantsOptions.find(t => t.value === editData.tenantId) || null}
              onChange={selected => setEditData({ ...editData, tenantId: selected?.value })}
              options={tenantsOptions}
              placeholder="Select Tenant..."
              className="react-select-container"
              classNamePrefix="react-select"
              isSearchable
            />
            <Select
              value={localsOptions.find(l => l.value === editData.localId) || null}
              onChange={selected => setEditData({ ...editData, localId: selected?.value })}
              options={localsOptions}
              placeholder="Select Local..."
              className="react-select-container"
              classNamePrefix="react-select"
              isSearchable
            />
            <Select
              value={{ value: editData.status, label: editData.status.charAt(0).toUpperCase() + editData.status.slice(1) }}
              onChange={selected => setEditData({ ...editData, status: selected.value })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'expired', label: 'Expired' },
              ]}
              isSearchable={false}
            />

          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeasePage;
