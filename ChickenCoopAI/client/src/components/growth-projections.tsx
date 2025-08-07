import { TrendingUp, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import type { Flock } from "@shared/schema";
import { calculateGrowthProjections } from "@/lib/calculations";
import { apiRequest } from "@/lib/queryClient";

interface GrowthProjectionsProps {
  flock?: Flock;
  farmId: string;
}

export default function GrowthProjections({ flock, farmId }: GrowthProjectionsProps) {
  const { data: calculations } = useQuery({
    queryKey: ['/api/calculate-environment', farmId],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/calculate-environment', {
        farmId,
        outsideTemp: 22,
        outsideHumidity: 45,
        windSpeed: 12,
        flockAge: flock?.currentAge || 18,
      });
      return response.json();
    },
    enabled: !!flock,
  });

  if (!flock) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <p className="text-gray-500 dark:text-gray-400 text-center" data-testid="text-no-flock">
            No flock data available
          </p>
        </div>
      </div>
    );
  }

  const projections = calculations ? calculateGrowthProjections(flock, calculations) : null;

  if (!projections) {
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

  const growthRateColor = projections.growthRateVsStandard > 0 ? 'text-green-600' : 'text-red-600';
  const growthRateSign = projections.growthRateVsStandard > 0 ? '+' : '';
  const fcrColor = projections.fcr <= 1.65 ? 'text-green-600' : 'text-yellow-600';
  
  const getEnvironmentalMessage = () => {
    if (projections.environmentalFactor >= 1.0) {
      return "Current conditions support optimal growth rate. Maintain temperature consistency.";
    } else if (projections.environmentalFactor >= 0.9) {
      return "Good environmental conditions. Minor improvements could enhance growth.";
    } else {
      return "Environmental stress detected. Optimize temperature and humidity for better growth.";
    }
  };

  const getEnvironmentalIcon = () => {
    if (projections.environmentalFactor >= 1.0) {
      return <Info className="text-green-600 mr-2" />;
    } else if (projections.environmentalFactor >= 0.9) {
      return <Info className="text-yellow-600 mr-2" />;
    } else {
      return <Info className="text-red-600 mr-2" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <TrendingUp className="text-farm-blue mr-2" />
          Growth Projections
        </h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-projected-weight-7d">
                {projections.projectedWeight7d}g
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Projected weight (7 days)</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-projected-weight-14d">
                {projections.projectedWeight14d}g
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Projected weight (14 days)</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Growth Rate vs Standard</span>
                <span className={`font-medium ${growthRateColor}`} data-testid="text-growth-rate">
                  {growthRateSign}{projections.growthRateVsStandard}%
                </span>
              </div>
              <Progress 
                value={Math.min(100, Math.max(0, 50 + projections.growthRateVsStandard))} 
                className="w-full h-2" 
                data-testid="progress-growth-rate"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Feed Conversion Ratio</span>
                <span className={`font-medium ${fcrColor}`} data-testid="text-fcr">
                  {projections.fcr}
                </span>
              </div>
              <Progress 
                value={Math.min(100, (1.8 - projections.fcr) / 0.6 * 100)} 
                className="w-full h-2" 
                data-testid="progress-fcr"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Target: 1.65 (Better efficiency)
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center">
              {getEnvironmentalIcon()}
              <p className="text-sm text-blue-700 dark:text-blue-300" data-testid="text-environmental-message">
                {getEnvironmentalMessage()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
