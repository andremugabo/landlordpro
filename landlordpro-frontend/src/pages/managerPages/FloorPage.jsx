import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getFloorsByPropertyId,
  getAllFloorsOccupancy,
  extractFloorsData,
} from '../../services/floorService';
import { Card, Input, Select, Spinner } from '../../components';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { showError } from '../../utils/toastHelper';
import { useSearchParams } from 'react-router-dom';
import useAccessibleProperties from '../../hooks/useAccessibleProperties';

const dedupeById = (items = []) => {
  const map = new Map();
  items.forEach((item) => {
    if (item?.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
};

const ManagerFloorPage = () => {
  const [floors, setFloors] = useState([]);
  const [occupancyReports, setOccupancyReports] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const limit = 10;

  const { isManager, properties, propertyOptions, loading: loadingProperties } =
    useAccessibleProperties();

  const [searchParams, setSearchParams] = useSearchParams();
  const propertyIdFromUrl = searchParams.get('propertyId');

  useEffect(() => {
    if (propertyIdFromUrl) {
      setSelectedPropertyId(propertyIdFromUrl);
    }
  }, [propertyIdFromUrl]);

  useEffect(() => {
    if (!isManager) return;

    if (properties.length === 1) {
      setSelectedPropertyId(properties[0].id);
    } else if (!properties.find((property) => property.id === selectedPropertyId)) {
      setSelectedPropertyId('');
    }
  }, [isManager, properties, selectedPropertyId]);

  const propertyNameMap = useMemo(
    () =>
      new Map(properties.map((property) => [property.id, property.name || 'Unnamed property'])),
    [properties]
  );

  const selectedPropertyOption = useMemo(
    () => propertyOptions.find((option) => option.value === selectedPropertyId) ?? null,
    [propertyOptions, selectedPropertyId]
  );

  const fetchFloors = useCallback(async () => {
    const targetPropertyIds =
      selectedPropertyId || !isManager
        ? [selectedPropertyId || null].filter(Boolean)
        : properties.map((property) => property.id);

    if (isManager && targetPropertyIds.length === 0) {
      setFloors([]);
      setOccupancyReports({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const floorResponses = await Promise.all(
        targetPropertyIds.map((propertyId) => getFloorsByPropertyId(propertyId))
      );

      const combinedFloors = dedupeById(
        floorResponses.flatMap((response, index) => {
          const data = extractFloorsData(response);
          const propertyId = targetPropertyIds[index];
          const propertyName = propertyNameMap.get(propertyId) || 'Unknown property';

          return data.map((floor) => ({
            ...floor,
            property_id: propertyId,
            property_name: floor.property_name || propertyName,
          }));
        })
      );

      const occupancyResponses = await Promise.all(
        targetPropertyIds.map((propertyId) => getAllFloorsOccupancy({ propertyId }))
      );

      const occupancyMap = {};
      occupancyResponses.forEach((response) => {
        const reports = extractFloorsData(response);
        reports.forEach((report) => {
          occupancyMap[report.floor_id] = report;
        });
      });

      setFloors(combinedFloors);
      setOccupancyReports(occupancyMap);
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Failed to fetch floors');
      setFloors([]);
      setOccupancyReports({});
    } finally {
      setLoading(false);
    }
  }, [isManager, selectedPropertyId, properties, propertyNameMap]);

  useEffect(() => {
    fetchFloors();
  }, [fetchFloors]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedPropertyId]);

  const filteredFloors = useMemo(() => {
    if (!Array.isArray(floors)) return [];

    let filtered = floors;

    if (searchTerm.trim()) {
      filtered = filtered.filter((floor) =>
        floor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        floor?.property_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [floors, searchTerm]);

  const paginatedFloors = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredFloors.slice(startIndex, startIndex + limit);
  }, [filteredFloors, page, limit]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredFloors.length / limit)),
    [filteredFloors.length, limit]
  );

  const totalLocals = useMemo(
    () => floors.reduce((sum, floor) => sum + (floor.locals_count || 0), 0),
    [floors]
  );

  const occupiedLocals = useMemo(
    () =>
      Object.values(occupancyReports).reduce(
        (sum, report) => sum + (report.occupied || 0),
        0
      ),
    [occupancyReports]
  );

  const averageOccupancy = useMemo(() => {
    const reports = Object.values(occupancyReports);
    if (!reports.length) return 0;
    const totalRate = reports.reduce((sum, report) => sum + (report.occupancy_rate || 0), 0);
    return Math.round(totalRate / reports.length);
  }, [occupancyReports]);

  const clearPropertyFilter = () => {
    setSelectedPropertyId('');
    setSearchParams({});
  };

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            {selectedPropertyOption ? `Floors – ${selectedPropertyOption.label}` : 'Floors Overview'}
          </h1>
          <p className="text-sm text-gray-500">
            Track occupancy and unit availability for your assigned properties
          </p>
        </div>

        {selectedPropertyOption && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
            <FiFilter className="text-sm" />
            <span className="text-sm font-medium">
              Filtered by: {selectedPropertyOption.label}
            </span>
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

      <Card className="max-w-xs p-4 border rounded-xl shadow-sm">
        <Select
          label="Property"
          value={selectedPropertyOption}
          options={propertyOptions}
          isClearable={!isManager}
          isDisabled={loadingProperties || (isManager && properties.length <= 1)}
          placeholder={isManager ? 'Select your property...' : 'All properties'}
          onChange={(option) => {
            const nextValue = option?.value ?? '';
            setSelectedPropertyId(nextValue);
            if (nextValue) {
              setSearchParams({ propertyId: nextValue });
            } else {
              setSearchParams({});
            }
          }}
        />
      </Card>

      {isManager && !loadingProperties && properties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 text-center text-gray-600">
          You are not assigned to any property yet. Please contact an administrator.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : floors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 text-center text-gray-600">
          No floors available for the current selection.
        </div>
      ) : (
        <>
          <div className="relative w-full mb-4">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder={
                selectedPropertyOption
                  ? `Search floors in ${selectedPropertyOption.label}...`
                  : 'Search by floor name or property...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-gray-800">{floors.length}</div>
              <div className="text-sm text-gray-500">Total Floors</div>
            </Card>
            <Card className="p-4 border rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{totalLocals}</div>
              <div className="text-sm text-gray-500">Total Locals</div>
            </Card>
            <Card className="p-4 border rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">{occupiedLocals}</div>
              <div className="text-sm text-gray-500">Occupied Locals</div>
            </Card>
            <Card className="p-4 border rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{averageOccupancy}%</div>
              <div className="text-sm text-gray-500">Average Occupancy</div>
            </Card>
          </div>

          <div className="hidden md:block bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3 font-semibold text-left">Name</th>
                  <th className="p-3 font-semibold text-left">Level</th>
                  {!selectedPropertyId && (
                    <th className="p-3 font-semibold text-left">Property</th>
                  )}
                  <th className="p-3 font-semibold text-left">Total Locals</th>
                  <th className="p-3 font-semibold text-left">Occupied</th>
                  <th className="p-3 font-semibold text-left">Available</th>
                  <th className="p-3 font-semibold text-left">Maintenance</th>
                  <th className="p-3 font-semibold text-left">Occupancy %</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFloors.map((floor) => {
                  const report = occupancyReports[floor.id] || {};
                  return (
                    <tr
                      key={floor.id}
                      className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <td className="p-3 font-medium text-gray-800">{floor.name}</td>
                      <td className="p-3">{floor.level_number}</td>
                      {!selectedPropertyId && (
                        <td className="p-3">{floor?.property_name || '-'}</td>
                      )}
                      <td className="p-3">{report.total_locals || 0}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.occupied > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {report.occupied || 0}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.available > 0
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {report.available || 0}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.maintenance > 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {report.maintenance || 0}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (report.occupancy_rate || 0) >= 70
                              ? 'bg-green-100 text-green-800'
                              : (report.occupancy_rate || 0) >= 40
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {report.occupancy_rate ?? 0}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid gap-4">
            {paginatedFloors.map((floor) => {
              const report = occupancyReports[floor.id] || {};
              return (
                <Card
                  key={floor.id}
                  className="bg-white rounded-xl shadow-md border border-gray-100 p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-gray-800">{floor.name}</div>
                    <span className="text-xs text-gray-500">Level {floor.level_number}</span>
                  </div>
                  {!selectedPropertyId && (
                    <div className="text-xs text-gray-500">
                      Property: {floor?.property_name || '-'}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Total locals: {report.total_locals || 0}</div>
                    <div>
                      Occupied: <span className="text-green-600">{report.occupied || 0}</span>
                    </div>
                    <div>
                      Available: <span className="text-blue-600">{report.available || 0}</span>
                    </div>
                    <div>
                      Maintenance: <span className="text-red-600">{report.maintenance || 0}</span>
                    </div>
                    <div className="col-span-2">
                      Occupancy:{' '}
                      <span
                        className={`font-medium ${
                          (report.occupancy_rate || 0) >= 70
                            ? 'text-green-600'
                            : (report.occupancy_rate || 0) >= 40
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {report.occupancy_rate ?? 0}%
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-between items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-600 rounded-lg shadow-sm">
            <div className="text-gray-500">
              Showing <span className="font-medium">{paginatedFloors.length}</span> of{' '}
              <span className="font-medium">{filteredFloors.length}</span> floors
              {selectedPropertyOption && ` for ${selectedPropertyOption.label}`}
              {searchTerm && ' (filtered)'}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
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
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
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
        </>
      )}
    </div>
  );
};

export default ManagerFloorPage;