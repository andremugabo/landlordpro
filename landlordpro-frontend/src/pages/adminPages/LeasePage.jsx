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
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  // ✅ Fetch tenants and locals with corrected parameter structure
  const fetchTenantsAndLocals = async () => {
    try {
      setError(null);
      const [tenantsData, localsData] = await Promise.all([
        getAllTenants(1, 100), // This uses (page, limit) format
        getAllLocals({ page: 1, limit: 100 }) // This uses params object format
      ]);
      
      // console.log('Tenants API response:', tenantsData);
      // console.log('Locals API response:', localsData);
      
      // Based on your tenant service, the response should be { tenants, totalPages, page }
      setTenants(tenantsData.tenants || tenantsData.data || []);
      
      // Based on your local service, the response could be { data: [], locals: [], etc. }
      // Use the extractLocalsData utility if available, otherwise handle different structures
      const localsArray = localsData.data || localsData.locals || localsData || [];
      setLocals(Array.isArray(localsArray) ? localsArray : []);
    } catch (err) {
      console.error('Error fetching tenants or locals:', err);
      setError('Failed to fetch tenants or locals');
      showError('Failed to fetch tenants or locals');
    }
  };

  const fetchPropertiesData = async () => {
    try {
      setError(null);
      // Assuming properties service has similar structure to tenants
      const res = await getAllProperties(1, 100);
      // console.log('Properties API response:', res);
      setProperties(res.properties || res.data || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to fetch properties');
      showError('Failed to fetch properties');
    }
  };

  // ✅ Fetch leases with corrected API response handling
  const fetchLeases = async (pageNumber = 1, filterStatus = '', term = '') => {
    try {
      setLoading(true);
      setError(null);
      
      // Assuming leaseService follows similar pattern to tenantService
      const res = await leaseService.getLeases(pageNumber, PAGE_SIZE, filterStatus, term);
      
      // console.log('Leases API response:', res);
      
      // Handle different possible response structures
      const leasesData = res.data || res.leases || res || [];
      const totalCount = res.total || res.totalCount || res.totalItems || 
                        (Array.isArray(leasesData) ? leasesData.length : 0);
      
      setLeases(Array.isArray(leasesData) ? leasesData : []);
      setPage(pageNumber);
      setTotalPages(Math.ceil(totalCount / PAGE_SIZE) || 1);
    } catch (err) {
      // console.error('Error fetching leases:', err);
      setError('Failed to fetch leases: ' + (err.message || 'Unknown error'));
      showError('Failed to fetch leases');
      setLeases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantsAndLocals();
    fetchPropertiesData();
    fetchLeases(1); // Initial fetch
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
    fetchLeases(1, statusFilter, searchTerm);
  }, [statusFilter, searchTerm]);

  const tenantsOptions = tenants.map(t => ({ 
    value: t.id, 
    label: t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || `Tenant ${t.id}`
  }));
  
  const propertiesOptions = properties.map(p => ({ 
    value: p.id, 
    label: p.name || p.property_name || `Property ${p.id}` 
  }));

  // ✅ Client-side filtering as fallback
  const filteredLeases = useMemo(
    () =>
      leases.filter(
        l =>
          l.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.local?.reference_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.local?.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.local?.code?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [leases, searchTerm]
  );

  // ✅ Edit Lease with improved property handling
  const handleEditClick = lease => {
    console.log('Editing lease:', lease);
    setSelectedLease(lease);
    
    // Handle different possible property name variations
    const propertyId = lease.local?.property_id || lease.local?.propertyId || 
                      lease.property_id || lease.propertyId || '';
    
    const localsForProperty = locals.filter(l => 
      (l.property_id || l.propertyId) === propertyId
    );
    setFilteredLocals(localsForProperty);
    
    setEditData({
      startDate: lease.start_date?.split('T')[0] || lease.startDate?.split('T')[0] || '',
      endDate: lease.end_date?.split('T')[0] || lease.endDate?.split('T')[0] || '',
      status: lease.status || 'active',
      tenantId: lease.tenant_id || lease.tenant?.id || '',
      propertyId: propertyId,
      localId: lease.local_id || lease.local?.id || '',
      leaseAmount: lease.lease_amount || lease.leaseAmount || '',
    });
    setModalOpen(true);
  };

  // ✅ Submit (Create or Update) - FIXED: Use camelCase field names
  const handleSubmit = async () => {
    const { startDate, endDate, status, tenantId, localId, leaseAmount } = editData;
    console.log('Submitting lease data:', editData);
    
    if (!startDate || !endDate || !tenantId || !localId || !leaseAmount) {
      showError('All fields are required');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      showError('End date cannot be before start date');
      return;
    }

    try {
      // Use camelCase field names that match exactly what your leaseService expects
      const payload = {
        startDate: startDate,
        endDate: endDate,
        status: status,
        tenantId: tenantId,
        localId: localId,
        leaseAmount: Number(leaseAmount),
      };

      console.log('Sending payload to leaseService:', payload);

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
    } catch (err) {
      console.error('Error saving lease:', err);
      showError(err.message || 'Failed to save lease');
    }
  };

  // ✅ Delete Lease
  const handleDelete = async lease => {
    if (!window.confirm('Are you sure you want to delete this lease?')) return;
    try {
      await leaseService.deleteLease(lease.id);
      showInfo('Lease deleted successfully');
      fetchLeases(page, statusFilter, searchTerm);
    } catch (err) {
      console.error('Error deleting lease:', err);
      showError(err.message || 'Failed to delete lease');
    }
  };

  // ✅ Download PDF
  const handleDownloadPdf = async () => {
    try {
      await leaseService.downloadPdfReport();
      showSuccess('PDF report downloaded!');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      showError(err.message || 'Failed to download PDF');
    }
  };

  // ✅ Trigger expired leases manually (admin-only)
  const handleTriggerExpired = async () => {
    if (!window.confirm('Manually trigger expired lease check?')) return;
    try {
      await leaseService.triggerExpiredLeases();
      showSuccess('Expired leases updated successfully!');
      fetchLeases(page, statusFilter, searchTerm);
    } catch (err) {
      console.error('Error triggering expired leases:', err);
      showError(err.message || 'Failed to trigger expired leases');
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
        {status?.charAt(0)?.toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  // Get display data safely
  const getTenantName = (lease) => {
    if (lease.tenant?.name) return lease.tenant.name;
    if (lease.tenant?.first_name || lease.tenant?.last_name) {
      return `${lease.tenant.first_name || ''} ${lease.tenant.last_name || ''}`.trim();
    }
    return lease.tenant_id || '-';
  };

  const getLocalReference = (lease) => {
    return lease.local?.reference_code || lease.local?.referenceCode || 
           lease.local?.code || lease.local_id || '-';
  };

  const getLeaseAmount = (lease) => {
    return lease.lease_amount || lease.leaseAmount;
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

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-600 text-sm">{error}</div>
            <Button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800 text-lg font-bold"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-1/2">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search by tenant name, local reference..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 w-full border-gray-300 rounded-lg text-white"
          />
        </div>

        <div className="w-full sm:w-1/3">
          <Select
            // label="Filter by Status"
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
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg">
          {leases.length === 0 ? 'No leases found' : 'No leases match your search criteria'}
        </div>
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
                      <td className="p-3 font-medium text-gray-800">{getTenantName(lease)}</td>
                      <td className="p-3">{getLocalReference(lease)}</td>
                      <td className="p-3">
                        {getLeaseAmount(lease) ? `${getLeaseAmount(lease).toLocaleString()} RWF` : '-'}
                      </td>
                      <td className="p-3">{lease.start_date?.split('T')[0] || lease.startDate?.split('T')[0] || '-'}</td>
                      <td className="p-3">{lease.end_date?.split('T')[0] || lease.endDate?.split('T')[0] || '-'}</td>
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
                        {getTenantName(lease)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getLocalReference(lease)}
                      </div>
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
                        {getLeaseAmount(lease) ? `${getLeaseAmount(lease).toLocaleString()} RWF` : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Duration</div>
                      <div className="font-medium text-gray-800 text-xs">
                        {lease.start_date?.split('T')[0] || lease.startDate?.split('T')[0] || '-'} to {' '}
                        {lease.end_date?.split('T')[0] || lease.endDate?.split('T')[0] || '-'}
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
      {totalPages > 1 && (
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
      )}

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
              required
            />
            <Input
              type="date"
              label="End Date"
              value={editData.endDate}
              onChange={e => setEditData({ ...editData, endDate: e.target.value })}
              required
            />
            <Input
              type="number"
              label="Lease Amount (RWF)"
              value={editData.leaseAmount}
              onChange={e => setEditData({ ...editData, leaseAmount: e.target.value })}
              min="0"
              step="0.01"
              required
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
                const localsForProperty = locals.filter(l => 
                  (l.property_id || l.propertyId) === propertyId
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
                      .map(l => ({ 
                        value: l.id, 
                        label: l.reference_code || l.referenceCode || l.code || `Local ${l.id}` 
                      }))
                      .find(l => l.value === editData.localId)
                  : { value: '', label: '— Select Local —', isDisabled: true }
              }
              options={[
                { value: '', label: '— Select Local —', isDisabled: true },
                ...filteredLocals.map(l => ({ 
                  value: l.id, 
                  label: l.reference_code || l.referenceCode || l.code || `Local ${l.id}` 
                })),
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