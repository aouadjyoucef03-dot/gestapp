import { useState } from "react";
import { Utensils, Plus, Droplets } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Flock } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { calculateConsumptionTargets } from "@/lib/calculations";
import { useToast } from "@/hooks/use-toast";
import RecordInputDialog from "./record-input-dialog";

interface FeedWaterTrackerProps {
  flock?: Flock;
}

export default function FeedWaterTracker({ flock }: FeedWaterTrackerProps) {
  const [feedDialogOpen, setFeedDialogOpen] = useState(false);
  const [waterDialogOpen, setWaterDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: consumption } = useQuery({
    queryKey: ['/api/flocks', flock?.id, 'consumption', 'today'],
    enabled: !!flock?.id,
  });

  const addRecordMutation = useMutation({
    mutationFn: async ({ type, amount }: { type: 'feed' | 'water'; amount: number }) => {
      const response = await apiRequest('POST', '/api/feed-water-records', {
        flockId: flock?.id,
        type,
        amount,
        date: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/flocks', flock?.id, 'consumption', 'today'] });
      toast({
        title: "Record Added",
        description: `${variables.type === 'feed' ? 'Feed' : 'Water'} record added successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to Add Record",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!flock) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <p className="text-gray-500 dark:text-gray-400 text-center" data-testid="text-no-flock">
            No flock selected
          </p>
        </div>
      </div>
    );
  }

  const targets = calculateConsumptionTargets(flock.chickCount, flock.currentAge);
  const dailyFeed = (consumption as { feed: number; water: number })?.feed || 0;
  const dailyWater = (consumption as { feed: number; water: number })?.water || 0;

  const feedPercentage = Math.min(100, (dailyFeed / targets.feed) * 100);
  const waterPercentage = Math.min(100, (dailyWater / targets.water) * 100);

  const handleAddFeed = (amount: number) => {
    addRecordMutation.mutate({ type: 'feed', amount });
    setFeedDialogOpen(false);
  };

  const handleAddWater = (amount: number) => {
    addRecordMutation.mutate({ type: 'water', amount });
    setWaterDialogOpen(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <Utensils className="text-farm-orange mr-2" />
          Feed & Water
        </h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {/* Feed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Feed</span>
              <span className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-daily-feed">
                {dailyFeed} kg
              </span>
            </div>
            <Progress value={feedPercentage} className="w-full h-2" data-testid="progress-feed" />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span data-testid="text-feed-target">Target: {targets.feed} kg</span>
              <span data-testid="text-feed-percentage">{Math.round(feedPercentage)}% consumed</span>
            </div>
          </div>

          {/* Water */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Water</span>
              <span className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-daily-water">
                {dailyWater} L
              </span>
            </div>
            <Progress value={waterPercentage} className="w-full h-2" data-testid="progress-water" />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span data-testid="text-water-target">Target: {targets.water} L</span>
              <span data-testid="text-water-percentage">{Math.round(waterPercentage)}% consumed</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setFeedDialogOpen(true)}
              disabled={addRecordMutation.isPending}
              data-testid="button-add-feed"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Feed Record
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setWaterDialogOpen(true)}
              disabled={addRecordMutation.isPending}
              data-testid="button-add-water"
            >
              <Droplets className="mr-2 h-4 w-4" />
              Add Water Record
            </Button>
          </div>
        </div>
      </div>

      {/* Feed Input Dialog */}
      <RecordInputDialog
        open={feedDialogOpen}
        onOpenChange={setFeedDialogOpen}
        title="Add Feed Record"
        description="Enter the amount of feed provided to the flock"
        unit="kg"
        onSubmit={handleAddFeed}
        isLoading={addRecordMutation.isPending}
      />

      {/* Water Input Dialog */}
      <RecordInputDialog
        open={waterDialogOpen}
        onOpenChange={setWaterDialogOpen}
        title="Add Water Record"
        description="Enter the amount of water provided to the flock"
        unit="L"
        onSubmit={handleAddWater}
        isLoading={addRecordMutation.isPending}
      />
    </div>
  );
}
