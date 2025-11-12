import React, { useEffect, useState, useMemo } from 'react';
import { 
  getFloorById,
  getFloorOccupancy,
  extractFloorsData 
} from '../../services/floorService';
import { Button, Modal, Input, Card, Badge } from '../../components';
import { FiArrowLeft, FiHome, FiLayers, FiEdit, FiTrash, FiPlus, FiSearch, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { createLocal, updateLocal, deleteLocal } from '../../services/localService';

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

  const propertyId = searchParams.get('propertyId');
  const propertyNameParam = searchParams.get('propertyName');
  const floorNameFromUrl = searchParams.get('floorName');

  const fetchFloorData = async () => {
    try {
      setLoading(true);
      
      const floorResponse = await getFloorById(floorId);
      const floorData = floorResponse.data;
      setFloor(floorData);
      const rawLocals = floorData.locals || floorData.locals_details || [];
      const filteredLocals = Array.isArray(rawLocals)
        ? rawLocals.filter((local) => String(local?.floor_id) === String(floorId))
        : [];
      setLocals(filteredLocals);

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

  const resolvedPropertyId = propertyId || floor?.property_id || floor?.propertyForFloor?.id;
  const resolvedPropertyName = propertyNameParam || floor?.propertyForFloor?.name || floor?.property_name;

  const handleBackToFloors = () => {
    if (resolvedPropertyId) {
      navigate(`/admin/properties/${resolvedPropertyId}/floors`);
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
    if (!editData.local_number?.trim()) {
      showError('Local number is required.');
      return;
    }

    try {
      if (selectedLocal) {
        await updateLocal(selectedLocal.id, {
          ...selectedLocal,
          local_number: editData.local_number.trim(),
          area: editData.area,
          rent_price: editData.rent_price,
          status: editData.status,
        });
        showSuccess('Local updated successfully.');
      } else {
        await createLocal({
          floor_id: floorId,
          local_number: editData.local_number.trim(),
          area: editData.area,
          rent_price: editData.rent_price,
          status: editData.status,
        });
        showSuccess('Local created successfully.');
      }
      setModalOpen(false);
      setSelectedLocal(null);
      setEditData({ local_number: '', area: '', rent_price: '', status: 'available' });
      fetchFloorData();
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Failed to save local');
    }
  };

  const handleDeleteLocal = async (local) => {
    if (!window.confirm(`Are you sure you want to delete local "${local.local_number}"?`)) return;
    try {
      await deleteLocal(local.id);
      showInfo('Local deleted successfully.');
      fetchFloorData();
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Failed to delete local');
    }
  };

  const handleAddLocal = () => {
    setSelectedLocal(null);
    setEditData({ local_number: '', area: '', rent_price: '', status: 'available' });
    setModalOpen(true);
  };

  const filteredLocals = useMemo(() => {
    if (!Array.isArray(locals)) return [];
    if (!searchTerm.trim()) return locals;
    const searchLower = searchTerm.toLowerCase();
    return locals.filter(local =>
      local.local_number?.toLowerCase().includes(searchLower) ||
      local.status?.toLowerCase().includes(searchLower)
    );
  }, [locals, searchTerm]);

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
      case 'occupied': return 'bg-emerald-100 text-emerald-700';
      case 'available': return 'bg-blue-100 text-blue-700';
      case 'maintenance': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
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

  const heroTitle = floorNameFromUrl || floor.name;
  const heroSubtitle = resolvedPropertyName || floor.property_name;

  return (
    <div className="min-h-screen pt-12 pb-12 px-3 sm:px-6 bg-slate-50">
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4 max-w-2xl">
            <Button
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 w-fit backdrop-blur"
              onClick={handleBackToFloors}
            >
              <FiArrowLeft /> Back to Floors
            </Button>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/70">Floor Overview</p>
              <h1 className="text-3xl md:text-4xl font-semibold mt-2 flex items-center gap-3">
                <FiLayers className="text-white/70" />
                {heroTitle}
              </h1>
              <p className="text-white/80 text-sm mt-2 flex items-center gap-2">
                <FiHome className="text-white/60" />
                {heroSubtitle}
              </p>
              <p className="text-white/60 text-xs mt-1">Level {floor.level_number}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 min-w-[220px] md:min-w-[260px]">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Total locals</span>
                <FiTrendingUp />
              </div>
              <p className="text-2xl font-semibold">{localStats.total}</p>
              <p className="text-xs text-white/60 mt-1">Units registered</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Occupied</span>
                <FiCheckCircle />
              </div>
              <p className="text-2xl font-semibold">{localStats.occupied}</p>
              <p className="text-xs text-white/60 mt-1">{localStats.occupancyRate}% occupancy</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Available</span>
                <FiTrendingUp />
              </div>
              <p className="text-2xl font-semibold">{localStats.available}</p>
              <p className="text-xs text-white/60 mt-1">Ready for lease</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Maintenance</span>
                <FiTrendingUp />
              </div>
              <p className="text-2xl font-semibold">{localStats.maintenance}</p>
              <p className="text-xs text-white/60 mt-1">Needs attention</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <Card className="w-full md:max-w-md p-4 border border-slate-200 shadow-sm">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search locals by number or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </Card>
        <Button
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 w-full md:w-auto justify-center"
          onClick={handleAddLocal}
        >
          <FiPlus className="text-base" /> Add Local
        </Button>
      </div>

      <div className="space-y-6">
        {filteredLocals.length === 0 ? (
          <Card className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
            <FiLayers className="text-5xl text-slate-300 mx-auto mb-5" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {locals.length === 0 ? 'No Locals Found' : 'No Locals Match Your Search'}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              {locals.length === 0 
                ? 'Use the “Add Local” button to create the first unit on this floor.'
                : 'Try adjusting your search terms to locate a specific local.'
              }
            </p>
            {locals.length === 0 && (
              <Button
                className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={handleAddLocal}
              >
                <FiPlus className="mr-2" /> Create Local
              </Button>
            )}
          </Card>
        ) : (
          <Card className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="p-4 text-left">Local</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Area (m²)</th>
                    <th className="p-4 text-left">Rent (FRW)</th>
                    <th className="p-4 text-left">Last Updated</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocals.map((local) => (
                    <tr key={local.id} className="border-b border-slate-200/80 last:border-none hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-900 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-slate-600">
                          <FiLayers />
                        </span>
                        {local.local_number || `LOC-${local.id.substring(0, 8)}`}
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(local.status)} text={getStatusText(local.status)} />
                      </td>
                      <td className="p-4">{local.area ? `${local.area} m²` : '-'}</td>
                      <td className="p-4">{local.rent_price ? Number(local.rent_price).toLocaleString() : '-'}</td>
                      <td className="p-4 text-slate-500 text-xs">
                        {local.updatedAt
                          ? new Date(local.updatedAt).toLocaleDateString()
                          : local.updated_at
                          ? new Date(local.updated_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Button
                            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                            onClick={() => handleEditLocal(local)}
                          >
                            <FiEdit className="text-sm" /> Edit
                          </Button>
                          <Button
                            className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
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
          </Card>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={selectedLocal ? `Edit Local - ${selectedLocal.local_number}` : 'Create Local'}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Area (m²)"
                type="number"
                value={editData.area}
                onChange={(e) => setEditData({ ...editData, area: e.target.value })}
                placeholder="Enter area"
              />
              <Input
                label="Rent Price (FRW)"
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