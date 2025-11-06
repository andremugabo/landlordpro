import React, { useEffect, useState, useMemo } from 'react';
import { 
  getFloorsByPropertyId,
  getFloorsWithStats,
  updateFloor, 
  deleteFloor,
  extractFloorsData 
} from '../../services/floorService';
import { Button, Modal, Input, Card } from '../../components';
import { FiEdit, FiTrash, FiArrowLeft, FiLayers, FiHome } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';
import { useParams, useNavigate } from 'react-router-dom';

const PropertyFloorsPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  
  const [floors, setFloors] = useState([]);
  const [propertyInfo, setPropertyInfo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [editData, setEditData] = useState({ name: '', level_number: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const fetchPropertyFloors = async () => {
    try {
      setLoading(true);
      const response = await getFloorsByPropertyId(propertyId);
      
      const floorsData = extractFloorsData(response);
      setFloors(floorsData);
      
      // Extract property info from the first floor (all floors belong to same property)
      if (floorsData.length > 0 && response.property) {
        setPropertyInfo(response.property);
      }
    } catch (err) {
      console.error('Error fetching property floors:', err);
      showError(err?.message || 'Failed to fetch floors for this property');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (propertyId) {
      fetchPropertyFloors();
    }
  }, [propertyId]);

  const handleEditClick = (floor) => {
    setSelectedFloor(floor);
    setEditData({ 
      name: floor.name, 
      level_number: floor.level_number
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const { name, level_number } = editData;
    if (!name?.trim()) {
      showError('Floor name is required.');
      return;
    }
    try {
      if (selectedFloor) {
        await updateFloor(selectedFloor.id, {
          name: name.trim(),
          level_number: parseInt(level_number),
        });
        showSuccess('Floor updated successfully!');
        fetchPropertyFloors();
      }
      setModalOpen(false);
      setSelectedFloor(null);
      setEditData({ name: '', level_number: 0 });
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Failed to save floor');
    }
  };

  const handleDelete = async (floor) => {
    if (!window.confirm(`Are you sure you want to delete "${floor.name}"?`)) return;
    try {
      await deleteFloor(floor.id);
      showInfo('Floor deleted successfully.');
      fetchPropertyFloors();
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Failed to delete floor');
    }
  };

  const handleBackToProperties = () => {
    navigate('/admin/properties');
  };

  const handleViewLocals = (floor) => {
    navigate(`/admin/floors/${floor.id}/locals?propertyId=${propertyId}&propertyName=${encodeURIComponent(propertyInfo?.name || '')}&floorName=${encodeURIComponent(floor.name)}`);
  };

  // Paginated floors
  const paginatedFloors = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return floors.slice(startIndex, startIndex + limit);
  }, [floors, page, limit]);

  const totalPages = Math.ceil(floors.length / limit);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalLocals = floors.reduce((sum, floor) => sum + (floor.locals_count || 0), 0);
    const occupied = floors.reduce((sum, floor) => sum + (floor.occupancy?.occupied || 0), 0);
    const available = floors.reduce((sum, floor) => sum + (floor.occupancy?.available || 0), 0);
    const maintenance = floors.reduce((sum, floor) => sum + (floor.occupancy?.maintenance || 0), 0);
    
    const occupancyRate = totalLocals > 0 ? Math.round((occupied / totalLocals) * 100) : 0;

    return {
      totalLocals,
      occupied,
      available,
      maintenance,
      occupancyRate
    };
  }, [floors]);

  if (loading) {
    return (
      <div className="min-h-screen pt-12 px-3 sm:px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">Loading floors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-12 px-3 sm:px-6 bg-gray-50">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md flex items-center gap-2"
            onClick={handleBackToProperties}
          >
            <FiArrowLeft className="text-base" />
            Back to Properties
          </Button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <FiHome className="text-blue-500" />
              {propertyInfo?.name || 'Property'} Floors
            </h1>
            {propertyInfo?.location && (
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Location:</span> {propertyInfo.location}
              </p>
            )}
          </div>
        </div>

        {/* Property Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{floors.length}</div>
            <div className="text-sm text-blue-700">Total Floors</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="text-2xl font-bold text-green-600">{stats.totalLocals}</div>
            <div className="text-sm text-green-700">Total Locals</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="text-2xl font-bold text-purple-600">{stats.occupied}</div>
            <div className="text-sm text-purple-700">Occupied</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <div className="text-2xl font-bold text-orange-600">{stats.available}</div>
            <div className="text-sm text-orange-700">Available</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <div className="text-2xl font-bold text-red-600">{stats.occupancyRate}%</div>
            <div className="text-sm text-red-700">Occupancy Rate</div>
          </div>
        </div>
      </div>

      {/* Floors Grid */}
      <div className="grid gap-6">
        {floors.length === 0 ? (
          <Card className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
            <FiLayers className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Floors Found</h3>
            <p className="text-gray-600 mb-4">
              This property doesn't have any floors yet. Floors are automatically created when you specify the number of floors for a property.
            </p>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="p-4 font-semibold text-left">Floor Name</th>
                    <th className="p-4 font-semibold text-left">Level</th>
                    <th className="p-4 font-semibold text-left">Total Locals</th>
                    <th className="p-4 font-semibold text-left">Occupied</th>
                    <th className="p-4 font-semibold text-left">Available</th>
                    <th className="p-4 font-semibold text-left">Maintenance</th>
                    <th className="p-4 font-semibold text-left">Occupancy</th>
                    <th className="p-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFloors.map(floor => (
                    <tr key={floor.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <FiLayers className="text-blue-500" />
                          {floor.name}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                          Level {floor.level_number}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{floor.locals_count || 0}</td>
                      <td className="p-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          {floor.occupancy?.occupied || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {floor.occupancy?.available || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                          {floor.occupancy?.maintenance || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          (floor.occupancy_rate || 0) >= 70 ? 'bg-green-100 text-green-800' :
                          (floor.occupancy_rate || 0) >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {floor.occupancy_rate || 0}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                            onClick={() => handleViewLocals(floor)}
                          >
                            <FiLayers className="text-sm" /> Locals
                          </Button>
                          <Button
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                            onClick={() => handleEditClick(floor)}
                          >
                            <FiEdit className="text-sm" /> Edit
                          </Button>
                          <Button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                            onClick={() => handleDelete(floor)}
                          >
                            <FiTrash className="text-sm" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid gap-4">
              {paginatedFloors.map(floor => (
                <Card key={floor.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <FiLayers className="text-blue-500" />
                      <span className="font-medium text-gray-800">{floor.name}</span>
                    </div>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                      Level {floor.level_number}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <div className="text-gray-500">Total Locals</div>
                      <div className="font-medium">{floor.locals_count || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Occupied</div>
                      <div className="font-medium text-green-600">{floor.occupancy?.occupied || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Available</div>
                      <div className="font-medium text-blue-600">{floor.occupancy?.available || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Maintenance</div>
                      <div className="font-medium text-red-600">{floor.occupancy?.maintenance || 0}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-500">Occupancy Rate</div>
                      <div className={`font-medium ${
                        (floor.occupancy_rate || 0) >= 70 ? 'text-green-600' :
                        (floor.occupancy_rate || 0) >= 40 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {floor.occupancy_rate || 0}%
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs flex-1 flex items-center justify-center gap-1"
                      onClick={() => handleViewLocals(floor)}
                    >
                      <FiLayers className="text-sm" /> View Locals
                    </Button>
                    <Button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                      onClick={() => handleEditClick(floor)}
                    >
                      <FiEdit className="text-sm" />
                    </Button>
                    <Button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                      onClick={() => handleDelete(floor)}
                    >
                      <FiTrash className="text-sm" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {floors.length > limit && (
              <div className="flex justify-between items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-600 rounded-lg shadow-sm">
                <div className="text-gray-500">
                  Showing <span className="font-medium">{paginatedFloors.length}</span> of{' '}
                  <span className="font-medium">{floors.length}</span> floors
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
                    Page {page} of {totalPages}
                  </span>
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
          </>
        )}
      </div>

      {/* Edit Floor Modal */}
      {modalOpen && (
        <Modal
          title="Edit Floor"
          onClose={() => {
            setModalOpen(false);
            setSelectedFloor(null);
            setEditData({ name: '', level_number: 0 });
          }}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              label="Floor Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="Enter floor name"
            />
            <Input
              label="Level Number"
              type="number"
              value={editData.level_number}
              onChange={(e) => setEditData({ ...editData, level_number: parseInt(e.target.value) || 0 })}
              placeholder="Enter level number"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PropertyFloorsPage;