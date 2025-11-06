import React, { useEffect, useState, useMemo } from 'react';
import { 
  getAllLocals, 
  createLocal, 
  updateLocal, 
  deleteLocal,  // <-- added
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
  const [editData, setEditData] = useState({ reference_code: '', status: 'available', size_m2: '', property_id: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch locals
  const fetchLocals = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const data = await getAllLocals(pageNumber, 10);
      const { locals, totalPages, page } = data;
      setLocals(locals);
      setTotalPages(totalPages);
      setPage(page);
    } catch (err) {
      showError(err?.message || 'Failed to fetch locals');
    } finally {
      setLoading(false);
    }
  };

  // Fetch properties for Select dropdown
  const fetchProperties = async () => {
    try {
      const data = await getAllProperties(1, 100);
      setProperties(data.properties || []);
    } catch (err) {
      showError(err?.message || 'Failed to fetch properties');
    }
  };

  useEffect(() => {
    fetchLocals(page);
    fetchProperties();
  }, [page]);

  const handleEditClick = (local) => {
    setSelectedLocal(local);
    setEditData({
      reference_code: local.reference_code,
      status: local.status,
      size_m2: local.size_m2,
      property_id: local.property_id
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const { reference_code, status, size_m2, property_id } = editData;

    if (!reference_code?.trim() || !property_id) {
      showError('Reference code and property are required.');
      return;
    }

    try {
      if (selectedLocal) {
        await updateLocal(selectedLocal.id, { reference_code, status, size_m2, property_id });
        showSuccess('Local updated successfully!');
      } else {
        await createLocal({ reference_code, status, size_m2, property_id });
        showSuccess('Local added successfully!');
        setPage(1);
      }
      fetchLocals(page);
      setModalOpen(false);
      setSelectedLocal(null);
      setEditData({ reference_code: '', status: 'available', size_m2: '', property_id: '' });
    } catch (err) {
      showError(err?.message || 'Failed to save local');
    }
  };

  const handleDelete = async (local) => {
    if (!window.confirm('Are you sure you want to delete this local?')) return;
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
    try {
      await updateLocalStatus(local.id, newStatus);
      showSuccess('Status updated successfully.');
      fetchLocals(page);
    } catch (err) {
      showError(err?.message || 'Failed to update status');
    }
  };

  const filteredLocals = useMemo(() => {
    if (!Array.isArray(locals)) return [];
    return locals.filter(l =>
      l.reference_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [locals, searchTerm]);

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
            setEditData({ reference_code: '', status: 'available', size_m2: '', property_id: '' });
            setModalOpen(true);
          }}
        >
          <FiPlus className="text-base" />
          <span>Add Local</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search by reference or property..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg"
        />
      </div>

      {/* Local List */}
      <div className="grid gap-4">
        <Card className="bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading locals...</div>
          ) : (
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3 font-semibold text-left">Reference</th>
                  <th className="p-3 font-semibold text-left">Property</th>
                  <th className="p-3 font-semibold text-left">Size (m²)</th>
                  <th className="p-3 font-semibold text-left">Status</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">No locals found</td>
                  </tr>
                ) : (
                  filteredLocals.map(local => (
                    <tr key={local.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{local.reference_code}</td>
                      <td className="p-3">{local.property?.name || '-'}</td>
                      <td className="p-3">{local.size_m2 || '-'}</td>
                      <td className="p-3">
                        <Select
                          value={local.status}
                          options={[
                            { value: 'available', label: 'Available' },
                            { value: 'occupied', label: 'Occupied' },
                            { value: 'maintenance', label: 'Maintenance' },
                          ]}
                          onChange={(e) => handleStatusChange(local, e.target.value)}
                        />
                      </td>
                      <td className="p-3 flex justify-center gap-2">
                        <Button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                          onClick={() => handleEditClick(local)}
                        >
                          <FiEdit className="text-sm" /> Edit
                        </Button>
                        {local.deleted_at ? (
                          <Button
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                            onClick={() => handleRestore(local)}
                          >
                            <FiRefreshCcw className="text-sm" /> Restore
                          </Button>
                        ) : (
                          <Button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                            onClick={() => handleDelete(local)}
                          >
                            <FiTrash className="text-sm" /> Delete
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
          Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page <= 1}
            className={`px-3 py-1 rounded-md border text-xs font-medium transition ${page <= 1 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
          >
            ← Prev
          </button>
          <span className="px-2 text-gray-500 text-xs">{page}</span>
          <button
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page >= totalPages}
            className={`px-3 py-1 rounded-md border text-xs font-medium transition ${page >= totalPages ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal
          title={selectedLocal ? 'Edit Local' : 'Add New Local'}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              label="Reference Code"
              value={editData.reference_code}
              onChange={(e) => setEditData({ ...editData, reference_code: e.target.value })}
            />
            <Input
              label="Size (m²)"
              value={editData.size_m2}
              onChange={(e) => setEditData({ ...editData, size_m2: e.target.value })}
            />
            <Select
              label="Status"
              value={editData.status}
              options={[
                { value: 'available', label: 'Available' },
                { value: 'occupied', label: 'Occupied' },
                { value: 'maintenance', label: 'Maintenance' },
              ]}
              onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            />
            <Select
              label="Property"
              value={editData.property_id}
              options={properties.map(p => ({ value: p.id, label: p.name }))}
              onChange={(e) => setEditData({ ...editData, property_id: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LocalPage;
