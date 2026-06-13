import { useState, useEffect } from "react";
import { UserProfile } from "./types";
import WebFrame from "./components/WebFrame";
import Login from "./components/Login";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import WaterTracker from "./components/WaterTracker";
import HabitTracker from "./components/HabitTracker";
import SleepTracker from "./components/SleepTracker";
import VoiceAssistant from "./components/VoiceAssistant";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("aurora_user_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [todayWaterLogged, setTodayWaterLogged] = useState(0);
  const [habitsVersion, setHabitsVersion] = useState(0);
  const [sleepVersion, setSleepVersion] = useState(0);

  useEffect(() => {
    if (user && user.onboarded) {
      fetchTodayWater();
    }
  }, [user]);

  const fetchTodayWater = async () => {
    if (!user) return;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/dashboard/${user.id}`);
      const data = await response.json();
      if (data && data.waterProgress) {
        setTodayWaterLogged(data.waterProgress.logged);
      }
    } catch (e) {
      console.error("Failed to fetch today's logged water:", e);
    }
  };

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    localStorage.setItem("aurora_user_session", JSON.stringify(loggedInUser));
  };

  const handleOnboardComplete = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem("aurora_user_session", JSON.stringify(updatedUser));
    setActiveTab("dashboard");
  };

  const handleUserUpdated = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem("aurora_user_session", JSON.stringify(updatedUser));
    // refresh water goals and other statistics
    fetchTodayWater();
    setHabitsVersion(prev => prev + 1);
    setSleepVersion(prev => prev + 1);
  };

  const handleDataSynced = () => {
    // refresh all states
    fetchTodayWater();
    setHabitsVersion(prev => prev + 1);
    setSleepVersion(prev => prev + 1);
  };

  // Logout/Reset utility if needed (e.g., to clear session)
  const handleResetSession = () => {
    localStorage.removeItem("aurora_user_session");
    setUser(null);
    setActiveTab("dashboard");
  };

  // Render current active screen inside Mobile bezel box container
  const renderScreen = () => {
    if (!user) {
      return (
        <Login 
          onLoginSuccess={handleLoginSuccess}
          userEmailPreference="khwahishseth@gmail.com"
        />
      );
    }

    if (!user.onboarded) {
      return (
        <Onboarding 
          user={user} 
          onOnboardComplete={handleOnboardComplete} 
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            user={user}
            waterGoal={user.dailyWaterGoalMl}
            todayWaterLogged={todayWaterLogged}
            habitsVersion={habitsVersion}
            sleepVersion={sleepVersion}
            onWaterLogged={handleDataSynced}
            onHabitsUpdated={handleDataSynced}
            onUserUpdated={handleUserUpdated}
          />
        );
      case "water":
        return (
          <WaterTracker
            user={user}
            onWaterUpdated={handleDataSynced}
            todayLogged={todayWaterLogged}
          />
        );
      case "habits":
        return (
          <HabitTracker
            user={user}
            habitsVersion={habitsVersion}
            onHabitsUpdated={handleDataSynced}
          />
        );
      case "sleep":
        return (
          <SleepTracker
            user={user}
            sleepVersion={sleepVersion}
            onSleepUpdated={handleDataSynced}
          />
        );
      case "coach":
        return (
          <VoiceAssistant
            user={user}
            onDataSynced={handleDataSynced}
          />
        );
      default:
        return (
          <div className="p-6 text-center text-slate-400">
            Screen template not found.
          </div>
        );
    }
  };

  return (
    <WebFrame
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
      onResetSession={handleResetSession}
    >
      {renderScreen()}
    </WebFrame>
  );
}
