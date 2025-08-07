import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Feather, Home, Baby, Cog } from "lucide-react";
import { insertFarmSchema, insertFlockSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const setupSchema = z.object({
  // Farm details
  farmName: z.string().min(1, "Farm name is required"),
  length: z.number().min(5, "Length must be at least 5 meters").max(100, "Length must be less than 100 meters"),
  width: z.number().min(5, "Width must be at least 5 meters").max(100, "Width must be less than 100 meters"),
  height: z.number().min(2, "Height must be at least 2 meters").max(10, "Height must be less than 10 meters"),
  
  // Flock details
  flockName: z.string().min(1, "Flock name is required"),
  chickCount: z.number().min(50, "Minimum 50 chicks required").max(10000, "Maximum 10,000 chicks allowed"),
  currentAge: z.number().min(0, "Age cannot be negative").max(100, "Age must be less than 100 days"),
  averageWeight: z.number().min(20, "Weight must be at least 20g").max(5000, "Weight must be less than 5000g"),
});

type SetupFormData = z.infer<typeof setupSchema>;

export default function FarmSetupDialog() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      farmName: "Main Farm",
      length: 24,
      width: 12,
      height: 3.5,
      flockName: "Batch A",
      chickCount: 1250,
      currentAge: 18,
      averageWeight: 485,
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: SetupFormData) => {
      // Create farm first
      const farmResponse = await apiRequest('POST', '/api/farms', {
        name: data.farmName,
        length: data.length,
        width: data.width,
        height: data.height,
      });
      const farm = await farmResponse.json();

      // Create flock
      const flockResponse = await apiRequest('POST', '/api/flocks', {
        farmId: farm.id,
        name: data.flockName,
        chickCount: data.chickCount,
        currentAge: data.currentAge,
        averageWeight: data.averageWeight,
        batchDate: new Date(Date.now() - data.currentAge * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Create default equipment
      const equipmentData = [
        { 
          farmId: farm.id,
          type: 'fan', 
          name: 'Fan 1', 
          specification: { diameter: 120, power: 2.8 },
          isActive: true,
          currentSetting: 75 
        },
        { 
          farmId: farm.id,
          type: 'fan', 
          name: 'Fan 2', 
          specification: { diameter: 100, power: 2.1 },
          isActive: false,
          currentSetting: 0 
        },
        { 
          farmId: farm.id,
          type: 'heater', 
          name: 'Heater 1', 
          specification: { power: 15 },
          isActive: true,
          currentSetting: 45 
        },
        { 
          farmId: farm.id,
          type: 'heater', 
          name: 'Heater 2', 
          specification: { power: 12 },
          isActive: false,
          currentSetting: 0 
        },
        { 
          farmId: farm.id,
          type: 'inlet', 
          name: 'Air Inlet System', 
          specification: { surface: 2.4 },
          isActive: false,
          currentSetting: 30 
        },
      ];

      // Create equipment
      await Promise.all(equipmentData.map(equipment => 
        apiRequest('POST', '/api/equipment', equipment)
      ));

      // Create initial environmental reading
      await apiRequest('POST', '/api/environmental-readings', {
        farmId: farm.id,
        insideTemp: 28,
        insideHumidity: 65,
        outsideTemp: 22,
        outsideHumidity: 45,
        windSpeed: 12,
        pressure: 1013,
      });

      return { farm, flock: await flockResponse.json() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms'] });
      toast({
        title: "Farm Setup Complete",
        description: "Your poultry farm has been successfully configured.",
      });
    },
    onError: (error) => {
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Failed to setup farm. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SetupFormData) => {
    setupMutation.mutate(data);
  };

  const nextStep = async () => {
    const fields = step === 1 
      ? ['farmName', 'length', 'width', 'height'] as const
      : ['flockName', 'chickCount', 'currentAge', 'averageWeight'] as const;
    
    const isValid = await form.trigger(fields);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Home className="h-16 w-16 text-farm-green mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Farm Configuration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter your farm dimensions and basic information
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="farmName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Farm Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter farm name" 
                  {...field} 
                  data-testid="input-farm-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length (m)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="24" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    data-testid="input-farm-length"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width (m)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="12" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    data-testid="input-farm-width"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (m)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="3.5" 
                    step="0.1"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    data-testid="input-farm-height"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Calculated:</strong> Floor area: {(form.watch('length') * form.watch('width')).toFixed(1)} m² | 
            Volume: {(form.watch('length') * form.watch('width') * form.watch('height')).toFixed(1)} m³
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Baby className="h-16 w-16 text-farm-orange mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Flock Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter details about your current batch of chicks
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="flockName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Flock/Batch Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter flock name" 
                  {...field} 
                  data-testid="input-flock-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="chickCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Chicks</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1250" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-chick-count"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Age (days)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="18" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-current-age"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="averageWeight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Average Weight (grams)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="485" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  data-testid="input-average-weight"
                />
              </FormControl>
              <FormDescription>
                Current average weight of chicks in grams
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            <strong>Density:</strong> {((form.watch('chickCount') / (form.watch('length') * form.watch('width')))).toFixed(1)} birds/m² |
            <strong className="ml-2">Growth Stage:</strong> {
              form.watch('currentAge') < 14 ? 'Starter' : 
              form.watch('currentAge') < 28 ? 'Grower' : 'Finisher'
            }
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Cog className="h-16 w-16 text-farm-blue mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Equipment Setup
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Default equipment will be configured for your farm
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default Equipment Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Fan 1 (Ø 120cm)</span>
              <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">Active - 75%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Fan 2 (Ø 100cm)</span>
              <span className="text-xs text-gray-600 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Standby</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Heater 1 (15 kW)</span>
              <span className="text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded">Active - 45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Heater 2 (12 kW)</span>
              <span className="text-xs text-gray-600 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Standby</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Air Inlet System (2.4 m²)</span>
              <span className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded">30% Opening</span>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            <strong>Note:</strong> You can modify equipment settings after setup is complete. 
            The system will use AI calculations to optimize environmental conditions.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" data-testid="dialog-farm-setup">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <Feather className="h-6 w-6 text-farm-green" />
            <div>
              <DialogTitle>Welcome to ChickMaster Pro</DialogTitle>
              <DialogDescription>
                Let's set up your poultry farm management system
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${stepNum === step 
                    ? 'bg-farm-green text-white' 
                    : stepNum < step 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }
                `} data-testid={`step-indicator-${stepNum}`}>
                  {stepNum < step ? '✓' : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`
                    w-12 h-0.5 mx-2
                    ${stepNum < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}
                  `}></div>
                )}
              </div>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}

              <Separator />

              <div className="flex justify-between">
                {step > 1 ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                    data-testid="button-previous"
                  >
                    Previous
                  </Button>
                ) : (
                  <div></div>
                )}

                {step < 3 ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    className="bg-farm-green hover:bg-green-700"
                    data-testid="button-next"
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={setupMutation.isPending}
                    className="bg-farm-green hover:bg-green-700"
                    data-testid="button-complete-setup"
                  >
                    {setupMutation.isPending ? 'Setting up...' : 'Complete Setup'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
