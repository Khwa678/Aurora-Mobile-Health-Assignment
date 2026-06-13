import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { Home, Droplet, CheckSquare, Moon, MessageSquare, Heart, RefreshCw } from "lucide-react";

interface WebFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: UserProfile | null;
  onResetSession: () => void;
}

export default function WebFrame({
  children,
  activeTab,
  onTabChange,
  user,
  onResetSession,
}: WebFrameProps) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine dynamic greeting based on actual hours
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good Morning";
    if (hrs < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="relative min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans overflow-x-hidden">
      
      {/* Immersive Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute bottom-[10%] right-[-5%] w-[550px] h-[550px] bg-teal-500/10 rounded-full blur-[160px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Top Application Header / Navigation */}
      <header className="relative z-10 px-6 md:px-12 pt-6 pb-4 border-b border-white/5 backdrop-blur-md bg-slate-950/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <div 
            onClick={() => user?.onboarded && onTabChange("dashboard")}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl">A</span>
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Aurora
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-305 px-2 py-0.5 rounded-full font-bold ml-2 uppercase tracking-wider hidden sm:inline-block">
                Web App
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Live Clock indicator */}
            <div className="hidden md:flex flex-col text-right border-r border-white/10 pr-6 mr-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Local Time
              </span>
              <span className="text-sm font-semibold text-slate-200 mt-0.5">
                {currentTime}
              </span>
            </div>

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium">
                    {getGreeting()},
                  </p>
                  <p className="font-semibold text-slate-200 text-sm">
                    {user.name || "Traveller"}
                  </p>
                </div>
                
                <div className="relative group">
                  <img
                    src={
                      user.avatarUrl ||
                      "https://api.dicebear.com/7.x/adventurer/svg?seed=Aurora"
                    }
                    className="w-11 h-11 rounded-full border-2 border-white/10 bg-slate-900/40 p-0.5 pointer-events-auto transition-transform group-hover:scale-105"
                    alt="User Portrait Avatar"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <button
                  onClick={onResetSession}
                  className="bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/25 text-[10px] uppercase font-bold tracking-widest py-1.5 px-3 rounded-lg text-slate-400 hover:text-red-400 transition-all cursor-pointer hidden sm:block"
                >
                  Reset Session
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-teal-400 bg-teal-400/5 border border-teal-500/10 px-3 py-1.5 rounded-full font-bold">
                <Heart className="w-3.5 h-3.5 text-teal-400 animate-pulse" /> Offline Secure Connection
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Layout Content Container */}
      <main className="relative z-10 flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 md:px-12 py-8">
        <div className="flex-1 bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-[32px] overflow-hidden flex flex-col justify-between shadow-2xl relative min-h-[560px]">
          {/* Subtle inside glow glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.02] to-transparent pointer-events-none rounded-[32px]" />
          
          <div className="flex-1 overflow-y-auto relative h-full">
            {children}
          </div>
        </div>
      </main>

      {/* Persistent Bottom Elevated Glass Pill Tab-Bar navigation (Visibly premium) */}
      {user && user.onboarded && (
        <footer className="relative z-20 px-4 md:px-10 pb-8 pt-2 flex justify-center items-center">
          <div className="bg-slate-950/45 backdrop-blur-3xl border border-white/10 rounded-full p-2 flex items-center space-x-1 sm:space-x-2 shadow-2xl shadow-indigo-950/20 max-w-full overflow-x-auto scrollbar-none">
            
            <button
              onClick={() => onTabChange("dashboard")}
              className={`px-4 sm:px-6 py-2.5 rounded-full font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/35"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden xs:inline">Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange("water")}
              className={`px-4 sm:px-6 py-2.5 rounded-full font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "water"
                  ? "bg-gradient-to-tr from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-600/35"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Droplet className="w-4 h-4" />
              <span className="hidden xs:inline">Hydration</span>
            </button>

            <button
              onClick={() => onTabChange("coach")}
              className={`px-4 sm:px-6 py-2.5 rounded-full font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "coach"
                  ? "bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-lg shadow-cyan-600/35"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Voice AI</span>
            </button>

            <button
              onClick={() => onTabChange("habits")}
              className={`px-4 sm:px-6 py-2.5 rounded-full font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "habits"
                  ? "bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/35"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span className="hidden xs:inline">Habits</span>
            </button>

            <button
              onClick={() => onTabChange("sleep")}
              className={`px-4 sm:px-6 py-2.5 rounded-full font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "sleep"
                  ? "bg-gradient-to-tr from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-600/35"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Moon className="w-4 h-4" />
              <span className="hidden xs:inline">Rest</span>
            </button>

          </div>
        </footer>
      )}
    </div>
  );
}
