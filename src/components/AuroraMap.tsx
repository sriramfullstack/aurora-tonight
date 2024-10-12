import React from 'react';

interface AuroraMapProps {
  location: { lat: number; lon: number } | null;
}

const AuroraMap: React.FC<AuroraMapProps> = ({ location }) => {
  return (
    <div className="bg-indigo-800 bg-opacity-50 rounded-lg p-4 mb-8">
      <h3 className="text-xl mb-4">Best Viewing Locations</h3>
      <div className="aspect-w-16 aspect-h-9 bg-gray-700 rounded-lg overflow-hidden">
        {/* Placeholder for the map */}
        <div className="flex items-center justify-center h-full">
          <p>Interactive Aurora Map (Coming Soon)</p>
        </div>
      </div>
      <p className="mt-4">
        {location
          ? `Best viewing spot near you: [Calculated based on ${location.lat.toFixed(2)}°N, ${location.lon.toFixed(2)}°W]`
          : 'Loading best viewing locations...'}
      </p>
    </div>
  );
};

export default AuroraMap;