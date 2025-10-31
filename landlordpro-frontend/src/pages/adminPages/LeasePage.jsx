import React, { useState, useEffect, useMemo } from 'react';
import leaseService from '../../services/leaseService';
import { getAllTenants } from '../../services/tenantService';
import { getAllLocals } from '../../services/localService';
import { getAllProperties } from '../../services/propertyService';
import { Button, Input, Modal, Card, Select } from '../../components';
import { FiEdit, FiPlus, FiTrash, FiSearch, FiDownload, FiClock } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const LeasePage = () => {
  const [leases, setLeases] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [locals, setLocals] = useState([]);
  const [filteredLocals, setFilteredLocals] = useState([]);
  const [properties, setProperties] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState(null);
  const [editData, setEditData] = useState({
    startDate: '',
    endDate: '',
    status: 'active',
    tenantId: '',
    propertyId: '',
    localId: '',
    leaseAmount: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  // ✅ Fetch tenants and locals
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

  const fetchPropertiesData = async () => {
    try {
      const res = await getAllProperties(1, 100);
      setProperties(res.properties || []);
    } catch {
      showError('Failed to fetch properties');
    }
  };

  // ✅ Fetch leases
  const fetchLeases = async (pageNumber = 1, filterStatus = '', term = '') => {
    try {
      setLoading(true);
      const res = await leaseService.getLeases(pageNumber, PAGE_SIZE, filterStatus);
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
    fetchPropertiesData();
  }, []);

  useEffect(() => {
    fetchLeases(page, statusFilter, searchTerm);
  }, [page, statusFilter, searchTerm]);

  const tenantsOptions = tenants.map(t => ({ value: t.id, label: t.name }));
  const propertiesOptions = properties.map(p => ({ value: p.id, label: p.name }));

  const filteredLeases = useMemo(
    () =>
      leases.filter(
        l =>
          l.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.local?.reference_code?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [leases, searchTerm]
  );

  // ✅ Edit Lease
  const handleEditClick = lease => {
    setSelectedLease(lease);
    
    // Filter locals based on the lease's property
    const propertyId = lease.local?.property_id || lease.local?.propertyId || '';
    const localsForProperty = locals.filter(l => 
      (l.property_id || l.propertyId) === propertyId
    );
    setFilteredLocals(localsForProperty);
    
    setEditData({
      startDate: lease.startDate?.split('T')[0] || '',
      endDate: lease.endDate?.split('T')[0] || '',
      status: lease.status || 'active',
      tenantId: lease.tenant?.id || '',
      propertyId: propertyId,
      localId: lease.local?.id || '',
      leaseAmount: lease.leaseAmount || '',
    });
    setModalOpen(true);
  };

  // ✅ Submit (Create or Update)
  const handleSubmit = async () => {
    const { startDate, endDate, status, tenantId, localId, leaseAmount } = editData;
    console.log(editData)
    if (!startDate || !endDate || !tenantId || !localId || !leaseAmount) {
      showError('All fields are required');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      showError('End date cannot be before start date');
      return;
    }

    try {
      const payload = {
        startDate,
        endDate,
        status,
        tenantId,
        localId,
        leaseAmount: Number(leaseAmount),
      };

      if (selectedLease) {
        await leaseService.updateLease(selectedLease.id, payload);
        showSuccess('Lease updated successfully!');
      } else {
        await leaseService.createLease(payload);
        showSuccess('Lease created successfully!');
      }

      fetchLeases(page, statusFilter, searchTerm);
      setModalOpen(false);
      setSelectedLease(null);
      setEditData({
        startDate: '',
        endDate: '',
        status: 'active',
        tenantId: '',
        propertyId: '',
        localId: '',
        leaseAmount: '',
      });
      setFilteredLocals([]);
    } catch {
      showError('Failed to save lease');
    }
  };

  // ✅ Delete Lease
  const handleDelete = async lease => {
    if (!window.confirm('Are you sure you want to delete this lease?')) return;
    try {
      await leaseService.deleteLease(lease.id);
      showInfo('Lease deleted successfully');
      fetchLeases(page, statusFilter, searchTerm);
    } catch {
      showError('Failed to delete lease');
    }
  };

  // ✅ Download PDF
  const handleDownloadPdf = async () => {
    try {
      await leaseService.downloadPdfReport();
      showSuccess('PDF report downloaded!');
    } catch {
      showError('Failed to download PDF');
    }
  };

  // ✅ Trigger expired leases manually (admin-only)
  const handleTriggerExpired = async () => {
    if (!window.confirm('Manually trigger expired lease check?')) return;
    try {
      await leaseService.triggerExpiredLeases();
      showSuccess('Expired leases updated successfully!');
      fetchLeases(page, statusFilter, searchTerm);
    } catch {
      showError('Failed to trigger expired leases');
    }
  };

  // ✅ Status badge styling
  const statusBadge = status => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          colors[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Lease Management</h1>
          <p className="text-sm text-gray-500">Manage leases, tenants, and locals efficiently</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <Button
            onClick={() => {
              setSelectedLease(null);
              setEditData({
                startDate: '',
                endDate: '',
                status: 'active',
                tenantId: '',
                propertyId: '',
                localId: '',
                leaseAmount: '',
              });
              setFilteredLocals([]);
              setModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm"
          >
            <FiPlus /> Add Lease
          </Button>
          <Button
            onClick={handleDownloadPdf}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm"
          >
            <FiDownload /> Download PDF
          </Button>
          <Button
            onClick={handleTriggerExpired}
            className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm"
          >
            <FiClock /> Trigger Expired
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-1/2">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search by tenant or local..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 w-full border-gray-300 rounded-lg"
          />
        </div>

        <div className="w-full sm:w-1/3">
          <Select
            label="Filter by Status"
            value={
              statusFilter
                ? { value: statusFilter, label: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) }
                : null
            }
            onChange={selected => setStatusFilter(selected?.value || '')}
            options={[
              { value: '', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'expired', label: 'Expired' },
            ]}
            isSearchable={false}
          />
        </div>
      </div>

      {/* Loading/Empty State */}
      {loading ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg">Loading leases...</div>
      ) : filteredLeases.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg">No leases found</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card className="bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="p-3 text-left font-semibold">Reference</th>
                    <th className="p-3 text-left font-semibold">Tenant</th>
                    <th className="p-3 text-left font-semibold">Local</th>
                    <th className="p-3 text-left font-semibold">Amount (RWF)</th>
                    <th className="p-3 text-left font-semibold">Start</th>
                    <th className="p-3 text-left font-semibold">End</th>
                    <th className="p-3 text-left font-semibold">Status</th>
                    <th className="p-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeases.map(lease => (
                    <tr key={lease.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{lease.reference || '-'}</td>
                      <td className="p-3 font-medium text-gray-800">{lease.tenant?.name || '-'}</td>
                      <td className="p-3">{lease.local?.referenceCode || '-'}</td>
                      <td className="p-3">
                        {lease.leaseAmount ? `${lease.leaseAmount.toLocaleString()} RWF` : '-'}
                      </td>
                      <td className="p-3">{lease.startDate?.split('T')[0]}</td>
                      <td className="p-3">{lease.endDate?.split('T')[0]}</td>
                      <td className="p-3">{statusBadge(lease.status)}</td>
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
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-4">
            {filteredLeases.map(lease => (
              <Card key={lease.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-800 text-base">
                        {lease.tenant?.name || '-'}
                      </div>
                      <div className="text-sm text-gray-500">{lease.local?.referenceCode || '-'}</div>
                      {lease.reference && (
                        <div className="text-xs text-gray-400">Ref: {lease.reference}</div>
                      )}
                    </div>
                    {statusBadge(lease.status)}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs">Amount</div>
                      <div className="font-medium text-gray-800">
                        {lease.leaseAmount ? `${lease.leaseAmount.toLocaleString()} RWF` : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Duration</div>
                      <div className="font-medium text-gray-800 text-xs">
                        {lease.startDate?.split('T')[0]} to {lease.endDate?.split('T')[0]}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button
                      onClick={() => handleEditClick(lease)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md text-xs flex items-center justify-center gap-1"
                    >
                      <FiEdit /> Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(lease)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-xs flex items-center justify-center gap-1"
                    >
                      <FiTrash /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

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

      {/* Modal */}
      {modalOpen && (
        <Modal
          title={selectedLease ? 'Edit Lease' : 'Add New Lease'}
          onClose={() => {
            setModalOpen(false);
            setFilteredLocals([]);
          }}
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
            <Input
              type="number"
              label="Lease Amount (RWF)"
              value={editData.leaseAmount}
              onChange={e => setEditData({ ...editData, leaseAmount: e.target.value })}
            />
        
            <Select
              label="Tenant"
              value={
                editData.tenantId
                  ? tenantsOptions.find(t => t.value === editData.tenantId)
                  : { value: '', label: '— Select Tenant —', isDisabled: true }
              }
              options={[
                { value: '', label: '— Select Tenant —', isDisabled: true },
                ...tenantsOptions,
              ]}
              onChange={selected =>
                setEditData({ ...editData, tenantId: selected?.value || '' })
              }
              isOptionDisabled={option => option.isDisabled}
              placeholder="Select Tenant..."
              isSearchable
            />

        
              <Select
                label="Property"
                value={
                  editData.propertyId
                    ? propertiesOptions.find(p => p.value === editData.propertyId)
                    : { value: '', label: '— Select Property —', isDisabled: true }
                }
                options={[
                  { value: '', label: '— Select Property —', isDisabled: true },
                  ...propertiesOptions,
                ]}
                onChange={selected => {
                  const propertyId = selected?.value || '';
                  setEditData({ ...editData, propertyId, localId: '' });

                  // Filter locals by selected property
                  const localsForProperty = locals.filter(
                    l => (l.property_id || l.propertyId) === propertyId
                  );
                  setFilteredLocals(localsForProperty);
                }}
                isOptionDisabled={option => option.isDisabled}
                placeholder="Select Property..."
                isSearchable
              />

        
              <Select
                label="Local"
                value={
                  editData.localId
                    ? filteredLocals
                        .map(l => ({ value: l.id, label: l.reference_code }))
                        .find(l => l.value === editData.localId)
                    : { value: '', label: '— Select Local —', isDisabled: true }
                }
                options={[
                  { value: '', label: '— Select Local —', isDisabled: true },
                  ...filteredLocals.map(l => ({ value: l.id, label: l.reference_code })),
                ]}
                onChange={selected =>
                  setEditData({ ...editData, localId: selected?.value || '' })
                }
                isOptionDisabled={option => option.isDisabled}
                placeholder={editData.propertyId ? 'Select Local...' : 'Select a property first'}
                isDisabled={!editData.propertyId}
                isSearchable
              />

        
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