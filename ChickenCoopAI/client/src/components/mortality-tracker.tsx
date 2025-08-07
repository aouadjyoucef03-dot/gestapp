import { Heart, Plus, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Flock } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MortalityTrackerProps {
  flock?: Flock;
}

const mortalityCauses = [
  "Natural",
  "Disease",
  "Heat stress",
  "Cold stress",
  "Injury",
  "Unknown",
  "Culling",
];

export default function MortalityTracker({ flock }: MortalityTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deathCount, setDeathCount] = useState(1);
  const [cause, setCause] = useState("Natural");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: todaysMortality } = useQuery({
    queryKey: ['/api/flocks', flock?.id, 'mortality', 'today'],
    enabled: !!flock?.id,
  });

  const addMortalityMutation = useMutation({
    mutationFn: async ({ deathCount, cause }: { deathCount: number; cause: string }) => {
      const response = await apiRequest('POST', '/api/mortality-records', {
        flockId: flock?.id,
        deathCount,
        cause,
        date: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flocks', flock?.id, 'mortality'] });
      queryClient.invalidateQueries({ queryKey: ['/api/farms', flock?.farmId, 'flocks'] });
      toast({
        title: "Mortality Record Added",
        description: "Mortality data has been recorded successfully.",
      });
      setIsOpen(false);
      setDeathCount(1);
      setCause("Natural");
    },
    onError: () => {
      toast({
        title: "Failed to Add Record",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deathCount > 0) {
      addMortalityMutation.mutate({ deathCount, cause });
    }
  };

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

  const currentMortality = (todaysMortality as { mortality: number })?.mortality || 0;
  const totalLosses = flock.initialChickCount - flock.chickCount;
  const mortalityRate = ((totalLosses / flock.initialChickCount) * 100);

  const getMortalityColor = (rate: number) => {
    if (rate <= 2) return 'text-green-600';
    if (rate <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMortalityStatus = (rate: number) => {
    if (rate <= 2) return 'Excellent';
    if (rate <= 5) return 'Good';
    return 'Concerning';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <Heart className="text-red-500 mr-2" />
          Mortality Tracking
        </h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {/* Current Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-today-mortality">
                {currentMortality}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Deaths today</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className={`text-2xl font-bold ${getMortalityColor(mortalityRate)}`} data-testid="text-mortality-rate">
                {mortalityRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total mortality rate</p>
            </div>
          </div>

          {/* Status */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="text-blue-600 mr-2 h-4 w-4" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300" data-testid="text-mortality-status">
                  Status: {getMortalityStatus(mortalityRate)}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Total losses: {totalLosses} birds from initial {flock.initialChickCount}
                </p>
              </div>
            </div>
          </div>

          {/* Add Record Dialog */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full"
                data-testid="button-add-mortality"
              >
                <Plus className="mr-2 h-4 w-4" />
                Record Mortality
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-mortality">
              <DialogHeader>
                <DialogTitle>Record Mortality</DialogTitle>
                <DialogDescription>
                  Add mortality data for today
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="deathCount">Number of Deaths</Label>
                  <Input
                    id="deathCount"
                    type="number"
                    min="1"
                    value={deathCount}
                    onChange={(e) => setDeathCount(parseInt(e.target.value) || 1)}
                    data-testid="input-death-count"
                  />
                </div>
                <div>
                  <Label htmlFor="cause">Cause</Label>
                  <Select value={cause} onValueChange={setCause}>
                    <SelectTrigger data-testid="select-mortality-cause">
                      <SelectValue placeholder="Select cause" />
                    </SelectTrigger>
                    <SelectContent>
                      {mortalityCauses.map((causeOption) => (
                        <SelectItem key={causeOption} value={causeOption}>
                          {causeOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                    data-testid="button-cancel-mortality"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addMortalityMutation.isPending}
                    data-testid="button-save-mortality"
                  >
                    {addMortalityMutation.isPending ? 'Recording...' : 'Record'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}