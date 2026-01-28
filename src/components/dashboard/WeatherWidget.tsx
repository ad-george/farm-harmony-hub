import { motion } from "framer-motion";
import { Sun, Cloud, Droplets, Wind } from "lucide-react";

export function WeatherWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-80">Weather Today</p>
          <p className="text-4xl font-bold mt-1">24°C</p>
          <p className="text-sm opacity-80 mt-1">Partly Cloudy</p>
        </div>
        <div className="flex items-center justify-center h-16 w-16">
          <Sun className="h-12 w-12 text-accent" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-primary-foreground/20">
        <div className="text-center">
          <Droplets className="h-4 w-4 mx-auto opacity-80" />
          <p className="text-sm font-medium mt-1">65%</p>
          <p className="text-xs opacity-70">Humidity</p>
        </div>
        <div className="text-center">
          <Wind className="h-4 w-4 mx-auto opacity-80" />
          <p className="text-sm font-medium mt-1">12 km/h</p>
          <p className="text-xs opacity-70">Wind</p>
        </div>
        <div className="text-center">
          <Cloud className="h-4 w-4 mx-auto opacity-80" />
          <p className="text-sm font-medium mt-1">10%</p>
          <p className="text-xs opacity-70">Rain</p>
        </div>
      </div>
    </motion.div>
  );
}
