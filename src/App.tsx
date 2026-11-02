import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { AuthModal } from './components/AuthModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';

import { HomeView } from './views/HomeView';
import { ActiveWorkoutView } from './views/ActiveWorkoutView';
import { RoutinesView } from './views/RoutinesView';
import { MuscleMapView } from './views/MuscleMapView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';

import { storage } from './services/storage';
import { Routine, WorkoutSession, WorkoutExercise } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(storage.getCurrentUser());
  const [preferences, setPreferences] = useState(storage.getPreferences());
  const [routines, setRoutines] = useState(storage.getRoutines());
  const [completedWorkouts, setCompletedWorkouts] = useState(storage.getCompletedWorkouts());
  const [allExercises, setAllExercises] = useState(storage.getAllExercises());

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync state when storage changes
  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setCurrentUser(storage.getCurrentUser());
      setPreferences(storage.getPreferences());
      setRoutines(storage.getRoutines());
      setCompletedWorkouts(storage.getCompletedWorkouts());
      setAllExercises(storage.getAllExercises());
    });
    return unsub;
  }, []);

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    if (currentUser.theme === 'light') {
      root.classList.remove('dark');
      root.style.backgroundColor = '#F2F2F7';
    } else if (currentUser.theme === 'amoled') {
      root.classList.add('dark');
      root.style.backgroundColor = '#000000';
    } else {
      root.classList.add('dark');
      root.style.backgroundColor = '#0D0E11';
    }
  }, [currentUser.theme]);

  // Start workout from a routine
  const handleStartWorkout = (routine: Routine) => {
    const exercises: WorkoutExercise[] = routine.exercises.map((cfg, idx) => {
      const ex = allExercises.find(e => e.id === cfg.exerciseId);
      const startWeight = cfg.startingWeightKg || preferences.startingWeights[cfg.exerciseId] || 20;

      const sets = Array.from({ length: cfg.targetSets }, (_, sIdx) => ({
        id: `set_${idx}_${sIdx}_${Date.now()}`,
        setNumber: sIdx + 1,
        weightKg: startWeight,
        reps: cfg.targetReps,
        completed: false,
        targetReps: cfg.targetReps
      }));

      return {
        id: `we_${idx}_${Date.now()}`,
        exerciseId: cfg.exerciseId,
        exerciseName: ex?.name || 'Exercise',
        primaryMuscle: ex?.primaryMuscle || 'CHEST',
        order: idx,
        sets
      };
    });

    const session: WorkoutSession = {
      id: 'ws_' + Date.now().toString(36),
      routineId: routine.id,
      name: routine.name,
      startTime: new Date().toISOString(),
      exercises
    };

    setActiveWorkout(session);
    setCurrentTab('home');
  };

  // Finish workout session
  const handleFinishWorkout = (finishedWorkout: WorkoutSession) => {
    storage.saveCompletedWorkout(finishedWorkout);
    setActiveWorkout(null);
    setCurrentTab('home');
  };

  // Calculate workout streak
  const calculateStreak = () => {
    const finished = completedWorkouts.filter(w => !!w.endTime);
    if (finished.length === 0) return 0;
    // Simple streak: unique days with a workout in the last 14 days
    const daysSet = new Set(finished.map(w => new Date(w.startTime).toDateString()));
    return daysSet.size;
  };

  const streakDays = calculateStreak();

  return (
    <div className={`min-h-screen text-white font-sans ${
      currentUser.theme === 'amoled' ? 'bg-black' : currentUser.theme === 'light' ? 'bg-[#F2F2F7] text-gray-900' : 'bg-[#0D0E11]'
    }`}>
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        streakDays={streakDays}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-3">
        {activeWorkout ? (
          <ActiveWorkoutView
            workout={activeWorkout}
            preferences={preferences}
            currentUser={currentUser}
            allExercises={allExercises}
            onFinishWorkout={handleFinishWorkout}
            onCancelWorkout={() => setActiveWorkout(null)}
          />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeView
                routines={routines}
                completedWorkouts={completedWorkouts}
                preferences={preferences}
                currentUser={currentUser}
                onStartWorkout={handleStartWorkout}
                onNavigateToWizard={() => setCurrentTab('routines')}
              />
            )}
            {currentTab === 'routines' && (
              <RoutinesView
                routines={routines}
                allExercises={allExercises}
                preferences={preferences}
                onStartWorkout={handleStartWorkout}
                onRefreshRoutines={() => {
                  setRoutines(storage.getRoutines());
                  setPreferences(storage.getPreferences());
                }}
              />
            )}
            {currentTab === 'muscles' && (
              <MuscleMapView
                completedWorkouts={completedWorkouts}
              />
            )}
            {currentTab === 'analytics' && (
              <AnalyticsView
                completedWorkouts={completedWorkouts}
                currentUser={currentUser}
                onRefresh={() => setCompletedWorkouts(storage.getCompletedWorkouts())}
              />
            )}
            {currentTab === 'settings' && (
              <SettingsView
                currentUser={currentUser}
                preferences={preferences}
                allExercises={allExercises}
                onOpenAuth={() => setShowAuthModal(true)}
                onRefresh={() => {
                  setCurrentUser(storage.getCurrentUser());
                  setPreferences(storage.getPreferences());
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Tab Bar (hidden when actively working out) */}
      {!activeWorkout && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeWorkoutRunning={!!activeWorkout}
        />
      )}

      {/* User Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
      />

      {/* iOS Safari "Add to Home Screen" Banner */}
      <PwaInstallBanner />
    </div>
  );
};
