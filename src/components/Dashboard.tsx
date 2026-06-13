import React, { useState, useEffect } from "react";
import { UserProfile, DashboardSummary } from "../types";
import { Droplet, CheckSquare, Moon, Sparkles, RefreshCw, Flame, Settings, Save, X, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import NotificationReminders from "./NotificationReminders";

interface DashboardProps {
  user: UserProfile;
  waterGoal: number;
  todayWaterLogged: number;
  habitsVersion: number;
  sleepVersion: number;
  onWaterLogged: () => void;
  onHabitsUpdated: () => void;
  onUserUpdated: (user: UserProfile) => void;
}

export default function Dashboard({
  user,
  waterGoal,
  todayWaterLogged,
  habitsVersion,
  sleepVersion,
  onWaterLogged,
  onHabitsUpdated,
  onUserUpdated,
}: DashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [aiInsight, setAiInsight] = useState("Gathering health statistics details...");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingQuickWater, setLoadingQuickWater] = useState(false);

  // Profile Customization state
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editWater, setEditWater] = useState(user.dailyWaterGoalMl || 2000);
  const [editSleep, setEditSleep] = useState(user.sleepGoalHours || 8);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    // Sync settings-specific editing state with user props alterations
    setEditName(user.name);
    setEditWater(user.dailyWaterGoalMl || 2000);
    setEditSleep(user.sleepGoalHours || 8);
  }, [user]);

  useEffect(() => {
    fetchDashboardSummary();
  }, [todayWaterLogged, habitsVersion, sleepVersion, user]);

  const fetchDashboardSummary = async () => {
    try {
      const response = await fetch(`/api/dashboard/${user.id}`);
      const data = await response.json();
      setSummary(data);
      // Fetch dynamic custom AI insight too
      fetchAIInsight();
    } catch (e) {
      console.error("Failed to load dashboard summary logs", e);
    }
  };

  const fetchAIInsight = async () => {
    setLoadingInsight(true);
    try {
      const response = await fetch(`/api/insight/${user.id}`, { method: "POST" });
      const data = await response.json();
      setAiInsight(data.insight || "Keep hydrating! Excellent progress today. Ask Aurora for interactive guidance!");
    } catch (e) {
      console.error(e);
      setAiInsight("You're making steady efforts. Mindful hydration is the choice for persistent vital energy!");
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleQuickWater = async () => {
    setLoadingQuickWater(true);
    try {
      const response = await fetch(`/api/water/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl: 250 })
      });
      if (response.ok) {
        onWaterLogged();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuickWater(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSavingSettings(true);
    try {
      const response = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: editName.trim(),
          dailyWaterGoalMl: editWater,
          sleepGoalHours: editSleep
        }),
      });
      const data = await response.json();
      if (data.success && data.user) {
        onUserUpdated(data.user);
        setShowSettings(false);
      }
    } catch (err) {
      console.error("Error saving dynamic goal parameters:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  if (!summary) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-slate-950 p-6 text-slate-100">
        <span className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 mt-3 font-semibold">Aligning health indices...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent p-6 md:p-8 font-sans justify-between overflow-y-auto z-10 relative">
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start">
        
        {/* Left Column: Greetings & AI Daily Insight */}
        <div className="md:col-span-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest inline-block">
                Health Companion
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-white mt-2">
                Breathe, {user.name}
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Settings Trigger Icon */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl border border-white/10 transition-colors cursor-pointer ${
                  showSettings ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-450 hover:bg-white/10 text-slate-300"
                }`}
                title="Customize Goals & Profile"
              >
                <Settings className={`w-4 h-4 ${showSettings ? "rotate-90" : ""} transition-transform duration-300`} />
              </button>

              <img
                src={user.avatarUrl || "https://api.dicebear.com/7.x/adventurer/svg?seed=Aurora"}
                className="w-12 h-12 rounded-full border-2 border-white/20 bg-slate-900/40 shadow-inner"
                alt="UserProfile Avatar"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {showSettings ? (
              <motion.form
                key="settings-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSaveSettings}
                className="bg-slate-950/60 backdrop-blur-xl border border-indigo-500/20 p-5 rounded-[24px] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    ⚙️ Goal Customization
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="text-slate-500 hover:text-slate-350"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Name field */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Preferred Nickname
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 outline-none focus:border-indigo-500"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>

                  {/* Water sliders */}
                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      <span>Daily Water Limit</span>
                      <span className="text-teal-400">{editWater} ml</span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="4000"
                      step="250"
                      className="w-full bg-slate-800 accent-teal-400 cursor-pointer rounded-lg h-1"
                      value={editWater}
                      onChange={(e) => setEditWater(Number(e.target.value))}
                    />
                  </div>

                  {/* Sleep sliders */}
                  <div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      <span>Sleep target hours</span>
                      <span className="text-purple-400">{editSleep} hrs</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="12"
                      step="0.5"
                      className="w-full bg-slate-800 accent-purple-400 cursor-pointer rounded-lg h-1"
                      value={editSleep}
                      onChange={(e) => setEditSleep(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings || !editName.trim()}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-teal-400 text-white text-[11px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingSettings ? "Updating..." : "Save Preferences"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="bg-white/5 hover:bg-white/10 text-slate-350 border border-white/5 text-[11px] font-semibold py-2 px-3 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            ) : (
              /* Dynamic Premium AI Daily Insight Board (Immersive UI Style) */
              <motion.div
                key="insight-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-teal-500/15 backdrop-blur-xl border border-white/10 p-6 rounded-[24px] relative overflow-hidden shadow-xl shadow-indigo-950/10"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> AI Health Coach • Daily Insight
                  </span>
                  <button 
                    onClick={fetchAIInsight}
                    disabled={loadingInsight}
                    className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingInsight ? "animate-spin" : ""}`} /> Recoach
                  </button>
                </div>

                <p className="text-sm text-slate-100 italic leading-relaxed font-serif">
                  "{aiInsight}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Achievements / Consistency info box */}
          <div className="bg-white/5 backdrop-blur-md border border-white/5 p-5 rounded-[22px] flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5 fill-amber-400/15 animate-bounce" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-250 block">Health Streak Multipliers</span>
              <p className="text-xs text-slate-400 mt-0.5">
                Build daily habit streak multipliers by registering sleep hours, completing routines, and achieving hydration goals!
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Bento Grid metrics layout */}
        <div className="md:col-span-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            
            {/* Hydration tracking block */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-[22px] p-5 flex flex-col justify-between shadow-xl min-h-[170px]">
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Droplet className="w-5 h-5 fill-teal-400/20" />
                </div>
                <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full">
                  {summary.waterProgress.percentage}%
                </span>
              </div>

              <div className="mt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-medium">
                  Hydration Target
                </span>
                <span className="text-2xl font-extrabold text-slate-100 mt-1 block leading-none">
                  {todayWaterLogged} / <span className="text-teal-400 font-bold text-sm">{waterGoal} ml</span>
                </span>
              </div>

              <button
                onClick={handleQuickWater}
                disabled={loadingQuickWater}
                className="mt-4 w-full bg-white/5 hover:bg-white/10 text-[11px] font-bold py-2 px-3 rounded-xl text-teal-300 border border-white/5 transition-colors text-center cursor-pointer"
              >
                {loadingQuickWater ? "..." : "+ 250ml quick"}
              </button>
            </div>

            {/* Habits progress tracking block */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-[22px] p-5 flex flex-col justify-between shadow-xl min-h-[170px]">
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                  {summary.habitsProgress.percentage}%
                </span>
              </div>

              <div className="mt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-medium">
                  Complete Habits
                </span>
                <span className="text-2xl font-extrabold text-slate-100 mt-1 block leading-none">
                  {summary.habitsProgress.completed} / {summary.habitsProgress.total}
                </span>
              </div>

              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider overflow-hidden text-ellipsis whitespace-nowrap">
                {summary.habitsProgress.total - summary.habitsProgress.completed} remaining today
              </div>
            </div>
          </div>

          {/* Circadian sleep tracker rest card */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-[24px] p-5 flex justify-between items-center shadow-md">
            <div className="flex gap-4.5 items-center">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Moon className="w-5.5 h-5.5 fill-purple-400/10" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-medium">
                  Rest assessment
                </span>
                <span className="text-xs font-bold text-slate-200 mt-1 block">
                  {summary.sleepSummary.averageHours} hrs avg duration / <span className="text-purple-400 text-[11px] font-bold">{user.sleepGoalHours || 8}h goal</span>
                </span>
              </div>
            </div>

            <div className="text-right flex flex-col justify-center items-end">
              <span className="text-xs font-bold text-purple-305 bg-purple-500/10 border border-purple-500/25 px-2.5 py-1.5 rounded-xl block">
                {summary.sleepSummary.averageQuality}/10 score
              </span>
            </div>
          </div>

          {/* Local notification Reminders system */}
          <NotificationReminders
            user={user}
            habitsVersion={habitsVersion}
            todayWaterLogged={todayWaterLogged}
            onWaterLogged={onWaterLogged}
            onHabitsUpdated={onHabitsUpdated}
          />
        </div>

      </div>

      <div className="pt-6 mt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <span className="flex items-center gap-1"><Info className="w-3 h-3 text-teal-400" /> Click Gear to Customize Daily Goals</span>
        <span>MVP Submission</span>
      </div>
    </div>
  );
}
