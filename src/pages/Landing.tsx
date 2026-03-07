import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Leaf } from "lucide-react";
import { motion } from "framer-motion";
import landingBg from "@/assets/landing-bg.jpg";

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-full overflow-hidden relative flex flex-col"
      style={{
        backgroundImage: `url(${landingBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Top Bar - distinct style */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary/95 to-primary/80 backdrop-blur-sm shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shadow-md">
            <Leaf className="h-6 w-6 text-accent-foreground" />
          </div>
          <span className="text-xl font-bold text-primary-foreground">DigiFarm</span>
        </div>
        
        <p className="hidden md:block text-primary-foreground/90 text-sm font-medium">
          The Complete Farm Management Solution
        </p>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/20 text-primary-foreground text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Smart Agriculture
          </div>
        </div>
      </motion.header>

      {/* Main Content - Centered */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            Manage Your Farm
            <span className="text-accent"> Smarter</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-xl mx-auto drop-shadow-md">
            Track crops, livestock, finances, and team operations all in one powerful platform
          </p>
        </motion.div>
      </div>

      {/* Bottom Section - Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-6 pb-12 md:pb-16"
      >
        <Link to="/auth?mode=signin">
          <Button 
            size="lg" 
            variant="outline"
            className="w-48 h-12 text-base font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm transition-all duration-300"
          >
            Sign In
          </Button>
        </Link>
        <Link to="/auth?mode=signup">
          <Button 
            size="lg"
            className="w-48 h-12 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/30 transition-all duration-300"
          >
            Sign Up
          </Button>
        </Link>
      </motion.div>

      {/* Footer text */}
      <div className="relative z-10 text-center pb-4">
        <p className="text-white/60 text-xs">
          © 2024 DigiFarm. All rights reserved.
        </p>
      </div>
    </div>
  );
}
