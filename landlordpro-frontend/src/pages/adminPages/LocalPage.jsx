import React, { useEffect, useState, useMemo } from 'react';
import { 
  getAllLocals, 
  createLocal, 
  updateLocal, 
  softDeleteLocal, 
  restoreLocal, 
  updateLocalStatus 
} from '../../services/localService';
import { getAllProperties } from '../../services/propertyService';
import { Button, Modal, Input, Card, Select } from '../../components';
import { FiEdit, FiPlus, FiTrash, FiSearch, FiRefreshCcw } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const LocalPage = () => {
  const [locals, setLocals] = useState([]);
  const [properties, setProperties] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [editData, setEditData] = useState({ 
    reference_code: '', 
    status: 'available', // Default value set here
    size_m2: '', 
    property_id: '', 
    level: '' 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Status options for consistency
  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  // Fetch locals
  const fetchLocals = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const data = await getAllLocals(pageNumber, 10);
      setLocals(data.locals || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || pageNumber);
    } catch (err) {
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
      showError(err?.message || 'Failed to fetch properties');
      setProperties([]);
    }
  };

  useEffect(() => {
    fetchLocals(page);
  }, [page]);

  useEffect(() => {
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
    if (size_m2 && isNaN(Number(size_m2))) {
      return showError('Size must be a valid number.');
    }

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
        setPage(1); // Go to first page to see new item
      }
      
      fetchLocals(page);
      setModalOpen(false);
      setSelectedLocal(null);
      setEditData({ 
        reference_code: '', 
        status: 'available', 
        size_m2: '', 
        property_id: '', 
        level: '' 
      });
    } catch (err) {
      showError(err?.message || 'Failed to save local');
    }
  };

  const handleDelete = async (local) => {
    if (!window.confirm(`Are you sure you want to delete local "${local.reference_code}"?`)) return;
    try {
      await softDeleteLocal(local.id);
      showInfo('Local deleted successfully.');
      fetchLocals(page);
    } catch (err) {
      showError(err?.message || 'Failed to delete local');
    }
  };

  const handleRestore = async (local) => {
    try {
      await restoreLocal(local.id);
      showSuccess('Local restored successfully.');
      fetchLocals(page);
    } catch (err) {
      showError(err?.message || 'Failed to restore local');
    }
  };

  const handleStatusChange = async (local, newStatus) => {
    if (local.status === newStatus) return; // No change
    
    try {
      await updateLocalStatus(local.id, newStatus);
      showSuccess('Status updated successfully.');
      fetchLocals(page);
    } catch (err) {
      showError(err?.message || 'Failed to update status');
    }
  };

  // Filter locals
  const filteredLocals = useMemo(() => {
    if (!searchTerm) return locals;
    
    return locals.filter(l =>
      l.reference_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.level?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [locals, searchTerm]);

  // Property options for select
  const propertyOptions = useMemo(() => 
    properties.map(p => ({ value: p.id, label: p.name })),
    [properties]
  );

  // Status badge component
  const StatusBadge = ({ status, deleted }) => {
    if (deleted) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          Deleted
        </span>
      );
    }

    const colors = {
      available: 'bg-green-100 text-green-800',
      occupied: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Mobile card component
  const MobileCard = ({ local }) => (
    <Card className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="font-semibold text-gray-800 text-base">{local.reference_code}</h2>
          <p className="text-xs text-gray-500">{local.property?.name || '-'}</p>
        </div>
        <StatusBadge status={local.status} deleted={!!local.deleted_at} />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-3">
        <div>
          <span className="text-gray-500 text-xs">Level:</span>
          <div className="font-medium">{local.level ?? '-'}</div>
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
          onClick={() => {
            setSelectedLocal(null);
            setEditData({ 
              reference_code: '', 
              status: 'available', 
              size_m2: '', 
              property_id: '', 
              level: '' 
            });
            setModalOpen(true);
          }}
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
          className="pl-10 w-full border-gray-300 rounded-lg"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading locals...</div>
          ) : filteredLocals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No locals found</div>
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
                {filteredLocals.map(local => (
                  <tr key={local.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-gray-800">{local.reference_code}</td>
                    <td className="p-3">{local.property?.name || '-'}</td>
                    <td className="p-3">{local.level ?? '-'}</td>
                    <td className="p-3">{local.size_m2 || '-'}</td>
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
        ) : filteredLocals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No locals found</div>
        ) : (
          filteredLocals.map(local => <MobileCard key={local.id} local={local} />)
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

      {/* Modal */}
      {modalOpen && (
        <Modal
          title={selectedLocal ? 'Edit Local' : 'Add New Local'}
          onClose={() => {
            setModalOpen(false);
            setSelectedLocal(null);
          }}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input 
              label="Reference Code" 
              value={editData.reference_code} 
              onChange={(e) => setEditData({ ...editData, reference_code: e.target.value })} 
              placeholder="e.g., A-101"
            />
            
            <Select
              label="Property"
              value={
                editData.property_id
                  ? propertyOptions.find(p => p.value === editData.property_id)
                  : { value: '', label: '— Select Property —', isDisabled: true }
              }
              options={[
                { value: '', label: '— Select Property —', isDisabled: true },
                ...propertyOptions,
              ]}
              onChange={(selected) => setEditData({ ...editData, property_id: selected?.value || '' })}
              isOptionDisabled={(option) => option.isDisabled}
              placeholder="Select Property..."
              isSearchable
            />


            <Input 
              label="Level" 
              value={editData.level} 
              onChange={(e) => setEditData({ ...editData, level: e.target.value })} 
              placeholder="e.g., Ground Floor, 1st Floor"
            />
            
            <Input 
              label="Size (m²)" 
              type="number"
              value={editData.size_m2} 
              onChange={(e) => setEditData({ ...editData, size_m2: e.target.value })} 
              placeholder="e.g., 50"
            />
            
            <Select
              label="Status"
              value={
                editData.status
                  ? statusOptions.find(opt => opt.value === editData.status)
                  : { value: '', label: '— Select Status —', isDisabled: true }
              }
              options={[
                { value: '', label: '— Select Status —', isDisabled: true },
                ...statusOptions,
              ]}
              onChange={(selected) => setEditData({ ...editData, status: selected?.value || '' })}
              isOptionDisabled={(option) => option.isDisabled}
              placeholder="Select Status..."
              isSearchable={false}
            />

          </div>
        </Modal>
      )}
    </div>
  );
};

export default LocalPage;