import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Button, Input, Badge } from '../../components';
import { FiArrowLeft, FiLayers, FiHome, FiSearch } from 'react-icons/fi';
import useAccessibleProperties from '../../hooks/useAccessibleProperties';
import { getLocalsByFloorId } from '../../services/localService';
import { getFloorById, getFloorOccupancy } from '../../services/floorService';
import { showError } from '../../utils/toastHelper';

const STATUS_META = {
  occupied: { label: 'Occupied', className: 'bg-emerald-100 text-emerald-700' },
  available: { label: 'Available', className: 'bg-blue-100 text-blue-700' },
  maintenance: { label: 'Maintenance', className: 'bg-amber-100 text-amber-700' },
};

const ManagerFloorLocalsPage = () => {
  const { floorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isManager, accessiblePropertyIds, loading: loadingProperties } = useAccessibleProperties();

  const propertyId = searchParams.get('propertyId');
  const propertyNameParam = decodeURIComponent(searchParams.get('propertyName') || '');
  const floorNameFromUrl = decodeURIComponent(searchParams.get('floorName') || '');

  const [floor, setFloor] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [locals, setLocals] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [propertyMeta, setPropertyMeta] = useState({ id: propertyId || null, name: propertyNameParam });

  const propertyAccessible = useMemo(() => {
    if (!propertyId) return true;
    if (!isManager) return true;
    return accessiblePropertyIds.includes(propertyId) || accessiblePropertyIds.includes(Number(propertyId));
  }, [propertyId, accessiblePropertyIds, isManager]);

  useEffect(() => {
    if (!floorId || (isManager && !loadingProperties && !propertyAccessible)) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);

        const [floorResponse, occupancyResponse, localsResponse] = await Promise.all([
          getFloorById(floorId),
          getFloorOccupancy(floorId),
          getLocalsByFloorId(floorId),
        ]);

        const floorData = floorResponse?.data || floorResponse;
        setFloor(floorData);
        setOccupancy(occupancyResponse?.data || occupancyResponse);

        const localsData = Array.isArray(localsResponse?.data)
          ? localsResponse.data
          : Array.isArray(localsResponse)
          ? localsResponse
          : [];
        const filteredLocals = localsData.filter((local) => String(local?.floor_id) === String(floorId));
        setLocals(filteredLocals);

        const resolvedProperty = floorData?.propertyForFloor || floorData?.property;
        if (resolvedProperty) {
          setPropertyMeta({ id: resolvedProperty.id, name: resolvedProperty.name });
        }
      } catch (err) {
        console.error(err);
        setError(err?.message || 'Failed to load locals for this floor');
        showError(err?.message || 'Failed to load locals for this floor');
        setLocals([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [floorId, propertyAccessible, isManager, loadingProperties]);

  const filteredLocals = useMemo(() => {
    if (!Array.isArray(locals)) return [];
    if (!search.trim()) return locals;
    const term = search.toLowerCase();
    return locals.filter((local) =>
      local.local_number?.toLowerCase().includes(term) ||
      local.reference_code?.toLowerCase().includes(term) ||
      local.status?.toLowerCase().includes(term)
    );
  }, [locals, search]);

  const stats = useMemo(() => {
    const total = locals.length;
    if (!total) return { total: 0, occupied: 0, available: 0, maintenance: 0, occupancyRate: 0 };
    const occupied = locals.filter((local) => local.status === 'occupied').length;
    const available = locals.filter((local) => local.status === 'available').length;
    const maintenance = locals.filter((local) => local.status === 'maintenance').length;
    const occupancyRate = total ? Math.round((occupied / total) * 100) : 0;
    return { total, occupied, available, maintenance, occupancyRate };
  }, [locals]);

  const resolvedPropertyId = propertyMeta.id || floor?.property_id || floor?.propertyForFloor?.id;
  const resolvedPropertyName = propertyMeta.name || floor?.propertyForFloor?.name || floor?.property_name || '';

  const handleBackToFloors = () => {
    if (resolvedPropertyId) {
      navigate(`/manager/properties/${resolvedPropertyId}/floors`);
    } else {
      navigate('/manager/floors');
    }
  };

  if (!floorId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 text-center text-gray-600">Missing floor identifier.</Card>
      </div>
    );
  }

  if (loadingProperties || loading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <div className="text-gray-500">Loading floor locals...</div>
      </div>
    );
  }

  if (isManager && !propertyAccessible) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <Card className="p-8 text-center max-w-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Access Restricted</h2>
          <p className="text-sm text-gray-600 mb-6">
            You do not have permission to view this floor. Please contact an administrator if you believe this is an error.
          </p>
          <Button
            onClick={() => navigate('/manager/floors')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Floors
          </Button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <Card className="p-8 text-center max-w-lg text-red-600">{error}</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 px-3 sm:px-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md flex items-center gap-2"
            onClick={handleBackToFloors}
          >
            <FiArrowLeft className="text-base" /> Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <FiHome className="text-blue-500" />
              <span>{resolvedPropertyName || 'Property'}</span>
              <FiLayers className="text-blue-500 ml-2" />
              <span>Level {floor?.level_number ?? '?'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {floorNameFromUrl || floor?.name || 'Floor'} – Locals
            </h1>
            <p className="text-sm text-gray-500">Monitor occupancy and availability for each local on this floor.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 border rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Locals</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
              placeholder="Search locals by number or status..."
              className="pl-10"
            />
          </div>
        </div>

        {filteredLocals.length === 0 ? (
          <Card className="p-8 text-center text-gray-500 border border-dashed">
            No locals match your filters.
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Local</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Area (m²)</th>
                  <th className="p-3 text-left">Rent (FRW)</th>
                  <th className="p-3 text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocals.map((local) => {
                  const meta = STATUS_META[local.status] || {
                    label: local.status || 'Unknown',
                    className: 'bg-gray-100 text-gray-700',
                  };
                  return (
                    <tr key={local.id} className="border-b last:border-none hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900 flex items-center gap-2">
                        <FiLayers className="text-blue-500" />
                        {local.local_number || local.reference_code || `LOC-${String(local.id).slice(0, 6)}`}
                      </td>
                      <td className="p-3">
                        <Badge className={meta.className} text={meta.label} />
                      </td>
                      <td className="p-3">{local.area ? `${local.area}` : '—'}</td>
                      <td className="p-3">{local.rent_price ? Number(local.rent_price).toLocaleString() : '—'}</td>
                      <td className="p-3 text-gray-500">
                        {local.updatedAt
                          ? new Date(local.updatedAt).toLocaleDateString()
                          : local.updated_at
                          ? new Date(local.updated_at).toLocaleDateString()
                          : '—'}
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

export default ManagerFloorLocalsPage;
