import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Farms from "./pages/Farms";
import Employees from "./pages/Employees";
import Crops from "./pages/Crops";
import Livestock from "./pages/Livestock";
import Finance from "./pages/Finance";
import Inventory from "./pages/Inventory";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import Predictions from "./pages/Predictions";
import Weather from "./pages/Weather";
import Irrigation from "./pages/Irrigation";
import AnomalyDetection from "./pages/AnomalyDetection";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppDataProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/farms" element={<ProtectedRoute><Farms /></ProtectedRoute>} />
              <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
              <Route path="/crops" element={<ProtectedRoute><Crops /></ProtectedRoute>} />
              <Route path="/livestock" element={<ProtectedRoute><Livestock /></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/predictions" element={<ProtectedRoute><Predictions /></ProtectedRoute>} />
              <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
              <Route path="/irrigation" element={<ProtectedRoute><Irrigation /></ProtectedRoute>} />
              <Route path="/anomaly-detection" element={<ProtectedRoute><AnomalyDetection /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
