import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { Equipment } from "@shared/schema";

interface EquipmentControlProps {
  equipment: Equipment;
  onUpdate: (data: { isActive?: boolean; currentSetting?: number }) => void;
  isLoading?: boolean;
  showToggle?: boolean;
}

export default function EquipmentControl({ 
  equipment, 
  onUpdate, 
  isLoading = false,
  showToggle = true 
}: EquipmentControlProps) {
  const getEquipmentLabel = () => {
    const spec = equipment.specification;
    switch (equipment.type) {
      case 'fan':
        return `${equipment.name} (Ø ${spec?.diameter || 0}cm)`;
      case 'heater':
        return `${equipment.name} (${spec?.power || 0} kW)`;
      case 'inlet':
        return `${equipment.name}`;
      default:
        return equipment.name;
    }
  };

  const getEquipmentStats = () => {
    const spec = equipment.specification;
    const setting = equipment.currentSetting || 0;
    
    switch (equipment.type) {
      case 'fan':
        const diameter = spec?.diameter || 0;
        const power = equipment.isActive ? (diameter * 0.02 * setting / 100).toFixed(1) : '0';
        const airflow = equipment.isActive ? Math.round(diameter * 0.85 * setting / 100 * 60) : 0;
        return `Power: ${power} kW | Airflow: ${airflow} m³/h`;
      case 'heater':
        const maxPower = spec?.power || 0;
        const currentPower = equipment.isActive ? (maxPower * setting / 100).toFixed(1) : '0';
        const fuelStatus = equipment.isActive ? 'Normal' : 'Standby';
        return `Power: ${currentPower} kW | Fuel: ${fuelStatus}`;
      case 'inlet':
        const totalSurface = spec?.surface || 0;
        const effectiveArea = (totalSurface * setting / 100).toFixed(2);
        const velocity = (setting * 2.5 / 100).toFixed(1);
        return `Effective area: ${effectiveArea} m² | Air velocity: ${velocity} m/s`;
      default:
        return '';
    }
  };

  const getSliderColor = () => {
    switch (equipment.type) {
      case 'fan':
        return 'bg-farm-green';
      case 'heater':
        return 'bg-farm-orange';
      case 'inlet':
        return 'bg-farm-blue';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4" data-testid={`equipment-${equipment.type}-${equipment.id}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid={`text-equipment-name-${equipment.id}`}>
          {getEquipmentLabel()}
        </span>
        {showToggle && (
          <Switch
            checked={equipment.isActive}
            onCheckedChange={(checked) => onUpdate({ isActive: checked })}
            disabled={isLoading}
            data-testid={`switch-${equipment.id}`}
          />
        )}
      </div>
      
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {equipment.type === 'inlet' ? 'Opening:' : equipment.type === 'heater' ? 'Output:' : 'Speed:'}
        </span>
        <div className="flex-1">
          <Slider
            value={[equipment.currentSetting || 0]}
            onValueChange={([value]) => onUpdate({ currentSetting: value })}
            max={100}
            step={1}
            disabled={isLoading || (showToggle && !equipment.isActive)}
            className="w-full"
            data-testid={`slider-${equipment.id}`}
          />
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400 w-10" data-testid={`text-setting-${equipment.id}`}>
          {equipment.currentSetting || 0}%
        </span>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400" data-testid={`text-stats-${equipment.id}`}>
        {getEquipmentStats()}
      </div>
    </div>
  );
}
