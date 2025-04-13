
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Music, Bell, BookOpen, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type FocusMode = "pomodoro" | "study" | "distraction-free";
type TimerState = "idle" | "running" | "paused" | "complete";

interface TimerSettings {
  pomodoro: { workTime: number; breakTime: number };
  study: { sessionTime: number };
}

const FocusTools = () => {
  const [activeMode, setActiveMode] = useState<FocusMode>("pomodoro");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // seconds
  const [isBreak, setIsBreak] = useState(false);
  const [ambientSound, setAmbientSound] = useState(false);
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>({
    pomodoro: { workTime: 25, breakTime: 5 },
    study: { sessionTime: 45 },
  });
  
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    audioRef.current = new Audio("/path/to/ambient-sound.mp3"); // You'll need to add an audio file
    audioRef.current.loop = true;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    if (ambientSound) {
      audioRef.current?.play().catch(e => console.error("Error playing audio:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [ambientSound]);
  
  useEffect(() => {
    // Reset timer when mode changes
    resetTimer();
    
    // Set initial time based on mode
    switch (activeMode) {
      case "pomodoro":
        setTimeRemaining(settings.pomodoro.workTime * 60);
        break;
      case "study":
        setTimeRemaining(settings.study.sessionTime * 60);
        break;
      case "distraction-free":
        setTimeRemaining(60 * 60); // 1 hour by default
        break;
    }
  }, [activeMode]);
  
  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setTimerState("complete");
            
            if (activeMode === "pomodoro" && !isBreak) {
              toast.success("Time for a break!");
              setIsBreak(true);
              setTimeRemaining(settings.pomodoro.breakTime * 60);
              return settings.pomodoro.breakTime * 60;
            } else if (activeMode === "pomodoro" && isBreak) {
              toast.success("Break finished! Ready to work?");
              setIsBreak(false);
              setTimeRemaining(settings.pomodoro.workTime * 60);
              return settings.pomodoro.workTime * 60;
            } else {
              toast.success("Session complete!");
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState, isBreak, activeMode]);
  
  const startTimer = () => {
    setTimerState("running");
    if (muteNotifications) {
      toast("Notifications muted during focus session");
    }
  };
  
  const pauseTimer = () => {
    setTimerState("paused");
  };
  
  const resetTimer = () => {
    setTimerState("idle");
    setIsBreak(false);
    
    switch (activeMode) {
      case "pomodoro":
        setTimeRemaining(settings.pomodoro.workTime * 60);
        break;
      case "study":
        setTimeRemaining(settings.study.sessionTime * 60);
        break;
      case "distraction-free":
        setTimeRemaining(60 * 60); // 1 hour
        break;
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  const getProgressPercentage = () => {
    let totalSeconds;
    
    switch (activeMode) {
      case "pomodoro":
        totalSeconds = (isBreak ? settings.pomodoro.breakTime : settings.pomodoro.workTime) * 60;
        break;
      case "study":
        totalSeconds = settings.study.sessionTime * 60;
        break;
      case "distraction-free":
        totalSeconds = 60 * 60;
        break;
      default:
        totalSeconds = 25 * 60;
    }
    
    return ((totalSeconds - timeRemaining) / totalSeconds) * 100;
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold">Focus Tools</h2>
      
      <Tabs defaultValue="pomodoro" onValueChange={(value) => setActiveMode(value as FocusMode)}>
        <TabsList className="w-full">
          <TabsTrigger value="pomodoro" className="flex-1">
            <div className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Pomodoro
            </div>
          </TabsTrigger>
          <TabsTrigger value="study" className="flex-1">
            <div className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              Study Mode
            </div>
          </TabsTrigger>
          <TabsTrigger value="distraction-free" className="flex-1">
            <div className="flex items-center">
              <VolumeX className="mr-2 h-4 w-4" />
              Focus Mode
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pomodoro">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {isBreak ? "Break Time" : "Focus Time"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="text-6xl font-mono font-bold text-primary">
                  {formatTime(timeRemaining)}
                </div>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              
              <div className="flex justify-center gap-4">
                {timerState !== "running" ? (
                  <Button onClick={startTimer}>
                    <Play className="mr-2 h-4 w-4" />
                    {timerState === "idle" ? "Start" : "Resume"}
                  </Button>
                ) : (
                  <Button onClick={pauseTimer}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                )}
                <Button variant="outline" onClick={resetTimer}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Pomodoro Settings</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="work-time">Work: {settings.pomodoro.workTime}m</Label>
                    <Slider
                      id="work-time"
                      min={5}
                      max={60}
                      step={5}
                      value={[settings.pomodoro.workTime]}
                      onValueChange={(value) => 
                        setSettings({
                          ...settings,
                          pomodoro: { ...settings.pomodoro, workTime: value[0] }
                        })
                      }
                      disabled={timerState !== "idle"}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="break-time">Break: {settings.pomodoro.breakTime}m</Label>
                    <Slider
                      id="break-time"
                      min={1}
                      max={30}
                      step={1}
                      value={[settings.pomodoro.breakTime]}
                      onValueChange={(value) => 
                        setSettings({
                          ...settings,
                          pomodoro: { ...settings.pomodoro, breakTime: value[0] }
                        })
                      }
                      disabled={timerState !== "idle"}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="study">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Study Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="text-6xl font-mono font-bold text-primary">
                  {formatTime(timeRemaining)}
                </div>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              
              <div className="flex justify-center gap-4">
                {timerState !== "running" ? (
                  <Button onClick={startTimer}>
                    <Play className="mr-2 h-4 w-4" />
                    {timerState === "idle" ? "Start" : "Resume"}
                  </Button>
                ) : (
                  <Button onClick={pauseTimer}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                )}
                <Button variant="outline" onClick={resetTimer}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-time">Session Length: {settings.study.sessionTime}m</Label>
                  <Slider
                    id="session-time"
                    min={10}
                    max={120}
                    step={5}
                    value={[settings.study.sessionTime]}
                    onValueChange={(value) => 
                      setSettings({
                        ...settings,
                        study: { ...settings.study, sessionTime: value[0] }
                      })
                    }
                    disabled={timerState !== "idle"}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ambient-sound"
                    checked={ambientSound}
                    onCheckedChange={setAmbientSound}
                  />
                  <Label htmlFor="ambient-sound" className="flex items-center">
                    <Music className="mr-2 h-4 w-4" />
                    Ambient Background Sound
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distraction-free">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Distraction-Free Focus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="text-6xl font-mono font-bold text-primary">
                  {formatTime(timeRemaining)}
                </div>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              
              <div className="flex justify-center gap-4">
                {timerState !== "running" ? (
                  <Button onClick={startTimer}>
                    <Play className="mr-2 h-4 w-4" />
                    {timerState === "idle" ? "Start" : "Resume"}
                  </Button>
                ) : (
                  <Button onClick={pauseTimer}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                )}
                <Button variant="outline" onClick={resetTimer}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mute-notifications"
                    checked={muteNotifications}
                    onCheckedChange={setMuteNotifications}
                  />
                  <Label htmlFor="mute-notifications" className="flex items-center">
                    <VolumeX className="mr-2 h-4 w-4" />
                    Mute Notifications During Focus
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ambient-sound-df"
                    checked={ambientSound}
                    onCheckedChange={setAmbientSound}
                  />
                  <Label htmlFor="ambient-sound-df" className="flex items-center">
                    <Music className="mr-2 h-4 w-4" />
                    Ambient Background Sound
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Time Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Focus Sessions Today:</span>
              <span className="font-semibold">3</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Focus Time Today:</span>
              <span className="font-semibold">2h 15m</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Productivity Score:</span>
              <span className="font-semibold">85%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FocusTools;
