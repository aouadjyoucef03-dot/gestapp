import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Feather, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import QuickStats from "@/components/quick-stats";
import EnvironmentalControls from "@/components/environmental-controls";
import WeatherPanel from "@/components/weather-panel";
import AIRecommendations from "@/components/ai-recommendations";
import FeedWaterTracker from "@/components/feed-water-tracker";
import GrowthProjections from "@/components/growth-projections";
import DailyChecklist from "@/components/daily-checklist";
import FarmSetupDialog from "@/components/farm-setup-dialog";
import MortalityTracker from "@/components/mortality-tracker";
import EquipmentManagementDialog from "@/components/equipment-management-dialog";
import FarmDetailsDialog from "@/components/farm-details-dialog";

export default function Dashboard() {
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [farmDetailsDialogOpen, setFarmDetailsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: farms, isLoading: farmsLoading } = useQuery({
    queryKey: ['/api/farms'],
  });

  const { data: farm } = useQuery({
    queryKey: ['/api/farms', farms?.[0]?.id],
    enabled: !!farms?.[0]?.id,
  });

  const { data: flocks } = useQuery({
    queryKey: ['/api/farms', farm?.id, 'flocks'],
    enabled: !!farm?.id,
  });

  const { data: equipment } = useQuery({
    queryKey: ['/api/farms', farm?.id, 'equipment'],
    enabled: !!farm?.id,
  });

  const { data: environmentalData } = useQuery({
    queryKey: ['/api/farms', farm?.id, 'readings', 'latest'],
    enabled: !!farm?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleSyncData = async () => {
    try {
      // Simulate data sync
      toast({
        title: "Data Synced",
        description: "All environmental data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Unable to sync data. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (farmsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-farm-green"></div>
      </div>
    );
  }

  if (!farm) {
    return <FarmSetupDialog />;
  }

  const primaryFlock = flocks?.[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Feather className="text-farm-green text-2xl" data-testid="logo-icon" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100" data-testid="app-title">
                  ChickMaster Pro
                </h1>
                <button 
                  onClick={() => setFarmDetailsDialogOpen(true)}
                  className="text-sm text-farm-green hover:text-green-700 cursor-pointer"
                  data-testid="button-edit-farm"
                >
                  {farm?.name} - Edit Details
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400" data-testid="datetime-display">
                <span data-testid="current-date">{currentDate}</span> | 
                <span data-testid="current-time" className="ml-1">{currentTime}</span>
              </div>
              <Button 
                onClick={() => setEquipmentDialogOpen(true)}
                variant="outline"
                data-testid="button-manage-equipment"
              >
                <Settings className="mr-2 h-4 w-4" />
                Manage Equipment
              </Button>
              <Button 
                onClick={handleSyncData}
                className="bg-farm-green text-white hover:bg-green-700"
                data-testid="button-sync-data"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="mb-8">
          <QuickStats farm={farm} flock={primaryFlock} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Environmental Controls */}
          <div className="lg:col-span-2 space-y-6">
            <EnvironmentalControls 
              farm={farm} 
              equipment={equipment || []} 
              environmentalData={environmentalData} 
              flock={primaryFlock}
            />
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            <WeatherPanel farmId={farm.id} />
            <AIRecommendations farmId={farm.id} flock={primaryFlock} equipment={equipment || []} />
            <FeedWaterTracker flock={primaryFlock} />
            <MortalityTracker flock={primaryFlock} />
            <div className="text-xs text-gray-500 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Farm Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Dimensions</span>
                  <span className="font-medium" data-testid="text-farm-dimensions">
                    {farm.length}m × {farm.width}m × {farm.height}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Floor Area</span>
                  <span className="font-medium" data-testid="text-floor-area">
                    {farm.length * farm.width} m²
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Volume</span>
                  <span className="font-medium" data-testid="text-volume">
                    {farm.length * farm.width * farm.height} m³
                  </span>
                </div>
                {primaryFlock && (
                  <div className="flex justify-between">
                    <span>Density</span>
                    <span className="font-medium" data-testid="text-density">
                      {((primaryFlock.chickCount / (farm.length * farm.width)) * 100 / 100).toFixed(1)} birds/m²
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Management Actions */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DailyChecklist farmId={farm.id} />
          <GrowthProjections flock={primaryFlock} farmId={farm.id} />
        </div>
      </div>

      {/* Equipment Management Dialog */}
      {farm && (
        <EquipmentManagementDialog 
          open={equipmentDialogOpen}
          onOpenChange={setEquipmentDialogOpen}
          farmId={farm.id}
        />
      )}

      {/* Farm Details Dialog */}
      {farm && (
        <FarmDetailsDialog 
          open={farmDetailsDialogOpen}
          onOpenChange={setFarmDetailsDialogOpen}
          farm={farm}
        />
      )}
    </div>
  );
}
