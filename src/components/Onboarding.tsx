import { useState } from "react";
import { Sparkles, ArrowRight, Droplet, Moon, User } from "lucide-react";
import { motion } from "motion/react";
import { UserProfile } from "../types";

interface OnboardingProps {
  user: UserProfile;
  onOnboardComplete: (updatedUser: UserProfile) => void;
}

export default function Onboarding({ user, onOnboardComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user.name || "");
  const [waterGoal, setWaterGoal] = useState(2000);
  const [sleepGoal, setSleepGoal] = useState(8);
  const [saving, setSaving] = useState(false);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      saveOnboarding();
    }
  };

  const saveOnboarding = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name,
          dailyWaterGoalMl: waterGoal,
          sleepGoalHours: sleepGoal,
        }),
      });
      const data = await response.json();
      if (data.success) {
        onOnboardComplete(data.user);
      }
    } catch (e) {
      console.error("Onboarding saving error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-100 justify-between p-6 font-sans select-none z-10 relative animate-fadeIn">
      {/* Header and steps indicator */}
      <div className="flex items-center justify-between pt-4">
        <span className="text-[10px] font-bold tracking-widest text-teal-400 uppercase">
          Onboarding
        </span>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? "w-6 bg-teal-400" : "w-1.5 bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center my-6">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight leading-tight">
                Welcome to your sacred health space.
              </h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Let's customize Aurora to harmonize with your biological rhythm. What should we call you?
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Preferred Name
              </label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400">
              <Droplet className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight leading-tight">
                Prioritize Hydration
              </h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Proper water intake sustains active metabolism and mental concentration. What is your daily target?
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Daily Goal
                </span>
                <span className="text-lg font-extrabold text-cyan-400">{waterGoal} ml</span>
              </div>
              
              <input
                type="range"
                min="1000"
                max="4000"
                step="250"
                className="w-full h-1.5 bg-slate-800 accent-teal-400 rounded-lg appearance-none cursor-pointer"
                value={waterGoal}
                onChange={(e) => setWaterGoal(Number(e.target.value))}
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>1000ml (Min)</span>
                <span>2000ml (Adult Avg)</span>
                <span>4000ml (Active)</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
              <Moon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight leading-tight">
                Embrace Quality Rest
              </h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sleep rejuvenates the cell system and consolidates cognitive learning. How many hours do you target?
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Optimal Sleep Target
                </span>
                <span className="text-lg font-extrabold text-purple-450">{sleepGoal} hours</span>
              </div>

              <input
                type="range"
                min="5"
                max="12"
                step="0.5"
                className="w-full h-1.5 bg-slate-800 accent-purple-400 rounded-lg appearance-none cursor-pointer"
                value={sleepGoal}
                onChange={(e) => setSleepGoal(Number(e.target.value))}
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>5 hrs (Short)</span>
                <span>8 hrs (Recommended)</span>
                <span>12 hrs (Long)</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Navigation action button */}
      <div className="pb-4">
        <button
          onClick={handleNext}
          disabled={saving || (step === 1 && !name.trim())}
          className="w-full bg-gradient-to-r from-indigo-500 to-teal-400 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {step === 3 ? "Let's Begin" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
