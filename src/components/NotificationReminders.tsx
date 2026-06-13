import React, { useState, useEffect, useRef } from "react";
import { UserProfile, Habit } from "../types";
import { Bell, Sparkles, Clock, Volume2, Play, Pause, ChevronRight, Check, Droplet, UserCheck, Flame, RefreshCcw, HelpCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NotificationRemindersProps {
  user: UserProfile;
  habitsVersion: number;
  onWaterLogged: () => void;
  onHabitsUpdated: () => void;
  todayWaterLogged: number;
}

interface AlertTrigger {
  id: string;
  type: "water" | "habit";
  title: string;
  message: string;
  targetId?: string; // Habit ID
  emoji: string;
  timestamp: string;
}

export default function NotificationReminders({
  user,
  habitsVersion,
  onWaterLogged,
  onHabitsUpdated,
  todayWaterLogged,
}: NotificationRemindersProps) {
  // Configured alerts in memory & localStorage
  const [waterIntervalMins, setWaterIntervalMins] = useState<number>(() => {
    return Number(localStorage.getItem(`aurora_water_interval_${user.id}`) || "60");
  });
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(() => {
    return localStorage.getItem(`aurora_reminders_enabled_${user.id}`) !== "false";
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Acceleration multiplier to help users/reviewers test notifications instantly!
  // "1x" = Real Time, "60x" = 1 second represents 1 minute, "1800x" = 1 second represents 30 minutes!
  const [timeMultiplier, setTimeMultiplier] = useState<number>(1); 

  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeAlert, setActiveAlert] = useState<AlertTrigger | null>(null);
  const [history, setHistory] = useState<AlertTrigger[]>([]);
  
  // Next run times
  const [nextWaterTime, setNextWaterTime] = useState<Date>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 60);
    return d;
  });

  const [simulatedMinutes, setSimulatedMinutes] = useState(0);
  const [simulatedTimeStr, setSimulatedTimeStr] = useState("");
  const [logActionLoading, setLogActionLoading] = useState(false);

  // Sound Synth Synthesizer player
  const playSynthesizedChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = "sine";
      osc2.type = "sine";
      
      // Beautiful harmonic clean bells (C5 -> E5 -> G5 chord progression)
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.18); // G5
      
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.22); // C6
      
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn("Sound blocked by browser interaction policy, click to activate audio permissions first.", e);
    }
  };

  // Keep simulated time accurate and fetch habits
  useEffect(() => {
    fetchHabits();
  }, [habitsVersion, user]);

  const fetchHabits = async () => {
    try {
      const response = await fetch(`/api/habits/${user.id}`);
      const data = await response.json();
      setHabits(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to re-calc and save changes
  const handleWaterIntervalChange = (mins: number) => {
    setWaterIntervalMins(mins);
    localStorage.setItem(`aurora_water_interval_${user.id}`, String(mins));
    resetWaterTimer(mins);
  };

  const toggleReminders = () => {
    const nextState = !remindersEnabled;
    setRemindersEnabled(nextState);
    localStorage.setItem(`aurora_reminders_enabled_${user.id}`, String(nextState));
  };

  const resetWaterTimer = (minutes: number = waterIntervalMins) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutes);
    setNextWaterTime(d);
  };

  // Main Background Tick thread
  useEffect(() => {
    if (!remindersEnabled) return;

    // Run interval checks every 1000ms
    const timer = setInterval(() => {
      const now = new Date();
      
      // If time acceleration is set, add simulated minutes
      if (timeMultiplier > 1) {
        // multiplier / 60 added per second makes sense (e.g. 60x multiplier adds 1 min per second)
        const minsToAdd = timeMultiplier / 60;
        setSimulatedMinutes(prev => {
          const total = prev + minsToAdd;
          // Calculate simulated time representation
          const d = new Date();
          d.setMinutes(d.getMinutes() + total);
          setSimulatedTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          
          // Check if custom timers triggered under simulated conditions!
          // Check water countdown:
          const secondsLeft = Math.max(0, Math.round((nextWaterTime.getTime() - now.getTime()) / 1000) - (total * 60));
          if (secondsLeft <= 0) {
            triggerWaterNotification();
            // recalculate next target
            const nextTarget = new Date();
            nextTarget.setMinutes(nextTarget.getMinutes() + waterIntervalMins);
            setNextWaterTime(nextTarget);
            return 0; // reset simulation to preserve clean test looping
          }

          // Check habit reminder times
          // Format current simulated time
          const simHours = d.getHours();
          const simMins = d.getMinutes();
          const simTimeFormatted = `${String(simHours).padStart(2, '0')}:${String(simMins).padStart(2, '0')}`;
          
          habits.forEach(habit => {
            if (habit.reminderTime === simTimeFormatted && d.getSeconds() < 2) {
              triggerHabitNotification(habit);
            }
          });

          return total;
        });
      } else {
        // Standard Real-Time Checks
        const secondsLeft = Math.max(0, Math.round((nextWaterTime.getTime() - now.getTime()) / 1000));
        setSimulatedTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        
        if (secondsLeft <= 0) {
          triggerWaterNotification();
          resetWaterTimer();
        }

        // Habit matches
        const currentHours = now.getHours();
        const currentMins = now.getMinutes();
        const currentTimeFormatted = `${String(currentHours).padStart(2, '0')}:${String(currentMins).padStart(2, '0')}`;
        
        // Match seconds to run once per minute
        if (now.getSeconds() === 0) {
          habits.forEach(habit => {
            if (habit.reminderTime === currentTimeFormatted) {
              triggerHabitNotification(habit);
            }
          });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [remindersEnabled, nextWaterTime, waterIntervalMins, timeMultiplier, habits]);

  const triggerWaterNotification = () => {
    const alert: AlertTrigger = {
      id: `water_${Date.now()}`,
      type: "water",
      title: "Hydration Reminder 💧",
      message: `Your cell health asks for fluid. Log some pure water to feed vitality! Goal is ${user.dailyWaterGoalMl}ml.`,
      emoji: "💧",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setActiveAlert(alert);
    setHistory(prev => [alert, ...prev].slice(0, 5));
    playSynthesizedChime();
  };

  const triggerHabitNotification = (habit: Habit) => {
    // Check if user completed it already today
    const todayStr = new Date().toISOString().split("T")[0];
    if (habit.completedDates.includes(todayStr)) return;

    const alert: AlertTrigger = {
      id: `habit_${habit.id}_${Date.now()}`,
      type: "habit",
      title: `${habit.emoji} Habit Reminder`,
      message: `It is ${habit.reminderTime}! Focus on doing your daily routine: "${habit.name}". Description: ${habit.description || 'Practice mindfulness.'}`,
      targetId: habit.id,
      emoji: habit.emoji,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setActiveAlert(alert);
    setHistory(prev => [alert, ...prev].slice(0, 5));
    playSynthesizedChime();
  };

  // Immediate simulations for demonstration / instant testing
  const handleSimulateWaterAlert = () => {
    triggerWaterNotification();
  };

  const handleSimulateHabitAlert = (habit: Habit) => {
    triggerHabitNotification(habit);
  };

  // Custom CTA click actions inside notifications
  const handleQuickLogWaterAction = async () => {
    setLogActionLoading(true);
    try {
      const response = await fetch(`/api/water/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl: 250 })
      });
      if (response.ok) {
        onWaterLogged();
        setActiveAlert(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLogActionLoading(false);
    }
  };

  const handleQuickToggleHabitAction = async (habitId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    setLogActionLoading(true);
    try {
      const response = await fetch(`/api/habits/toggle/${user.id}/${habitId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayStr }),
      });
      if (response.ok) {
        onHabitsUpdated();
        setActiveAlert(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLogActionLoading(false);
    }
  };

  // Calculate live water seconds remaining
  const now = new Date();
  const simulatedSecondsOffset = simulatedMinutes * 60;
  const timeDifferenceSecs = Math.max(0, Math.round((nextWaterTime.getTime() - now.getTime()) / 1000) - simulatedSecondsOffset);
  const minutesLeft = Math.floor(timeDifferenceSecs / 60);
  const secondsLeft = Math.round(timeDifferenceSecs % 60);

  return (
    <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 space-y-5">
      
      {/* Active High-Visual Alert Dialog overlay inside frame container */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="fixed inset-x-6 bottom-6 md:absolute md:inset-x-8 md:bottom-8 bg-gradient-to-br from-indigo-900/90 via-slate-950/95 to-teal-900/90 border-2 border-teal-400/50 p-5 rounded-[24px] shadow-2xl shadow-slate-950/80 z-50 overflow-hidden"
          >
            {/* Visual ripple pulse */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-teal-400/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
            
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-teal-400/20 border border-teal-400/35 flex items-center justify-center text-2xl flex-shrink-0 animate-bounce">
                {activeAlert.emoji}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-teal-350 tracking-wider uppercase block">
                    {activeAlert.title}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/40 px-2 py-0.5 rounded-md">
                    AT {activeAlert.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-100 leading-relaxed font-sans pr-2">
                  {activeAlert.message}
                </p>

                <div className="flex items-center gap-2 pt-3">
                  {activeAlert.type === "water" ? (
                    <button
                      onClick={handleQuickLogWaterAction}
                      disabled={logActionLoading}
                      className="bg-teal-400 hover:bg-teal-350 text-slate-950 text-[11px] font-black py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/20 active:scale-95 transition-all"
                    >
                      <Droplet className="w-3.5 h-3.5 fill-slate-950" />
                      {logActionLoading ? "Saving..." : "Log 250ml Water"}
                    </button>
                  ) : (
                    activeAlert.targetId && (
                      <button
                        onClick={() => handleQuickToggleHabitAction(activeAlert.targetId!)}
                        disabled={logActionLoading}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {logActionLoading ? "Recording..." : "Complete Habit"}
                      </button>
                    )
                  )}
                  
                  <button
                    onClick={() => setActiveAlert(null)}
                    className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-[10px] font-bold py-2 px-3 rounded-lg border border-white/5 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title Segment */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Bell className="w-4 h-4 animate-swing" />
            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1">
              Mindful Reminders <span className="text-[10px] text-teal-400 font-extrabold bg-teal-500/10 px-2 py-0.5 rounded-full">ACTIVE</span>
            </h3>
            <p className="text-[10px] text-slate-400">Manage interactive water intervals and schedules</p>
          </div>
        </div>

        {/* Master activation switch */}
        <button
          onClick={toggleReminders}
          className="text-slate-400 hover:text-slate-200"
          title="Enable/Disable all notifications"
        >
          {remindersEnabled ? (
            <ToggleRight className="w-8 h-8 text-teal-400 cursor-pointer" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-slate-600 cursor-pointer" />
          )}
        </button>
      </div>

      {remindersEnabled ? (
        <div className="space-y-4">
          
          {/* Top visual controls area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
            
            {/* Water Interval Setting */}
            <div className="space-y-2">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
                💧 Hydration Warning Trigger
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[15, 30, 45, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleWaterIntervalChange(mins)}
                    className={`py-1.5 px-2.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                      waterIntervalMins === mins 
                        ? "bg-teal-400/20 text-teal-300 border border-teal-400/40" 
                        : "bg-slate-950 hover:bg-slate-900 text-slate-400 border border-white/5"
                    }`}
                  >
                    {mins === 15 ? "15m (Test)" : mins === 30 ? "30m" : mins === 60 ? "Every 1h" : mins === 120 ? "Every 2h" : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Multiplier Accelerator (Beautiful Prototype Fast Forward) */}
            <div className="space-y-2">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                🧪 Prototype Time Accelerator <HelpCircle className="w-3 h-3 text-slate-500" title="Speeds up time so you can watch alarms trigger in real-time!" />
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Realtime", val: 1 },
                  { label: "1 min/sec", val: 60 },
                  { label: "30 mins/sec", val: 1800 }
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => {
                      setTimeMultiplier(item.val);
                      if (item.val > 1) {
                        setSimulatedMinutes(0);
                      }
                    }}
                    className={`py-1.5 px-2.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                      timeMultiplier === item.val
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                        : "bg-slate-950 hover:bg-slate-900 text-slate-400 border border-white/5"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Current Countdown Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Water trigger tracker progress block */}
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 flex justify-between items-center relative">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">
                  Next Water Chime
                </span>
                <span className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  {minutesLeft > 0 ? `${minutesLeft} min ${secondsLeft}s` : `${secondsLeft}s left`}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold block uppercase">
                  Target interval: {waterIntervalMins} mins
                </span>
              </div>

              {/* Simulation Instant Test Button */}
              <button 
                onClick={handleSimulateWaterAlert}
                className="bg-teal-400 hover:bg-teal-350 p-2 rounded-xl text-slate-950 transition-colors cursor-pointer"
                title="Manually trigger immediate alert to test synth chime & popup"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Habit trigger assessment block */}
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">
                  Next Habit Alarms
                </span>
                <span className="text-xs font-bold text-slate-200 block">
                  {habits.length === 0 ? "No active habits" : `${habits.length} daily checklist scheduled`}
                </span>
                <span className="text-[9px] text-slate-500 max-w-[150px] block truncate font-semibold">
                  {habits.length > 0 
                     ? `Upcoming: ${habits.map(h => `${h.emoji} ${h.reminderTime}`).join(", ")}` 
                     : "Define habits in Habit tab!"}
                </span>
              </div>

              {/* Simulated triggering buttons dropdown for lists */}
              <div className="flex gap-1">
                {habits.slice(0, 2).map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() => handleSimulateHabitAlert(habit)}
                    className="bg-indigo-650 hover:bg-indigo-600 p-2 rounded-xl text-white transition-colors cursor-pointer text-xs"
                    title={`Trigger alarm test for ${habit.name}`}
                  >
                    {habit.emoji}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Sound enable control and simulated time representation */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              Sound Mode: 
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md cursor-pointer ${
                  soundEnabled ? "bg-teal-400/10 text-teal-300 border border-teal-400/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {soundEnabled ? "Synthesized Sound ON" : "Sound MUTED"}
              </button>
            </span>

            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Live: <span className="text-slate-350">{simulatedTimeStr || "..."}</span>
            </span>
          </div>

          {/* History tracker log */}
          {history.length > 0 && (
            <div className="bg-slate-900/20 border border-white/5 rounded-2xl p-4.5 space-y-2.5">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">
                Notifications Log (Recent Alert history)
              </span>
              <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
                {history.map((h) => (
                  <div key={h.id} className="flex justify-between items-center text-[10px] bg-white/[0.02] py-1.5 px-3 rounded-lg">
                    <span className="text-slate-300 flex items-center gap-2">
                      <span>{h.emoji}</span>
                      <span className="font-semibold text-slate-205">{h.title}</span>
                    </span>
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      triggered {h.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900/10 rounded-2xl border border-white/5 text-slate-500 text-xs font-semibold">
          Reminders are turned off. Push the switch at the top right to start hydration chimes and habit schedules!
        </div>
      )}

    </div>
  );
}
