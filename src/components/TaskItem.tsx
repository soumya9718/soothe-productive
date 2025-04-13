
import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Clock, Calendar, CheckCircle, Circle, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Task } from "./TaskManager";
import EditTaskDialog from "./EditTaskDialog";
import { toast } from "sonner";

interface TaskItemProps {
  task: Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

const TaskItem = ({ task, updateTask, deleteTask }: TaskItemProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-priority-high text-black";
      case "medium":
        return "bg-priority-medium text-black";
      case "low":
        return "bg-priority-low text-black";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in-progress":
        return <Progress value={50} className="h-2 w-8" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const toggleStatus = () => {
    const nextStatus =
      task.status === "not-started"
        ? "in-progress"
        : task.status === "in-progress"
        ? "completed"
        : "not-started";
    
    updateTask(task.id, { status: nextStatus });
    
    if (nextStatus === "completed") {
      toast.success("Task completed!");
    }
  };

  return (
    <Card className={`my-1 p-4 hover-scale ${task.status === "completed" ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5"
            onClick={toggleStatus}
          >
            {getStatusIcon(task.status)}
          </Button>
          
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h3
                className={`text-base font-medium ${
                  task.status === "completed" ? "task-complete" : ""
                }`}
              >
                {task.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </Badge>
                
                {task.status === "in-progress" && (
                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900">
                    In Progress
                  </Badge>
                )}
              </div>
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
            )}
            
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {task.timeAllocation && (
                <div className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  {task.timeAllocation} min
                </div>
              )}
              
              {task.deadline && (
                <div className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {format(new Date(task.deadline), "MMM d, yyyy")}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                deleteTask(task.id);
                toast.info("Task deleted");
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditTaskDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        task={task}
        updateTask={updateTask}
      />
    </Card>
  );
};

export default TaskItem;
