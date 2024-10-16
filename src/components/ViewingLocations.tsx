import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { getViewingLocations } from "../utils/apiHelpers";

interface ViewingLocationsProps {
  location: { lat: number; lon: number; name: string } | null;
  auroraChance: number;
}

const ViewingLocations: React.FC<ViewingLocationsProps> = ({
  location,
  auroraChance,
}) => {
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    if (location) {
      getViewingLocations(location.lat, location.lon).then(setLocations);
    }
  }, [location]);

  return (
    <div className="bg-indigo-800 bg-opacity-50 rounded-lg p-4 mb-8">
      <h3 className="text-xl mb-2">Best Viewing Locations</h3>
      <p className="text-sm mb-4">Aurora Chance: {auroraChance}%</p>
      {auroraChance > 0 && locations.length > 0 ? (
        <ul className="space-y-2">
          {locations.map((location, index) => (
            <li key={index} className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{location}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {auroraChance === 0
            ? "No aurora activity expected at this time."
            : "No suitable viewing locations found within a 50km radius. The aurora may still be visible from your current location."}
        </p>
      )}
    </div>
  );
};

export default ViewingLocations;
