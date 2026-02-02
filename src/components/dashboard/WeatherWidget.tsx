import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Cloud, Droplets, Wind, CloudRain, CloudSun } from "lucide-react";
import { format } from "date-fns";

export function WeatherWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Format for East Africa Time display
  const formattedDate = format(currentTime, "EEEE, MMMM d, yyyy");
  const formattedTime = format(currentTime, "h:mm a");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-80">{formattedDate}</p>
          <p className="text-xs opacity-70 mt-0.5">{formattedTime} EAT</p>
          <p className="text-4xl font-bold mt-2">28°C</p>
          <p className="text-sm opacity-80 mt-1">Partly Cloudy</p>
        </div>
        <div className="flex items-center justify-center h-16 w-16">
          <CloudSun className="h-12 w-12 text-accent" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-primary-foreground/20">
        <div className="text-center">
          <Droplets className="h-4 w-4 mx-auto opacity-80" />
          <p className="text-sm font-medium mt-1">72%</p>
          <p className="text-xs opacity-70">Humidity</p>
        </div>
        <div className="text-center">
          <Wind className="h-4 w-4 mx-auto opacity-80" />
          <p className="text-sm font-medium mt-1">8 km/h</p>
          <p className="text-xs opacity-70">Wind</p>
        </div>
        <div className="text-center">
          <CloudRain className="h-4 w-4 mx-auto opacity-80" />
          <p className="text-sm font-medium mt-1">15%</p>
          <p className="text-xs opacity-70">Rain</p>
        </div>
      </div>
    </motion.div>
  );
}
