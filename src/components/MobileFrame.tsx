import React, { useState, useEffect } from "react";
import { Battery, Wifi, Signal, Home, Droplet, CheckSquare, Moon, MessageSquareQuote } from "lucide-react";

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onboarded: boolean;
}

export default function MobileFrame({ children, activeTab, onTabChange, onboarded }: MobileFrameProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900 min-h-screen text-slate-100 font-sans">
      {/* Outer physical simulation of mobile device body */}
      <div className="relative w-full max-w-[390px] h-[820px] bg-slate-950 rounded-[48px] border-[10px] border-slate-800 shadow-2xl overflow-hidden flex flex-col items-stretch ring-1 ring-slate-700/50">
        
        {/* Dynamic status island cut-out / Speaker bezel */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-full z-50 flex items-center justify-center gap-1.5 px-3">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          <div className="w-8 h-1 bg-slate-800 rounded-full" />
        </div>

        {/* Device Screen Status Bar */}
        <div className="h-10 bg-slate-950 flex items-end justify-between px-6 pb-1.5 text-[11px] font-bold text-slate-300 select-none z-40">
          <div>{time}</div>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <Battery className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        {/* Active Page Viewport Container */}
        <div className="flex-1 overflow-y-auto bg-slate-950/40 backdrop-blur-3xl scrollbar-none relative">
          {/* Background atmosphere blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[-5%] left-[-10%] w-[250px] h-[250px] bg-indigo-500/15 rounded-full blur-[50px]" />
            <div className="absolute bottom-[12%] right-[-10%] w-[280px] h-[280px] bg-teal-500/15 rounded-full blur-[60px]" />
            <div className="absolute top-[40%] left-[10%] w-[220px] h-[180px] bg-blue-500/10 rounded-full blur-[50px]" />
          </div>
          
          <div className="relative z-10 h-full">
            {children}
          </div>
        </div>

        {/* Global Navigation Tab Bar (Visible only after user has onboarded successfully) */}
        {onboarded && (
          <div className="h-16 bg-slate-950 border-t border-slate-900/80 flex items-center justify-around px-2 z-30">
            <button
              onClick={() => onTabChange("dashboard")}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors cursor-pointer ${
                activeTab === "dashboard" ? "text-teal-400" : "text-slate-500 hover:text-slate-400"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[9px] mt-0.5 font-semibold">Home</span>
            </button>

            <button
              onClick={() => onTabChange("water")}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors cursor-pointer ${
                activeTab === "water" ? "text-cyan-400" : "text-slate-500 hover:text-slate-400"
              }`}
            >
              <Droplet className="w-5 h-5" />
              <span className="text-[9px] mt-0.5 font-semibold">Water</span>
            </button>

            {/* Coach Voice AI floating button */}
            <button
              onClick={() => onTabChange("coach")}
              className="relative -top-3 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/20 active:scale-95 transition-transform cursor-pointer ring-4 ring-slate-950"
            >
              <MessageSquareQuote className="w-5 h-5" />
            </button>

            <button
              onClick={() => onTabChange("habits")}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors cursor-pointer ${
                activeTab === "habits" ? "text-emerald-400" : "text-slate-500 hover:text-slate-400"
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span className="text-[9px] mt-0.5 font-semibold">Habits</span>
            </button>

            <button
              onClick={() => onTabChange("sleep")}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-colors cursor-pointer ${
                activeTab === "sleep" ? "text-purple-400" : "text-slate-500 hover:text-slate-400"
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="text-[9px] mt-0.5 font-semibold">Sleep</span>
            </button>
          </div>
        )}

        {/* virtual home swipe button */}
        <div className="h-5 bg-slate-950 flex items-center justify-center">
          <div className="w-28 h-1 bg-slate-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}
