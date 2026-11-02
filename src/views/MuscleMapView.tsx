import React from 'react';
import { BodyMap } from '../components/BodyMap';
import { MuscleGroup, WorkoutSession } from '../types';
import { AdaptiveProgressionEngine } from '../services/adaptiveEngine';
import { storage } from '../services/storage';

interface MuscleMapViewProps {
  completedWorkouts: WorkoutSession[];
}

export const MuscleMapView: React.FC<MuscleMapViewProps> = ({ completedWorkouts }) => {
  const allExercises = storage.getAllExercises();
  const recovery = AdaptiveProgressionEngine.getMuscleRecoveryStatus(completedWorkouts, allExercises);

  return (
    <div className="space-y-6 pb-24 pt-2">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Muscle Recovery Map</h2>
        <p className="text-xs text-gray-400">Real-time fatigue tracking & anatomical recovery</p>
      </div>

      {/* Anatomical 2D Vector Silhouette */}
      <BodyMap recovery={recovery} />

      {/* Muscle Breakdown Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-white">Muscle Status Breakdown</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {(Object.keys(recovery) as MuscleGroup[]).map(muscle => {
            const data = recovery[muscle];
            const isFresh = data.status === 'FRESH';
            const isRecov = data.status === 'RECOVERING';

            return (
              <div 
                key={muscle}
                className="bg-[#181A20] border border-[#272A34] p-3 rounded-xl flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-white">{muscle}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    isFresh ? 'bg-emerald-400' : isRecov ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>{data.hoursSince >= 900 ? 'Fresh' : `${data.hoursSince}h ago`}</span>
                  <span className={`font-semibold uppercase text-[10px] ${
                    isFresh ? 'text-emerald-400' : isRecov ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {data.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
