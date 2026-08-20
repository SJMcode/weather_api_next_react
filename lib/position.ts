export type Coords = { lat: number; lon: number };

// Requests the browser for the user's current GPS location
export function getPosition(): Promise<Coords> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      // On success: Resolve with the latitude and longitude rounded to 2 decimal places
      ({ coords }) =>
        resolve({
          lat: Number(coords.latitude.toFixed(2)),
          lon: Number(coords.longitude.toFixed(2)),
        }),
      // On error (e.g. permission denied): Reject the promise
      reject,
      // Configuration options: timeout after 10 seconds
      { timeout: 10000 },
    ),
  );
}