import React from "react";
import { Sun, Cloud, CloudRain, Droplets } from "lucide-react";
import { calculateAuroraChance } from "../utils/apiHelpers";

interface AuroraForecastProps {
  auroraData: any;
  weatherData: any;
}

const AuroraForecast: React.FC<AuroraForecastProps> = ({
  auroraData,
  weatherData,
}) => {
  const getForecast = () => {
    if (!auroraData || !weatherData) return [];

    return weatherData.list
      .filter((_: any, index: number) => index % 8 === 0)
      .slice(0, 5)
      .map((day: any, index: number) => {
        const chance = calculateAuroraChance(auroraData, {
          list: [day],
          city: weatherData.city,
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

  const forecast = getForecast();

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
      <h3 className="text-xl mb-4">5-Day Aurora Forecast</h3>
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
