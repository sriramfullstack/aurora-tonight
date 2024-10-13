import axios from "axios";

const NOAA_API_URL =
  "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json";
const OPENWEATHERMAP_API_URL =
  "https://api.openweathermap.org/data/2.5/forecast";
const OPENWEATHERMAP_API_KEY = "4103fb80c1acdb68060bf9589985ce53"; // Replace with your actual API key
const GEOCODING_API_URL = "https://api.openweathermap.org/geo/1.0/reverse";
const ELEVATION_API_URL = "https://api.opentopodata.org/v1/aster30m";
const DIRECT_GEOCODING_API_URL =
  "https://api.openweathermap.org/geo/1.0/direct";

const NOAA_KP_INDEX_URL =
  "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
const NOAA_MAG_URL =
  "https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json";
const NOAA_PLASMA_URL =
  "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json";
const NOAA_GEOSPACE_URL =
  "https://services.swpc.noaa.gov/products/geospace-1-day.json";

export async function fetchAuroraData() {
  try {
    const [auroraResponse, kpIndexResponse, magResponse, plasmaResponse] =
      await Promise.all([
        axios.get(NOAA_API_URL),
        axios.get(NOAA_KP_INDEX_URL),
        axios.get(NOAA_MAG_URL),
        axios.get(NOAA_PLASMA_URL),
      ]);

    const kpIndexData = kpIndexResponse.data;
    const latestKpIndex = kpIndexData[kpIndexData.length - 1];

    const magData = magResponse.data;
    const latestMagData = magData[magData.length - 1];

    const plasmaData = plasmaResponse.data;
    const latestPlasmaData = plasmaData[plasmaData.length - 1];

    return {
      observationTime: auroraResponse.data["Observation Time"],
      forecastTime: auroraResponse.data["Forecast Time"],
      coordinates: auroraResponse.data.coordinates,
      kpIndex: latestKpIndex[1] || "N/A",
      kpTimestamp: latestKpIndex[0] || "N/A",
      hemiPower: auroraResponse.data["Hemisphere Power"] || "N/A",
      bz: latestMagData[3] || "N/A", // Bz component from mag-1-day.json
      solarWindSpeed: latestPlasmaData[1] || "N/A", // Solar wind speed from plasma-1-day.json
      solarWindDensity: latestPlasmaData[2] || "N/A", // Solar wind density from plasma-1-day.json
    };
  } catch (error) {
    console.error("Error fetching aurora data:", error);
    throw new Error("Failed to fetch aurora data");
  }
}

export async function fetchWeatherData(lat: number, lon: number) {
  try {
    const response = await axios.get(OPENWEATHERMAP_API_URL, {
      params: {
        lat,
        lon,
        appid: OPENWEATHERMAP_API_KEY,
        units: "metric",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw new Error("Failed to fetch weather data");
  }
}

export function calculateAuroraChance(
  auroraData: any,
  weatherData: any
): number {
  if (!auroraData || !weatherData) return 0;

  const lat = weatherData.city?.coord?.lat || 0;
  const lon = weatherData.city?.coord?.lon || 0;

  // Find the closest aurora data point
  const closestPoint = auroraData.coordinates.reduce(
    (closest: any, point: any) => {
      const [pointLon, pointLat, auroraValue] = point;
      const distance = Math.sqrt(
        Math.pow(pointLat - lat, 2) + Math.pow(pointLon - lon, 2)
      );
      return distance < closest.distance
        ? { lat: pointLat, lon: pointLon, aurora: auroraValue, distance }
        : closest;
    },
    { distance: Infinity }
  );

  // Extract relevant data
  const auroraIntensity = closestPoint.aurora || 0;
  const cloudCover = weatherData.list[0]?.clouds?.all || 0; // Cloud coverage percentage

  // Calculate base chance based on aurora intensity
  let chance = Math.min(auroraIntensity * 10, 100); // Multiply by 10 to scale 0-10 to 0-100

  // Adjust for cloud cover
  chance *= (100 - cloudCover) / 100;

  // Adjust for latitude (higher latitudes have better chances)
  const latitude = Math.abs(lat);
  if (latitude > 60) chance *= 1.2;
  else if (latitude > 50) chance *= 1.1;
  else if (latitude < 40) chance *= 0.8;

  // Ensure chance is between 0 and 100
  return Math.round(Math.max(0, Math.min(100, chance)));
}

export async function getViewingLocations(
  lat: number,
  lon: number
): Promise<string[]> {
  try {
    // Step 1: Get nearby locations
    const nearbyLocations = await getNearbyLocations(lat, lon);

    // Step 2: Calculate viewing scores for each location
    const locationsWithScores = await Promise.all(
      nearbyLocations.map(async (location) => {
        const score = await calculateViewingScore(location);
        return { ...location, score };
      })
    );

    // Step 3: Sort locations by score and return top 5
    const topLocations = locationsWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Step 4: Format the results
    return topLocations.map(
      (location) =>
        `${location.name} (${location.distance.toFixed(1)}km ${
          location.direction
        })`
    );
  } catch (error) {
    console.error("Error getting viewing locations:", error);
    return []; // Return an empty array in case of error
  }
}

async function getNearbyLocations(lat: number, lon: number) {
  const response = await axios.get(
    "https://api.openweathermap.org/geo/1.0/reverse",
    {
      params: {
        lat,
        lon,
        limit: 20, // Get 20 nearby locations
        appid: OPENWEATHERMAP_API_KEY,
      },
    }
  );

  return response.data.map((location: any) => ({
    name: location.name,
    lat: location.lat,
    lon: location.lon,
    distance: calculateDistance(lat, lon, location.lat, location.lon),
    direction: calculateDirection(lat, lon, location.lat, location.lon),
  }));
}

async function calculateViewingScore(location: any) {
  let elevation;
  try {
    // Try to get elevation data
    const elevationResponse = await axios.get(ELEVATION_API_URL, {
      params: {
        locations: `${location.lat},${location.lon}`,
      },
    });
    elevation = elevationResponse.data.results[0].elevation;
  } catch (error) {
    console.error("Error fetching elevation data:", error);
    // Fallback: Estimate elevation based on latitude
    elevation = Math.abs(location.lat) * 100; // Very rough estimate
  }

  // Calculate score based on elevation and distance
  const elevationScore = Math.min(elevation / 1000, 1); // 0-1 score based on elevation
  const distanceScore = 1 - Math.min(location.distance / 50, 1); // 0-1 score based on distance (closer is better)

  return (elevationScore + distanceScore) / 2; // Average of both scores
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  // Haversine formula to calculate distance between two points
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateDirection(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(bearing / 45) % 8];
}

export async function fetchLocationSuggestions(searchTerm: string) {
  try {
    const response = await axios.get(DIRECT_GEOCODING_API_URL, {
      params: {
        q: searchTerm,
        limit: 5,
        appid: OPENWEATHERMAP_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    throw new Error("Failed to fetch location suggestions");
  }
}
