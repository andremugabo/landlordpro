import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  restoreTenant,
} from '../../services/tenantService';
import { getAllLocals } from '../../services/localService';
import leaseService from '../../services/leaseService';
import { Button, Modal, Input, Card, Select } from '../../components';
import { FiEdit, FiPlus, FiTrash, FiSearch, FiRefreshCcw } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';
import useAccessibleProperties from '../../hooks/useAccessibleProperties';

const TenantPage = () => {
  const [tenants, setTenants] = useState([]);
  const [locals, setLocals] = useState([]);
  const [leases, setLeases] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const {
    isManager,
    properties,
    propertyOptions,
    loading: loadingProperties,
  } = useAccessibleProperties();

  useEffect(() => {
    if (!isManager) return;

    if (properties.length === 1) {
      setSelectedPropertyId(properties[0].id);
    } else if (!properties.find((property) => property.id === selectedPropertyId)) {
      setSelectedPropertyId('');
    }
  }, [isManager, properties, selectedPropertyId]);

  const fetchLocalsForFilter = useCallback(async (propertyId) => {
    try {
      const params = { page: 1, limit: 500 };
      if (propertyId) {
        params.propertyId = propertyId;
      }
      const response = await getAllLocals(params);
      setLocals(response.locals || response.data || []);
    } catch (error) {
      console.error('Failed to fetch locals for tenant filtering:', error);
      setLocals([]);
    }
  }, []);

  const fetchLeasesForFilter = useCallback(async () => {
    try {
      const response = await leaseService.getLeases(1, 500);
      setLeases(response.data || []);
    } catch (error) {
      console.error('Failed to fetch leases for tenant filtering:', error);
      setLeases([]);
    }
  }, []);

  useEffect(() => {
    if (isManager && properties.length > 0 && !selectedPropertyId) {
      return;
    }

    fetchLocalsForFilter(selectedPropertyId || undefined);
    fetchLeasesForFilter();
  }, [selectedPropertyId, isManager, properties.length, fetchLocalsForFilter, fetchLeasesForFilter]);

  useEffect(() => {
    setPage(1);
  }, [selectedPropertyId]);

  const fetchTenants = async (pageNumber = 1, search = '') => {
    try {
      setLoading(true);
      const data = await getAllTenants(pageNumber, 10, search);
      const { tenants, totalPages, page } = data;
      setTenants(tenants);
      setTotalPages(totalPages);
      setPage(page);
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      setTenants([]);
      setTotalPages(1);
      setPage(1);
      showError(err?.message || 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager && properties.length > 0 && !selectedPropertyId) {
      return;
    }
    fetchTenants(page, searchTerm);
  }, [page, searchTerm, selectedPropertyId, isManager, properties.length]);

  const localPropertyMap = useMemo(() => {
    const map = new Map();
    locals.forEach((local) => {
      if (!local?.id) return;
      const propertyId =
        local.property_id ||
        local.propertyId ||
        local.property?.id ||
        local.property?.property_id ||
        null;
      if (propertyId) {
        map.set(local.id, propertyId);
      }
    });
    return map;
  }, [locals]);

  const tenantPropertyMap = useMemo(() => {
    const map = new Map();
    leases.forEach((lease) => {
      const tenantId = lease.tenant?.id;
      const localId = lease.local?.id;
      if (!tenantId || !localId) return;

      const propertyId = localPropertyMap.get(localId);
      if (!propertyId) return;

      if (!map.has(tenantId)) {
        map.set(tenantId, new Set());
      }
      map.get(tenantId).add(propertyId);
    });
    return map;
  }, [leases, localPropertyMap]);

  const accessiblePropertyIds = useMemo(
    () => new Set(properties.map((property) => property.id)),
    [properties]
  );

  const searchTermLower = searchTerm.toLowerCase();

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        !searchTermLower ||
        tenant.name?.toLowerCase().includes(searchTermLower) ||
        tenant.email?.toLowerCase().includes(searchTermLower) ||
        tenant.phone?.toLowerCase().includes(searchTermLower);
      if (!matchesSearch) return false;

      const tenantProperties = tenantPropertyMap.get(tenant.id);

      if (isManager) {
        if (!tenantProperties || tenantProperties.size === 0) return false;
        const hasAccessible = [...tenantProperties].some((propertyId) =>
          accessiblePropertyIds.has(propertyId)
        );
        if (!hasAccessible) return false;
        if (selectedPropertyId) {
          return tenantProperties.has(selectedPropertyId);
        }
        return true;
      }

      if (selectedPropertyId) {
        return tenantProperties?.has(selectedPropertyId) ?? false;
      }

      return true;
    });
  }, [
    tenants,
    searchTermLower,
    tenantPropertyMap,
    isManager,
    accessiblePropertyIds,
    selectedPropertyId
  ]);

  const handleEditClick = (tenant) => {
    setSelectedTenant(tenant);
    setEditData({
      name: tenant.name,
      email: tenant.email || '',
      phone: tenant.phone || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const { name, email, phone } = editData;

    if (!name?.trim()) {
      showError('Name is required.');
      return;
    }

    try {
      if (selectedTenant) {
        await updateTenant(selectedTenant.id, { name, email, phone });
        showSuccess('Tenant updated successfully!');
      } else {
        await createTenant({ name, email, phone });
        showSuccess('Tenant added successfully!');
        setPage(1);
      }

      fetchTenants(page, searchTerm);
      setModalOpen(false);
      setSelectedTenant(null);
      setEditData({ name: '', email: '', phone: '' });
    } catch (err) {
      showError(err?.message || 'Failed to save tenant');
    }
  };

  const handleDelete = async (tenant) => {
    if (!window.confirm('Are you sure you want to delete this tenant?')) return;

    try {
      await deleteTenant(tenant.id);
      showInfo('Tenant soft deleted successfully.');
      fetchTenants(page, searchTerm);
    } catch (err) {
      showError(err?.message || 'Failed to delete tenant');
    }
  };

  const handleRestore = async (tenant) => {
    try {
      await restoreTenant(tenant.id);
      showSuccess('Tenant restored successfully!');
      fetchTenants(page, searchTerm);
    } catch (err) {
      showError(err?.message || 'Failed to restore tenant');
    }
  };

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Tenants Management</h1>
          <p className="text-sm text-gray-500">View, add, or manage tenants</p>
        </div>
        <div className="w-full sm:w-72">
          <Select
            label="Filter by Property"
            value={propertyOptions.find((option) => option.value === selectedPropertyId) ?? null}
            options={propertyOptions}
            isClearable={!isManager}
            isDisabled={loadingProperties || (isManager && properties.length <= 1)}
            placeholder={isManager ? 'Select your property...' : 'All properties'}
            onChange={(option) => setSelectedPropertyId(option?.value || '')}
          />
        </div>
        <Button
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm transition w-full sm:w-auto justify-center"
          onClick={() => {
            setSelectedTenant(null);
            setEditData({ name: '', email: '', phone: '' });
            setModalOpen(true);
          }}
          disabled={isManager && properties.length === 0}
        >
          <FiPlus className="text-base" />
          <span>Add Tenant</span>
        </Button>
      </div>

      {isManager && !loadingProperties && properties.length === 0 ? (
        <Card className="p-6 text-center text-gray-600">
          You are not assigned to any property yet. Please contact an administrator.
        </Card>
      ) : (
        <>
      {/* Search */}
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg"
        />
      </div>

      {/* Tenant List */}
      <div className="grid gap-4">
        <Card className="bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tenants...</div>
          ) : (
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3 font-semibold text-left">Name</th>
                  <th className="p-3 font-semibold text-left">Email</th>
                  <th className="p-3 font-semibold text-left">Phone</th>
                  <th className="p-3 font-semibold text-center">Deleted?</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      No tenants found
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className={`transition-colors ${
                        tenant.deletedAt ? 'bg-red-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="p-3 font-medium text-gray-800">{tenant.name}</td>
                      <td className="p-3">{tenant.email || '-'}</td>
                      <td className="p-3">{tenant.phone || '-'}</td>
                      <td className="p-3 text-center">
                        {tenant.deletedAt ? (
                          <span className="text-red-500 font-semibold text-xs">Yes</span>
                        ) : (
                          <span className="text-green-500 font-semibold text-xs">No</span>
                        )}
                      </td>
                      <td className="p-3 flex justify-center gap-2">
                        {!tenant.deletedAt ? (
                          <>
                            <Button
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                              onClick={() => handleEditClick(tenant)}
                            >
                              <FiEdit className="text-sm" /> Edit
                            </Button>
                            <Button
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                              onClick={() => handleDelete(tenant)}
                            >
                              <FiTrash className="text-sm" /> Delete
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                            onClick={() => handleRestore(tenant)}
                          >
                            <FiRefreshCcw className="text-sm" /> Restore
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-600 rounded-lg shadow-sm">
        <div className="text-gray-500">
          Page <span className="font-medium">{page}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
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
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
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
          title={selectedTenant ? 'Edit Tenant' : 'Add New Tenant'}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
            <Input
              label="Email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />
          </div>
        </Modal>
      )}
        </>
      )}
    </div>
  );
};

export default TenantPage;
