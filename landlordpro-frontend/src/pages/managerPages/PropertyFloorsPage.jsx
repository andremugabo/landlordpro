import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Input } from '../../components';
import { FiArrowLeft, FiLayers, FiHome, FiSearch } from 'react-icons/fi';
import useAccessibleProperties from '../../hooks/useAccessibleProperties';
import {
  getFloorsByPropertyId,
  getAllFloorsOccupancy,
  extractFloorsData,
} from '../../services/floorService';
import { getPropertyById } from '../../services/propertyService';
import { showError } from '../../utils/toastHelper';

const normaliseFloors = (floors = [], propertyMeta = {}) =>
  floors.map((floor) => {
    const targetPropertyId = propertyMeta.id || floor.property_id;
    const rawLocals = floor.locals || floor.localsForFloor || [];
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
    const localsCount = floor.locals_count ?? filteredLocals.length ?? 0;
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

const ManagerPropertyFloorsPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const {
    isManager,
    properties,
    accessiblePropertyIds,
    loading: loadingProperties,
  } = useAccessibleProperties();

  const [floors, setFloors] = useState([]);
  const [occupancyReports, setOccupancyReports] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [propertyInfo, setPropertyInfo] = useState(null);

  const property = useMemo(
    () => properties.find((item) => String(item.id) === String(propertyId)) || propertyInfo,
    [properties, propertyId, propertyInfo]
  );

  const propertyAccessible = useMemo(() => {
    if (!propertyId) return false;
    if (!isManager) return true;
    return accessiblePropertyIds.includes(propertyId) || accessiblePropertyIds.includes(Number(propertyId));
  }, [accessiblePropertyIds, isManager, propertyId]);

  useEffect(() => {
    if (!propertyId) return;
    if (property) {
      setPropertyInfo({ id: property.id, name: property.name, location: property.location });
      return;
    }

    const fetchPropertyDetails = async () => {
      try {
        const details = await getPropertyById(propertyId);
        if (details) {
          setPropertyInfo({ id: details.id, name: details.name, location: details.location });
        }
      } catch (error) {
        console.warn('Failed to fetch property details', error?.message || error);
      }
    };

    fetchPropertyDetails();
  }, [propertyId, property]);

  useEffect(() => {
    if (!propertyId || (isManager && !loadingProperties && !propertyAccessible)) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        const floorsResponse = await getFloorsByPropertyId(propertyId);
        let floorsData = extractFloorsData(floorsResponse);
        if ((!floorsData || floorsData.length === 0) && propertyInfo?.floorsForProperty) {
          floorsData = propertyInfo.floorsForProperty;
        }

        const normalisedFloors = normaliseFloors(floorsData, {
          id: propertyInfo?.id || floorsResponse?.property?.id || propertyId,
          name: property?.name || propertyInfo?.name || floorsResponse?.property?.name,
        });

        const occupancyResponse = await getAllFloorsOccupancy({ propertyId });
        const occupancyMap = {};
        extractFloorsData(occupancyResponse).forEach((report) => {
          occupancyMap[report.floor_id] = report;
        });

        setFloors(normalisedFloors);
        setOccupancyReports(occupancyMap);
      } catch (error) {
        console.error(error);
        showError(error?.message || 'Failed to load floors for this property');
        setFloors([]);
        setOccupancyReports({});
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [propertyAccessible, propertyId, property, loadingProperties, isManager]);

  const filteredFloors = useMemo(() => {
    if (!Array.isArray(floors)) return [];
    if (!search.trim()) return floors;
    const term = search.toLowerCase();
    return floors.filter((floor) =>
      floor.name?.toLowerCase().includes(term) ||
      String(floor.level_number).toLowerCase().includes(term)
    );
  }, [floors, search]);

  const stats = useMemo(() => {
    if (!floors.length) {
      return { total: 0, locals: 0, occupied: 0, available: 0, maintenance: 0, occupancyRate: 0 };
    }
    const locals = floors.reduce((sum, floor) => sum + (floor.locals_count || 0), 0);
    const occupied = floors.reduce((sum, floor) => sum + (occupancyReports[floor.id]?.occupied || 0), 0);
    const available = floors.reduce((sum, floor) => sum + (occupancyReports[floor.id]?.available || 0), 0);
    const maintenance = floors.reduce((sum, floor) => sum + (occupancyReports[floor.id]?.maintenance || 0), 0);
    const occupancyRate = locals > 0 ? Math.round((occupied / locals) * 100) : 0;
    return { total: floors.length, locals, occupied, available, maintenance, occupancyRate };
  }, [floors, occupancyReports]);

  if (!propertyId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 text-center text-gray-600">Missing property identifier.</Card>
      </div>
    );
  }

  if (loadingProperties || loading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <div className="text-gray-500">Loading property floors...</div>
      </div>
    );
  }

  if (isManager && !propertyAccessible) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <Card className="p-8 text-center max-w-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Access Restricted</h2>
          <p className="text-sm text-gray-600 mb-6">
            You do not have permission to view floors for this property. Please contact an administrator if you believe this is an error.
          </p>
          <Button
            onClick={() => navigate('/manager/properties')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Properties
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md flex items-center gap-2"
            onClick={() => navigate(-1)}
          >
            <FiArrowLeft className="text-base" /> Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <FiHome className="text-blue-500" />
              <span>{property?.name || 'Property'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
              Floors Overview
            </h1>
            {property?.location && (
              <p className="text-sm text-gray-500">{property.location}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="p-4 border rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Floors</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </Card>
          <Card className="p-4 border rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Locals</p>
            <p className="text-2xl font-bold text-blue-600">{stats.locals}</p>
          </Card>
          <Card className="p-4 border rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Occupied</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.occupied}</p>
          </Card>
          <Card className="p-4 border rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Available</p>
            <p className="text-2xl font-bold text-blue-600">{stats.available}</p>
          </Card>
          <Card className="p-4 border rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Maintenance</p>
            <p className="text-2xl font-bold text-amber-600">{stats.maintenance}</p>
          </Card>
          <Card className="p-4 border rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Occupancy</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.occupancyRate}%</p>
          </Card>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search floors by name or level..."
              className="pl-10"
            />
          </div>
        </div>

        {filteredFloors.length === 0 ? (
          <Card className="p-8 text-center text-gray-500 border border-dashed">
            No floors match your current filters.
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Floor</th>
                  <th className="p-3 text-left">Level</th>
                  <th className="p-3 text-left">Locals</th>
                  <th className="p-3 text-left">Occupied</th>
                  <th className="p-3 text-left">Available</th>
                  <th className="p-3 text-left">Maintenance</th>
                  <th className="p-3 text-left">Occupancy</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFloors.map((floor) => {
                  const report = occupancyReports[floor.id] || {};
                  const occupancyClass = (report.occupancy_rate || 0) >= 70
                    ? 'bg-emerald-100 text-emerald-700'
                    : (report.occupancy_rate || 0) >= 40
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700';

                  return (
                    <tr key={floor.id} className="border-b last:border-none hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900 flex items-center gap-2">
                        <FiLayers className="text-blue-500" />
                        {floor.name}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                          Level {floor.level_number}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {(floor.locals || []).slice(0, 6).map((local) => (
                            <span
                              key={local.id}
                              className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium"
                            >
                              {local.local_number || local.reference_code || `LOC-${String(local.id).slice(0, 6)}`}
                            </span>
                          ))}
                          {floor.locals_count > 6 && (
                            <span className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs font-medium">
                              +{floor.locals_count - 6}
                            </span>
                          )}
                          {(!floor.locals || floor.locals.length === 0) && (
                            <span className="text-gray-400">0</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                          {report.occupied || 0}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {report.available || 0}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700">
                          {report.maintenance || 0}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${occupancyClass}`}>
                          {report.occupancy_rate ?? 0}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-md"
                          onClick={() =>
                            navigate(
                              `/manager/floors/${floor.id}/locals?propertyId=${propertyId}&propertyName=${encodeURIComponent(
                                property?.name || ''
                              )}&floorName=${encodeURIComponent(floor.name)}`
                            )
                          }
                        >
                          View locals
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerPropertyFloorsPage;
