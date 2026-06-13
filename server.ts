import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up simple local database
const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface Database {
  users: { [id: string]: { id: string; name: string; email: string; dailyWaterGoalMl: number; sleepGoalHours: number; onboarded: boolean; avatarUrl?: string } };
  waterLogs: { [id: string]: { id: string; userId: string; amountMl: number; timestamp: string } };
  habits: { [id: string]: { id: string; userId: string; name: string; description: string; emoji: string; frequency: "daily" | "weekly"; reminderTime: string; streak: number; completedDates: string[] } };
  sleepLogs: { [id: string]: { id: string; userId: string; hours: number; quality: number; date: string; timestamp: string } };
}

const defaultDB: Database = {
  users: {},
  waterLogs: {},
  habits: {},
  sleepLogs: {}
};

// Ensure data folder exists
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"));
}

function loadDB(): Database {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load local DB, resetting to default:", error);
  }
  return defaultDB;
}

function saveDB(db: Database) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save DB:", err);
  }
}

// Global DB Reference
let db = loadDB();

// Lazy Gemini Initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Seed helper functions for pre-populating dummy data for a user
function seedUserData(userId: string) {
  const now = new Date();
  
  // Clean logs first
  db.waterLogs = Object.fromEntries(Object.entries(db.waterLogs).filter(([_, log]) => log.userId !== userId));
  db.habits = Object.fromEntries(Object.entries(db.habits).filter(([_, habit]) => habit.userId !== userId));
  db.sleepLogs = Object.fromEntries(Object.entries(db.sleepLogs).filter(([_, sleep]) => sleep.userId !== userId));

  // Add water logs
  for (let i = 0; i < 3; i++) {
    const time = new Date(now.getTime() - i * 3 * 3600 * 1000);
    const amount = [250, 500, 330][i];
    const logId = `water_${userId}_${Date.now()}_${i}`;
    db.waterLogs[logId] = {
      id: logId,
      userId,
      amountMl: amount,
      timestamp: time.toISOString()
    };
  }

  // Add baseline habits
  const h1 = `habit_${userId}_1`;
  db.habits[h1] = {
    id: h1,
    userId,
    name: "Morning Meditation",
    description: "Start the day with deep breaths and mental clarity",
    emoji: "🧘",
    frequency: "daily",
    reminderTime: "07:30",
    streak: 3,
    completedDates: [
      new Date(now.getTime() - 86400000).toISOString().split("T")[0],
      new Date(now.getTime() - 172800000).toISOString().split("T")[0]
    ]
  };

  const h2 = `habit_${userId}_2`;
  db.habits[h2] = {
    id: h2,
    userId,
    name: "Hydrate and Stretch",
    description: "Stretch for 10 minutes and drink 300ml water",
    emoji: "🤸",
    frequency: "daily",
    reminderTime: "08:00",
    streak: 1,
    completedDates: []
  };

  const h3 = `habit_${userId}_3`;
  db.habits[h3] = {
    id: h3,
    userId,
    name: "Sleep Wind-down Routine",
    description: "No screens 45 minutes before sleeping",
    emoji: "🌌",
    frequency: "daily",
    reminderTime: "22:00",
    streak: 0,
    completedDates: []
  };

  // Add Sleep data (past 5 days)
  for (let i = 0; i < 5; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    const sleepId = `sleep_${userId}_${dateStr}`;
    db.sleepLogs[sleepId] = {
      id: sleepId,
      userId,
      hours: [7.5, 6.8, 8.2, 5.5, 7.0][i],
      quality: [8, 6, 9, 4, 7][i],
      date: dateStr,
      timestamp: d.toISOString()
    };
  }

  saveDB(db);
}

// HELPERS FOR RETRIEVING DATA
function getWaterForDay(userId: string, dateStr: string): number {
  return Object.values(db.waterLogs)
    .filter(log => log.userId === userId && log.timestamp.startsWith(dateStr))
    .reduce((sum, log) => sum + log.amountMl, 0);
}

function getHabitsProgressForDay(userId: string, dateStr: string) {
  const list = Object.values(db.habits).filter(h => h.userId === userId);
  const total = list.length;
  const completed = list.filter(h => h.completedDates.includes(dateStr)).length;
  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 100
  };
}

function getSleepSummary(userId: string) {
  const list = Object.values(db.sleepLogs)
    .filter(s => s.userId === userId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  if (list.length === 0) {
    return { averageHours: 0, averageQuality: 0, recentLogs: [] };
  }

  const sumHours = list.reduce((sum, s) => sum + s.hours, 0);
  const sumQuality = list.reduce((sum, s) => sum + s.quality, 0);

  return {
    averageHours: parseFloat((sumHours / list.length).toFixed(1)),
    averageQuality: parseFloat((sumQuality / list.length).toFixed(1)),
    recentLogs: list
  };
}

// AUTH API ENDPOINTS
app.post("/api/auth/login", (req, res) => {
  const { email, name, avatarUrl } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Find or create user
  let user = Object.values(db.users).find(u => u.email === email);
  if (!user) {
    const id = `user_${Date.now()}`;
    user = {
      id,
      name: name || email.split("@")[0],
      email,
      dailyWaterGoalMl: 2000,
      sleepGoalHours: 8,
      onboarded: false,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`
    };
    db.users[id] = user;
    saveDB(db);
    seedUserData(id); // seed onboarding dummy data instantly
  } else {
    // If user already exists, check if name or avatarUrl is updated during custom sign up / sign in
    if (name) user.name = name;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    saveDB(db);
  }

  res.json({ success: true, user });
});

app.post("/api/auth/onboard", (req, res) => {
  const { userId, name, dailyWaterGoalMl, sleepGoalHours } = req.body;
  const user = db.users[userId];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.name = name || user.name;
  user.dailyWaterGoalMl = Number(dailyWaterGoalMl) || 2000;
  user.sleepGoalHours = Number(sleepGoalHours) || 8;
  user.onboarded = true;

  saveDB(db);
  res.json({ success: true, user });
});

// RESOURCE RETRIEVALS
app.get("/api/dashboard/:userId", (req, res) => {
  const { userId } = req.params;
  const user = db.users[userId];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const loggedWater = getWaterForDay(userId, todayStr);
  const habitsProg = getHabitsProgressForDay(userId, todayStr);
  const sleepSum = getSleepSummary(userId);

  // default insights if no gemini key
  const insight = "Stay steady, Aurora companion! You have logged your hydration and completed some meditation. Reach out to the AI Health Coach for interactive chat coaching if desired!";

  res.json({
    waterProgress: {
      logged: loggedWater,
      goal: user.dailyWaterGoalMl,
      percentage: Math.min(100, Math.round((loggedWater / user.dailyWaterGoalMl) * 100))
    },
    habitsProgress: habitsProg,
    sleepSummary: sleepSum,
    dailyInsight: insight,
    user
  });
});

app.get("/api/water/:userId", (req, res) => {
  const { userId } = req.params;
  const list = Object.values(db.waterLogs)
    .filter(log => log.userId === userId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  res.json(list);
});

app.post("/api/water/:userId", (req, res) => {
  const { userId } = req.params;
  const { amountMl } = req.body;

  if (!amountMl || amountMl <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }

  const logId = `water_${userId}_${Date.now()}`;
  const log = {
    id: logId,
    userId,
    amountMl: Number(amountMl),
    timestamp: new Date().toISOString()
  };

  db.waterLogs[logId] = log;
  saveDB(db);

  res.json({ success: true, log });
});

app.get("/api/habits/:userId", (req, res) => {
  const { userId } = req.params;
  const list = Object.values(db.habits).filter(h => h.userId === userId);
  res.json(list);
});

app.post("/api/habits/:userId", (req, res) => {
  const { userId } = req.params;
  const { name, description, emoji, frequency, reminderTime } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Habit name is required" });
  }

  const habitId = `habit_${userId}_${Date.now()}`;
  const habit = {
    id: habitId,
    userId,
    name,
    description: description || "Build a healthy rhythm",
    emoji: emoji || "🌟",
    frequency: frequency || "daily",
    reminderTime: reminderTime || "09:00",
    streak: 0,
    completedDates: []
  };

  db.habits[habitId] = habit;
  saveDB(db);

  res.json({ success: true, habit });
});

app.post("/api/habits/toggle/:userId/:habitId", (req, res) => {
  const { userId, habitId } = req.params;
  const { date } = req.body; // format 'YYYY-MM-DD'
  
  const hStr = date || new Date().toISOString().split("T")[0];
  const habit = db.habits[habitId];

  if (!habit || habit.userId !== userId) {
    return res.status(404).json({ error: "Habit not found" });
  }

  const index = habit.completedDates.indexOf(hStr);
  if (index > -1) {
    habit.completedDates.splice(index, 1);
    // reduce streak if toggled today
    if (habit.streak > 0) habit.streak -= 1;
  } else {
    habit.completedDates.push(hStr);
    habit.streak += 1;
  }

  saveDB(db);
  res.json({ success: true, habit });
});

app.delete("/api/habits/:userId/:habitId", (req, res) => {
  const { userId, habitId } = req.params;
  const habit = db.habits[habitId];

  if (!habit || habit.userId !== userId) {
    return res.status(404).json({ error: "Habit not found" });
  }

  delete db.habits[habitId];
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/sleep/:userId", (req, res) => {
  const { userId } = req.params;
  const list = Object.values(db.sleepLogs)
    .filter(log => log.userId === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
  res.json(list);
});

app.post("/api/sleep/:userId", (req, res) => {
  const { userId } = req.params;
  const { hours, quality, date } = req.body;

  if (!hours || !quality) {
    return res.status(400).json({ error: "Hours and scale quality of sleep are required" });
  }

  const dateStr = date || new Date().toISOString().split("T")[0];
  const sleepId = `sleep_${userId}_${dateStr}`;

  db.sleepLogs[sleepId] = {
    id: sleepId,
    userId,
    hours: Number(hours),
    quality: Number(quality),
    date: dateStr,
    timestamp: new Date().toISOString()
  };

  saveDB(db);

  res.json({ success: true, sleepLog: db.sleepLogs[sleepId] });
});

function runSimulatedCoachParsing(message: string, userId: string, user: any, todayStr: string) {
  const lowerMsg = message.toLowerCase();
  let speechText = `Hello ${user.name}! I am your voice health companion, Aurora. Try saying "I drank 500ml water" or "Create a stretching habit", and I will automatically do it for you!`;
  let action: any = null;

  // Water tracking detection
  if (lowerMsg.includes("water") || lowerMsg.includes("drank") || lowerMsg.includes("ml") || lowerMsg.includes("drink") || lowerMsg.includes("glass") || lowerMsg.includes("cup") || lowerMsg.includes("hydrate")) {
    // try to extract numbers
    const match = lowerMsg.match(/\d+(\.\d+)?/);
    let amount = 250; // default for a glass/cup/drink
    
    if (match) {
      const num = parseFloat(match[0]);
      if (lowerMsg.includes("liter") || lowerMsg.includes("litre") || lowerMsg.includes(" l") || lowerMsg.endsWith(" l")) {
        amount = Math.round(num * 1000);
      } else {
        amount = Math.round(num);
      }
    } else if (lowerMsg.includes("liter") || lowerMsg.includes("litre")) {
      amount = 1000;
    }
    
    // Sanity limit check
    if (amount <= 0 || amount > 10000) {
      amount = 250;
    }

    const logId = `water_${userId}_${Date.now()}`;
    db.waterLogs[logId] = {
      id: logId,
      userId,
      amountMl: amount,
      timestamp: new Date().toISOString()
    };
    saveDB(db);

    const friendlyReplies = [
      `No problem! I've logged ${amount}ml of water for you. Keep up the high standard of hydration!`,
      `Wonderful! That's another ${amount}ml of water. Consistent hydration is the foundation of vital energy.`,
      `Got it, ${user.name}! I registered ${amount}ml of water. Sip by sip, you're doing amazing today!`
    ];
    speechText = friendlyReplies[Math.floor(Math.random() * friendlyReplies.length)];
    action = { type: "ADD_WATER", payload: { amountMl: amount } };
  }
  // Habit creation detection
  else if (lowerMsg.includes("habit") || lowerMsg.includes("create") || lowerMsg.includes("schedule") || lowerMsg.includes("routine")) {
    let habitName = "Zen Meditation";
    let desc = "Practice mindfulness every day.";
    let emoji = "🧘";
    let reminderTime = "08:00";

    if (lowerMsg.includes("stretch") || lowerMsg.includes("stretching") || lowerMsg.includes("flex")) {
      habitName = "Daily Body Stretching";
      desc = "Release muscle tension and stimulate circadian immune flow.";
      emoji = "🤸";
      reminderTime = "08:30";
    } else if (lowerMsg.includes("meditat") || lowerMsg.includes("zen") || lowerMsg.includes("breath")) {
      habitName = "Daily Zen Meditation";
      desc = "Mindful reflection and breathing logs.";
      emoji = "🧘";
      reminderTime = "08:00";
    } else if (lowerMsg.includes("read") || lowerMsg.includes("book")) {
      habitName = "Daily Mindful Reading";
      desc = "Expand intellect and slow brainwaves prior to rest.";
      emoji = "📖";
      reminderTime = "21:30";
    } else if (lowerMsg.includes("walk") || lowerMsg.includes("stroll") || lowerMsg.includes("step")) {
      habitName = "Daily Mindful Walk";
      desc = "Get outdoor steps to realign cortisol rhythms.";
      emoji = "🚶";
      reminderTime = "17:00";
    } else if (lowerMsg.includes("yoga") || lowerMsg.includes("asana")) {
      habitName = "Daily Yoga Routine";
      desc = "Integrate breathe pacing and alignment postures.";
      emoji = "🧘";
      reminderTime = "07:00";
    } else if (lowerMsg.includes("journal") || lowerMsg.includes("write") || lowerMsg.includes("reflect")) {
      habitName = "Daily Reflection Journal";
      desc = "Process emotional blockages through expressive writing.";
      emoji = "📝";
      reminderTime = "22:00";
    } else {
      // Custom extraction
      const indicators = ["create a habit of", "create habit", "create", "schedule a habit for", "habit of"];
      let customName = "";
      for (const ind of indicators) {
        if (lowerMsg.includes(ind)) {
          const idx = lowerMsg.indexOf(ind) + ind.length;
          customName = message.substring(idx).trim();
          break;
        }
      }
      if (customName) {
        customName = customName.replace(/\bhabit\b/gi, "").trim();
        customName = customName.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
      }
      if (customName && customName.length > 2) {
        habitName = customName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        desc = "Created custom routine automatically via Voice AI.";
        emoji = "✨";
        reminderTime = "09:00";
      }
    }

    const habitId = `habit_${userId}_${Date.now()}`;
    const newHab = {
      id: habitId,
      userId,
      name: habitName,
      description: desc,
      emoji: emoji,
      frequency: "daily" as const,
      reminderTime: reminderTime,
      streak: 0,
      completedDates: []
    };
    db.habits[habitId] = newHab;
    saveDB(db);

    const friendlyHabitReplies = [
      `Lovely choice! I've scheduled your new habit: "${habitName}" with a reminder at ${reminderTime}. Aurora is right beside you!`,
      `Got it! I have set up your new daily habit: ${habitName} for ${reminderTime}. Building consistency is the magic of small steps!`,
    ];
    speechText = friendlyHabitReplies[Math.floor(Math.random() * friendlyHabitReplies.length)];
    action = { type: "ADD_HABIT", payload: newHab };
  }
  // Sleep tracking detection
  else if (lowerMsg.includes("sleep") || lowerMsg.includes("slept") || lowerMsg.includes("rest") || lowerMsg.includes("night")) {
    const match = lowerMsg.match(/\d+(\.\d+)?/);
    const hours = match ? parseFloat(match[0]) : 8;
    
    let quality = 8;
    const qualMatch = lowerMsg.match(/(?:quality|score|rate|rating)\s*(\d+)/i) || lowerMsg.match(/(?:of|at)\s*(\d+)\s*(?:out of 10|\/10)?/i);
    if (qualMatch) {
      quality = parseInt(qualMatch[1]);
    } else {
      const allNumbers = lowerMsg.match(/\d+(\.\d+)?/g);
      if (allNumbers && allNumbers.length > 1) {
        const potentialQual = parseFloat(allNumbers[1]);
        if (potentialQual >= 1 && potentialQual <= 10) {
          quality = Math.round(potentialQual);
        }
      }
    }

    if (quality < 1) quality = 1;
    if (quality > 10) quality = 10;
    
    const sleepId = `sleep_${userId}_${todayStr}`;
    db.sleepLogs[sleepId] = {
      id: sleepId,
      userId,
      hours,
      quality,
      date: todayStr,
      timestamp: new Date().toISOString()
    };
    saveDB(db);

    const friendlySleepReplies = [
      `Beautiful rest! I've registered your sleep log of ${hours} hours with a quality score of ${quality}/10. Proper rest nourishes your mind!`,
      `Sweet dreams! I've logged ${hours} hours of restorative sleep with quality ${quality}/10. Keep respecting your circadian rhythm!`
    ];
    speechText = friendlySleepReplies[Math.floor(Math.random() * friendlySleepReplies.length)];
    action = { type: "ADD_SLEEP", payload: { hours, quality, date: todayStr } };
  }

  return {
    textResponse: speechText,
    actionPerformed: action,
    updatedWater: getWaterForDay(userId, todayStr),
    updatedHabits: Object.values(db.habits).filter(h => h.userId === userId),
    updatedSleep: getSleepSummary(userId)
  };
}

function generateFallbackInsight(user: any, userId: string, todayStr: string, currentWater: number, currentHabits: any[], sleepSum: any): string {
  const waterPct = Math.round((currentWater / (user.dailyWaterGoalMl || 2000)) * 100);
  const totalHabits = currentHabits.length;
  const completedHabits = currentHabits.filter(h => h.completedDates.includes(todayStr)).length;
  
  if (waterPct < 30) {
    return `Breathe deeply, ${user.name}. Your cellular vitality could use a refreshing drink of pure water right now.`;
  }
  if (totalHabits > 0 && completedHabits === 0) {
    return `The secret of your future is hidden in your daily routine. Take a gentle breath and try one habit checkbox today!`;
  }
  if (waterPct >= 100 && (totalHabits === 0 || completedHabits === totalHabits)) {
    return `A masterpiece of mindfulness! Both hydration and daily rhythms are fully aligned today, ${user.name}.`;
  }
  if (sleepSum.averageHours < 6.5) {
    return `Rest is the sacred companion of effort. Focus on creating a screen-free wind-down sleep routine tonight.`;
  }
  
  const generalInsights = [
    `Every single sip of water and stretch is a conscious vote for your vibrant biological balance, ${user.name}.`,
    `Notice the subtle space between your thoughts as you breathe. Step into this moment with complete peace.`,
    `A healthy life is not a final destination, but a collection of beautiful microscopic daily choices.`,
    `You are doing exceptionally well today. Align your focus with calmness and let the distractions fade away.`
  ];
  return generalInsights[Math.floor(Math.random() * generalInsights.length)];
}

// VOICE HEALTH COACH ENDPOINT
app.post("/api/voice-coach/:userId", async (req, res) => {
  const { userId } = req.params;
  const { message } = req.body; // text representation of client audio transcript

  const user = db.users[userId];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!message || String(message).trim() === "") {
    return res.status(400).json({ error: "Message is required" });
  }

  const aiObj = getGeminiClient();

  const todayStr = new Date().toISOString().split("T")[0];
  const currentWater = getWaterForDay(userId, todayStr);
  const currentHabits = Object.values(db.habits).filter(h => h.userId === userId);
  const sleepSum = getSleepSummary(userId);

  // Fallback Rule: If Gemini API Key is missing, execute rule-based trigger so user STILL has fully matching demo!
  if (!aiObj) {
    console.log("No Gemini API key found, running simulated coach parsing.");
    const result = runSimulatedCoachParsing(message, userId, user, todayStr);
    return res.json(result);
  }

  // Define Function Declarations for Gemini tool calling
  const addWaterTool = {
    name: "addWater",
    description: "Logs that the user consumed or drank water in milliliters.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        amountMl: {
          type: Type.NUMBER,
          description: "Water amount in milliliters (ml). If the user states 'a cup/glass', default to 250."
        }
      },
      required: ["amountMl"]
    }
  };

  const createHabitTool = {
    name: "createHabit",
    description: "Creates a new daily wellness habit for the user to practice consistency.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "Short literal title for the habit, e.g. 'Daily Zen Meditation', 'Drink Morning Tea'."
        },
        description: {
          type: Type.STRING,
          description: "Friendly high-level explanation or instruction."
        },
        emoji: {
          type: Type.STRING,
          description: "A single representative emoji (e.g., '🧘' for meditation, '🚶' for walks, '💧' for water, '📖' for reading)."
        },
        time: {
          type: Type.STRING,
          description: "Default daily schedule time in 'HH:MM' 24-hr layout."
        }
      },
      required: ["name"]
    }
  };

  const logSleepTool = {
    name: "logSleep",
    description: "Logs that the user slept for a specific number of hours on a given date (or defaults to today) and their sleep quality.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        hours: {
          type: Type.NUMBER,
          description: "Number of hours slept (e.g. 7.5, 8)."
        },
        quality: {
          type: Type.NUMBER,
          description: "Quality score from 1 to 10."
        },
        date: {
          type: Type.STRING,
          description: "Date string in 'YYYY-MM-DD' format (optional, default to today)."
        }
      },
      required: ["hours", "quality"]
    }
  };

  try {
    const statusSummary = `
      User data for context of conversation:
      - Current User: ${user.name}
      - Today's Water Drank: ${currentWater}ml / Goal: ${user.dailyWaterGoalMl}ml
      - Active habits: ${currentHabits.map(h => `${h.name} (${h.streak}-day streak)`).join(", ")}
      - Sleep stats: avg ${sleepSum.averageHours} hours/day with score ${sleepSum.averageQuality}/10.
    `;

    const response = await aiObj.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: `You are Aurora, an empathetic, supportive AI Health Coach shaped like Apple Health & calm mindfulness platforms.
          You communicate warmly, speaking directly and encouragingly. Use humble human-friendly vocabulary.
          Your task is to understand user statements and log wellness elements like hydrating, stretching, meditations or sleeping.
          If the user reports completing/doing an action, call the respective tool.
          Always speak back a beautiful, short, calming confirmation response that will be broadcast via text-to-speech.
          Keep answers beneath 3 sentences.
          
          Context statistics:
          ${statusSummary}`,
        tools: [{ functionDeclarations: [addWaterTool, createHabitTool, logSleepTool] }],
      }
    });

    let voiceText = response.text || "I have received your request and registered your health goals!";
    let actionApplied = null;

    // Check for function calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      const args: any = call.args;

      if (call.name === "addWater") {
        const amount = Number(args.amountMl) || 250;
        const logId = `water_${userId}_${Date.now()}`;
        db.waterLogs[logId] = {
          id: logId,
          userId,
          amountMl: amount,
          timestamp: new Date().toISOString()
        };
        saveDB(db);

        actionApplied = { type: "ADD_WATER", payload: { amountMl: amount } };
        voiceText = `No problem! I've logged ${amount}ml of water for you. Keep up the high standard of hydration!`;
      } 
      else if (call.name === "createHabit") {
        const habitId = `habit_${userId}_${Date.now()}`;
        const newHab = {
          id: habitId,
          userId,
          name: args.name,
          description: args.description || "Consistent healthy rhythm",
          emoji: args.emoji || "✨",
          frequency: "daily" as const,
          reminderTime: args.time || "08:00",
          streak: 0,
          completedDates: []
        };
        db.habits[habitId] = newHab;
        saveDB(db);

        actionApplied = { type: "ADD_HABIT", payload: newHab };
        voiceText = `Lovely choice! I've scheduled your new habit: "${args.name}" with a reminder at ${args.time || "08:00"}. Aurora is right beside you!`;
      }
      else if (call.name === "logSleep") {
        const hours = Number(args.hours) || 8;
        const quality = Number(args.quality) || 8;
        const sleepDate = args.date || todayStr;
        const sleepId = `sleep_${userId}_${sleepDate}`;
        
        db.sleepLogs[sleepId] = {
          id: sleepId,
          userId,
          hours,
          quality,
          date: sleepDate,
          timestamp: new Date().toISOString()
        };
        saveDB(db);

        actionApplied = { type: "ADD_SLEEP", payload: { hours, quality, date: sleepDate } };
        voiceText = `Wonderful! I've registered your sleep log of ${hours} hours with a quality score of ${quality}/10. Proper rest nourishes your mind!`;
      }
    }

    res.json({
      textResponse: voiceText,
      actionPerformed: actionApplied,
      updatedWater: getWaterForDay(userId, todayStr),
      updatedHabits: Object.values(db.habits).filter(h => h.userId === userId),
      updatedSleep: getSleepSummary(userId)
    });

  } catch (err: any) {
    console.error("Gemini Error, falling back to simulated coach parsing:", err);
    const result = runSimulatedCoachParsing(message, userId, user, todayStr);
    return res.json(result);
  }
});

// GET SEED STATUS & INSIGHTS GENERATION (FOR FRONTEND RE-COACHING)
app.post("/api/insight/:userId", async (req, res) => {
  const { userId } = req.params;
  const user = db.users[userId];
  if (!user) return res.status(404).json({ error: "User not found" });

  const todayStr = new Date().toISOString().split("T")[0];
  const currentWater = getWaterForDay(userId, todayStr);
  const currentHabits = Object.values(db.habits).filter(h => h.userId === userId);
  const sleepSum = getSleepSummary(userId);

  const aiObj = getGeminiClient();
  if (!aiObj) {
    const reflection = generateFallbackInsight(user, userId, todayStr, currentWater, currentHabits, sleepSum);
    return res.json({ insight: reflection });
  }

  try {
    const prompt = `Based on the user's progress today, generate a short 1-sentence mindful and encouraging health reflection.
      - User name: ${user.name}
      - Water: ${currentWater}/${user.dailyWaterGoalMl} ml
      - Habits Count: ${currentHabits.length} (streaks: ${currentHabits.map(h => `${h.name}: ${h.streak}`).join(", ")})
      - Avg Sleep: ${sleepSum.averageHours} hours, avg score: ${sleepSum.averageQuality}/10.
      Keep it calm, warm, and brief (under 15 words). No markdown or bold.`;

    const response = await aiObj.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the Aurora companion, giving short, beautiful aesthetic health feedback."
      }
    });

    res.json({ insight: response.text?.trim() || generateFallbackInsight(user, userId, todayStr, currentWater, currentHabits, sleepSum) });
  } catch (error) {
    const reflection = generateFallbackInsight(user, userId, todayStr, currentWater, currentHabits, sleepSum);
    res.json({ insight: reflection });
  }
});


// Serve static assets from build in production
// Dynamic Vite handling for development
const start = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

start();
