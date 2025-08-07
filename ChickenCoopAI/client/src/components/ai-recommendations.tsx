import { Brain, Bot } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Equipment, Flock } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIRecommendationsProps {
  farmId: string;
  flock?: Flock;
  equipment: Equipment[];
}

export default function AIRecommendations({ farmId, flock, equipment }: AIRecommendationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  });

  const recommendations = calculations?.recommendations || [];

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'warning':
        return 'destructive';
      case 'success':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <i className="fas fa-exclamation-triangle text-yellow-600"></i>;
      case 'success':
        return <i className="fas fa-check-circle text-green-600"></i>;
      case 'info':
        return <i className="fas fa-lightbulb text-blue-600"></i>;
      default:
        return <i className="fas fa-info-circle text-gray-600"></i>;
    }
  };

  const getAlertBorderColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'success':
        return 'border-l-green-400 bg-green-50 dark:bg-green-900/20';
      case 'info':
        return 'border-l-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-l-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const applyAISuggestions = async () => {
    if (!recommendations.length) return;
    
    try {
      // Apply temperature adjustments based on recommendations
      for (const rec of recommendations) {
        if (rec.action === 'temperature_low') {
          // Increase heater output or reduce fan speed
          const heaters = equipment.filter(eq => eq.type === 'heater' && !eq.isActive);
          const fans = equipment.filter(eq => eq.type === 'fan' && eq.isActive && (eq.currentSetting || 0) > 50);
          
          if (heaters.length > 0) {
            // Activate first available heater at 50%
            await apiRequest('PATCH', `/api/equipment/${heaters[0].id}`, {
              isActive: true,
              currentSetting: 50
            });
          } else if (fans.length > 0) {
            // Reduce fan speed by 20%
            const newSetting = Math.max(20, (fans[0].currentSetting || 0) - 20);
            await apiRequest('PATCH', `/api/equipment/${fans[0].id}`, {
              currentSetting: newSetting
            });
          }
        } else if (rec.action === 'temperature_high') {
          // Increase fan speed or reduce heater output
          const fans = equipment.filter(eq => eq.type === 'fan' && (eq.currentSetting || 0) < 80);
          const heaters = equipment.filter(eq => eq.type === 'heater' && eq.isActive && (eq.currentSetting || 0) > 30);
          
          if (fans.length > 0) {
            // Increase fan speed by 20%
            const newSetting = Math.min(100, (fans[0].currentSetting || 0) + 20);
            await apiRequest('PATCH', `/api/equipment/${fans[0].id}`, {
              isActive: true,
              currentSetting: newSetting
            });
          } else if (heaters.length > 0) {
            // Reduce heater output by 20%
            const newSetting = Math.max(0, (heaters[0].currentSetting || 0) - 20);
            await apiRequest('PATCH', `/api/equipment/${heaters[0].id}`, {
              currentSetting: newSetting
            });
          }
        }
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'equipment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calculate-environment'] });
      
      toast({
        title: "AI Suggestions Applied",
        description: "Equipment settings have been automatically optimized.",
      });
    } catch (error) {
      toast({
        title: "Failed to Apply Suggestions",
        description: "Some equipment adjustments could not be applied.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <Brain className="text-farm-green mr-2" />
          AI Recommendations
        </h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p data-testid="text-no-recommendations">No recommendations available</p>
              <p className="text-sm">AI analysis in progress...</p>
            </div>
          ) : (
            recommendations.map((rec, index) => (
              <Alert 
                key={index} 
                className={`${getAlertBorderColor(rec.type)} border-l-4`}
                data-testid={`alert-recommendation-${index}`}
              >
                <div className="flex items-center">
                  {getAlertIcon(rec.type)}
                  <h4 className="text-sm font-medium ml-2" data-testid={`text-rec-title-${index}`}>
                    {rec.title}
                  </h4>
                </div>
                <AlertDescription className="mt-1" data-testid={`text-rec-message-${index}`}>
                  {rec.message}
                </AlertDescription>
              </Alert>
            ))
          )}
        </div>

        {recommendations.length > 0 && (
          <Button 
            className="w-full mt-4 bg-farm-green hover:bg-green-700 text-white"
            onClick={applyAISuggestions}
            data-testid="button-apply-suggestions"
          >
            <Bot className="mr-2 h-4 w-4" />
            Apply AI Suggestions
          </Button>
        )}
      </div>
    </div>
  );
}
