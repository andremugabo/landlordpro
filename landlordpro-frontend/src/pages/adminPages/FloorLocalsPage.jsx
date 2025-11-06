import React, { useEffect, useState, useMemo } from 'react';
import { 
  getFloorById,
  getFloorOccupancy,
  extractFloorsData 
} from '../../services/floorService';
import { Button, Modal, Input, Card, Badge } from '../../components';
import { FiArrowLeft, FiHome, FiLayers, FiEdit, FiTrash, FiPlus, FiSearch } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

const FloorLocalsPage = () => {
  const { floorId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [floor, setFloor] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [locals, setLocals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [editData, setEditData] = useState({ 
    local_number: '', 
    area: '', 
    rent_price: '', 
    status: 'available' 
  });

  // Get property info from URL params (passed from PropertyFloorsPage)
  const propertyId = searchParams.get('propertyId');
  const propertyName = searchParams.get('propertyName');
  const floorNameFromUrl = searchParams.get('floorName');

  const fetchFloorData = async () => {
    try {
      setLoading(true);
      
      // Fetch floor details
      const floorResponse = await getFloorById(floorId);
      const floorData = floorResponse.data;
      setFloor(floorData);
      setLocals(floorData.locals || []);

      // Fetch occupancy report
      const occupancyResponse = await getFloorOccupancy(floorId);
      setOccupancy(occupancyResponse.data);

    } catch (err) {
      console.error('Error fetching floor data:', err);
      showError(err?.message || 'Failed to fetch floor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (floorId) {
      fetchFloorData();
    }
  }, [floorId]);

  const handleBackToFloors = () => {
    if (propertyId && propertyName) {
      navigate(`/admin/properties/${propertyId}/floors`);
    } else {
      navigate('/admin/floors');
    }
  };

  const handleEditLocal = (local) => {
    setSelectedLocal(local);
    setEditData({
      local_number: local.local_number || '',
      area: local.area || '',
      rent_price: local.rent_price || '',
      status: local.status || 'available'
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    // TODO: Implement local update logic
    console.log('Update local:', selectedLocal?.id, editData);
    showSuccess('Local update functionality to be implemented');
    setModalOpen(false);
  };

  const handleDeleteLocal = async (local) => {
    if (!window.confirm(`Are you sure you want to delete local "${local.local_number}"?`)) return;
    // TODO: Implement local delete logic
    console.log('Delete local:', local.id);
    showInfo('Local delete functionality to be implemented');
  };

  const handleAddLocal = () => {
    // TODO: Implement add local logic
    showInfo('Add local functionality to be implemented');
  };

  // Filter locals based on search term
  const filteredLocals = useMemo(() => {
    if (!Array.isArray(locals)) return [];
    
    if (!searchTerm.trim()) return locals;
    
    const searchLower = searchTerm.toLowerCase();
    return locals.filter(local =>
      local.local_number?.toLowerCase().includes(searchLower) ||
      local.status?.toLowerCase().includes(searchLower)
    );
  }, [locals, searchTerm]);

  // Calculate local statistics
  const localStats = useMemo(() => {
    const total = locals.length;
    const occupied = locals.filter(l => l.status === 'occupied').length;
    const available = locals.filter(l => l.status === 'available').length;
    const maintenance = locals.filter(l => l.status === 'maintenance').length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { total, occupied, available, maintenance, occupancyRate };
  }, [locals]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-green-100 text-green-800';
      case 'available': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'occupied': return 'Occupied';
      case 'available': return 'Available';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-12 px-3 sm:px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">Loading locals...</div>
        </div>
      </div>
    );
  }

  if (!floor) {
    return (
      <div className="min-h-screen pt-12 px-3 sm:px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500">Floor not found</div>
          <Button
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={handleBackToFloors}
          >
            <FiArrowLeft className="mr-2" />
            Back to Floors
          </Button>
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
            onClick={handleBackToFloors}
          >
            <FiArrowLeft className="text-base" />
            Back to Floors
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <FiHome className="text-blue-500" />
              <span>{propertyName || floor.property_name}</span>
              <FiLayers className="text-blue-500 ml-2" />
              <span>Floor {floor.level_number}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
              {floorNameFromUrl || floor.name} - Locals
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and view all locals on this floor
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{localStats.total}</div>
            <div className="text-sm text-blue-700">Total Locals</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="text-2xl font-bold text-green-600">{localStats.occupied}</div>
            <div className="text-sm text-green-700">Occupied</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{localStats.available}</div>
            <div className="text-sm text-blue-700">Available</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <div className="text-2xl font-bold text-red-600">{localStats.maintenance}</div>
            <div className="text-sm text-red-700">Maintenance</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="text-2xl font-bold text-purple-600">{localStats.occupancyRate}%</div>
            <div className="text-sm text-purple-700">Occupancy Rate</div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search locals by number or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full border-gray-300 rounded-lg"
          />
        </div>
        
        <Button
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 w-full sm:w-auto justify-center"
          onClick={handleAddLocal}
        >
          <FiPlus className="text-base" />
          Add Local
        </Button>
      </div>

      {/* Locals Grid */}
      <div className="grid gap-6">
        {filteredLocals.length === 0 ? (
          <Card className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
            <FiLayers className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {locals.length === 0 ? 'No Locals Found' : 'No Locals Match Your Search'}
            </h3>
            <p className="text-gray-600 mb-4">
              {locals.length === 0 
                ? 'This floor doesn\'t have any locals yet. Add locals to start managing this floor.'
                : 'Try adjusting your search terms to find the local you\'re looking for.'
              }
            </p>
            {locals.length === 0 && (
              <Button
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={handleAddLocal}
              >
                <FiPlus className="mr-2" />
                Add First Local
              </Button>
            )}
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="p-4 font-semibold text-left">Local Number</th>
                    <th className="p-4 font-semibold text-left">Status</th>
                    <th className="p-4 font-semibold text-left">Area (m²)</th>
                    <th className="p-4 font-semibold text-left">Rent Price</th>
                    <th className="p-4 font-semibold text-left">Last Updated</th>
                    <th className="p-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocals.map(local => (
                    <tr key={local.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <td className="p-4 font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <FiLayers className="text-blue-500" />
                          {local.local_number || `LOC-${local.id.substring(0, 8)}`}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge 
                          className={getStatusColor(local.status)}
                          text={getStatusText(local.status)}
                        />
                      </td>
                      <td className="p-4">
                        {local.area ? `${local.area} m²` : '-'}
                      </td>
                      <td className="p-4">
                        {local.rent_price ? `$${local.rent_price}` : '-'}
                      </td>
                      <td className="p-4 text-gray-500">
                        {local.updatedAt ? new Date(local.updatedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                            onClick={() => handleEditLocal(local)}
                          >
                            <FiEdit className="text-sm" /> Edit
                          </Button>
                          <Button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                            onClick={() => handleDeleteLocal(local)}
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
              {filteredLocals.map(local => (
                <Card key={local.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <FiLayers className="text-blue-500" />
                      <span className="font-medium text-gray-800">
                        {local.local_number || `LOC-${local.id.substring(0, 8)}`}
                      </span>
                    </div>
                    <Badge 
                      className={getStatusColor(local.status)}
                      text={getStatusText(local.status)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <div className="text-gray-500">Area</div>
                      <div className="font-medium">{local.area ? `${local.area} m²` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Rent Price</div>
                      <div className="font-medium">{local.rent_price ? `$${local.rent_price}` : '-'}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-500">Last Updated</div>
                      <div className="font-medium text-gray-600">
                        {local.updatedAt ? new Date(local.updatedAt).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs flex-1 flex items-center justify-center gap-1"
                      onClick={() => handleEditLocal(local)}
                    >
                      <FiEdit className="text-sm" /> Edit
                    </Button>
                    <Button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1"
                      onClick={() => handleDeleteLocal(local)}
                    >
                      <FiTrash className="text-sm" /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Local Modal */}
      {modalOpen && (
        <Modal
          title={`Edit Local - ${selectedLocal?.local_number}`}
          onClose={() => {
            setModalOpen(false);
            setSelectedLocal(null);
            setEditData({ local_number: '', area: '', rent_price: '', status: 'available' });
          }}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              label="Local Number"
              value={editData.local_number}
              onChange={(e) => setEditData({ ...editData, local_number: e.target.value })}
              placeholder="Enter local number (e.g., A-101)"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Area (m²)"
                type="number"
                value={editData.area}
                onChange={(e) => setEditData({ ...editData, area: e.target.value })}
                placeholder="Enter area"
              />
              <Input
                label="Rent Price ($)"
                type="number"
                value={editData.rent_price}
                onChange={(e) => setEditData({ ...editData, rent_price: e.target.value })}
                placeholder="Enter rent price"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Status
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FloorLocalsPage;