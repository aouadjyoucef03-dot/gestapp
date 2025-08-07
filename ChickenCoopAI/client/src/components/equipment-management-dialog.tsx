import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Fan, Flame, Wind } from "lucide-react";
import { insertEquipmentSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Equipment } from "@shared/schema";

const equipmentFormSchema = z.object({
  type: z.enum(['fan', 'heater', 'inlet']),
  name: z.string().min(1, "Equipment name is required"),
  diameter: z.number().optional(),
  power: z.number().optional(),
  surface: z.number().optional(),
  isActive: z.boolean().default(false),
  currentSetting: z.number().min(0).max(100).default(0),
});

type EquipmentFormData = z.infer<typeof equipmentFormSchema>;

interface EquipmentManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
}

export default function EquipmentManagementDialog({ 
  open, 
  onOpenChange, 
  farmId 
}: EquipmentManagementDialogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: equipment = [] } = useQuery({
    queryKey: ['/api/farms', farmId, 'equipment'],
    enabled: !!farmId,
  });

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      type: 'fan',
      name: '',
      diameter: 120,
      power: 15,
      surface: 2.4,
      isActive: false,
      currentSetting: 0,
    },
  });

  const addEquipmentMutation = useMutation({
    mutationFn: async (data: EquipmentFormData) => {
      const specification: Record<string, number> = {};
      
      if (data.type === 'fan' && data.diameter) {
        specification.diameter = data.diameter;
        specification.power = data.diameter * 0.025; // Estimated power based on diameter
      } else if (data.type === 'heater' && data.power) {
        specification.power = data.power;
      } else if (data.type === 'inlet' && data.surface) {
        specification.surface = data.surface;
      }

      const response = await apiRequest('POST', '/api/equipment', {
        farmId,
        type: data.type,
        name: data.name,
        specification,
        isActive: data.isActive,
        currentSetting: data.currentSetting,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'equipment'] });
      toast({
        title: "Equipment Added",
        description: "New equipment has been added successfully.",
      });
      form.reset();
      setIsAdding(false);
    },
    onError: () => {
      toast({
        title: "Failed to Add Equipment",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      const response = await apiRequest('DELETE', `/api/equipment/${equipmentId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'equipment'] });
      toast({
        title: "Equipment Removed",
        description: "Equipment has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Remove Equipment",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EquipmentFormData) => {
    addEquipmentMutation.mutate(data);
  };

  const handleDelete = (equipmentId: string) => {
    deleteEquipmentMutation.mutate(equipmentId);
  };

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'fan':
        return <Fan className="h-5 w-5 text-farm-green" />;
      case 'heater':
        return <Flame className="h-5 w-5 text-farm-orange" />;
      case 'inlet':
        return <Wind className="h-5 w-5 text-farm-blue" />;
      default:
        return null;
    }
  };

  const getEquipmentSpec = (equipment: Equipment) => {
    const spec = equipment.specification;
    switch (equipment.type) {
      case 'fan':
        return `Ø ${spec?.diameter || 0}cm`;
      case 'heater':
        return `${spec?.power || 0} kW`;
      case 'inlet':
        return `${spec?.surface || 0} m²`;
      default:
        return '';
    }
  };

  const selectedType = form.watch('type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-equipment-management">
        <DialogHeader>
          <DialogTitle>Equipment Management</DialogTitle>
          <DialogDescription>
            Add, remove, and configure your farm equipment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Equipment */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Current Equipment
            </h3>
            <div className="grid gap-3">
              {equipment.map((item: Equipment) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getEquipmentIcon(item.type)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100" data-testid={`text-equipment-${item.id}`}>
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {getEquipmentSpec(item)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.isActive 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {item.isActive ? `Active - ${item.currentSetting}%` : 'Standby'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteEquipmentMutation.isPending}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Add New Equipment */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add New Equipment
              </h3>
              {!isAdding && (
                <Button onClick={() => setIsAdding(true)} data-testid="button-add-equipment">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Equipment
                </Button>
              )}
            </div>

            {isAdding && (
              <Card className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Equipment Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-equipment-type">
                                  <SelectValue placeholder="Select equipment type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fan">Cooling Fan</SelectItem>
                                <SelectItem value="heater">Gas Heater</SelectItem>
                                <SelectItem value="inlet">Air Inlet</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Equipment Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter equipment name" 
                                {...field} 
                                data-testid="input-equipment-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Type-specific specifications */}
                    {selectedType === 'fan' && (
                      <FormField
                        control={form.control}
                        name="diameter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fan Diameter (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="120" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-fan-diameter"
                              />
                            </FormControl>
                            <FormDescription>
                              Typical sizes: 100cm, 120cm, 140cm
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedType === 'heater' && (
                      <FormField
                        control={form.control}
                        name="power"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Heater Power (kW)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="15" 
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-heater-power"
                              />
                            </FormControl>
                            <FormDescription>
                              Gas heater power rating in kilowatts
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedType === 'inlet' && (
                      <FormField
                        control={form.control}
                        name="surface"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inlet Surface Area (m²)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="2.4" 
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-inlet-surface"
                              />
                            </FormControl>
                            <FormDescription>
                              Total air inlet surface area in square meters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currentSetting"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Setting (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                min="0"
                                max="100"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-initial-setting"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAdding(false)}
                        data-testid="button-cancel-add"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={addEquipmentMutation.isPending}
                        data-testid="button-save-equipment"
                      >
                        {addEquipmentMutation.isPending ? 'Adding...' : 'Add Equipment'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}