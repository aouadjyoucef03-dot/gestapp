import { CloudSun, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface WeatherPanelProps {
  farmId: string;
}

export default function WeatherPanel({ farmId }: WeatherPanelProps) {
  // Default coordinates (can be made configurable)
  const lat = 40.7128;
  const lon = -74.0060;

  const { data: weather, isLoading, refetch } = useQuery({
    queryKey: ['/api/weather', lat, lon],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const getWeatherIcon = () => {
    if (!weather) return <CloudSun className="text-yellow-500 text-2xl" />;
    
    // Simple icon mapping
    const temp = weather.temperature;
    if (temp > 25) return <i className="fas fa-sun text-yellow-500 text-2xl"></i>;
    if (temp > 15) return <CloudSun className="text-blue-500 text-2xl" />;
    return <i className="fas fa-cloud text-gray-500 text-2xl"></i>;
  };

  const getForecastMessage = () => {
    if (!weather) return "Weather data unavailable";
    
    const temp = weather.temperature;
    if (temp > 30) return "Hot weather expected. Increase ventilation.";
    if (temp < 5) return "Cold conditions. Ensure adequate heating.";
    return "Stable conditions expected. No equipment adjustments needed.";
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <CloudSun className="text-farm-blue mr-2" />
            Weather Conditions
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            data-testid="button-refresh-weather"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            {getWeatherIcon()}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-outside-temp">
            {weather ? `${weather.temperature.toFixed(1)}°C` : '--°C'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Outside Temperature</p>
        </div>
        
        {weather && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Humidity</span>
              <span className="text-sm font-medium" data-testid="text-outside-humidity">
                {weather.humidity}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Wind Speed</span>
              <span className="text-sm font-medium" data-testid="text-wind-speed">
                {weather.windSpeed.toFixed(1)} km/h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pressure</span>
              <span className="text-sm font-medium" data-testid="text-pressure">
                {weather.pressure} hPa
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">24h Forecast Impact:</p>
          <p className="text-sm text-farm-blue font-medium" data-testid="text-forecast-message">
            {getForecastMessage()}
          </p>
        </div>
      </div>
    </div>
  );
}
