import { Thermometer } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Farm, Equipment, EnvironmentalReading, Flock } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// import EquipmentControl from "./equipment-control"; // TODO: create if needed

interface EnvironmentalControlsProps {
  farm: Farm;
  equipment: Equipment[];
  environmentalData?: EnvironmentalReading;
  flock?: Flock;
}

export default function EnvironmentalControls({ 
  farm, 
  equipment, 
  environmentalData,
  flock 
}: EnvironmentalControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI calculations
  const { data: calculations } = useQuery({
    queryKey: ['/api/calculate-environment', farm.id, environmentalData?.outsideTemp],
    enabled: !!environmentalData,
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/calculate-environment', {
        farmId: farm.id,
        outsideTemp: environmentalData?.outsideTemp || 22,
        outsideHumidity: environmentalData?.outsideHumidity || 45,
        windSpeed: environmentalData?.windSpeed || 12,
        flockAge: flock?.currentAge || 18,
      });
      return response.json();
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { isActive?: boolean; currentSetting?: number }}) => {
      const response = await apiRequest('PATCH', `/api/equipment/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farm.id, 'equipment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calculate-environment'] });
      toast({
        title: "Equipment Updated",
        description: "Equipment settings have been applied successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update equipment settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentTemp = calculations?.insideTemp || environmentalData?.insideTemp || 28;
  const currentHumidity = calculations?.insideHumidity || environmentalData?.insideHumidity || 65;
  const ventilationLevel = equipment
    .filter(eq => eq.type === 'fan' && eq.isActive)
    .reduce((sum, fan) => sum + (fan.currentSetting || 0), 0) / 
    equipment.filter(eq => eq.type === 'fan').length || 0;

  // Age-based targets
  const targetTempMin = flock?.currentAge ? (flock.currentAge < 7 ? 32 : flock.currentAge < 14 ? 30 : flock.currentAge < 21 ? 27 : flock.currentAge < 28 ? 24 : 21) : 30;
  const targetTempMax = targetTempMin + 3;

  const getTemperatureColor = (temp: number) => {
    if (temp < targetTempMin) return 'from-temp-cool to-blue-600';
    if (temp > targetTempMax) return 'from-temp-warm to-temp-hot';
    return 'from-temp-warm to-temp-hot';
  };

  const getTemperatureProgress = (temp: number) => {
    const range = targetTempMax - targetTempMin;
    const progress = Math.max(0, Math.min(100, ((temp - targetTempMin) / range) * 100));
    return Math.round(progress);
  };

  const fans = equipment.filter(eq => eq.type === 'fan');
  const heaters = equipment.filter(eq => eq.type === 'heater');
  const inlets = equipment.filter(eq => eq.type === 'inlet');

  return (
    <div className="space-y-6">
      {/* Current Environment Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Thermometer className="text-farm-green mr-2" />
            Environmental Conditions
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Temperature */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getTemperatureColor(currentTemp)} flex items-center justify-center`}>
                  <div className="text-white">
                    <div className="text-2xl font-bold" data-testid="text-current-temp">
                      {currentTemp.toFixed(1)}°C
                    </div>
                    <div className="text-xs">Current</div>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Inside Temperature</p>
              <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="text-temp-target">
                Target: {targetTempMin}-{targetTempMax}°C
              </p>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-temp-warm h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${getTemperatureProgress(currentTemp)}%` }}
                  data-testid="progress-temperature"
                ></div>
              </div>
            </div>

            {/* Humidity */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-farm-blue to-blue-600 flex items-center justify-center">
                  <div className="text-white">
                    <div className="text-2xl font-bold" data-testid="text-current-humidity">
                      {currentHumidity.toFixed(0)}%
                    </div>
                    <div className="text-xs">Current</div>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Humidity</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Target: 60-70%</p>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-farm-blue h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, currentHumidity)}%` }}
                  data-testid="progress-humidity"
                ></div>
              </div>
            </div>

            {/* Ventilation */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-farm-green flex items-center justify-center">
                  <div className="text-white">
                    <div className="text-2xl font-bold" data-testid="text-ventilation-level">
                      {Math.round(ventilationLevel)}%
                    </div>
                    <div className="text-xs">Active</div>
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Ventilation</p>
              <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="text-active-fans">
                {equipment.filter(eq => eq.type === 'fan' && eq.isActive).length} fans running
              </p>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-farm-green h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${ventilationLevel}%` }}
                  data-testid="progress-ventilation"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <i className="fas fa-cogs text-farm-green mr-2"></i>
            Equipment Controls
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* Fans */}
            {fans.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ventilation Fans</h3>
                <div className="space-y-3">
                  {fans.map((fan) => (
                    <div key={fan.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{fan.name}</h4>
                        <button
                          onClick={() => updateEquipmentMutation.mutate({ 
                            id: fan.id, 
                            data: { isActive: !fan.isActive } 
                          })}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            fan.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                          }`}
                          data-testid={`toggle-fan-${fan.id}`}
                        >
                          {fan.isActive ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {fan.specification && typeof fan.specification === 'object' && 'diameter' in fan.specification
                          ? `Diameter: ${fan.specification.diameter}cm`
                          : 'Standard fan'
                        }
                      </div>
                      <div className="flex items-center space-x-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Speed:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={fan.currentSetting || 0}
                          onChange={(e) => updateEquipmentMutation.mutate({ 
                            id: fan.id, 
                            data: { currentSetting: parseInt(e.target.value) } 
                          })}
                          className="flex-1"
                          data-testid={`slider-fan-${fan.id}`}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-10">
                          {fan.currentSetting || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Heaters */}
            {heaters.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Heating Systems</h3>
                <div className="space-y-3">
                  {heaters.map((heater) => (
                    <div key={heater.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{heater.name}</h4>
                        <button
                          onClick={() => updateEquipmentMutation.mutate({ 
                            id: heater.id, 
                            data: { isActive: !heater.isActive } 
                          })}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            heater.isActive 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                          }`}
                          data-testid={`toggle-heater-${heater.id}`}
                        >
                          {heater.isActive ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {heater.specification && typeof heater.specification === 'object' && 'power' in heater.specification
                          ? `Power: ${heater.specification.power}kW`
                          : 'Standard heater'
                        }
                      </div>
                      <div className="flex items-center space-x-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Power:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={heater.currentSetting || 0}
                          onChange={(e) => updateEquipmentMutation.mutate({ 
                            id: heater.id, 
                            data: { currentSetting: parseInt(e.target.value) } 
                          })}
                          className="flex-1"
                          data-testid={`slider-heater-${heater.id}`}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-10">
                          {heater.currentSetting || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Air Inlets */}
            {inlets.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Air Inlets</h3>
                <div className="space-y-3">
                  {inlets.map((inlet) => (
                    <div key={inlet.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{inlet.name}</h4>
                        <button
                          onClick={() => updateEquipmentMutation.mutate({ 
                            id: inlet.id, 
                            data: { isActive: !inlet.isActive } 
                          })}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            inlet.isActive 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                          }`}
                          data-testid={`toggle-inlet-${inlet.id}`}
                        >
                          {inlet.isActive ? 'OPEN' : 'CLOSED'}
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {inlet.specification && typeof inlet.specification === 'object' && 'surface' in inlet.specification
                          ? `Surface: ${inlet.specification.surface}m²`
                          : 'Standard inlet'
                        }
                      </div>
                      <div className="flex items-center space-x-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Opening:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={inlet.currentSetting || 0}
                          onChange={(e) => updateEquipmentMutation.mutate({ 
                            id: inlet.id, 
                            data: { currentSetting: parseInt(e.target.value) } 
                          })}
                          className="flex-1"
                          data-testid={`slider-inlet-${inlet.id}`}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-10">
                          {inlet.currentSetting || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
