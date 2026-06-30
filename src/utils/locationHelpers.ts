export interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Requests foreground location permission and returns current coords.
 * Returns null if permission denied or location unavailable.
 */
export const getCurrentCoords = async (): Promise<Coords | null> => {
  if (!('geolocation' in navigator)) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  });
};

/** Returns null if either lat or lng is missing/invalid */
export const validateCoordPair = (
  lat: string, lng: string
): { latitude: number; longitude: number } | null => {
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  if (isNaN(parsedLat) || isNaN(parsedLng)) return null;
  return { latitude: parsedLat, longitude: parsedLng };
};
