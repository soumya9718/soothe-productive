
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Clock, Calendar, CheckCircle, Circle, Edit, Trash, Play, Pause } from "lucide-react";
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
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0); // in seconds

  // Start/stop timer
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    
    if (!isTimerRunning) {
      // When starting the timer
      toast.info(`Started working on: ${task.title}`);
      
      if (task.status === "not-started") {
        updateTask(task.id, { status: "in-progress" });
      }
    } else {
      // When stopping the timer
      toast.info(`Paused work on: ${task.title}`);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: number | undefined;
    
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Format time display
  const formatTimeDisplay = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-orange-300 text-black";
      case "medium":
        return "bg-yellow-200 text-black";
      case "low":
        return "bg-blue-200 text-black";
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
      setIsTimerRunning(false);
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
            
            {/* Task timer display */}
            {(timeSpent > 0 || isTimerRunning) && (
              <div className="mt-2 flex items-center text-sm text-primary-foreground">
                <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Time spent: {formatTimeDisplay(timeSpent)}</span>
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={`${isTimerRunning ? 'bg-red-100 hover:bg-red-200' : 'bg-green-100 hover:bg-green-200'} text-black dark:text-white`}
            onClick={toggleTimer}
          >
            {isTimerRunning ? (
              <Pause className="mr-1 h-3.5 w-3.5" />
            ) : (
              <Play className="mr-1 h-3.5 w-3.5" />
            )}
            {isTimerRunning ? 'Pause' : 'Start'}
          </Button>
          
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
