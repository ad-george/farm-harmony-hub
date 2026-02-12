import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Percent,
  Target,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAppData } from "@/contexts/AppDataContext";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface FarmPrediction {
  farmName: string;
  farmType: string;
  currentOutput: string;
  predictedOutput: string;
  changePercent: number;
  confidence: number;
  factors: string[];
  quarterlyTrend: { quarter: string; actual: number; predicted: number }[];
}

interface OverallPrediction {
  totalCurrentOutput: string;
  totalPredictedOutput: string;
  overallChangePercent: number;
  overallConfidence: number;
  summary: string;
  recommendations: string[];
  monthlyTrend: { month: string; current: number; predicted: number }[];
}

interface PredictionData {
  farmPredictions: FarmPrediction[];
  overallPrediction: OverallPrediction;
}

// Mock historical data to send to AI
const historicalProductionData = [
  { year: 2023, farm: "Kilimanjaro Green Farm", crop: "Wheat", yield: 380, unit: "tons" },
  { year: 2023, farm: "Kilimanjaro Green Farm", crop: "Maize", yield: 220, unit: "tons" },
  { year: 2024, farm: "Kilimanjaro Green Farm", crop: "Wheat", yield: 420, unit: "tons" },
  { year: 2024, farm: "Kilimanjaro Green Farm", crop: "Maize", yield: 250, unit: "tons" },
  { year: 2023, farm: "Lake Victoria Estates", crop: "Maize", yield: 580, unit: "tons" },
  { year: 2023, farm: "Lake Victoria Estates", crop: "Rice", yield: 320, unit: "tons" },
  { year: 2024, farm: "Lake Victoria Estates", crop: "Maize", yield: 640, unit: "tons" },
  { year: 2024, farm: "Lake Victoria Estates", crop: "Rice", yield: 350, unit: "tons" },
  { year: 2023, farm: "Rwenzori Highlands", crop: "Coffee", yield: 85, unit: "tons" },
  { year: 2024, farm: "Rwenzori Highlands", crop: "Coffee", yield: 95, unit: "tons" },
  { year: 2023, farm: "Nyungwe Valley Farm", crop: "Tea", yield: 120, unit: "tons" },
  { year: 2024, farm: "Nyungwe Valley Farm", crop: "Tea", yield: 135, unit: "tons" },
];

// Mock crops data to send (same as in Crops page)
const cropsData = [
  { name: "Wheat", variety: "Winter Wheat", farm: "Kilimanjaro Green Farm", stage: "vegetative", progress: 45, area: "120 acres", expectedYield: "4,800 bushels" },
  { name: "Maize", variety: "Highland Maize", farm: "Lake Victoria Estates", stage: "seedling", progress: 15, area: "200 acres", expectedYield: "28,000 bushels" },
  { name: "Coffee", variety: "Arabica", farm: "Rwenzori Highlands", stage: "flowering", progress: 65, area: "150 acres", expectedYield: "6,750 kg" },
  { name: "Tea", variety: "Black Tea", farm: "Nyungwe Valley Farm", stage: "vegetative", progress: 40, area: "25 acres", expectedYield: "75,000 kg" },
];

export default function Predictions() {
  const { farms } = useAppData();
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFarm, setExpandedFarm] = useState<string | null>(null);

  const generatePredictions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("predict-yield", {
        body: {
          farms: farms.map((f) => ({
            name: f.name,
            location: f.location,
            size: f.size,
            soilType: f.type || f.farmType,
            farmType: f.farmType,
            status: f.status,
            employees: f.employees,
          })),
          crops: cropsData,
          historicalData: historicalProductionData,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setPredictions(data);
      toast.success("Predictions generated successfully!");
    } catch (err: any) {
      console.error("Prediction error:", err);
      toast.error(err.message || "Failed to generate predictions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFarmExpanded = (farmName: string) => {
    setExpandedFarm(expandedFarm === farmName ? null : farmName);
  };

  return (
    <DashboardLayout
      title="AI Yield Predictions"
      subtitle="AI-powered production forecasts based on your farm data"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Production Forecasting</h2>
            <p className="text-sm text-muted-foreground">
              Click "Generate Predictions" to analyze your farm data with AI
            </p>
          </div>
        </div>
        <Button
          onClick={generatePredictions}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Predictions
            </>
          )}
        </Button>
      </div>

      {/* How it works - shown before predictions */}
      {!predictions && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" />
                How Predictions Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Data Collection</p>
                    <p className="text-sm text-muted-foreground">
                      The system gathers your farm details, current crops, soil types, locations,
                      and historical production records.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-foreground">AI Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Our AI model analyzes seasonal patterns, crop growth stages, farm capacity,
                      and regional agricultural trends.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Forecast Output</p>
                    <p className="text-sm text-muted-foreground">
                      You get per-farm predictions with confidence scores, trend charts,
                      key factors, and actionable recommendations.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-8 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-64 bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prediction Results */}
      {predictions && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Overall Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <BarChart3 className="h-4 w-4" />
                  Current Output
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {predictions.overallPrediction.totalCurrentOutput}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Target className="h-4 w-4" />
                  Predicted Output
                </div>
                <p className="text-2xl font-bold text-primary">
                  {predictions.overallPrediction.totalPredictedOutput}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  {predictions.overallPrediction.overallChangePercent >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  Growth Forecast
                </div>
                <p
                  className={`text-2xl font-bold ${
                    predictions.overallPrediction.overallChangePercent >= 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {predictions.overallPrediction.overallChangePercent >= 0 ? "+" : ""}
                  {predictions.overallPrediction.overallChangePercent}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Percent className="h-4 w-4" />
                  Confidence
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {predictions.overallPrediction.overallConfidence}%
                </p>
                <Progress
                  value={predictions.overallPrediction.overallConfidence}
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* AI Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {predictions.overallPrediction.summary}
              </p>
            </CardContent>
          </Card>

          {/* Overall Monthly Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Production Trend (Monthly)</CardTitle>
              <CardDescription>
                Current vs predicted monthly production output across all farms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={predictions.overallPrediction.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="current"
                    stroke="hsl(var(--muted-foreground))"
                    fill="hsl(var(--muted-foreground) / 0.1)"
                    name="Current (tons)"
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.15)"
                    name="Predicted (tons)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Per-Farm Predictions */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Farm-by-Farm Predictions
            </h3>
            <div className="space-y-4">
              {predictions.farmPredictions.map((farm, index) => (
                <motion.div
                  key={farm.farmName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      {/* Farm Header */}
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleFarmExpanded(farm.farmName)}
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <h4 className="font-semibold text-foreground">{farm.farmName}</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {farm.farmType} Farm
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Current → Predicted</p>
                            <p className="font-semibold">
                              {farm.currentOutput} →{" "}
                              <span className="text-primary">{farm.predictedOutput}</span>
                            </p>
                          </div>
                          <Badge
                            className={
                              farm.changePercent >= 0
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                            }
                          >
                            {farm.changePercent >= 0 ? "+" : ""}
                            {farm.changePercent}%
                          </Badge>
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-muted-foreground">Confidence</p>
                            <p className="font-medium">{farm.confidence}%</p>
                          </div>
                          {expandedFarm === farm.farmName ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedFarm === farm.farmName && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-6 space-y-4"
                        >
                          {/* Quarterly Trend Chart */}
                          <div>
                            <h5 className="text-sm font-medium text-muted-foreground mb-3">
                              Quarterly Production Trend
                            </h5>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={farm.quarterlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    color: "hsl(var(--foreground))",
                                  }}
                                />
                                <Legend />
                                <Bar
                                  dataKey="actual"
                                  fill="hsl(var(--muted-foreground))"
                                  name="Actual (tons)"
                                  radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                  dataKey="predicted"
                                  fill="hsl(var(--primary))"
                                  name="Predicted (tons)"
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Key Factors */}
                          <div>
                            <h5 className="text-sm font-medium text-muted-foreground mb-2">
                              Key Factors
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {farm.factors.map((factor, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Confidence Bar */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Prediction Confidence</span>
                              <span className="font-medium">{farm.confidence}%</span>
                            </div>
                            <Progress value={farm.confidence} className="h-2" />
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Actionable steps to optimize your production output
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {predictions.overallPrediction.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {i + 1}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{rec}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
