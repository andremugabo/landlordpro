import React, { useEffect, useState, useMemo } from 'react';
import {
  getFloorsByPropertyId,
  updateFloor,
  deleteFloor,
  extractFloorsData,
  getAllFloorsOccupancy
} from '../../services/floorService';
import { getPropertyById } from '../../services/propertyService';
import { Button, Modal, Input, Card } from '../../components';
import { FiEdit, FiTrash, FiArrowLeft, FiLayers, FiHome, FiSearch, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { showSuccess, showError, showInfo } from '../../utils/toastHelper';
import { useParams, useNavigate } from 'react-router-dom';

const normaliseFloors = (floors = [], propertyMeta = {}) => {
  const targetPropertyId = propertyMeta.id || null;
  return floors.map((floor) => {
    const rawLocals = floor.locals_count !== undefined
      ? floor.locals
      : floor.locals || floor.localsForFloor || [];

    const filteredLocals = Array.isArray(rawLocals)
      ? rawLocals.filter((local) => {
          if (!local) return false;
          if (targetPropertyId && local.property_id) {
            return String(local.property_id) === String(targetPropertyId);
          }
          if (floor.id && local.floor_id) {
            return String(local.floor_id) === String(floor.id);
          }
          return true;
        })
      : [];

    const localsCount = floor.locals_count !== undefined
      ? floor.locals_count
      : filteredLocals.length;

    return {
      id: floor.id,
      name: floor.name,
      level_number: floor.level_number,
      locals: filteredLocals,
      locals_count: localsCount,
      property_id: floor.property_id || propertyMeta.id,
      property_name: floor.property_name || propertyMeta.name,
    };
  });
};

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
  const [searchTerm, setSearchTerm] = useState('');
  const [occupancyReports, setOccupancyReports] = useState({});

  const fetchPropertyFloors = async () => {
    try {
      setLoading(true);
      let propertyDetails = null;
      try {
        propertyDetails = await getPropertyById(propertyId);
        if (propertyDetails) {
          setPropertyInfo((prev) => ({
            id: propertyDetails.id,
            name: propertyDetails.name,
            location: propertyDetails.location,
          }));
        }
      } catch (innerError) {
        console.warn('getPropertyById fallback:', innerError?.message || innerError);
      }

      const response = await getFloorsByPropertyId(propertyId);
      

      let floorsData = extractFloorsData(response);
      if ((!floorsData || floorsData.length === 0) && propertyDetails?.floorsForProperty) {
        floorsData = propertyDetails.floorsForProperty;
      }

      const normalisedFloors = normaliseFloors(floorsData, {
        id: propertyDetails?.id || response?.property?.id || propertyInfo?.id || propertyId,
        name: propertyDetails?.name || response?.property?.name || propertyInfo?.name,
      });
      setFloors(normalisedFloors);

      const occupancyResponse = await getAllFloorsOccupancy({ propertyId });
      const occupancyMap = {};
      extractFloorsData(occupancyResponse).forEach((report) => {
        occupancyMap[report.floor_id] = report;
      });
      setOccupancyReports(occupancyMap);
    } catch (err) {
      console.error('Error fetching property floors:', err);
      showError(err?.message || 'Failed to fetch floors for this property');
      setFloors([]);
      setOccupancyReports({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (propertyId) {
      fetchPropertyFloors();
    }
  }, [propertyId]);

  const filteredFloors = useMemo(() => {
    if (!Array.isArray(floors)) return [];
    if (!searchTerm.trim()) return floors;
    const term = searchTerm.toLowerCase();
    return floors.filter((floor) =>
      floor.name?.toLowerCase().includes(term) ||
      String(floor.level_number).toLowerCase().includes(term)
    );
  }, [floors, searchTerm]);

  const paginatedFloors = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredFloors.slice(startIndex, startIndex + limit);
  }, [filteredFloors, page, limit]);

  const totalPages = Math.ceil(filteredFloors.length / limit) || 1;

  const stats = useMemo(() => {
    const totalLocals = floors.reduce((sum, floor) => sum + (floor.locals_count || 0), 0);
    const occupied = floors.reduce((sum, floor) => sum + (occupancyReports[floor.id]?.occupied || 0), 0);
    const available = floors.reduce((sum, floor) => sum + (occupancyReports[floor.id]?.available || 0), 0);
    const maintenance = floors.reduce((sum, floor) => sum + (occupancyReports[floor.id]?.maintenance || 0), 0);
    const occupancyRate = totalLocals > 0 ? Math.round((occupied / totalLocals) * 100) : 0;

    return { totalLocals, occupied, available, maintenance, occupancyRate };
  }, [floors, occupancyReports]);

  const statCards = useMemo(
    () => [
      {
        title: 'Floors',
        value: floors.length,
        hint: 'Registered levels',
        icon: <FiLayers className="w-5 h-5" />,
      },
      {
        title: 'Locals',
        value: stats.totalLocals,
        hint: 'Total commercial units',
        icon: <FiUsers className="w-5 h-5" />,
      },
      {
        title: 'Occupied',
        value: stats.occupied,
        hint: 'Currently leased units',
        icon: <FiTrendingUp className="w-5 h-5" />,
      },
      {
        title: 'Availability',
        value: `${stats.occupancyRate}%`,
        hint: 'Portfolio occupancy rate',
        icon: <FiHome className="w-5 h-5" />,
      },
    ],
    [floors.length, stats]
  );

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
          level_number: parseInt(level_number, 10),
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
    <div className="min-h-screen pt-12 pb-12 px-3 sm:px-6 bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleBackToProperties}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 backdrop-blur"
              >
                <FiArrowLeft /> Back to Properties
              </Button>
            </div>
            <div>
              <p className="text-sm uppercase tracking-widest text-white/70">Portfolio • Floors overview</p>
              <h1 className="text-3xl md:text-4xl font-semibold mt-1 flex items-center gap-3">
                <FiHome className="text-white/70" />
                {propertyInfo?.name || 'Property Floors'}
              </h1>
              {propertyInfo?.location && (
                <p className="text-white/80 text-sm mt-2">{propertyInfo.location}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 min-w-[220px] md:min-w-[260px]">
            {statCards.map((card) => (
              <div
                key={card.title}
                className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/20 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>{card.title}</span>
                  {card.icon}
                </div>
                <span className="text-2xl font-semibold">{card.value}</span>
                <span className="text-xs text-white/60">{card.hint}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card className="p-5 border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Quick search by floor name or level..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-white"
            />
          </div>
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">{filteredFloors.length}</span> of{' '}
            <span className="font-medium text-slate-700">{floors.length}</span> floors for this property.
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {floors.length === 0 ? (
          <Card className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
            <FiLayers className="text-5xl text-slate-300 mx-auto mb-5" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Floors Found</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              This property does not have any floors yet. Floors are generated automatically when the property setup includes floor information.
            </p>
          </Card>
        ) : (
          <Card className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="p-4 text-left">Floor</th>
                    <th className="p-4 text-left">Level</th>
                    <th className="p-4 text-left">Locals</th>
                    <th className="p-4 text-left">Occupied</th>
                    <th className="p-4 text-left">Available</th>
                    <th className="p-4 text-left">Maintenance</th>
                    <th className="p-4 text-left">Occupancy</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFloors.map((floor) => {
                    const report = occupancyReports[floor.id] || {};
                    const occupancyClass = report.occupancy_rate >= 70
                      ? 'bg-emerald-100 text-emerald-700'
                      : report.occupancy_rate >= 40
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700';

                    return (
                      <tr key={floor.id} className="border-b border-slate-200/80 last:border-none hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-slate-900 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-600">
                            <FiLayers />
                          </span>
                          {floor.name}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                            Level {floor.level_number}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">
                          <div className="flex flex-wrap gap-2">
                            {(floor.locals || []).slice(0, 6).map((local) => (
                              <span
                                key={local.id}
                                className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium"
                              >
                                {local.local_number || local.reference_code || `LOC-${String(local.id).slice(0, 6)}`}
                              </span>
                            ))}
                            {floor.locals_count > 6 && (
                              <span className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-medium">
                                +{floor.locals_count - 6}
                              </span>
                            )}
                            {(!floor.locals || floor.locals.length === 0) && (
                              <span className="text-slate-400">0</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">
                            {report.occupied || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                            {report.available || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                            {report.maintenance || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${occupancyClass}`}>
                            {report.occupancy_rate ?? floor.occupancy_rate ?? 0}%
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <Button
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                              onClick={() => handleViewLocals(floor)}
                            >
                              <FiLayers className="text-sm" /> Locals
                            </Button>
                            <Button
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                              onClick={() => handleEditClick(floor)}
                            >
                              <FiEdit className="text-sm" /> Edit
                            </Button>
                            <Button
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                              onClick={() => handleDelete(floor)}
                            >
                              <FiTrash className="text-sm" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredFloors.length > limit && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-500">
                <div>
                  Page <span className="font-medium text-slate-700">{page}</span> of{' '}
                  <span className="font-medium text-slate-700">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page <= 1}
                    className={`px-3 py-1 rounded-lg border text-xs font-medium transition ${
                      page <= 1 ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-slate-700 border-slate-300 hover:bg-white'
                    }`}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page >= totalPages}
                    className={`px-3 py-1 rounded-lg border text-xs font-medium transition ${
                      page >= totalPages ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-slate-700 border-slate-300 hover:bg-white'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

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
              onChange={(e) => setEditData({ ...editData, level_number: parseInt(e.target.value, 10) || 0 })}
              placeholder="Enter level number"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PropertyFloorsPage;