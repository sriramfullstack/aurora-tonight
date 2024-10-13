import React, { useEffect, useState } from "react";
import { Sun, Cloud, CloudRain, Droplets } from "lucide-react";
import { calculateAuroraChance } from "../utils/apiHelpers";

interface AuroraForecastProps {
  auroraData: {
    observationTime: string;
    forecastTime: string;
    coordinates: [number, number, number][];
  } | null;
  weatherData: {
    list: any[];
    city: {
      coord: { lat: number; lon: number };
      name: string;
    };
  } | null;
  location: { lat: number; lon: number; name: string } | null;
}

interface ForecastDay {
  day: string;
  chance: number;
  weather: string;
  temp: number;
}

const AuroraForecast: React.FC<AuroraForecastProps> = ({
  auroraData,
  weatherData,
  location,
}) => {
  const [forecast, setForecast] = useState<ForecastDay[]>([]);

  useEffect(() => {
    if (auroraData && weatherData && location) {
      const newForecast = getForecast();
      setForecast(newForecast);
    }
  }, [auroraData, weatherData, location]);

  const getForecast = (): ForecastDay[] => {
    if (!weatherData || !auroraData) return [];

    return weatherData.list
      .filter((_, index) => index % 8 === 0)
      .slice(0, 5)
      .map((day, index) => {
        const chance = calculateAuroraChance(auroraData, {
          ...weatherData,
          list: [day],
        });
        return {
          day:
            index === 0
              ? "Today"
              : new Date(day.dt * 1000).toLocaleDateString("en-US", {
                  weekday: "short",
                }),
          chance,
          weather: day.weather[0].main.toLowerCase(),
          temp: Math.round(day.main.temp),
        };
      });
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case "clear":
        return <Sun className="w-8 h-8 text-yellow-400" />;
      case "clouds":
        return <Cloud className="w-8 h-8 text-gray-400" />;
      case "rain":
      case "drizzle":
        return <CloudRain className="w-8 h-8 text-blue-400" />;
      case "thunderstorm":
        return <Droplets className="w-8 h-8 text-purple-400" />;
      default:
        return <Cloud className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <div className="bg-indigo-800 bg-opacity-50 rounded-lg p-4 mb-8">
      <h3 className="text-xl mb-4">
        5-Day Aurora Forecast for {location?.name}
      </h3>
      <div className="grid grid-cols-5 gap-4">
        {forecast.map((day) => (
          <div
            key={day.day}
            className="bg-indigo-700 bg-opacity-50 rounded-lg p-3 text-center"
          >
            <p className="font-bold mb-2">{day.day}</p>
            <div className="flex justify-center mb-2">
              {getWeatherIcon(day.weather)}
            </div>
            <p className="text-sm mb-1">{day.temp}°C</p>
            <p
              className="text-sm font-bold"
              style={{
                color: `rgb(${255 - day.chance * 2.55}, ${
                  day.chance * 2.55
                }, 0)`,
              }}
            >
              {day.chance}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuroraForecast;
