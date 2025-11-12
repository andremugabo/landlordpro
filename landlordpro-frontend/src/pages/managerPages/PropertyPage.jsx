import React, { useEffect, useState, useMemo } from 'react';
import {
  getAllProperties,
  createProperty,
  deleteProperty
} from '../../services/propertyService';
import { Button, Modal, Input, Card } from '../../components';
import { FiPlus, FiTrash, FiSearch, FiLayers } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';
import { useNavigate } from 'react-router-dom';

const PropertyPage = () => {
  const [properties, setProperties] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState({ name: '', location: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isAdmin = user.role === 'admin';
  const isManager = user.role === 'manager';

  const navigate = useNavigate();

  const fetchProperties = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const data = await getAllProperties(pageNumber, 10);

      const { properties = [], totalPages = 1, page = 1 } = data;

      if (properties.length === 0 && pageNumber > 1) {
        return fetchProperties(pageNumber - 1);
      }

      setProperties(properties);
      setTotalPages(totalPages);
      setPage(page);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setProperties([]);
      setTotalPages(1);
      setPage(1);
      showError(err?.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(page);
  }, [page]);

  const handleSubmit = async () => {
    const { name, location, description } = editData;

    if (!name?.trim() || !location?.trim()) {
      showError('Name and location are required.');
      return;
    }

    try {
      await createProperty({ name, location, description });
      showSuccess('Property added successfully!');
      setPage(1);
      fetchProperties(1);
      setModalOpen(false);
      setEditData({ name: '', location: '', description: '' });
    } catch (err) {
      showError(err?.message || 'Failed to add property');
    }
  };

  const handleDelete = async (property) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;

    try {
      await deleteProperty(property.id);
      showInfo('Property deleted successfully.');
      fetchProperties(page);
    } catch (err) {
      showError(err?.message || 'Failed to delete property');
    }
  };

  const filteredProperties = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    return properties.filter(p =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [properties, searchTerm]);

  // Permissions
  const canAdd = isAdmin || isManager;
  const canEdit = isAdmin;  // Only admin can edit
  const canDelete = isAdmin; // Only admin can delete

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Properties Management</h1>
          <p className="text-sm text-gray-500">
            {isAdmin ? 'Manage all properties' : 'View and add your properties'}
          </p>
        </div>

        {/* Add Button: Admin or Manager */}
        {canAdd && (
          <Button
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm transition w-full sm:w-auto justify-center"
            onClick={() => {
              setEditData({ name: '', location: '', description: '' });
              setModalOpen(true);
            }}
          >
            <FiPlus className="text-base" />
            <span>Add Property</span>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search by name, location, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg"
        />
      </div>

      {/* Property List */}
      <div className="grid gap-4">
        <Card className="bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading properties...</div>
          ) : (
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3 font-semibold text-left">Name</th>
                  <th className="p-3 font-semibold text-left">Location</th>
                  <th className="p-3 font-semibold text-left">Description</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td
                      colSpan={(canEdit || canDelete) ? 4 : 3}
                      className="p-6 text-center text-gray-500"
                    >
                      {searchTerm
                        ? 'No properties match your search'
                        : (isManager
                            ? 'You have no properties yet. Click "Add Property" to get started.'
                            : 'No properties found')
                      }
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map(property => (
                    <tr key={property.id} className="hover:bg-gray-50 transition-colors border-b">
                      <td className="p-3 font-medium text-gray-800">{property.name}</td>
                      <td className="p-3">{property.location}</td>
                      <td className="p-3">{property.description || '-'}</td>
                      <td className="p-3">
                        <Button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                          onClick={() => navigate(`/manager/properties/${property.id}/floors`)}
                        >
                          <FiLayers className="text-sm" /> Floors
                        </Button>
                      </td>

                      {/* Actions: Only Admin */}
                      {(canEdit || canDelete) && (
                        <td className="p-3 flex justify-center gap-2">
                          {canEdit && (
                            <Button
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                              onClick={() => {
                                // Edit is disabled for manager → no action
                              }}
                              disabled={!canEdit}
                            >
                              <FiEdit className="text-sm" /> Edit
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                              onClick={() => handleDelete(property)}
                            >
                              <FiTrash className="text-sm" /> Delete
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-600 rounded-lg shadow-sm">
          <div className="text-gray-500">
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
              Prev
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
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add Only (Admin or Manager) */}
      {modalOpen && canAdd && (
        <Modal
          title="Add New Property"
          onClose={() => {
            setModalOpen(false);
            setEditData({ name: '', location: '', description: '' });
          }}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              label="Name"
              placeholder="e.g. Kigali Heights"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
            <Input
              label="Location"
              placeholder="e.g. Nyarutarama, Kigali"
              value={editData.location}
              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
            />
            <Input
              label="Description (Optional)"
              placeholder="Brief description of the property"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PropertyPage;