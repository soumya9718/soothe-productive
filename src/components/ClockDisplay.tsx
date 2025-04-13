
import { useState, useEffect } from "react";
import { format } from "date-fns";

const ClockDisplay = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <div className="text-lg font-semibold">
        {format(time, "h:mm:ss a")}
      </div>
      <div className="text-sm text-muted-foreground">
        {format(time, "EEEE, MMM d, yyyy")}
      </div>
    </div>
  );
};

export default ClockDisplay;
