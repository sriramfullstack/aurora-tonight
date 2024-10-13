import React, { useState } from "react";

interface CustomLocationPickerProps {
  onLocationChange: (lat: number, lon: number) => void;
}

const CustomLocationPicker: React.FC<CustomLocationPickerProps> = ({
  onLocationChange,
}) => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lon)) {
      onLocationChange(lat, lon);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        step="any"
        placeholder="Latitude"
        value={latitude}
        autoComplete="off"
        onChange={(e) => setLatitude(e.target.value)}
      />
      <input
        type="number"
        step="any"
        placeholder="Longitude"
        value={longitude}
        autoComplete="off"
        onChange={(e) => setLongitude(e.target.value)}
      />
      <button type="submit">Set Custom Location</button>
    </form>
  );
};

export default CustomLocationPicker;
