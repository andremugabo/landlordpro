import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllProperties } from '../services/propertyService';

/**
 * Small helper to safely read the logged-in user from localStorage.
 */
const readCurrentUser = () => {
  if (typeof window === 'undefined') return null;

  const sources = [
    () => window.sessionStorage.getItem('authenticatedUser'),
    () => window.localStorage.getItem('user'),
  ];

  for (const getSource of sources) {
    try {
      const raw = getSource();
      if (raw) return JSON.parse(raw);
    } catch (error) {
      console.error('Failed to parse stored user:', error);
    }
  }

  return null;
};

/**
 * Hook that loads the list of properties accessible to the logged-in user.
 * Managers only receive the properties they are assigned to (handled server-side).
 */
const useAccessibleProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useState(() => readCurrentUser());

  const normalizedRole = user?.role ? String(user.role).toLowerCase() : '';
  const isManager = normalizedRole === 'manager';

  const refresh = useCallback(async () => {
    if (!user) {
      setProperties([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      const response = await getAllProperties(1, 100);
      setProperties(response?.properties ?? []);
      setError(null);
    } catch (err) {
      console.error('Failed to load accessible properties:', err);
      setProperties([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const propertyOptions = useMemo(
    () =>
      properties.map((property) => ({
        value: property.id,
        label: property.name,
        raw: property,
      })),
    [properties]
  );

  const accessiblePropertyIds = useMemo(
    () => properties.map((property) => property.id),
    [properties]
  );

  return {
    user,
    isManager,
    properties,
    propertyOptions,
    accessiblePropertyIds,
    loading,
    error,
    refresh,
  };
};

export default useAccessibleProperties;

