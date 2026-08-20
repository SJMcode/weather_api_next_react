"use client";

import { useEffect, useState, useRef } from "react";
import { fetcher, weatherByCity, weatherByPoint, reverseGeocode } from "@/lib/weather";
import { getPosition, Coords } from "@/lib/position";

interface WeatherData {
  location?: { name: string };
  referenceTime: string; // Added to interface
  timeseries: Array<{
    validTime: string;
    temp: number;
    symbol: number;
    summary: string;
    windSpeed: number;
    humidity: number;
    precipitationMean: number;
    airPressure: number;
  }>;
}

interface GeocodeLocation {
  address?: {
    city?: string;
    town?: string;
    municipality?: string;
  };
}

function getWeatherIcon(symbol: number): string {
  if (symbol === 1 || symbol === 2) return "☀️";
  if (symbol === 3 || symbol === 4) return "⛅";
  if (symbol === 5 || symbol === 6) return "☁️";
  if (symbol >= 7 && symbol <= 9) return "🌦️";
  if (symbol >= 10 && symbol <= 17) return "🌧️";
  if (symbol >= 18 && symbol <= 21) return "❄️";
  if (symbol >= 22 && symbol <= 24) return "⛈️";
  if (symbol >= 25 && symbol <= 27) return "❄️";
  return "🌡️";
}

export default function Page() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [cityName, setCityName] = useState("");
  
  const [coords, setCoords] = useState<Coords | null>(null);
  const [askingLocation, setAskingLocation] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    async function locateUser() {
      try {
        const userCoords = await getPosition();
        setCoords(userCoords);
      } catch (err) {
        console.log("GPS access denied, using fallback.");
      } finally {
        setAskingLocation(false);
      }
    }
    locateUser();
  }, []);

  useEffect(() => {
    if (askingLocation) return;

    async function getWeatherData() {
      setIsLoading(true);
      setError(null);
      
      try {
        let weatherPath = "";
        if (search) {
          weatherPath = weatherByCity(search);
          const weatherData = await fetcher<WeatherData>(weatherPath);
          setWeather(weatherData);
          setCityName(weatherData.location?.name || search);
        } else if (coords) {
          weatherPath = weatherByPoint(coords.lon, coords.lat);
          const [weatherData, geocodeData] = await Promise.all([
            fetcher<WeatherData>(weatherPath),
            fetcher<GeocodeLocation>(reverseGeocode(coords.lon, coords.lat))
          ]);
          setWeather(weatherData);
          setCityName(
            geocodeData.address?.city || 
            geocodeData.address?.town || 
            geocodeData.address?.municipality || 
            "Your Location"
          );
        } else {
          weatherPath = weatherByCity("linkoping");
          const weatherData = await fetcher<WeatherData>(weatherPath);
          setWeather(weatherData);
          setCityName(weatherData.location?.name || "Linköping");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    getWeatherData();
  }, [search, coords, askingLocation]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !weather || isHovered) return;

    let animationFrameId: number;
    let speed = 0.4;

    const scrollLoop = () => {
      container.scrollLeft += speed;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 1) {
        container.scrollLeft = 0;
      }
      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    animationFrameId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [weather, isHovered]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim() !== "") {
      setSearch(query.trim());
    }
  };

  // Helper function to format the forecast update time
  const formatUpdateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const current = weather?.timeseries[0];

  return (
    <div className="py-6 px-5 max-w-lg mx-auto overflow-hidden">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>

      {/* SEARCH FORM */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a city..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-blue-700 transition"
        >
          Search
        </button>
      </form>

      {search && (
        <button
          onClick={() => {
            setQuery("");
            setSearch("");
          }}
          className="text-xs text-blue-600 underline mb-6 hover:text-blue-800"
        >
          Use my location instead
        </button>
      )}

      {askingLocation && (
        <p className="text-gray-500 text-center py-4">Asking for location permission...</p>
      )}
      
      {!askingLocation && isLoading && (
        <p className="text-gray-500 text-center py-4">Loading weather data...</p>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl p-4 text-center mt-4">
          ⚠️ Could not load weather: {error}
        </div>
      )}

      {/* WEATHER DISPLAY */}
      {!askingLocation && !isLoading && !error && weather && current && (
        <div className="mt-4 animate-fade-in">
          {/* Resolved City Name & Time Display */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold capitalize">
              {cityName}
            </h1>
            <p className="text-xs text-gray-400">
              Last updated: {formatUpdateTime(weather.referenceTime)}
            </p>
          </div>
          
          {/* Detailed Weather Card */}
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 mb-8 shadow-sm">
            
            {/* Top row: Temp & Icon */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-5xl font-bold text-blue-500 tracking-tight">{current.temp}°C</p>
                <p className="text-gray-600 capitalize mt-1">{current.summary}</p>
              </div>
              <div className="text-6xl animate-bounce" style={{ animationDuration: '3s' }}>
                {getWeatherIcon(current.symbol)}
              </div>
            </div>

            {/* Bottom row: Grid of detailed weather metrics */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-blue-200/50 text-sm">
              {/* Wind Speed */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">💨</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Wind</p>
                  <p className="font-bold text-gray-800">{current.windSpeed} m/s</p>
                </div>
              </div>
              
              {/* Humidity */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">💧</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Humidity</p>
                  <p className="font-bold text-gray-800">{current.humidity}%</p>
                </div>
              </div>

              {/* Rain / Snow Precipitation */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌧️</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Precipitation</p>
                  <p className="font-bold text-gray-800">{current.precipitationMean} mm</p>
                </div>
              </div>

              {/* Atmospheric Pressure */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧭</span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Pressure</p>
                  <p className="font-bold text-gray-800">{current.airPressure} hPa</p>
                </div>
              </div>
            </div>

          </div>

          <h2 className="text-lg font-bold mb-3">Hourly Forecast</h2>
          
          {/* Horizontal Forecast */}
          <div 
            ref={scrollContainerRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
            className="flex gap-3 overflow-x-auto pb-4 scrollbar-none cursor-grab active:cursor-grabbing"
          >
            {weather.timeseries.slice(0, 12).map((hourData, index) => (
              <div 
                key={hourData.validTime} 
                className="flex-shrink-0 flex flex-col items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl w-24 text-center shadow-xs opacity-0 animate-fade-in-up"
                style={{
                  animationDelay: `${index * 60}ms`,
                }}
              >
                <span className="text-xs font-semibold text-gray-400">
                  {new Date(hourData.validTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
                <span className="text-3xl my-3">
                  {getWeatherIcon(hourData.symbol)}
                </span>
                <span className="text-sm font-bold text-gray-800">
                  {hourData.temp}°C
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}