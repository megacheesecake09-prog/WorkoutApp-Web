import React from 'react';
import { Play, SkipForward, Flame, Calendar, Dumbbell, Clock, ChevronRight, Award, Plus } from 'lucide-react';
import { Routine, WorkoutSession, UserPreferences, UserAccount } from '../types';
import { AdaptiveProgressionEngine } from '../services/adaptiveEngine';
import { storage } from '../services/storage';

interface HomeViewProps {
  routines: Routine[];
  completedWorkouts: WorkoutSession[];
  preferences: UserPreferences;
  currentUser: UserAccount;
  onStartWorkout: (routine: Routine) => void;
  onNavigateToWizard: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  routines,
  completedWorkouts,
  preferences,
  currentUser,
  onStartWorkout,
  onNavigateToWizard
}) => {
  const suggestedRoutine = AdaptiveProgressionEngine.getNextRoutineSuggestion(
    routines,
    completedWorkouts,
    preferences.scheduleSkipOffset
  );

  const handleSkipDay = () => {
    const nextOffset = preferences.scheduleSkipOffset + 1;
    storage.savePreferences({
      ...preferences,
      scheduleSkipOffset: nextOffset
    });
  };

  // Calculate quick stats
  const totalFinished = completedWorkouts.filter(w => !!w.endTime).length;
  const recentWorkouts = completedWorkouts.slice(0, 3);

  // Volume in last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeekWorkouts = completedWorkouts.filter(w => new Date(w.startTime).getTime() >= sevenDaysAgo);
  const thisWeekSets = thisWeekWorkouts.reduce((sum, w) => {
    return sum + w.exercises.reduce((exSum, ex) => exSum + ex.sets.filter(s => s.completed).length, 0);
  }, 0);

  return (
    <div className="space-y-6 pb-24 pt-2">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Ready to train, {currentUser.name.split(' ')[0]}?
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Active Split: <span className="text-blue-400 uppercase font-semibold">{preferences.activeSplit.replace('_', ' ')}</span>
          </p>
        </div>

        <button
          onClick={onNavigateToWizard}
          className="px-3 py-1.5 bg-[#181A20] hover:bg-white/10 active:scale-95 border border-[#272A34] rounded-xl text-xs font-semibold text-blue-400 transition"
        >
          Split Wizard
        </button>
      </div>

      {/* Main Today's Scheduled Workout Card */}
      {suggestedRoutine ? (
        <div className="bg-gradient-to-br from-[#181A20] via-[#1A1D24] to-[#121316] border border-blue-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={13} />
              Today's Scheduled Routine
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {suggestedRoutine.exercises.length} exercises
            </span>
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight mt-1 mb-1">
            {suggestedRoutine.name}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-1 mb-4">
            {suggestedRoutine.description}
          </p>

          {/* Exercises Preview Chips */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {suggestedRoutine.exercises.slice(0, 4).map((cfg, idx) => {
              const allEx = storage.getAllExercises();
              const ex = allEx.find(e => e.id === cfg.exerciseId);
              return (
                <span 
                  key={idx}
                  className="px-2.5 py-1 bg-[#121316]/80 border border-[#272A34] rounded-lg text-xs text-gray-300 font-medium"
                >
                  {ex?.name || 'Exercise'} ({cfg.targetSets}×{cfg.targetReps})
                </span>
              );
            })}
            {suggestedRoutine.exercises.length > 4 && (
              <span className="px-2 py-1 bg-white/5 rounded-lg text-xs text-gray-400">
                +{suggestedRoutine.exercises.length - 4} more
              </span>
            )}
          </div>

          {/* Action Buttons: Primary Start Workout + Skip Day Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onStartWorkout(suggestedRoutine)}
              className="flex-1 py-3.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2.5 transition"
            >
              <Play size={20} className="fill-white" />
              <span>Start Workout</span>
            </button>

            <button
              onClick={handleSkipDay}
              title="Skip this day (e.g. skip leg day) and advance to next rotation"
              className="py-3.5 px-4 bg-[#121316] hover:bg-white/10 active:scale-[0.98] border border-[#272A34] text-gray-300 hover:text-white font-semibold rounded-2xl transition flex items-center gap-1.5 text-xs"
            >
              <SkipForward size={16} />
              <span>Skip Day</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#181A20] border border-[#272A34] rounded-2xl p-6 text-center">
          <Dumbbell size={36} className="mx-auto text-blue-400 mb-2 opacity-80" />
          <h3 className="font-bold text-base text-white">No Routines Configured</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">Run the Split Setup Wizard to generate your training schedule.</p>
          <button
            onClick={onNavigateToWizard}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition"
          >
            Launch Setup Wizard
          </button>
        </div>
      )}

      {/* Week Overview Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#181A20] border border-[#272A34] rounded-2xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>This Week</span>
            <Flame size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{thisWeekWorkouts.length}</div>
          <p className="text-[11px] text-gray-400">{thisWeekSets} total sets completed</p>
        </div>

        <div className="bg-[#181A20] border border-[#272A34] rounded-2xl p-4">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Total Logged</span>
            <Award size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalFinished}</div>
          <p className="text-[11px] text-gray-400">All-time finished sessions</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-white">Recent Workouts</h3>
          <span className="text-xs text-gray-400">{totalFinished} completed</span>
        </div>

        {recentWorkouts.length > 0 ? (
          <div className="space-y-2">
            {recentWorkouts.map(w => {
              const dateStr = new Date(w.startTime).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              });
              const completedSetsCount = w.exercises.reduce(
                (sum, e) => sum + e.sets.filter(s => s.completed).length, 0
              );

              return (
                <div 
                  key={w.id} 
                  className="bg-[#181A20] border border-[#272A34] p-3.5 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                      <Dumbbell size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">{w.name}</h4>
                      <p className="text-xs text-gray-400">{dateStr} • {completedSetsCount} sets</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    Done
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-[#181A20] border border-[#272A34] rounded-2xl text-center text-xs text-gray-400">
            No workouts logged yet. Tap "Start Workout" above to smash your first session!
          </div>
        )}
      </div>
    </div>
  );
};
