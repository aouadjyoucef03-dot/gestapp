import { ClipboardCheck, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { DEFAULT_CHECKLIST_TASKS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailyChecklistProps {
  farmId: string;
}

export default function DailyChecklist({ farmId }: DailyChecklistProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: checklist } = useQuery({
    queryKey: ['/api/farms', farmId, 'checklist', 'today'],
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async (tasks: { id: string; task: string; completed: boolean }[]) => {
      const response = await apiRequest('POST', `/api/farms/${farmId}/checklist`, { tasks });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'checklist'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update checklist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const tasks = checklist?.tasks || DEFAULT_CHECKLIST_TASKS;
  const completedCount = tasks.filter((task: any) => task.completed).length;
  const completionPercentage = (completedCount / tasks.length) * 100;

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    const updatedTasks = tasks.map((task: any) => 
      task.id === taskId ? { ...task, completed } : task
    );
    updateChecklistMutation.mutate(updatedTasks);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <ClipboardCheck className="text-farm-green mr-2" />
          Daily Checklist
        </h2>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {tasks.map((task: any) => (
            <div key={task.id} className="flex items-center space-x-3">
              <Checkbox
                id={task.id}
                checked={task.completed}
                onCheckedChange={(checked) => handleTaskToggle(task.id, !!checked)}
                disabled={updateChecklistMutation.isPending}
                data-testid={`checkbox-task-${task.id}`}
              />
              <label 
                htmlFor={task.id}
                className={`text-sm cursor-pointer ${
                  task.completed 
                    ? 'text-gray-500 dark:text-gray-400 line-through' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                data-testid={`label-task-${task.id}`}
              >
                {task.task}
              </label>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center mb-2">
            <Check className="text-green-600 mr-2 h-4 w-4" />
            <p className="text-sm text-green-700 dark:text-green-300" data-testid="text-progress">
              Progress: {completedCount}/{tasks.length} tasks completed today
            </p>
          </div>
          <Progress value={completionPercentage} className="w-full h-2" data-testid="progress-checklist" />
        </div>
      </div>
    </div>
  );
}
