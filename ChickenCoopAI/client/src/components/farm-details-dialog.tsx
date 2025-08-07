import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Farm } from "@shared/schema";

const farmUpdateSchema = z.object({
  name: z.string().min(1, "Farm name is required"),
  length: z.number().min(1, "Length must be greater than 0"),
  width: z.number().min(1, "Width must be greater than 0"),
  height: z.number().min(1, "Height must be greater than 0"),
});

type FarmUpdateData = z.infer<typeof farmUpdateSchema>;

interface FarmDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farm: Farm;
}

export default function FarmDetailsDialog({ 
  open, 
  onOpenChange, 
  farm 
}: FarmDetailsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FarmUpdateData>({
    resolver: zodResolver(farmUpdateSchema),
    defaultValues: {
      name: farm.name,
      length: farm.length,
      width: farm.width,
      height: farm.height,
    },
  });

  const updateFarmMutation = useMutation({
    mutationFn: async (data: FarmUpdateData) => {
      const response = await apiRequest('PATCH', `/api/farms/${farm.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farm.id] });
      toast({
        title: "Farm Updated",
        description: "Farm details have been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update farm details. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FarmUpdateData) => {
    updateFarmMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-farm-details">
        <DialogHeader>
          <DialogTitle>Edit Farm Details</DialogTitle>
          <DialogDescription>
            Update your farm information and dimensions
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
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

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (m)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
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
                        step="0.1"
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-farm"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateFarmMutation.isPending}
                data-testid="button-save-farm"
              >
                {updateFarmMutation.isPending ? 'Updating...' : 'Update Farm'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}