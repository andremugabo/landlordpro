import React, { useEffect, useState, useMemo } from 'react';
import { 
  getAllLocals, 
  createLocal, 
  updateLocal, 
  deleteLocal, 
  restoreLocal, 
  updateLocalStatus   
} from '../../services/localService';
import { getAllProperties } from '../../services/propertyService';
import { Button, Modal, Input, Card, Select, Badge } from '../../components';
import { FiEdit, FiPlus, FiTrash, FiSearch, FiRefreshCcw, FiHome, FiLayers } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const LocalPage = () => {
  const [locals, setLocals] = useState([]);
  const [properties, setProperties] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [editData, setEditData] = useState({ 
    reference_code: '', 
    status: 'available',
    size_m2: '', 
    property_id: '', 
    level: '' 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Status options for consistency
  const statusOptions = [
    { value: 'available', label: 'Available', color: 'green' },
    { value: 'occupied', label: 'Occupied', color: 'blue' },
    { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
  ];

  // Fetch locals
  const fetchLocals = async (pageNumber = page) => {
    try {
      setLoading(true);
      const data = await getAllLocals({ page: pageNumber, limit });
      setLocals(data.data || data.locals || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || pageNumber);
    } catch (err) {
      console.error('Error fetching locals:', err);
      showError(err?.message || 'Failed to fetch locals');
      setLocals([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch properties
  const fetchProperties = async () => {
    try {
      const data = await getAllProperties(1, 100);
      setProperties(data.properties || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      showError(err?.message || 'Failed to fetch properties');
      setProperties([]);
    }
  };

  useEffect(() => {
    fetchLocals();
    fetchProperties();
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (searchTerm) {
      setPage(1);
    }
  }, [searchTerm]);

  // Edit modal open
  const handleEditClick = (local) => {
    setSelectedLocal(local);
    setEditData({
      reference_code: local.reference_code || '',
      status: local.status || 'available',
      size_m2: local.size_m2 || '',
      property_id: local.property_id || '',
      level: local.level || ''
    });
    setModalOpen(true);
  };

  // Create or update
  const handleSubmit = async () => {
    if (submitting) return;
    
    const { reference_code, status, size_m2, property_id, level } = editData;
    
    // Validation
    if (!reference_code?.trim()) {
      return showError('Reference code is required.');
    }
    if (!property_id) {
      return showError('Property is required.');
    }
    if (!level?.trim()) {
      return showError('Level is required.');
    }
    if (size_m2 && (isNaN(Number(size_m2)) || Number(size_m2) <= 0)) {
      return showError('Size must be a valid positive number.');
    }

    setSubmitting(true);
    try {
      const payload = {
        reference_code: reference_code.trim(),
        status,
        size_m2: size_m2 ? Number(size_m2) : null,
        property_id,
        level: level.trim()
      };

      if (selectedLocal) {
        await updateLocal(selectedLocal.id, payload);
        showSuccess('Local updated successfully!');
      } else {
        await createLocal(payload);
        showSuccess('Local added successfully!');
        setPage(1);
      }
      
      await fetchLocals(selectedLocal ? page : 1);
      handleModalClose();
    } catch (err) {
      console.error('Error saving local:', err);
      showError(err?.message || 'Failed to save local');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (local) => {
    if (!window.confirm(`Are you sure you want to delete local "${local.reference_code}"?`)) return;
    try {
      await deleteLocal(local.id);  // This now uses deleteLocal instead of softDeleteLocal
      showInfo('Local deleted successfully.');
      await fetchLocals(page);
    } catch (err) {
      console.error('Error deleting local:', err);
      showError(err?.message || 'Failed to delete local');
    }
  };


  const handleRestore = async (local) => {
    try {
      await restoreLocal(local.id);
      showSuccess('Local restored successfully.');
      await fetchLocals(page);
    } catch (err) {
      console.error('Error restoring local:', err);
      showError(err?.message || 'Failed to restore local');
    }
  };

  const handleStatusChange = async (local, newStatus) => {
    if (local.status === newStatus) return;
    
    try {
      await updateLocalStatus(local.id, newStatus);
      showSuccess('Status updated successfully.');
      await fetchLocals(page);
    } catch (err) {
      console.error('Error updating status:', err);
      showError(err?.message || 'Failed to update status');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedLocal(null);
    setEditData({ 
      reference_code: '', 
      status: 'available', 
      size_m2: '', 
      property_id: '', 
      level: '' 
    });
  };

  // Filter locals
  const filteredLocals = useMemo(() => {
    if (!Array.isArray(locals)) return [];
    if (!searchTerm.trim()) return locals;
    
    const searchLower = searchTerm.toLowerCase();
    return locals.filter(l =>
      l.reference_code?.toLowerCase().includes(searchLower) ||
      l.property?.name?.toLowerCase().includes(searchLower) ||
      l.level?.toString().toLowerCase().includes(searchLower)
    );
  }, [locals, searchTerm]);

  // Property options for select
  const propertyOptions = useMemo(() => 
    properties.map(p => ({ value: p.id, label: p.name })),
    [properties]
  );

  // Get property name by ID
  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || '-';
  };

  // Status badge component
  const StatusBadge = ({ status, deleted }) => {
    if (deleted) {
      return (
        <Badge 
          className="bg-red-100 text-red-800"
          text="Deleted"
        />
      );
    }

    const statusOption = statusOptions.find(opt => opt.value === status);
    const colorClass = statusOption 
      ? `bg-${statusOption.color}-100 text-${statusOption.color}-800`
      : 'bg-gray-100 text-gray-800';

    return (
      <Badge 
        className={colorClass}
        text={statusOption?.label || status}
      />
    );
  };

  // Get status color for select
  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'gray';
  };

  // Mobile card component
  const MobileCard = ({ local }) => (
    <Card className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="font-semibold text-gray-800 text-base flex items-center gap-1">
            <FiLayers className="text-blue-500" />
            {local.reference_code}
          </h2>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <FiHome className="text-gray-400" />
            {getPropertyName(local.property_id)}
          </p>
        </div>
        <StatusBadge status={local.status} deleted={!!local.deleted_at} />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-3">
        <div>
          <span className="text-gray-500 text-xs">Level:</span>
          <div className="font-medium">{local.level || '-'}</div>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Size:</span>
          <div className="font-medium">{local.size_m2 ? `${local.size_m2} m²` : '-'}</div>
        </div>
      </div>

      {!local.deleted_at && (
        <div className="mb-3">
          <Select
            value={statusOptions.find(opt => opt.value === local.status)}
            options={statusOptions}
            onChange={(selected) => handleStatusChange(local, selected.value)}
            isSearchable={false}
            placeholder="Change status..."
          />
        </div>
      )}
      
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        {!local.deleted_at ? (
          <>
            <Button 
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md text-xs flex items-center justify-center gap-1" 
              onClick={() => handleEditClick(local)}
            >
              <FiEdit className="text-sm" /> Edit
            </Button>
            <Button 
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-xs flex items-center justify-center gap-1" 
              onClick={() => handleDelete(local)}
            >
              <FiTrash className="text-sm" /> Delete
            </Button>
          </>
        ) : (
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-xs flex items-center justify-center gap-1" 
            onClick={() => handleRestore(local)}
          >
            <FiRefreshCcw className="text-sm" /> Restore
          </Button>
        )}
      </div>
    </Card>
  );

  // Paginated locals
  const paginatedLocals = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredLocals.slice(startIndex, startIndex + limit);
  }, [filteredLocals, page, limit]);

  const totalFilteredCount = filteredLocals.length;

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Locals Management</h1>
          <p className="text-sm text-gray-500">View, add, or manage units within properties</p>
        </div>
        <Button
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm transition w-full sm:w-auto justify-center"
          onClick={() => setModalOpen(true)}
        >
          <FiPlus className="text-base" /> Add Local
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search by reference, property, or level..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg text-white"
        />
      </div>

      {/* Stats Summary */}
      {!loading && locals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-800">{locals.length}</div>
            <div className="text-sm text-gray-500">Total Locals</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-green-600">
              {locals.filter(l => l.status === 'available' && !l.deleted_at).length}
            </div>
            <div className="text-sm text-gray-500">Available</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">
              {locals.filter(l => l.status === 'occupied' && !l.deleted_at).length}
            </div>
            <div className="text-sm text-gray-500">Occupied</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-red-600">
              {locals.filter(l => l.deleted_at).length}
            </div>
            <div className="text-sm text-gray-500">Deleted</div>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading locals...</div>
          ) : paginatedLocals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {locals.length === 0 ? 'No locals found' : 'No locals match your search'}
            </div>
          ) : (
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3 font-semibold text-left">Reference</th>
                  <th className="p-3 font-semibold text-left">Property</th>
                  <th className="p-3 font-semibold text-left">Level</th>
                  <th className="p-3 font-semibold text-left">Size (m²)</th>
                  <th className="p-3 font-semibold text-left">Status</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLocals.map(local => (
                  <tr key={local.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <td className="p-3 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <FiLayers className="text-blue-500" />
                        {local.reference_code}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FiHome className="text-gray-400" />
                        {getPropertyName(local.property_id)}
                      </div>
                    </td>
                    <td className="p-3">{local.level || '-'}</td>
                    <td className="p-3">{local.size_m2 ? `${local.size_m2} m²` : '-'}</td>
                    <td className="p-3">
                      {!local.deleted_at ? (
                        <Select
                          value={statusOptions.find(opt => opt.value === local.status)}
                          options={statusOptions}
                          onChange={(selected) => handleStatusChange(local, selected.value)}
                          isSearchable={false}
                        />
                      ) : (
                        <StatusBadge status={local.status} deleted={true} />
                      )}
                    </td>
                    <td className="p-3 flex justify-center gap-2">
                      {!local.deleted_at ? (
                        <>
                          <Button 
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1" 
                            onClick={() => handleEditClick(local)}
                          >
                            <FiEdit className="text-sm" /> Edit
                          </Button>
                          <Button 
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1" 
                            onClick={() => handleDelete(local)}
                          >
                            <FiTrash className="text-sm" /> Delete
                          </Button>
                        </>
                      ) : (
                        <Button 
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1" 
                          onClick={() => handleRestore(local)}
                        >
                          <FiRefreshCcw className="text-sm" /> Restore
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading locals...</div>
        ) : paginatedLocals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {locals.length === 0 ? 'No locals found' : 'No locals match your search'}
          </div>
        ) : (
          paginatedLocals.map(local => <MobileCard key={local.id} local={local} />)
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredLocals.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-600 rounded-lg shadow-sm">
          <div className="text-gray-500 mb-2 sm:mb-0">
            Showing <span className="font-medium">{paginatedLocals.length}</span> of{' '}
            <span className="font-medium">{totalFilteredCount}</span> locals
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
            <span className="px-2 text-gray-500 text-xs">
              Page {page} of {Math.ceil(totalFilteredCount / limit)}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(totalFilteredCount / limit)))}
              disabled={page >= Math.ceil(totalFilteredCount / limit)}
              className={`px-3 py-1 rounded-md border text-xs font-medium transition ${
                page >= Math.ceil(totalFilteredCount / limit)
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
          title={selectedLocal ? 'Edit Local' : 'Add New Local'}
          onClose={handleModalClose}
          onSubmit={handleSubmit}
          submitText={submitting ? (selectedLocal ? 'Updating...' : 'Creating...') : (selectedLocal ? 'Update' : 'Create')}
          disabled={submitting}
        >
          <div className="space-y-4">
            <Input 
              label="Reference Code *" 
              value={editData.reference_code} 
              onChange={(e) => setEditData({ ...editData, reference_code: e.target.value })} 
              placeholder="e.g., A-101"
              required
            />
            
            <Select
              label="Property *"
              value={propertyOptions.find(p => p.value === editData.property_id) || null}
              options={propertyOptions}
              onChange={(selected) => setEditData({ ...editData, property_id: selected?.value || '' })}
              placeholder="Select Property..."
              isSearchable
              required
            />

            <Input 
              label="Level *" 
              value={editData.level} 
              onChange={(e) => setEditData({ ...editData, level: e.target.value })} 
              placeholder="e.g., Ground Floor, 1st Floor"
              required
            />
            
            <Input 
              label="Size (m²)" 
              type="number"
              min="0"
              step="0.01"
              value={editData.size_m2} 
              onChange={(e) => setEditData({ ...editData, size_m2: e.target.value })} 
              placeholder="e.g., 50.5"
            />
            
            <Select
              label="Status *"
              value={statusOptions.find(opt => opt.value === editData.status)}
              options={statusOptions}
              onChange={(selected) => setEditData({ ...editData, status: selected?.value || 'available' })}
              placeholder="Select Status..."
              isSearchable={false}
              required
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LocalPage;