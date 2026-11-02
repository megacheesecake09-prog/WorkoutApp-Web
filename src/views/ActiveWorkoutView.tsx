import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, Clock, Sparkles, AlertCircle, ArrowLeft, ArrowRightLeft, Dumbbell } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WorkoutSession, WorkoutExercise, WorkoutSet, Exercise, UserPreferences, UserAccount } from '../types';
import { AdaptiveProgressionEngine } from '../services/adaptiveEngine';
import { storage } from '../services/storage';
import { RestTimerModal } from '../components/RestTimerModal';
import { wakeLock } from '../services/wakeLock';

interface ActiveWorkoutViewProps {
  workout: WorkoutSession;
  preferences: UserPreferences;
  currentUser: UserAccount;
  allExercises: Exercise[];
  onFinishWorkout: (finishedWorkout: WorkoutSession) => void;
  onCancelWorkout: () => void;
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutViewProps> = ({
  workout: initialWorkout,
  preferences,
  currentUser,
  allExercises,
  onFinishWorkout,
  onCancelWorkout
}) => {
  const [workout, setWorkout] = useState<WorkoutSession>(initialWorkout);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({}); // workoutExerciseId -> text
  const [restTimer, setRestTimer] = useState<{ open: boolean; seconds: number; note?: string }>({
    open: false,
    seconds: preferences.defaultRestSeconds
  });
  const [showSwapPickerForExId, setShowSwapPickerForExId] = useState<string | null>(null);

  // Screen Wake Lock
  useEffect(() => {
    if (preferences.wakeLockEnabled) {
      wakeLock.requestLock();
    }
    return () => {
      wakeLock.releaseLock();
    };
  }, [preferences.wakeLockEnabled]);

  // Elapsed Timer
  useEffect(() => {
    const startMs = new Date(workout.startTime).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startMs) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [workout.startTime]);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleToggleSet = (exIndex: number, setIndex: number) => {
    const ex = workout.exercises[exIndex];
    const targetSet = ex.sets[setIndex];
    const newCompleted = !targetSet.completed;

    const updatedSets = ex.sets.map((s, i) => i === setIndex ? { ...s, completed: newCompleted } : s);
    const updatedExercises = workout.exercises.map((e, i) => i === exIndex ? { ...e, sets: updatedSets } : e);
    setWorkout({ ...workout, exercises: updatedExercises });

    if (newCompleted) {
      // Evaluate performance immediately
      const targetReps = targetSet.targetReps || 10;
      const feedback = AdaptiveProgressionEngine.evaluateCurrentSet(targetSet.weightKg, targetSet.reps, targetReps);
      setFeedbacks(prev => ({ ...prev, [ex.id]: feedback }));

      // Adaptive rest calculation
      let adaptiveRest = preferences.defaultRestSeconds;
      let note: string | undefined = undefined;

      if (targetSet.reps < targetReps - 2) {
        adaptiveRest = Math.min(240, preferences.defaultRestSeconds + 30);
        note = `+30s Rest Added: Tough set! Extended recovery for next set.`;
      } else if (targetSet.reps >= targetReps + 3) {
        adaptiveRest = Math.max(45, preferences.defaultRestSeconds - 15);
        note = `-15s Rest: Crushed reps with high power! Ready to go sooner.`;
      }

      setRestTimer({
        open: true,
        seconds: adaptiveRest,
        note
      });
    }
  };

  const handleUpdateSetWeight = (exIndex: number, setIndex: number, weightKg: number) => {
    const updatedExercises = workout.exercises.map((e, i) => {
      if (i !== exIndex) return e;
      const updatedSets = e.sets.map((s, si) => si === setIndex ? { ...s, weightKg } : s);
      return { ...e, sets: updatedSets };
    });
    setWorkout({ ...workout, exercises: updatedExercises });
  };

  const handleUpdateSetReps = (exIndex: number, setIndex: number, reps: number) => {
    const updatedExercises = workout.exercises.map((e, i) => {
      if (i !== exIndex) return e;
      const updatedSets = e.sets.map((s, si) => si === setIndex ? { ...s, reps } : s);
      return { ...e, sets: updatedSets };
    });
    setWorkout({ ...workout, exercises: updatedExercises });
  };

  const handleAddSet = (exIndex: number) => {
    const ex = workout.exercises[exIndex];
    const lastSet = ex.sets[ex.sets.length - 1];
    const newSet: WorkoutSet = {
      id: 'set_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      setNumber: ex.sets.length + 1,
      weightKg: lastSet ? lastSet.weightKg : 20,
      reps: lastSet ? lastSet.reps : 10,
      completed: false,
      targetReps: lastSet?.targetReps || 10
    };

    const updatedExercises = workout.exercises.map((e, i) => 
      i === exIndex ? { ...e, sets: [...e.sets, newSet] } : e
    );
    setWorkout({ ...workout, exercises: updatedExercises });
  };

  const handleDeleteSet = (exIndex: number, setIndex: number) => {
    const ex = workout.exercises[exIndex];
    if (ex.sets.length <= 1) return; // Keep at least one set
    const filtered = ex.sets.filter((_, i) => i !== setIndex).map((s, idx) => ({ ...s, setNumber: idx + 1 }));
    const updatedExercises = workout.exercises.map((e, i) => 
      i === exIndex ? { ...e, sets: filtered } : e
    );
    setWorkout({ ...workout, exercises: updatedExercises });
  };

  const handleSwapExercise = (exIndex: number, newEx: Exercise) => {
    const updatedExercises = workout.exercises.map((e, i) => {
      if (i !== exIndex) return e;
      return {
        ...e,
        exerciseId: newEx.id,
        exerciseName: newEx.name,
        primaryMuscle: newEx.primaryMuscle
      };
    });
    setWorkout({ ...workout, exercises: updatedExercises });
    setShowSwapPickerForExId(null);
  };

  const handleFinish = () => {
    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    const finished: WorkoutSession = {
      ...workout,
      endTime: new Date().toISOString()
    };
    onFinishWorkout(finished);
  };

  // Unit conversion helper
  const unitMultiplier = currentUser.weightUnit === 'lbs' ? 2.20462 : 1;
  const unitLabel = currentUser.weightUnit;

  return (
    <div className="space-y-5 pb-36 pt-2">
      {/* Top Session Bar */}
      <div className="bg-[#181A20] border border-[#272A34] rounded-2xl p-4 flex items-center justify-between sticky top-16 z-20 backdrop-blur-md">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            In Progress
          </span>
          <h2 className="text-base font-extrabold text-white truncate max-w-[180px]">
            {workout.name}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Elapsed Timer */}
          <div className="flex items-center gap-1 text-sm font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-xl">
            <Clock size={14} />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>

          <button
            onClick={handleFinish}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
          >
            <Check size={16} />
            <span>Finish</span>
          </button>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {workout.exercises.map((ex, exIdx) => {
          const pastHistory = storage.getCompletedWorkouts();
          const rec = AdaptiveProgressionEngine.predictNextSession(ex.exerciseId, pastHistory, 10, 20);
          const feedback = feedbacks[ex.id];

          return (
            <div key={ex.id} className="bg-[#181A20] border border-[#272A34] rounded-2xl overflow-hidden shadow-lg">
              {/* Exercise Header */}
              <div className="p-4 bg-[#14151B] border-b border-[#272A34] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{ex.exerciseName}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 font-semibold uppercase">
                    {ex.primaryMuscle}
                  </span>
                </div>

                {/* Substitute / Swap Button */}
                <button
                  onClick={() => setShowSwapPickerForExId(ex.id)}
                  title="Swap with an alternative exercise"
                  className="px-2.5 py-1 bg-[#1A1D24] hover:bg-white/10 active:scale-95 border border-[#272A34] rounded-lg text-xs text-gray-300 font-medium flex items-center gap-1"
                >
                  <ArrowRightLeft size={13} />
                  <span>Swap</span>
                </button>
              </div>

              {/* Coach Recommendation Bar */}
              <div className="px-4 py-2 bg-blue-500/5 border-b border-blue-500/15 flex items-center gap-2 text-xs">
                <Sparkles size={14} className="text-blue-400 shrink-0" />
                <span className="text-gray-300">
                  Target: <strong className="text-white">{rec.suggestedWeightKg}kg × {rec.suggestedReps} reps</strong> ({rec.rpeGuidance})
                </span>
              </div>

              {/* Live Feedback Toast */}
              {feedback && (
                <div className="mx-4 my-2 p-2.5 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-xl text-xs text-blue-200 animate-fade-in flex items-start gap-2">
                  <Sparkles size={14} className="text-blue-400 mt-0.5 shrink-0" />
                  <span>{feedback}</span>
                </div>
              )}

              {/* Sets Table */}
              <div className="p-4">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                  <div className="col-span-2">Set</div>
                  <div className="col-span-4">Weight ({unitLabel})</div>
                  <div className="col-span-4">Reps</div>
                  <div className="col-span-2 text-center">Done</div>
                </div>

                <div className="space-y-2">
                  {ex.sets.map((set, setIdx) => {
                    const isChecked = set.completed;
                    return (
                      <div 
                        key={set.id}
                        className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition ${
                          isChecked ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-[#121316] border border-[#272A34]'
                        }`}
                      >
                        {/* Set Number */}
                        <div className="col-span-2 font-bold text-xs text-gray-300 flex items-center gap-1">
                          <span>{set.setNumber}</span>
                          {ex.sets.length > 1 && (
                            <button
                              onClick={() => handleDeleteSet(exIdx, setIdx)}
                              className="text-gray-500 hover:text-red-400 p-0.5"
                              title="Delete set"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>

                        {/* Weight Input */}
                        <div className="col-span-4">
                          <input
                            type="number"
                            step="0.5"
                            value={set.weightKg}
                            onChange={e => handleUpdateSetWeight(exIdx, setIdx, parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 bg-[#181A20] border border-[#272A34] rounded-lg text-sm font-semibold text-center text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Reps Input */}
                        <div className="col-span-4">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={e => handleUpdateSetReps(exIdx, setIdx, parseInt(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 bg-[#181A20] border border-[#272A34] rounded-lg text-sm font-semibold text-center text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Checkmark Button */}
                        <div className="col-span-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSet(exIdx, setIdx)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-90 ${
                              isChecked 
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                                : 'bg-[#272A34] text-gray-400 hover:text-white'
                            }`}
                          >
                            <Check size={18} strokeWidth={isChecked ? 3 : 2} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Set Button */}
                <button
                  type="button"
                  onClick={() => handleAddSet(exIdx)}
                  className="w-full mt-3 py-2 bg-[#14151B] hover:bg-white/5 active:scale-98 border border-[#272A34] rounded-xl text-xs font-semibold text-gray-300 transition flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Set</span>
                </button>
              </div>

              {/* Exercise Swap Picker Modal */}
              {showSwapPickerForExId === ex.id && (
                <div className="p-4 bg-[#121316] border-t border-[#272A34]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Swap with Exercise</span>
                    <button 
                      onClick={() => setShowSwapPickerForExId(null)}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {allExercises
                      .filter(ae => ae.primaryMuscle === ex.primaryMuscle && ae.id !== ex.exerciseId)
                      .map(ae => (
                        <button
                          key={ae.id}
                          onClick={() => handleSwapExercise(exIdx, ae)}
                          className="w-full p-2 rounded-lg bg-[#181A20] hover:bg-white/10 text-left text-xs font-medium text-white flex items-center justify-between"
                        >
                          <span>{ae.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase">{ae.equipment}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cancel Workout button */}
      <div className="pt-2 text-center">
        <button
          onClick={onCancelWorkout}
          className="text-xs text-red-400 hover:text-red-300 underline"
        >
          Discard Workout Session
        </button>
      </div>

      {/* Adaptive Rest Timer Modal */}
      <RestTimerModal
        isOpen={restTimer.open}
        initialSeconds={restTimer.seconds}
        onClose={() => setRestTimer({ ...restTimer, open: false })}
        soundEnabled={preferences.soundEnabled}
        adaptiveNote={restTimer.note}
      />
    </div>
  );
};
