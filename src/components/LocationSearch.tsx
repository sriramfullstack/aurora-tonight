import React, { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { fetchLocationSuggestions } from "../utils/apiHelpers";

interface LocationSearchProps {
  onLocationSelect: (location: {
    lat: number;
    lon: number;
    name: string;
  }) => void;
  onUseCurrentLocation: () => void;
  onClose: () => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  onUseCurrentLocation,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleSearch = async () => {
    if (searchTerm.length > 2) {
      try {
        const data = await fetchLocationSuggestions(searchTerm);
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
      }
    }
  };

  const handleSuggestionSelect = (location: any) => {
    onLocationSelect({
      lat: location.lat,
      lon: location.lon,
      name: `${location.name}, ${location.country}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-indigo-900 p-6 rounded-lg w-96">
        <h2 className="text-xl mb-4">Search Location</h2>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter city or place name"
            autoComplete="off"
            className="w-full p-2 rounded bg-indigo-800 text-white"
          />
          <Search
            className="absolute right-2 top-2 text-gray-400 cursor-pointer"
            onClick={handleSearch}
          />
        </div>
        <ul className="mt-2">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionSelect(suggestion)}
              className="cursor-pointer hover:bg-indigo-800 p-2 rounded"
            >
              {suggestion.name}, {suggestion.country}
            </li>
          ))}
        </ul>
        <button
          onClick={onUseCurrentLocation}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded w-full flex items-center justify-center"
        >
          <MapPin className="mr-2" /> Use Current Location
        </button>
        <button
          onClick={onClose}
          className="mt-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default LocationSearch;
