import React from "react";
import { Sun, Wind, Thermometer, Droplets } from "lucide-react";

interface AdvancedInfoProps {
  auroraData: any;
}

const AdvancedInfo: React.FC<AdvancedInfoProps> = ({ auroraData }) => {
  if (
    !auroraData ||
    !auroraData.coordinates ||
    auroraData.coordinates.length === 0
  ) {
    return (
      <div className="bg-indigo-800 bg-opacity-50 rounded-lg p-4 mt-4">
        <h3 className="text-xl mb-4">Advanced Aurora Information</h3>
        <p>No aurora data available at the moment. Please try again later.</p>
      </div>
    );
  }

  const { Kp, Bz, solarWindSpeed, solarWindDensity } =
    auroraData.coordinates[0] || {};

  const InfoCard = ({
    title,
    value,
    icon,
    description,
  }: {
    title: string;
    value: string | number | undefined;
    icon: React.ReactNode;
    description: string;
  }) => (
    <div className="bg-indigo-700 bg-opacity-50 rounded-lg p-4">
      <div className="flex items-center mb-2">
        {icon}
        <h4 className="font-bold ml-2">{title}</h4>
      </div>
      <p className="text-2xl font-bold mb-2">{value ?? "N/A"}</p>
      <p className="text-sm">{description}</p>
    </div>
  );

  return (
    <div className="bg-indigo-800 bg-opacity-50 rounded-lg p-4 mt-4">
      <h3 className="text-xl mb-4">Advanced Aurora Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard
          title="Kp Index"
          value={Kp}
          icon={<Sun className="w-6 h-6 text-yellow-400" />}
          description="Measures global geomagnetic activity. Values of 5 or higher indicate good aurora viewing conditions."
        />
        <InfoCard
          title="Solar Wind Speed"
          value={solarWindSpeed ? `${solarWindSpeed} km/s` : undefined}
          icon={<Wind className="w-6 h-6 text-blue-400" />}
          description="Higher speeds contribute to stronger auroras."
        />
        <InfoCard
          title="Bz Component"
          value={Bz ? `${Bz} nT` : undefined}
          icon={<Thermometer className="w-6 h-6 text-red-400" />}
          description="Negative values increase the likelihood of aurora activity."
        />
        <InfoCard
          title="Solar Wind Density"
          value={solarWindDensity ? `${solarWindDensity} p/cm³` : undefined}
          icon={<Droplets className="w-6 h-6 text-purple-400" />}
          description="Higher densities can contribute to stronger auroras."
        />
      </div>
    </div>
  );
};

export default AdvancedInfo;
