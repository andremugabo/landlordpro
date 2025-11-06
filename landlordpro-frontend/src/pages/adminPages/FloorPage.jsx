import React, { useEffect, useState, useMemo } from 'react';
import { 
  getAllFloors, 
  getFloorsByPropertyId,
  getFloorsWithStats,
  updateFloor, 
  deleteFloor, 
  getAllFloorsOccupancy,
  extractFloorsData 
} from '../../services/floorService';
import { Button, Modal, Input } from '../../components';
import { FiEdit, FiTrash, FiSearch, FiLayers, FiFilter, FiX } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';
import { useSearchParams } from 'react-router-dom';

const FloorPage = () => {
  const [floors, setFloors] = useState([]);
  const [occupancyReports, setOccupancyReports] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [editData, setEditData] = useState({ name: '', level_number: 0, property_id: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const propertyIdFromUrl = searchParams.get('propertyId');
  const propertyNameFromUrl = searchParams.get('propertyName');

  // Initialize property filter from URL
  useEffect(() => {
    if (propertyIdFromUrl && propertyNameFromUrl) {
      setSelectedProperty({
        id: propertyIdFromUrl,
        name: decodeURIComponent(propertyNameFromUrl)
      });
    }
  }, [propertyIdFromUrl, propertyNameFromUrl]);

  const fetchFloors = async () => {
    try {
      setLoading(true);
      
      let data;
      if (selectedProperty) {
        // Fetch floors for specific property
        const response = await getFloorsByPropertyId(selectedProperty.id);
        data = extractFloorsData(response);
      } else {
        // Fetch all floors
        const response = await getAllFloors();
        data = extractFloorsData(response);
      }

      setFloors(data);

      // Fetch occupancy reports with property filter
      const reportsResponse = await getAllFloorsOccupancy(
        selectedProperty ? { propertyId: selectedProperty.id } : {}
      );
      const reports = extractFloorsData(reportsResponse);
      const reportsMap = {};
      reports.forEach(r => { reportsMap[r.floor_id] = r; });
      setOccupancyReports(reportsMap);
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Failed to fetch floors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchFloors(); 
  }, [selectedProperty]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedProperty]);

  const handleEditClick = (floor) => {
    setSelectedFloor(floor);
    setEditData({ 
      name: floor.name, 
      level_number: floor.level_number, 
      property_id: floor.property_id 
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const { name, level_number, property_id } = editData;
    if (!name?.trim() || !property_id?.trim()) {
      showError('Name and Property ID are required.');
      return;
    }
    try {
      if (selectedFloor) {
        await updateFloor(selectedFloor.id, {
          name: name.trim(),
          level_number: parseInt(level_number),
          property_id: property_id.trim(),
        });
        showSuccess('Floor updated successfully!');
      } else {
        showError('Floor creation is not implemented yet.');
      }
      fetchFloors();
      setModalOpen(false);
      setSelectedFloor(null);
      setEditData({ name: '', level_number: 0, property_id: '' });
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
      fetchFloors();
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Failed to delete floor');
    }
  };

  const clearPropertyFilter = () => {
    setSelectedProperty(null);
    // Clear URL parameters
    setSearchParams({});
  };

  // Get filtered floors based on search term
  const filteredFloors = useMemo(() => {
    if (!Array.isArray(floors)) return [];
    
    let filtered = floors;
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(f =>
        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f?.property_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [floors, searchTerm]);

  // Get paginated floors
  const paginatedFloors = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredFloors.slice(startIndex, startIndex + limit);
  }, [filteredFloors, page, limit]);

  // Calculate total pages based on filtered results
  const totalPages = useMemo(() => {
    return Math.ceil(filteredFloors.length / limit);
  }, [filteredFloors.length, limit]);

  const totalFilteredCount = filteredFloors.length;

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            {selectedProperty ? `Floors - ${selectedProperty.name}` : 'Floors Management'}
          </h1>
          <p className="text-sm text-gray-500">
            {selectedProperty 
              ? `Viewing floors for ${selectedProperty.name}` 
              : 'View, update, or manage floors'
            }
          </p>
        </div>
        
        {/* Property Filter Badge */}
        {selectedProperty && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
            <FiFilter className="text-sm" />
            <span className="text-sm font-medium">Filtered by: {selectedProperty.name}</span>
            <button
              onClick={clearPropertyFilter}
              className="text-blue-500 hover:text-blue-700 ml-2"
              title="Clear filter"
            >
              <FiX className="text-sm" />
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full mb-4">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder={selectedProperty 
            ? `Search floors in ${selectedProperty.name}...` 
            : "Search by floor name or property..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg"
        />
      </div>

      {/* Stats Summary */}
      {!loading && floors.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-800">{floors.length}</div>
            <div className="text-sm text-gray-500">Total Floors</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">
              {floors.reduce((sum, floor) => sum + (floor.locals_count || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Locals</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(occupancyReports).reduce((sum, report) => sum + (report.occupied || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Occupied Locals</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-orange-600">
              {Object.values(occupancyReports).length > 0 
                ? Math.round(Object.values(occupancyReports).reduce((sum, report) => sum + (report.occupancy_rate || 0), 0) / Object.values(occupancyReports).length)
                : 0
              }%
            </div>
            <div className="text-sm text-gray-500">Avg Occupancy</div>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading floors...</div>
        ) : paginatedFloors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {floors.length === 0 
              ? selectedProperty 
                ? `No floors found for ${selectedProperty.name}` 
                : 'No floors found'
              : 'No floors match your search'
            }
          </div>
        ) : (
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
              <tr>
                <th className="p-3 font-semibold text-left">Name</th>
                <th className="p-3 font-semibold text-left">Level</th>
                {!selectedProperty && <th className="p-3 font-semibold text-left">Property</th>}
                <th className="p-3 font-semibold text-left">Total Locals</th>
                <th className="p-3 font-semibold text-left">Occupied</th>
                <th className="p-3 font-semibold text-left">Available</th>
                <th className="p-3 font-semibold text-left">Maintenance</th>
                <th className="p-3 font-semibold text-left">Occupancy %</th>
                <th className="p-3 font-semibold text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFloors.map(floor => {
                const report = occupancyReports[floor.id] || {};
                return (
                  <tr key={floor.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <td className="p-3 font-medium text-gray-800">{floor.name}</td>
                    <td className="p-3">{floor.level_number}</td>
                    {!selectedProperty && (
                      <td className="p-3">{floor?.property_name || '-'}</td>
                    )}
                    <td className="p-3">{report.total_locals || 0}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.occupied > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {report.occupied || 0}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.available > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {report.available || 0}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.maintenance > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {report.maintenance || 0}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (report.occupancy_rate || 0) >= 70 ? 'bg-green-100 text-green-800' :
                        (report.occupancy_rate || 0) >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {report.occupancy_rate ?? 0}%
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
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
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden grid gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-md border border-gray-100">
            Loading floors...
          </div>
        ) : paginatedFloors.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-md border border-gray-100">
            {floors.length === 0 
              ? selectedProperty 
                ? `No floors found for ${selectedProperty.name}` 
                : 'No floors found'
              : 'No floors match your search'
            }
          </div>
        ) : (
          paginatedFloors.map(floor => {
            const report = occupancyReports[floor.id] || {};
            return (
              <div key={floor.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-gray-800">{floor.name}</div>
                  <div className="flex gap-1">
                    <Button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleEditClick(floor)}
                    >
                      <FiEdit className="text-xs" />
                    </Button>
                    <Button
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleDelete(floor)}
                    >
                      <FiTrash className="text-xs" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Level: {floor.level_number}</div>
                  {!selectedProperty && <div>Property: {floor?.property_name || '-'}</div>}
                  <div>Total: {report.total_locals || 0}</div>
                  <div>Occupied: <span className="text-green-600">{report.occupied || 0}</span></div>
                  <div>Available: <span className="text-blue-600">{report.available || 0}</span></div>
                  <div>Maintenance: <span className="text-red-600">{report.maintenance || 0}</span></div>
                  <div className="col-span-2">
                    Occupancy: <span className={`font-medium ${
                      (report.occupancy_rate || 0) >= 70 ? 'text-green-600' :
                      (report.occupancy_rate || 0) >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {report.occupancy_rate ?? 0}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredFloors.length > 0 && (
        <div className="flex justify-between items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-600 rounded-lg shadow-sm">
          <div className="text-gray-500">
            Showing <span className="font-medium">{paginatedFloors.length}</span> of{' '}
            <span className="font-medium">{totalFilteredCount}</span> floors
            {selectedProperty && ` for ${selectedProperty.name}`}
            {searchTerm && ' (filtered)'}
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

      {/* Modal */}
      {modalOpen && (
        <Modal
          title={selectedFloor ? 'Edit Floor' : 'Add New Floor'}
          onClose={() => setModalOpen(false)}
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
            <Input
              label="Property ID"
              value={editData.property_id}
              onChange={(e) => setEditData({ ...editData, property_id: e.target.value })}
              placeholder="Enter property ID"
              disabled={!!selectedFloor} // Disable if editing existing floor
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FloorPage;