import React, { useState, useEffect } from "react";
import { UserProfile, WaterLog } from "../types";
import { Droplet, Plus, Calendar, Trash2, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WaterTrackerProps {
  user: UserProfile;
  onWaterUpdated: () => void;
  todayLogged: number;
}

export default function WaterTracker({ user, onWaterUpdated, todayLogged }: WaterTrackerProps) {
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [recentAdded, setRecentAdded] = useState(false);

  const goal = user.dailyWaterGoalMl || 2000;
  const percentage = Math.min(100, Math.round((todayLogged / goal) * 100));

  useEffect(() => {
    fetchLogs();
  }, [todayLogged]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/water/${user.id}`);
      const data = await response.json();
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch water logs", e);
    }
  };

  const handleAddWater = async (amount: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/water/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl: amount }),
      });
      const data = await response.json();
      if (data.success) {
        setRecentAdded(true);
        setTimeout(() => setRecentAdded(false), 2000);
        onWaterUpdated();
        fetchLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(customAmount);
    if (amount > 0) {
      handleAddWater(amount);
      setCustomAmount("");
      setShowCustom(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent p-6 md:p-8 font-sans justify-between overflow-y-auto z-10 relative">
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start">
        
        {/* Left Column (Main Tracker & Presets) */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Droplet className="w-6 h-6 text-teal-400 animate-pulse" /> Hydration Tracker
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Keep hydration regular to fuel active metabolism and energy.
            </p>
          </div>

          {/* Dynamic rising wave container card */}
          <div className="relative w-full h-56 rounded-[24px] bg-white/5 backdrop-blur-xl border border-white/15 overflow-hidden flex flex-col justify-end">
            
            {/* Animated Wave Background elements */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-teal-600/50 to-teal-400/40 transition-all duration-700 ease-out z-10"
              style={{ height: `${percentage}%` }}
            >
              {/* Wave ripple */}
              <div className="absolute top-0 left-1/2 w-[300%] h-[300px] bg-slate-900/40 rounded-[38%] -translate-x-1/2 -translate-y-full liquid-wave" />
              <div className="absolute top-0 left-1/2 w-[310%] h-[310px] bg-teal-400/20 rounded-[40%] -translate-x-1/2 -translate-y-full liquid-wave [animation-delay:2s]" />
            </div>

            {/* Interactive foreground labels */}
            <div className="absolute inset-0 flex flex-col justify-between p-5 z-20">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/15 backdrop-blur-lg text-teal-300 border border-white/10">
                  Today's Intakes
                </span>
                <span className="text-sm font-bold text-slate-300 font-mono">
                  Goal: {goal}ml
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 self-center">
                <span className="text-6xl font-black tracking-tight text-white drop-shadow-md">
                  {todayLogged}
                </span>
                <span className="text-sm font-bold text-slate-300">/ {goal} ml</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-200">
                <span className="text-teal-305 font-bold tracking-wide uppercase">{percentage}% Completed</span>
                {percentage >= 100 && (
                  <span className="text-teal-400 font-bold bg-slate-950/60 px-3 py-1 rounded-full flex items-center gap-1 text-[11px] animate-bounce">
                    <Check className="w-3.5 h-3.5" /> Complete!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Presets and entry selection */}
          <div className="pt-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Quick Add Presets
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleAddWater(250)}
                disabled={loading}
                className="bg-white/5 hover:bg-white/10 border border-white/10 focus:border-teal-500 rounded-2xl py-3 px-2 text-center transition-all cursor-pointer group hover:scale-[1.02]"
              >
                <div className="text-teal-400 font-bold text-sm transition-transform group-hover:scale-105">250 ml</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Water Glass</div>
              </button>

              <button
                onClick={() => handleAddWater(500)}
                disabled={loading}
                className="bg-white/5 hover:bg-white/10 border border-white/10 focus:border-teal-500 rounded-2xl py-3 px-2 text-center transition-all cursor-pointer group hover:scale-[1.02]"
              >
                <div className="text-teal-400 font-bold text-sm transition-transform group-hover:scale-105">500 ml</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Flask / Cup</div>
              </button>

              <button
                onClick={() => setShowCustom(true)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium rounded-2xl py-3 px-2 text-center transition-all flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 text-teal-400" />
                <span className="text-[11px] mt-0.5 font-bold text-teal-300">Custom ml</span>
              </button>
            </div>
          </div>

          {/* Custom Input Modal Popover */}
          <AnimatePresence>
            {showCustom && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl space-y-3"
              >
                <form onSubmit={handleCustomSubmit} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Add Custom Amount</span>
                    <button
                      type="button"
                      onClick={() => setShowCustom(false)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex gap-2.5">
                    <input
                      type="number"
                      required
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-teal-500 text-xs p-3 rounded-xl text-slate-100 focus:outline-none"
                      placeholder="Enter amount (ml)"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-gradient-to-tr from-indigo-500 to-teal-400 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
                    >
                      Save Log
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column (Intake History Sidebar / Feed) */}
        <div className="md:col-span-5 bg-white/[0.02] border border-white/5 rounded-3xl p-5 md:p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-teal-400" /> Intake History
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">{logs.length} logs today</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[380px] pr-1 scrollbar-none">
            {logs.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs font-medium">
                No liquids registered today yet.<br/>Use presets or ask Aurora to log water!
              </div>
            ) : (
              logs.map((log) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                });
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] border border-white/5 p-3 rounded-2xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                        <Droplet className="w-4 h-4 fill-teal-400/20" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          Drank {log.amountMl} ml
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{timeStr}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-teal-400/90">+ {log.amountMl}ml</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
