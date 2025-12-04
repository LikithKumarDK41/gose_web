export interface GPSUpdate {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface GPSWatcher {
  stop: () => void;
}

export function startGPSWatcher(
  onUpdate: (data: GPSUpdate) => void,
  onError?: (err: GeolocationPositionError) => void
): GPSWatcher {
  if (!("geolocation" in navigator)) {
    onError?.({
      code: 0,
      message: "Geolocation not supported",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError);
    return { stop: () => {} };
  }

  let watchId: number | null = null;
  let active = true;
  let lastUpdate = Date.now();

  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  };

  /** Create or recreate the watcher */
  const attachWatcher = () => {
    if (!active) return;

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!active) return;
        lastUpdate = Date.now();

        onUpdate({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 9999,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        if (!active) return;
        onError?.(err);
      },
      options
    );
  };

  // Attach first watcher
  attachWatcher();

  // Reattach if no updates for 10 seconds (browser suspended)
  const monitor = setInterval(() => {
    if (!active) return;
    if (Date.now() - lastUpdate > 10000) {
      attachWatcher();
    }
  }, 5000);

  return {
    stop() {
      active = false;
      clearInterval(monitor);
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      watchId = null;
    },
  };
}
/* ------------------------------------------------------
   ONE-TIME location with accuracy awareness
   - Waits for a reasonably accurate fix
   - Returns the best reading seen within maxWaitMs
------------------------------------------------------- */
export function getCurrentLocation(
  desiredAccuracy = 80, // meters
  maxWaitMs = 15000
): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    let resolved = false;
    let bestPos: GeolocationPosition | null = null;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    };

    const cleanup = (watchId: number | null, timeoutId: number | null) => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (resolved) return;

        const acc = pos.coords.accuracy ?? 9999;

        // keep best reading so far
        if (!bestPos || acc < (bestPos.coords.accuracy ?? Infinity)) {
          bestPos = pos;
        }

        // if accuracy is good enough, resolve immediately
        if (acc <= desiredAccuracy) {
          resolved = true;
          cleanup(watchId, timeoutId);
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: acc,
          });
        }
      },
      (err) => {
        if (resolved) return;
        // If we have some reading, use it; otherwise error out
        if (bestPos) {
          resolved = true;
          cleanup(watchId, timeoutId);
          const acc = bestPos.coords.accuracy ?? 9999;
          resolve({
            lat: bestPos.coords.latitude,
            lng: bestPos.coords.longitude,
            accuracy: acc,
          });
        } else {
          resolved = true;
          cleanup(watchId, timeoutId);
          reject(err);
        }
      },
      options
    );

    const timeoutId = window.setTimeout(() => {
      if (resolved) return;
      if (bestPos) {
        resolved = true;
        cleanup(watchId, timeoutId);
        const acc = bestPos.coords.accuracy ?? 9999;
        resolve({
          lat: bestPos.coords.latitude,
          lng: bestPos.coords.longitude,
          accuracy: acc,
        });
      } else {
        resolved = true;
        cleanup(watchId, timeoutId);
        reject(new Error("Timed out while fetching location"));
      }
    }, maxWaitMs);
  });
}
