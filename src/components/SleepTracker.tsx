import React, { useState, useEffect } from "react";
import { UserProfile, SleepLog } from "../types";
import { Moon, Star, Calendar, Plus, AlignLeft, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SleepTrackerProps {
  user: UserProfile;
  onSleepUpdated: () => void;
  sleepVersion: number;
}

export default function SleepTracker({ user, onSleepUpdated, sleepVersion }: SleepTrackerProps) {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState(7.5);
  const [quality, setQuality] = useState(8);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [sleepVersion]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/sleep/${user.id}`);
      const data = await response.json();
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch sleep logs", e);
    }
  };

  const handleLogSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/sleep/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours, quality, date }),
      });
      const data = await response.json();
      if (data.success) {
        setShowForm(false);
        onSleepUpdated();
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Calculate statistics
  const avgHours = logs.length > 0 ? parseFloat((logs.reduce((sum, l) => sum + l.hours, 0) / logs.length).toFixed(1)) : 0;
  const avgQual = logs.length > 0 ? parseFloat((logs.reduce((sum, l) => sum + l.quality, 0) / logs.length).toFixed(1)) : 0;

  return (
    <div className="flex flex-col h-full bg-transparent p-6 md:p-8 font-sans justify-between overflow-y-auto z-10 relative">
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start">
        
        {/* Left Column: Sleep Averages & Log Form */}
        <div className="md:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <Moon className="w-6 h-6 text-purple-400 rotate-12" /> Sleep Analytics
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Rest restores cellular immune cycles. Keep track of deep circadian sleep.
              </p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-purple-400 select-none cursor-pointer hover:bg-white/15"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Dynamic sleep average indices cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-5 rounded-[22px] shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Sleep Avg Duration
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-purple-300">{avgHours}</span>
                <span className="text-xs text-slate-400 font-bold">hrs</span>
              </div>
              <span className="text-[11px] text-purple-400 mt-1.5 block font-bold">Goal: {user.sleepGoalHours || 8} hrs</span>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-5 rounded-[22px] shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Average Sleep Quality
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-amber-300">{avgQual}</span>
                <span className="text-xs text-slate-400 font-bold">/ 10</span>
              </div>
              <div className="flex items-center gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((st) => (
                  <Star
                    key={st}
                    className={`w-3.5 h-3.5 ${avgQual >= st * 2 ? "text-amber-400 fill-amber-400" : "text-slate-700"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Input Log sleep form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5"
              >
                <form onSubmit={handleLogSleep} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block">
                      Register Sleep Log
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-slate-400 hover:text-slate-200 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-slate-300">Sleep logged hours</label>
                      <span className="text-xs font-bold text-purple-400">{hours} hours</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="14"
                      step="0.5"
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 accent-purple-405 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-slate-300">Rest level quality</label>
                      <span className="text-xs font-bold text-amber-400">{quality} / 10 scale</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 accent-amber-400 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Sleep Date</label>
                      <input
                        type="date"
                        className="bg-slate-950 text-xs border border-slate-800 p-3 text-slate-200 rounded-xl w-full focus:outline-none"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-transform duration-100 active:scale-95"
                      >
                        Save Sleep Log
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Historic sleep logs */}
        <div className="md:col-span-5 bg-white/[0.02] border border-white/5 rounded-3xl p-5 md:p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-purple-400" /> Rest Logs (7 Days)
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">{logs.length} logged records</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[380px] pr-1 scrollbar-none">
            {logs.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs font-medium">
                No sleep cycles registered yet.<br/>Log your rest index using '+' above!
              </div>
            ) : (
              logs.map((log) => {
                const sleepDate = new Date(log.date + "T00:00:00").toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  weekday: "short"
                });
                return (
                  <div
                    key={log.id}
                    className="flex justify-between items-center bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] border border-white/5 p-3 rounded-2xl transition-all"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{sleepDate}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Scale quality: {log.quality}/10</div>
                    </div>
                    <div className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-500/10 border border-purple-500/15">
                      <Moon className="w-3.5 h-3.5 text-purple-300" />
                      <span className="text-xs font-bold text-purple-300">{log.hours} hrs</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      <div className="mt-8 bg-white/5 border border-white/5 p-4 rounded-2xl flex gap-3.5 items-start">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Circadian rhythm cycles average: <span className="text-purple-300 font-bold">90 minutes each</span>. Ensure sleep lasts in blocks of 1.5-hour factors (e.g. 7.5 hours or 9 hours) to wake up beautifully refreshed!
        </p>
      </div>
    </div>
  );
}
