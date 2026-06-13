import React, { useState, useEffect, useRef } from "react";
import { UserProfile } from "../types";
import { Mic, MicOff, Send, MessageSquareQuote, CheckCircle2, RotateCcw, Volume2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VoiceAssistantProps {
  user: UserProfile;
  onDataSynced: () => void;
}

export default function VoiceAssistant({ user, onDataSynced }: VoiceAssistantProps) {
  const [messages, setMessages] = useState<{ id: string; sender: "user" | "aurora"; text: string; action?: string; timestamp: Date }[]>([
    {
      id: "welcome",
      sender: "aurora",
      text: `Hello ${user.name}! I am Aurora, your interactive Voice AI Coach. Tap my glowing orb, and say 'I drank 500ml water' or 'Create a stretching habit' and I will automatically do it for you!`,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [actionDone, setActionDone] = useState<{ type: string; details: string } | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize Web Speech Synthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }

    // Initialize Web Speech Recognition
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setStatus("listening");
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setStatus("idle");
      };

      rec.onend = () => {
        setStatus("idle");
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      // recognition not supported, fallback instructions
      alert("Microphone recognition is restricted by iframe container or not supported. Please use the beautiful text console box below to test voice interactions instantly!");
      return;
    }

    if (status === "listening") {
      recognitionRef.current.stop();
    } else {
      // stop text to speech first
      if (synthRef.current) synthRef.current.cancel();
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start SpeechRecognition:", err);
      }
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setStatus("speaking");

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    // Warm professional voice choice
    const femaleVoice = voices.find(v => v.name.includes("Samantha") || v.name.includes("Google US English") || v.lang.startsWith("en-US"));
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.1;

    utterance.onend = () => {
      setStatus("idle");
    };
    utterance.onerror = () => {
      setStatus("idle");
    };

    synthRef.current.speak(utterance);
  };

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim()) return;
    setStatus("thinking");

    // Add user message to state
    const userMsg = {
      id: `user_${Date.now()}`,
      sender: "user" as const,
      text: msgText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch(`/api/voice-coach/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText })
      });

      if (!response.ok) {
        throw new Error("Voice Coach API error");
      }

      const data = await response.json();
      
      const auroraMsgText = data.textResponse || "I registered your goal correctly!";
      const auroraMsg = {
        id: `aurora_${Date.now()}`,
        sender: "aurora" as const,
        text: auroraMsgText,
        action: data.actionPerformed ? data.actionPerformed.type : undefined,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, auroraMsg]);

      // Speak back text aloud
      speakText(auroraMsgText);

      // Trigger action updates on dashboard
      if (data.actionPerformed) {
        const type = data.actionPerformed.type;
        let details = "Hydration logs updated";
        if (type === "ADD_WATER") {
          details = `Logged +${data.actionPerformed.payload.amountMl}ml of water`;
        } else if (type === "ADD_HABIT") {
          details = `Scheduled daily habit: ${data.actionPerformed.payload.name}`;
        } else if (type === "ADD_SLEEP") {
          details = `Registered sleep log hours`;
        }
        setActionDone({ type, details });
        onDataSynced();

        setTimeout(() => {
          setActionDone(null);
        }, 4000);
      }
    } catch (err) {
      console.error(err);
      const errText = "Sorry, I had trouble processing that. Please ensure you are connected to the network.";
      setMessages(prev => [...prev, {
        id: `aurora_err_${Date.now()}`,
        sender: "aurora",
        text: errText,
        timestamp: new Date()
      }]);
      speakText(errText);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleSendMessage(inputText);
      setInputText("");
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "listening": return "Listening closer...";
      case "thinking": return "Aurora is reflecting...";
      case "speaking": return "Aurora Voice active...";
      default: return "Tap Orb to Talk";
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent p-6 md:p-8 font-sans justify-between overflow-y-auto z-10 relative">
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-stretch flex-1">
        
        {/* Left Column: Interactive Glowing Wave Orb Body */}
        <div className="md:col-span-5 flex flex-col justify-between items-center bg-white/[0.01] border border-white/5 rounded-3xl p-6 relative">
          
          {/* Top Title */}
          <div className="text-center space-y-1.5 w-full">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" /> Aurora Voice Assistant
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Mindful Health AI Companion
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-8 relative w-full">
            <AnimatePresence>
              {actionDone && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="absolute top-2 bg-gradient-to-r from-teal-500/15 via-indigo-550/15 to-purple-500/15 backdrop-blur-xl border border-teal-500/20 p-2.5 px-4 rounded-full flex items-center gap-2 z-35 shadow-lg shadow-teal-500/10"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="text-[11px] font-bold text-teal-300">{actionDone.details}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulsing orbital ring structure */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className={`absolute inset-0 rounded-full border border-teal-405/20 transition-all duration-1000 ${
                status === "listening" ? "scale-125 animate-ping opacity-45" : "scale-110 opacity-15"
              }`} />

              {/* Core Interactive breathing sphere */}
              <button
                onClick={handleToggleListening}
                className={`w-32 h-32 rounded-full cursor-pointer focus:outline-none flex items-center justify-center relative shadow-2xl transition-all duration-550 border-4 border-slate-950 ${
                  status === "listening" 
                    ? "bg-gradient-to-tr from-indigo-500 via-teal-400 to-indigo-400 breathing-orb scale-105 shadow-teal-500/30" 
                    : status === "thinking"
                    ? "bg-gradient-to-tr from-indigo-500 via-purple-600 to-teal-400 animate-pulse scale-95"
                    : status === "speaking"
                    ? "bg-gradient-to-tr from-teal-405 to-indigo-500 breathing-orb shadow-indigo-505/35"
                    : "bg-gradient-to-tr from-indigo-500 to-teal-400 shadow-2xl shadow-indigo-500/40 hover:brightness-110"
                }`}
              >
                {status === "listening" ? (
                  <div className="flex gap-1 items-center justify-center">
                    <div className="w-1.5 h-6 bg-white voice-bar-anim rounded-full [animation-delay:0.1s]" />
                    <div className="w-1.5 h-8 bg-white voice-bar-anim rounded-full [animation-delay:0.3s]" />
                    <div className="w-1.5 h-6 bg-white voice-bar-anim rounded-full [animation-delay:0.5s]" />
                  </div>
                ) : status === "speaking" ? (
                  <Volume2 className="w-8 h-8 text-white animate-bounce" />
                ) : status === "thinking" ? (
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Mic className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                )}
              </button>
            </div>

            {/* Dynamic status label below */}
            <div className="mt-5 text-center">
              <p className="text-sm font-semibold tracking-wide text-slate-200">{getStatusText()}</p>
              <p className="text-[10px] text-slate-450 mt-1 uppercase font-bold tracking-widest">
                Hands-Free Mode
              </p>
            </div>
          </div>

          {/* Prompt cues guide */}
          <div className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 space-y-2 text-[11px] text-slate-400 leading-normal">
            <span className="font-bold text-teal-400 block text-[10px] uppercase tracking-wider">Try Saying :</span>
            <ul className="space-y-1 list-disc pl-3 text-slate-300">
              <li>"I drank 500ml water"</li>
              <li>"Create a mindfulness stretch habit"</li>
              <li>"Log sleep of 7.5 hours with quality 9"</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Converse Dialogues & Command Input */}
        <div className="md:col-span-7 flex flex-col justify-between bg-white/[0.02] border border-white/5 rounded-3xl p-5 md:p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <MessageSquareQuote className="w-3.5 h-3.5 text-teal-400" /> Interaction Console
            </span>
            <button
              onClick={() => setMessages([{ id: "init", sender: "aurora", text: `Ready for your requests, ${user.name}!`, timestamp: new Date() }])}
              className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 uppercase tracking-wider font-bold"
            >
              <RotateCcw className="w-3 h-3" /> Clear Logs
            </button>
          </div>

          {/* Full conversation bubbles container */}
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[360px] pr-1.5 scrollbar-none mb-4">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 text-[10px] font-bold text-slate-950 flex items-center justify-center shrink-0">
                      🔮
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-[20px] p-3.5 text-xs leading-relaxed ${
                      isUser
                        ? "bg-teal-500/10 border border-teal-500/20 text-slate-100 rounded-tr-none"
                        : "bg-white/[0.04] border border-white/5 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.action && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold px-2 py-0.5 rounded-full">
                        ✨ Automaton Completed: {msg.action}
                      </span>
                    )}
                  </div>
                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-teal-500/25 text-[10px] font-bold text-teal-300 flex items-center justify-center shrink-0">
                      👤
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Command typed bar action */}
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2 pt-2 border-t border-white/5">
            <input
              type="text"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 px-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              placeholder="Type health updates or talk to Aurora..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              type="submit"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 text-white font-bold hover:brightness-110 active:scale-95 transition-transform cursor-pointer shadow-lg shadow-indigo-540/30 shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
