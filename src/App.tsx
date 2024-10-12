import React, { useState, useEffect } from "react";
import { Sun, Moon, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import AuroraForecast from "./components/AuroraForecast";
import AdvancedInfo from "./components/AdvancedInfo";
import ViewingLocations from "./components/ViewingLocations";
import {
  fetchAuroraData,
  fetchWeatherData,
  calculateAuroraChance,
  getViewingLocations,
} from "./utils/apiHelpers";

function App() {
  const [location, setLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
  } | null>(null);
  const [auroraData, setAuroraData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [auroraChance, setAuroraChance] = useState<number>(0);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [viewingLocations, setViewingLocations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lon: longitude, name: "Loading..." });
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocation({
          lat: 64.8378,
          lon: -147.7164,
          name: "Fairbanks, Alaska",
        });
        setError("Couldn't get your location. Using default location.");
      }
    );
  }, []);

  useEffect(() => {
    if (location) {
      const fetchData = async () => {
        try {
          const [aurora, weather] = await Promise.all([
            fetchAuroraData(),
            fetchWeatherData(location.lat, location.lon),
          ]);

          setAuroraData(aurora);
          setWeatherData(weather);

          if (weather && weather.city && weather.city.name) {
            setLocation((prev) => ({
              ...prev!,
              name: `${weather.city.name}, ${weather.city.country}`,
            }));
          }

          const locations = await getViewingLocations(
            location.lat,
            location.lon
          );
          setViewingLocations(locations);
        } catch (err) {
          console.error("Error fetching data:", err);
          setError(
            "Failed to fetch aurora or weather data. Please try again later."
          );
        }
      };

      fetchData();
    }
  }, [location?.lat, location?.lon]);

  useEffect(() => {
    if (auroraData && weatherData) {
      const chance = calculateAuroraChance(auroraData, weatherData);
      setAuroraChance(chance);
    }
  }, [auroraData, weatherData]);

  useEffect(() => {
    if (weatherData?.city?.sunset && weatherData?.city?.sunrise) {
      const now = new Date();
      const sunsetTime = new Date(weatherData.city.sunset * 1000);
      const sunriseTime = new Date(weatherData.city.sunrise * 1000);
      setIsNight(now > sunsetTime || now < sunriseTime);
    }
  }, [weatherData]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-black text-white flex items-center justify-center">
        <div className="bg-red-600 bg-opacity-50 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-black text-white">
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Aurora Tonight</h1>
        {isNight ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-indigo-800 bg-opacity-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            {location ? location.name : "Loading location..."}
          </h2>
          <div className="text-4xl font-bold mb-4">
            {auroraChance}% chance of aurora tonight
          </div>
          <p className="text-lg">
            {auroraChance > 50
              ? "High chance of aurora! Get ready for a spectacular show."
              : "Low chance of aurora. Keep an eye on the forecast for updates."}
          </p>
        </div>

        <ViewingLocations
          locations={viewingLocations}
          auroraChance={auroraChance}
        />
        <AuroraForecast auroraData={auroraData} weatherData={weatherData} />

        <div className="mt-8">
          <button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "Hide" : "Show"} Advanced Information
            {showAdvanced ? (
              <ChevronUp className="ml-2" />
            ) : (
              <ChevronDown className="ml-2" />
            )}
          </button>
          {showAdvanced && <AdvancedInfo auroraData={auroraData} />}
        </div>
      </main>

      <footer className="text-center p-4 text-sm">
        © 2024 Aurora Tonight. Data provided by NOAA and OpenWeatherMap.
      </footer>
    </div>
  );
}

export default App;
