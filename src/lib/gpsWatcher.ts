// In gpsWatcher.ts

export interface GPSUpdate {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  heading?: number | null;
  speed?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
}

export interface GPSWatcher {
  stop: () => void;
  getLastKnownPosition: () => GPSUpdate | null;
}

export function startGPSWatcher(
  onUpdate: (data: GPSUpdate) => void,
  onError?: (err: GeolocationPositionError) => void
): GPSWatcher {
  if (!("geolocation" in navigator)) {
    const err = {
      code: 1, // PERMISSION_DENIED
      message: "Geolocation not supported",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    } as GeolocationPositionError;

    onError?.(err);
    return {
      stop: () => { },
      getLastKnownPosition: () => null
    };
  }

  let watchId: number | null = null;
  let active = true;
  let lastKnownPosition: GPSUpdate | null = null;
  let retryCount = 0;
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 2000;
  const MIN_ACCURACY = 100; // meters
  const MIN_DISTANCE_CHANGE = 5; // meters

  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0, // Always get a fresh position
  };

  const handlePosition = (pos: GeolocationPosition) => {
    if (!active) return;

    const newPosition: GPSUpdate = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? Number.MAX_SAFE_INTEGER,
      heading: pos.coords.heading ?? null,
      speed: pos.coords.speed ?? null,
      altitude: pos.coords.altitude ?? null,
      altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
      timestamp: pos.timestamp || Date.now(),
    };

    // Only update if position has changed significantly or accuracy improved
    const shouldUpdate =
      !lastKnownPosition ||
      haversineMeters(lastKnownPosition, newPosition) > MIN_DISTANCE_CHANGE ||
      (newPosition.accuracy < lastKnownPosition.accuracy * 0.8 && newPosition.accuracy < MIN_ACCURACY * 2) ||
      (newPosition.accuracy < MIN_ACCURACY && lastKnownPosition.accuracy > MIN_ACCURACY);

    if (shouldUpdate) {
      lastKnownPosition = newPosition;
      onUpdate(newPosition);
    }
  };

  const handleError = (err: GeolocationPositionError) => {
    if (!active) return;

    // If we get a timeout and haven't exceeded max retries, try again
    if ((err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) && retryCount < MAX_RETRIES) {
      retryCount++;
      const delay = RETRY_DELAY * Math.pow(2, retryCount - 1); // Exponential backoff
      setTimeout(() => {
        if (active) attachWatcher();
      }, Math.min(delay, 30000)); // Max 30 seconds delay
      return;
    }

    onError?.(err);
  };

  const attachWatcher = () => {
    if (!active) return;

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    try {
      watchId = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        options
      );
    } catch (err) {
      onError?.(err as GeolocationPositionError);
    }
  };

  // Initial attachment
  attachWatcher();

  return {
    stop() {
      active = false;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    },
    getLastKnownPosition: () => lastKnownPosition
  };
}

export async function getCurrentLocation(
  desiredAccuracy = 30, // meters
  maxWaitMs = 20000,    // 20 seconds max
  maxRetries = 2        // Maximum number of retry attempts
): Promise<{ lat: number; lng: number; accuracy: number }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !('geolocation' in navigator)) {
          throw new Error('Geolocation not supported');
        }

        const options: PositionOptions = {
          enableHighAccuracy: true,
          timeout: Math.min(10000, maxWaitMs), // Max 10s per attempt
          maximumAge: 0, // Always get fresh position
        };

        const startTime = Date.now();
        let watchId: number | null = null;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const cleanup = () => {
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
          }
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        };

        const onSuccess = (position: GeolocationPosition) => {
          const accuracy = position.coords.accuracy ?? Number.MAX_SAFE_INTEGER;
          
          // If accuracy is good enough, resolve immediately
          if (accuracy <= desiredAccuracy) {
            cleanup();
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy
            });
            return;
          }

          // If we're out of time, resolve with the best we have
          if (Date.now() - startTime >= maxWaitMs) {
            cleanup();
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy
            });
          }
        };

        const onError = (error: GeolocationPositionError) => {
          cleanup();
          reject(new Error(`Geolocation error (${error.code}): ${error.message}`));
        };

        // Set up timeout for this attempt
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Location request timed out'));
        }, options.timeout);

        // Start watching position
        try {
          watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);
        } catch (err) {
          cleanup();
          reject(err);
        }
      });
    } catch (error) {
      lastError = error as Error;
      console.warn(`Location attempt ${attempt} failed:`, error);
      
      // If we have more retries left, wait a bit before trying again
      if (attempt <= maxRetries) {
        const backoffTime = Math.min(1000 * attempt, 3000); // Exponential backoff, max 3s
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError || new Error('Failed to get location after multiple attempts');
}

// Helper function to calculate distance between two points in meters using Haversine formula
function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;

  const a_hav =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a_hav), Math.sqrt(1 - a_hav));

  return R * c;
}