import React, { useEffect, useState, useMemo } from 'react';
import { 
  getAllProperties, 
  createProperty, 
  updateProperty 
} from '../../services/propertyService';
import { getAllManagers } from '../../services/userService';
import { Button, Modal, Input, Card, Checkbox } from '../../components';
import { FiEdit, FiPlus, FiSearch, FiLayers } from 'react-icons/fi';
import { showSuccess, showError } from '../../utils/toastHelper';
import { useNavigate } from 'react-router-dom';

const PropertyPage = () => {
  const [properties, setProperties] = useState([]);
  const [managers, setManagers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editData, setEditData] = useState({ 
    name: '', 
    location: '', 
    description: '', 
    number_of_floors: 1, 
    has_basement: false,
    manager_id: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const navigate = useNavigate();

  // Fetch properties
  const fetchProperties = async (pageNumber = page) => {
    try {
      setLoading(true);
      const data = await getAllProperties(pageNumber, 10);
      const propertiesArray = data?.properties || [];
      const totalPagesCount = data?.totalPages || 1;
      const currentPage = data?.page || pageNumber;

      if (propertiesArray.length === 0 && pageNumber > 1) {
        return fetchProperties(pageNumber - 1);
      }

      setProperties(propertiesArray);
      setTotalPages(totalPagesCount);
      setPage(currentPage);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setProperties([]);
      setTotalPages(1);
      setPage(1);
      showError(err?.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  // Fetch managers
  const fetchManagers = async () => {
    try {
      const data = await getAllManagers();
      setManagers(data || []);
    } catch (err) {
      showError('Failed to fetch managers');
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchManagers();
  }, []);

  const handleEditClick = (property) => {
    setSelectedProperty(property);
    setEditData({ 
      name: property.name || '', 
      location: property.location || '', 
      description: property.description || '', 
      number_of_floors: property.number_of_floors || 1, 
      has_basement: property.has_basement || false,
      manager_id: property.manager_id || ''
    });
    setModalOpen(true);
  };

  const handleViewFloors = (property) => {
    navigate(`/admin/properties/${property.id}/floors`);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    const { name, location, description, number_of_floors, has_basement, manager_id } = editData;

    if (!name?.trim() || !location?.trim()) {
      showError('Name and location are required.');
      return;
    }

    if (number_of_floors < 1) {
      showError('Number of floors must be at least 1.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        location: location.trim(),
        description: description?.trim() || null,
        number_of_floors: parseInt(number_of_floors) || 1,
        has_basement: Boolean(has_basement),
        manager_id: manager_id || null // assign manager
      };

      if (selectedProperty) {
        await updateProperty(selectedProperty.id, payload);
        showSuccess('Property updated successfully!');
      } else {
        await createProperty(payload);
        showSuccess('Property added successfully!');
        setPage(1);
      }

      await fetchProperties(selectedProperty ? page : 1);
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Property submit error:', err);
      showError(err?.message || err?.response?.data?.message || 'Failed to save property');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProperty(null);
    setEditData({
      name: '',
      location: '',
      description: '',
      number_of_floors: 1,
      has_basement: false,
      manager_id: ''
    });
  };

  const filteredProperties = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    if (!searchTerm.trim()) return properties;
    const searchLower = searchTerm.toLowerCase();
    return properties.filter(p =>
      p.name?.toLowerCase().includes(searchLower) ||
      p.location?.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower)
    );
  }, [properties, searchTerm]);

  const handleModalClose = () => {
    setModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Properties Management</h1>
          <p className="text-sm text-gray-500">View, add, or manage properties</p>
        </div>
        <Button
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow-sm transition w-full sm:w-auto justify-center"
          onClick={() => setModalOpen(true)}
        >
          <FiPlus className="text-base" />
          <span>Add Property</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search by name, location, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg text-white"
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
                  <th className="p-3 font-semibold text-left">Floors</th>
                  <th className="p-3 font-semibold text-left">Basement</th>
                  <th className="p-3 font-semibold text-left">Manager</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-500">
                      {properties.length === 0 ? 'No properties found' : 'No properties match your search'}
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map(property => {
                    const manager = managers.find(m => m.id === property.manager_id);
                    const rowClass = `hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                      !manager ? 'bg-red-50' : ''
                    }`;

                    return (
                      <tr key={property.id} className={rowClass}>
                        <td className="p-3 font-medium text-gray-800">{property.name}</td>
                        <td className="p-3">{property.location}</td>
                        <td className="p-3 max-w-xs truncate" title={property.description}>
                          {property.description || '-'}
                        </td>
                        <td className="p-3 text-center">{property.number_of_floors}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            property.has_basement 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {property.has_basement ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="p-3 text-center">{manager ? manager.full_name : '—'}</td>
                        <td className="p-3 flex justify-center gap-2">
                          <Button
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1 transition-colors"
                            onClick={() => handleViewFloors(property)}
                            title={`View floors for ${property.name}`}
                          >
                            <FiLayers className="text-sm" /> Floors
                          </Button>
                          <Button
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1 transition-colors"
                            onClick={() => handleEditClick(property)}
                          >
                            <FiEdit className="text-sm" /> Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Pagination */}
      {!loading && properties.length > 0 && (
        <div className="flex justify-between items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-600 rounded-lg shadow-sm">
          <div className="text-gray-500">
            Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
            <span className="ml-2">({properties.length} properties)</span>
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
            <span className="px-2 text-gray-500 text-xs">Page {page}</span>
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
          title={selectedProperty ? 'Edit Property' : 'Add New Property'}
          onClose={handleModalClose}
          onSubmit={handleSubmit}
          submitText={submitting ? (selectedProperty ? 'Updating...' : 'Creating...') : (selectedProperty ? 'Update' : 'Create')}
          disabled={submitting}
        >
          <div className="space-y-4">
            <Input
              label="Name *"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="Enter property name"
              required
            />
            <Input
              label="Location *"
              value={editData.location}
              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              placeholder="Enter property location"
              required
            />
            <Input
              label="Description"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Enter property description (optional)"
            />

            {/* Number of Floors Dropdown */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Number of Floors *
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editData.number_of_floors}
                onChange={(e) => setEditData({ ...editData, number_of_floors: parseInt(e.target.value) || 1 })}
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1} {i === 0 ? '(Ground Floor only)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Has Basement Checkbox */}
            <Checkbox
              label="Has Basement"
              checked={editData.has_basement}
              onChange={(e) => setEditData({ ...editData, has_basement: e.target.checked })}
            />

            {/* Assign Manager Dropdown */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Assign Manager
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editData.manager_id || ''}
                onChange={(e) => setEditData({ ...editData, manager_id: e.target.value })}
              >
                <option value="">-- Select a manager --</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PropertyPage;
