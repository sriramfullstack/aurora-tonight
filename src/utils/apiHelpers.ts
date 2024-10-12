import axios from "axios";

const NOAA_API_URL =
  "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json";
const OPENWEATHERMAP_API_URL =
  "https://api.openweathermap.org/data/2.5/forecast";
const OPENWEATHERMAP_API_KEY = "4103fb80c1acdb68060bf9589985ce53"; // Replace with your actual API key
const GEOCODING_API_URL = "https://api.openweathermap.org/geo/1.0/reverse";
const ELEVATION_API_URL = "https://api.opentopodata.org/v1/aster30m";

export async function fetchAuroraData() {
  try {
    const response = await axios.get(NOAA_API_URL);
    return response.data;
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

  // Extract relevant data
  const kpIndex = auroraData.coordinates[0]?.Kp || 0;
  const cloudCover = weatherData.list[0]?.clouds?.all || 0; // Cloud coverage percentage

  // Calculate base chance based on Kp index
  let chance = kpIndex * 10; // 0-90% chance based on Kp index (0-9)

  // Adjust for cloud cover
  chance *= (100 - cloudCover) / 100;

  // Adjust for latitude (higher latitudes have better chances)
  const latitude = Math.abs(weatherData.city?.coord?.lat || 0);
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
  const response = await axios.get(GEOCODING_API_URL, {
    params: {
      lat,
      lon,
      limit: 20, // Get 20 nearby locations
      appid: OPENWEATHERMAP_API_KEY,
    },
  });

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
