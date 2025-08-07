import { Baby, Calendar, Weight, Heart } from "lucide-react";
import type { Farm, Flock } from "@shared/schema";

interface QuickStatsProps {
  farm: Farm;
  flock?: Flock;
}

export default function QuickStats({ farm, flock }: QuickStatsProps) {
  if (!flock) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p data-testid="text-no-flock">No flock data available</p>
            <p className="text-sm">Add a flock to view statistics</p>
          </div>
        </div>
      </div>
    );
  }

  const mortalityRate = 2.1; // This would be calculated from actual data
  const growthRate = 2.5; // This would be calculated from historical data

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Chicks</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-total-chicks">
              {flock.chickCount.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-farm-green bg-opacity-10 rounded-full">
            <Baby className="text-farm-green text-xl" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className="text-sm text-green-600 font-medium">+{growthRate}%</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">from last week</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Age</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-avg-age">
              {flock.currentAge} days
            </p>
          </div>
          <div className="p-3 bg-farm-blue bg-opacity-10 rounded-full">
            <Calendar className="text-farm-blue text-xl" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Growth stage:</span>
          <span className="text-sm text-farm-blue font-medium ml-2" data-testid="text-growth-stage">
            {flock.currentAge < 14 ? 'Starter' : flock.currentAge < 28 ? 'Grower' : 'Finisher'}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Weight</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-avg-weight">
              {flock.averageWeight}g
            </p>
          </div>
          <div className="p-3 bg-farm-orange bg-opacity-10 rounded-full">
            <Weight className="text-farm-orange text-xl" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className="text-sm text-green-600 font-medium">On target</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs standard</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mortality Rate</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-mortality-rate">
              {mortalityRate}%
            </p>
          </div>
          <div className="p-3 bg-red-500 bg-opacity-10 rounded-full">
            <Heart className="text-red-500 text-xl" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className="text-sm text-green-600 font-medium">-0.3%</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs industry avg</span>
        </div>
      </div>
    </div>
  );
}
