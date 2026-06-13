import React, { useState, useEffect } from "react";
import { UserProfile, Habit } from "../types";
import { CheckSquare, Plus, Bell, Calendar, Trash2, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HabitTrackerProps {
  user: UserProfile;
  onHabitsUpdated: () => void;
  habitsVersion: number;
}

export default function HabitTracker({ user, onHabitsUpdated, habitsVersion }: HabitTrackerProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🧘");
  const [reminderTime, setReminderTime] = useState("08:00");
  const [creating, setCreating] = useState(false);

  const emojiOptions = ["🧘", "🤸", "🚶", "💧", "📖", "🌌", "🍎", "☀️", "🌙"];

  useEffect(() => {
    fetchHabits();
  }, [habitsVersion]);

  const fetchHabits = async () => {
    try {
      const response = await fetch(`/api/habits/${user.id}`);
      const data = await response.json();
      setHabits(data);
    } catch (e) {
      console.error("Failed to fetch habits", e);
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setCreating(true);

    try {
      const response = await fetch(`/api/habits/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          emoji,
          frequency: "daily",
          reminderTime,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setName("");
        setDescription("");
        setEmoji("🧘");
        setShowCreator(false);
        onHabitsUpdated();
        fetchHabits();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      const response = await fetch(`/api/habits/toggle/${user.id}/${habitId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayStr }),
      });
      const data = await response.json();
      if (data.success) {
        onHabitsUpdated();
        fetchHabits();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      const response = await fetch(`/api/habits/${user.id}/${habitId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        onHabitsUpdated();
        fetchHabits();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col h-full bg-transparent p-6 md:p-8 font-sans justify-between overflow-y-auto z-10 relative">
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start">
        
        {/* Left Column: Habits listings */}
        <div className="md:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-teal-400" /> Habit Tracker
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Cultivate small steps daily to master a mindful lifestyle.
              </p>
            </div>
            
            <button
              onClick={() => setShowCreator(!showCreator)}
              className="md:hidden w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-teal-400 select-none cursor-pointer hover:bg-white/15"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-none">
            {habits.length === 0 ? (
              <div className="text-center py-24 bg-white/[0.01] border border-dashed border-white/10 rounded-3xl text-slate-500 text-xs font-medium">
                No healthy habits registered yet.<br/>Create one using the designer tool, or speak to Aurora to create it!
              </div>
            ) : (
              habits.map((habit) => {
                const isCompleted = habit.completedDates.includes(todayStr);
                return (
                  <div
                    key={habit.id}
                    className={`flex flex-col bg-white/5 backdrop-blur-md hover:bg-white/10 border p-4 rounded-[22px] transition-all duration-300 ${
                      isCompleted ? "border-teal-500/30 shadow-lg shadow-teal-500/5" : "border-white/10 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => handleToggleHabit(habit.id)}
                        className="flex-1 flex gap-3.5 text-left group cursor-pointer"
                      >
                        {/* Interactive click button */}
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-teal-400 fill-teal-500/10" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-600 group-hover:border-teal-400 transition-colors" />
                          )}
                        </div>
  
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-100">{habit.emoji} {habit.name}</span>
                            {habit.streak > 0 && (
                              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded-full">
                                🔥 {habit.streak}d streak
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {habit.description}
                          </p>
                        </div>
                      </button>
  
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors select-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
  
                    {/* Alarm indicator line */}
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-slate-500" /> Scheduled {habit.reminderTime}
                      </span>
                      <span className="text-teal-405 font-bold">Daily Goal</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Custom Habit Creator (Persistent on desktop, conditionally on mobile) */}
        <div className={`md:col-span-span bg-white/[0.02] border border-white/5 rounded-3xl p-5 md:p-6 flex flex-col md:col-span-5 ${showCreator ? 'block' : 'hidden md:block'}`}>
          <div className="space-y-4">
            <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-teal-400" /> Habit Designer
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Design a healthy behavioral trigger to align with your personal hydration and sleep schedules.
            </p>

            <form onSubmit={handleCreateHabit} className="space-y-4 mt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Habit Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zen Breathing"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-xs p-3 rounded-xl text-slate-200 focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Purpose / Description
                </label>
                <input
                  type="text"
                  placeholder="Brief guide, e.g. 5 mins focus"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-xs p-3 rounded-xl text-slate-200 focus:outline-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Emoji Icon
                  </label>
                  <div className="flex flex-wrap gap-1 bg-slate-950 border border-slate-800 p-2 rounded-xl">
                    {emojiOptions.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setEmoji(em)}
                        className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs cursor-pointer ${
                          emoji === em ? "bg-teal-500/20 ring-1 ring-teal-500 font-bold" : "hover:bg-slate-900"
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Reminder Alarm
                  </label>
                  <div className="relative">
                    <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="time"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-xs py-2.5 pt-3 pl-9 pr-2.5 rounded-xl text-slate-200 focus:outline-none"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-transform duration-100 active:scale-95 shadow-lg shadow-indigo-650/15"
              >
                Create Habit
              </button>
            </form>
          </div>
        </div>

      </div>

      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mt-8">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          💡 <span className="text-teal-400 font-bold">Aurora Voice Intelligence:</span> Try typing or saying <span className="text-slate-200 font-semibold">"Create a mindfulness stretch habit"</span> in the Voice AI tab to see the voice companion generate this habit automatically!
        </p>
      </div>
    </div>
  );
}
