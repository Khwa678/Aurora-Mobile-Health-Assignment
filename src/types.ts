export interface UserProfile {
  id: string;
  name: string;
  email: string;
  dailyWaterGoalMl: number;
  sleepGoalHours: number;
  onboarded: boolean;
  avatarUrl?: string;
}

export interface WaterLog {
  id: string;
  userId: string;
  amountMl: number;
  timestamp: string; // ISO string
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string;
  emoji: string;
  frequency: "daily" | "weekly";
  reminderTime: string; // "HH:MM"
  streak: number;
  completedDates: string[]; // List of YYYY-MM-DD strings
}

export interface SleepLog {
  id: string;
  userId: string;
  hours: number;
  quality: number; // 1-10 scale
  date: string; // YYYY-MM-DD
  timestamp: string;
}

export interface DashboardSummary {
  waterProgress: {
    logged: number;
    goal: number;
    percentage: number;
  };
  habitsProgress: {
    total: number;
    completed: number;
    percentage: number;
  };
  sleepSummary: {
    averageHours: number;
    averageQuality: number;
    recentLogs: SleepLog[];
  };
  dailyInsight: string;
}
