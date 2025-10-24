import React, { useEffect, useState, useMemo } from 'react';
import { 
  getAllProperties, 
  createProperty, 
  updateProperty, 
  deleteProperty 
} from '../../services/propertyService';
import { Button, Modal, Input, Card, Checkbox } from '../../components';
import { FiEdit, FiPlus, FiTrash, FiSearch } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

const PropertyPage = () => {
  const [properties, setProperties] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editData, setEditData] = useState({ 
    name: '', 
    location: '', 
    description: '', 
    number_of_floors: 1, 
    has_basement: false 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch properties
  const fetchProperties = async (pageNumber = page) => {
    try {
      setLoading(true);
      const data = await getAllProperties(pageNumber, 10);
      const { properties, totalPages, page } = data;

      if (properties.length === 0 && pageNumber > 1) return fetchProperties(pageNumber - 1);

      setProperties(properties);
      setTotalPages(totalPages);
      setPage(page);
    } catch (err) {
      console.error(err);
      setProperties([]);
      setTotalPages(1);
      setPage(1);
      showError(err?.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page]);

  // Open modal for edit
  const handleEditClick = (property) => {
    setSelectedProperty(property);
    setEditData({ 
      name: property.name, 
      location: property.location, 
      description: property.description || '', 
      number_of_floors: property.number_of_floors || 1, 
      has_basement: property.has_basement || false 
    });
    setModalOpen(true);
  };

  // Submit create/update
  // Submit create/update
const handleSubmit = async () => {
  const { name, location, description, number_of_floors, has_basement } = editData;

  // ✅ Frontend validation
  if (!name?.trim() || !location?.trim()) {
    showError('Name and location are required.');
    return;
  }

  if (number_of_floors < 1) {
    showError('Number of floors must be at least 1.');
    return;
  }

  try {
    // Build payload exactly matching the Joi schema
    const payload = {
      name: name.trim(),
      location: location.trim(),
      description: description?.trim() || null, // optional
      number_of_floors: parseInt(number_of_floors) || 1, // integer >=1
      has_basement: Boolean(has_basement), // boolean
    };

    if (selectedProperty) {
      // Update
      await updateProperty(selectedProperty.id, payload);
      showSuccess('Property updated successfully!');
    } else {
      // Create
      await createProperty(payload);
      showSuccess('Property added successfully!');
      setPage(1);
    }

    fetchProperties(page);
    setModalOpen(false);
    setSelectedProperty(null);
    setEditData({
      name: '',
      location: '',
      description: '',
      number_of_floors: 1,
      has_basement: false
    });
  } catch (err) {
    console.error('Property submit error:', err);
    showError(err?.response?.data?.message || err?.message || 'Failed to save property');
  }
};


  // Delete property
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

  // Filter properties by search term
  const filteredProperties = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    return properties.filter(p =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [properties, searchTerm]);

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
          onClick={() => {
            setSelectedProperty(null);
            setEditData({ name: '', location: '', description: '', number_of_floors: 1, has_basement: false });
            setModalOpen(true);
          }}
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
                  <th className="p-3 font-semibold text-left">Floors</th>
                  <th className="p-3 font-semibold text-left">Basement</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">
                      No properties found
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map(property => (
                    <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{property.name}</td>
                      <td className="p-3">{property.location}</td>
                      <td className="p-3">{property.description || '-'}</td>
                      <td className="p-3 text-center">{property.number_of_floors}</td>
                      <td className="p-3 text-center">{property.has_basement ? 'Yes' : 'No'}</td>
                      <td className="p-3 flex justify-center gap-2">
                        <Button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                          onClick={() => handleEditClick(property)}
                        >
                          <FiEdit className="text-sm" /> Edit
                        </Button>
                        <Button
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                          onClick={() => handleDelete(property)}
                        >
                          <FiTrash className="text-sm" /> Delete
                        </Button>
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
            title={selectedProperty ? 'Edit Property' : 'Add New Property'}
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
                label="Location"
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              />
              <Input
                label="Description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />

              {/* Number of Floors Dropdown */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Number of Floors</label>
                <select
                  className="w-full border-gray-300 rounded-lg p-2"
                  value={editData.number_of_floors}
                  onChange={(e) => setEditData({ ...editData, number_of_floors: parseInt(e.target.value) || 1 })}
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={i + 1}>{i + 1} {i === 0 ? '(Ground Floor only)' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Has Basement Checkbox */}
              <Checkbox
                label="Has Basement"
                checked={editData.has_basement}
                onChange={(e) => setEditData({ ...editData, has_basement: e.target.checked })}
              />
            </div>
          </Modal>
        )}

    </div>
  );
};

export default PropertyPage;
