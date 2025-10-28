import React, { useEffect, useState, useMemo } from 'react';
import { 
  getAllFloors, 
  updateFloor, 
  deleteFloor, 
  getAllFloorsOccupancy 
} from '../../services/floorService';
import { Button, Modal, Input, Card } from '../../components';
import { FiEdit, FiTrash, FiSearch } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';

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
  const [totalPages, setTotalPages] = useState(1);

  // Fetch floors with occupancy reports
  const fetchFloors = async () => {
    try {
      setLoading(true);
      const data = await getAllFloors();
      setFloors(data);

      const reports = await getAllFloorsOccupancy();
      const reportsMap = {};
      reports.forEach(r => { reportsMap[r.floor_id] = r; });
      setOccupancyReports(reportsMap);

      setTotalPages(Math.ceil(data.length / limit));
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Failed to fetch floors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloors();
  }, []);

  // Open modal for edit
  const handleEditClick = (floor) => {
    setSelectedFloor(floor);
    setEditData({ 
      name: floor.name, 
      level_number: floor.level_number, 
      property_id: floor.property_id 
    });
    setModalOpen(true);
  };

  // Submit update
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

  // Delete floor
  const handleDelete = async (floor) => {
    if (!window.confirm('Are you sure you want to delete this floor?')) return;

    try {
      await deleteFloor(floor.id);
      showInfo('Floor deleted successfully.');
      fetchFloors();
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Failed to delete floor');
    }
  };

  // Filter floors by search term
  const filteredFloors = useMemo(() => {
    if (!Array.isArray(floors)) return [];
    return floors.filter(f =>
      f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.propertyForFloor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice((page - 1) * limit, page * limit);
  }, [floors, searchTerm, page, limit]);

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Floors Management</h1>
          <p className="text-sm text-gray-500">View, update, or manage floors</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full mb-4">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search by floor name or property..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full border-gray-300 rounded-lg"
        />
      </div>

      {/* Floor List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-md border border-gray-100">
            Loading floors...
          </div>
        ) : filteredFloors.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-md border border-gray-100">
            No floors found
          </div>
        ) : (
          filteredFloors.map(floor => {
            const report = occupancyReports[floor.id] || {};
            return (
              <Card key={floor.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                  <div className="text-gray-800 font-medium">{floor.name}</div>
                  <div className="text-gray-600 text-sm">Level: {floor.level_number}</div>
                  <div className="text-gray-600 text-sm">Property: {floor?.property_name || '-'}</div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-600 text-sm">
                  <div>Total Locals: {report.total_locals || 0}</div>
                  <div>Occupied: {report.occupied || 0}</div>
                  <div>Available: {report.available || 0}</div>
                  <div>Maintenance: {report.maintenance || 0}</div>
                  <div>Occupancy: {report.occupancy_rate ?? 0}%</div>
                </div>

                <div className="flex gap-2 justify-end">
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
              </Card>
            );
          })
        )}
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
          title={selectedFloor ? 'Edit Floor' : 'Add New Floor'}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              label="Floor Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
            <Input
              label="Level Number"
              type="number"
              value={editData.level_number}
              onChange={(e) => setEditData({ ...editData, level_number: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Property ID"
              value={editData.property_id}
              onChange={(e) => setEditData({ ...editData, property_id: e.target.value })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FloorPage;
