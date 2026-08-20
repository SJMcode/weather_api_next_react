const baseUrl = "https://weather.lexlink.se";

export async function fetcher<T>(path: string): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`);

    if (!response.ok) {
    // Read the error message text returned in the body of the failed response
    const errorText = await response.text();
    // Throw an error using the API's message, or fallback to the status code
    throw new Error(errorText || `Request failed: ${response.status}`);
  }
  const data = response.json()
  console.log(data)
  return data;


}

// Generates the API path to search weather using a city/place name
export const weatherByCity = (city: string) =>
  // Encodes the city string for safety and returns the formatted endpoint path
  `/forecast/location/${encodeURIComponent(city)}`;
// Generates the API path to fetch weather using coordinates (longitude and latitude)
export const weatherByPoint = (lon: number, lat: number) =>
  // Formats and returns the coordinate forecast endpoint path
  `/forecast/point/${lon}/${lat}`;
// Generates the API path to get the place name for a set of coordinates
export const reverseGeocode = (lon: number, lat: number) =>
  // Formats and returns the reverse geocoding endpoint path
  `/geocode/reverse/${lon}/${lat}`;


  interface TestWeatherData {
  location?: {
    name: string;
  };
  timeseries: Array<{
    temp: number;
  }>;
}
// An immediately-invoked function expression (IIFE) to test our fetcher
(async () => {
  console.log("Testing weatherByCity and fetcher...");
  try {
    // 1. Get the path for "linkoping"
    const path = weatherByCity("linkoping");
    
    // 2. Fetch the data using our typed fetcher function
    const data = await fetcher<TestWeatherData>(path);
    
    console.log("✅ Success!");
    console.log(`Location: ${data.location?.name}`);
    console.log(`Temperature: ${data.timeseries[0].temp}°C`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
})();