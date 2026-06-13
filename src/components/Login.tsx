import React, { useState } from "react";
import { Sparkles, Mail, Heart, ArrowRight, UserPlus, Play, RefreshCw, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";

interface LoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  userEmailPreference?: string;
}

type AvatarStyle = "adventurer" | "lorelei" | "bottts" | "pixel-art";

export default function Login({ onLoginSuccess, userEmailPreference = "khwahishseth@gmail.com" }: LoginProps) {
  const [loginMode, setLoginMode] = useState<"quick" | "custom">("quick");
  const [email, setEmail] = useState(userEmailPreference);
  const [name, setName] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("Aurora");
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>("adventurer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleModeChange = (mode: "quick" | "custom") => {
    setLoginMode(mode);
    setError("");
    if (mode === "quick") {
      setEmail(userEmailPreference);
      setName("");
    } else {
      setEmail("");
      setName("");
    }
  };

  const randomizeSeed = () => {
    const randomSeeds = ["Luna", "Echo", "Atlas", "Vega", "Sage", "Nova", "Zen", "River", "Skye", "Phoenix"];
    const rand = randomSeeds[Math.floor(Math.random() * randomSeeds.length)] + Math.floor(Math.random() * 100);
    setAvatarSeed(rand);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setError("Please enter a valid email address (e.g. name@domain.com)");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Setup customized request body
      const selectedAvatarUrl = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed || targetEmail)}`;
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: targetEmail, 
          name: name.trim() || undefined,
          avatarUrl: loginMode === "custom" ? selectedAvatarUrl : undefined
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sign in. Please verify your internet connection.");
      }

      const data = await response.json();
      if (data.success && data.user) {
        // If they chose a custom avatar style, let's update it in the newly registered profile 
        // Note: The backend login route handles find/create. If it's a new or existing user, let's pass it
        onLoginSuccess(data.user);
      } else {
        throw new Error(data.error || "Login returned an error status from the server.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during authorization.");
    } finally {
      setLoading(false);
    }
  };

  const currentPreviewAvatar = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed || "User")}`;

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-100 justify-between p-6 md:p-8 font-sans select-none z-10 relative">
      
      {/* Top Header Identity */}
      <div className="flex flex-col items-center pt-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 text-teal-400 mb-4"
        >
          <Heart className="w-8 h-8 animate-pulse text-teal-400" />
          <div className="absolute inset-0 rounded-full border border-teal-500/20 scale-125 animate-ping opacity-25" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-extrabold bg-gradient-to-r from-indigo-300 via-teal-200 to-white bg-clip-text text-transparent tracking-tight font-sans"
        >
          Aurora
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-slate-400 max-w-[290px] mt-2 leading-relaxed"
        >
          Your mindful health companion for hydration, restorative rest, and intelligent habit tracking.
        </motion.p>
      </div>

      {/* Main Dynamic Entrance Segment */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 shadow-xl shadow-indigo-950/20 my-6"
      >
        {/* Toggle navigation for Login style */}
        <div className="grid grid-cols-2 bg-slate-950/60 p-1 rounded-xl border border-white/5 mb-5">
          <button
            onClick={() => handleModeChange("quick")}
            type="button"
            className={`py-2 px-3 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === "quick" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-505/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Quick Demo Acc
          </button>
          
          <button
            onClick={() => handleModeChange("custom")}
            type="button"
            className={`py-2 px-3 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === "custom" 
                ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            New / Custom Profile
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <AnimatePresence mode="wait">
            {loginMode === "quick" ? (
              <motion.div
                key="quick-mode"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5">
                    Demo Account Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      readOnly
                      className="w-full bg-slate-950/40 border border-slate-900 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-350 cursor-not-allowed outline-none select-all"
                      value={email}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
                    This prefilled email enters your personal showcase dashboard with preset data multipliers.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="custom-mode"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                {/* Email Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Your Personal Email <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@domain.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-400 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        // dynamically adjust seed according to typing if no custom seed set
                        if (avatarSeed === "Aurora" || avatarSeed === "") {
                          setAvatarSeed(e.target.value.split("@")[0] || "User");
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Full / Preferred Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Henderson"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-400 rounded-xl py-3 px-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (e.target.value) {
                        setAvatarSeed(e.target.value);
                      }
                    }}
                  />
                </div>

                {/* Avatar Visualizer Board */}
                <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                        Dynamic Character
                      </span>
                      <span className="text-[9px] text-slate-500 block">Customize your companion seed and art style</span>
                    </div>

                    <button
                      type="button"
                      onClick={randomizeSeed}
                      className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Randomize
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Live preview */}
                    <div className="relative w-14 h-14 rounded-full border border-teal-500/20 bg-slate-900 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <img
                        src={currentPreviewAvatar}
                        alt="Preview Portrait"
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full"
                      />
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Avatar seed string"
                        value={avatarSeed}
                        onChange={(e) => setAvatarSeed(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-teal-400 rounded-lg py-1.5 px-3 text-[11px] text-slate-300 leading-none focus:outline-none"
                      />

                      {/* Pill styles selectors */}
                      <div className="flex flex-wrap gap-1.5">
                        {(["adventurer", "lorelei", "bottts", "pixel-art"] as AvatarStyle[]).map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => setAvatarStyle(style)}
                            className={`px-2 py-1 text-[9px] font-bold rounded-md uppercase tracking-wider border transition-all cursor-pointer ${
                              avatarStyle === style 
                                ? "bg-teal-400/20 border-teal-400/50 text-teal-350" 
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                            }`}
                          >
                            {style.replace("-", " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-gradient-to-r from-indigo-500 to-teal-400 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {loginMode === "quick" ? (
                  <>
                    Hold & Breathe to Enter
                    <Play className="w-4 h-4 fill-white text-transparent" />
                  </>
                ) : (
                  <>
                    Create Customized Profile
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-1.5 mt-4.5 text-[9px] text-slate-500 justify-center font-bold tracking-wider uppercase">
          <span>● Dynamic Account Persistence</span>
          <span className="text-white/10">|</span>
          <span>● Simulated Credentials</span>
        </div>
      </motion.div>

      {/* Footer calm note */}
      <div className="text-center pb-2 text-[10px] uppercase font-bold tracking-widest text-slate-500">
        Inspirations from <span className="text-teal-405">Apple Health</span> &{" "}
        <span className="text-indigo-405">Headspace</span>
      </div>
    </div>
  );
}
