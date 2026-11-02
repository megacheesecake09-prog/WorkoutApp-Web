import React, { useState } from 'react';
import { TrendingUp, Award, Calendar, Trash2, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkoutSession, UserAccount } from '../types';
import { AdaptiveProgressionEngine } from '../services/adaptiveEngine';
import { storage } from '../services/storage';

interface AnalyticsViewProps {
  completedWorkouts: WorkoutSession[];
  currentUser: UserAccount;
  onRefresh: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  completedWorkouts,
  currentUser,
  onRefresh
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Bench, Squat, Lat Pulldown 1RM estimates
  const getBest1RM = (exerciseKeyword: string) => {
    let max = 0;
    completedWorkouts.forEach(w => {
      w.exercises.forEach(e => {
        if (e.exerciseName.toLowerCase().includes(exerciseKeyword.toLowerCase())) {
          e.sets.forEach(s => {
            if (s.completed && s.reps > 0 && s.weightKg > 0) {
              const est = AdaptiveProgressionEngine.calculateOneRepMax(s.weightKg, s.reps);
              if (est > max) max = est;
            }
          });
        }
      });
    });
    return max;
  };

  const bestBench = getBest1RM('bench');
  const bestSquat = getBest1RM('squat');
  const bestPulldown = getBest1RM('pulldown') || getBest1RM('pull-up');

  const handleDelete = (id: string) => {
    if (confirm('Delete this workout log?')) {
      storage.deleteWorkout(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 pb-24 pt-2">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Strength & History</h2>
        <p className="text-xs text-gray-400">Progression analytics & past workout logs</p>
      </div>

      {/* Strength PR Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#181A20] border border-[#272A34] p-3.5 rounded-2xl text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bench PR</p>
          <div className="text-xl font-black text-white mt-1">
            {bestBench > 0 ? `${bestBench}kg` : '—'}
          </div>
          <span className="text-[10px] text-blue-400 font-semibold">Est. 1RM</span>
        </div>

        <div className="bg-[#181A20] border border-[#272A34] p-3.5 rounded-2xl text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Squat PR</p>
          <div className="text-xl font-black text-white mt-1">
            {bestSquat > 0 ? `${bestSquat}kg` : '—'}
          </div>
          <span className="text-[10px] text-blue-400 font-semibold">Est. 1RM</span>
        </div>

        <div className="bg-[#181A20] border border-[#272A34] p-3.5 rounded-2xl text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Back PR</p>
          <div className="text-xl font-black text-white mt-1">
            {bestPulldown > 0 ? `${bestPulldown}kg` : '—'}
          </div>
          <span className="text-[10px] text-blue-400 font-semibold">Est. 1RM</span>
        </div>
      </div>

      {/* Workout History List */}
      <div>
        <h3 className="font-bold text-sm text-white mb-3">Completed Workouts History</h3>
        {completedWorkouts.length > 0 ? (
          <div className="space-y-2.5">
            {completedWorkouts.map(w => {
              const isExpanded = expandedId === w.id;
              const dateStr = new Date(w.startTime).toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              const totalSets = w.exercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0);

              return (
                <div 
                  key={w.id}
                  className="bg-[#181A20] border border-[#272A34] rounded-2xl overflow-hidden shadow-md"
                >
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : w.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white">{w.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{dateStr} • {totalSets} sets completed</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(w.id);
                        }}
                        className="p-1 text-gray-500 hover:text-red-400 transition"
                        title="Delete workout"
                      >
                        <Trash2 size={16} />
                      </button>
                      {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded Exercises & Sets */}
                  {isExpanded && (
                    <div className="p-4 bg-[#121316] border-t border-[#272A34] space-y-3 animate-fade-in">
                      {w.exercises.map((ex, eIdx) => (
                        <div key={eIdx} className="space-y-1">
                          <p className="text-xs font-bold text-gray-200">{ex.exerciseName}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ex.sets.map((s, sIdx) => (
                              <span 
                                key={sIdx}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                                  s.completed ? 'bg-[#181A20] text-emerald-400 border border-emerald-500/30' : 'bg-[#181A20] text-gray-500'
                                }`}
                              >
                                S{s.setNumber}: {s.weightKg}kg × {s.reps}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-[#181A20] border border-[#272A34] rounded-2xl text-center text-xs text-gray-400">
            No completed workouts yet. As you complete workouts, your history and progressive overload graphs will appear here!
          </div>
        )}
      </div>
    </div>
  );
};
