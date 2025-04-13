
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { PlusCircle, Clock, Calendar, CheckCheck, Filter, AlertTriangle, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddTaskDialog from "./AddTaskDialog";
import TaskItem from "./TaskItem";

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: Date;
  timeAllocation?: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  status: 'not-started' | 'in-progress' | 'completed';
  createdAt: Date;
}

const FILTERS = ["all", "today", "upcoming", "completed"] as const;
type FilterType = typeof FILTERS[number];

const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      try {
        return JSON.parse(savedTasks, (key, value) => {
          if (key === "deadline" || key === "createdAt") {
            return value ? new Date(value) : undefined;
          }
          return value;
        });
      } catch (error) {
        console.error("Failed to parse saved tasks", error);
        return [];
      }
    }
    return [];
  });

  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<"priority" | "deadline" | "timeAllocation">("priority");
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task: Task) => {
    setTasks([...tasks, task]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, ...updates } : task));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTasks(items);
  };

  // Filter tasks based on selected filter
  const getFilteredTasks = () => {
    let filtered = [...tasks];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedFilter === "today") {
      filtered = filtered.filter(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });
    } else if (selectedFilter === "upcoming") {
      filtered = filtered.filter(task => {
        if (!task.deadline) return true; // Tasks without deadlines are considered upcoming
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() > today.getTime();
      });
    } else if (selectedFilter === "completed") {
      filtered = filtered.filter(task => task.status === "completed");
    }

    // Sort tasks
    return filtered.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortBy === "deadline") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.getTime() - b.deadline.getTime();
      } else if (sortBy === "timeAllocation") {
        const timeA = a.timeAllocation || 0;
        const timeB = b.timeAllocation || 0;
        return timeA - timeB;
      }
      return 0;
    });
  };

  const filteredTasks = getFilteredTasks();
  
  // Get task suggestions based on time of day
  const getTaskSuggestion = () => {
    const hour = new Date().getHours();
    
    if (hour < 9) {
      return "Morning is perfect for planning your day and tackling challenging tasks.";
    } else if (hour < 12) {
      return "Mid-morning is great for focused work. Consider your high-priority tasks.";
    } else if (hour < 15) {
      return "After lunch, focus on collaborative tasks or meetings while your energy is stable.";
    } else if (hour < 18) {
      return "Late afternoon is ideal for wrapping up tasks and planning tomorrow.";
    } else {
      return "Evening is perfect for light tasks, reading, or learning new skills.";
    }
  };

  // Task stats 
  const completedToday = tasks.filter(task => {
    if (task.status !== "completed") return false;
    const taskDate = new Date(task.createdAt);
    const today = new Date();
    return taskDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
  }).length;
  
  const highPriorityCount = tasks.filter(task => 
    task.priority === "high" && task.status !== "completed"
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">My Tasks</h2>
          <p className="text-muted-foreground">{getTaskSuggestion()}</p>
        </div>
        <Button
          onClick={() => setIsAddTaskDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCheck className="mr-2 h-5 w-5 text-green-500" />
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedToday}</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{highPriorityCount}</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock3 className="mr-2 h-5 w-5 text-blue-500" />
              Time Allocated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(tasks.reduce((total, task) => total + (task.timeAllocation || 0), 0) / 60)} hrs
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {/* This was missing the Tabs component wrapping the TabsList */}
            <Tabs value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as FilterType)}>
              <TabsList>
                {FILTERS.map((filter) => (
                  <TabsTrigger
                    key={filter}
                    value={filter}
                    className={selectedFilter === filter ? 'bg-primary text-primary-foreground' : ''}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy("priority")}
              className={sortBy === "priority" ? "bg-muted" : ""}
            >
              Priority
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy("deadline")}
              className={sortBy === "deadline" ? "bg-muted" : ""}
            >
              <Calendar className="mr-1 h-4 w-4" />
              Date
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy("timeAllocation")}
              className={sortBy === "timeAllocation" ? "bg-muted" : ""}
            >
              <Clock className="mr-1 h-4 w-4" />
              Time
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Content for the selected filter tab should be inside TabsContent */}
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No tasks found</p>
              <Button 
                variant="link" 
                onClick={() => setIsAddTaskDialogOpen(true)}
              >
                Add your first task
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="tasks">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-1 p-1"
                  >
                    {filteredTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskItem
                              task={task}
                              updateTask={updateTask}
                              deleteTask={deleteTask}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      <AddTaskDialog
        isOpen={isAddTaskDialogOpen}
        setIsOpen={setIsAddTaskDialogOpen}
        addTask={addTask}
      />
    </div>
  );
};

export default TaskManager;
