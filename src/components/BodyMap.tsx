import React, { useState } from 'react';
import { MuscleGroup } from '../types';
import { Activity, Clock, Dumbbell, X } from 'lucide-react';
import { DEFAULT_EXERCISES } from '../data/defaultExercises';

interface BodyMapProps {
  recovery: Record<MuscleGroup, { hoursSince: number; status: 'FRESH' | 'RECOVERING' | 'FATIGUED' }>;
}

export const BodyMap: React.FC<BodyMapProps> = ({ recovery }) => {
  const [view, setView] = useState<'FRONT' | 'BACK'>('FRONT');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

  const getStatusColor = (muscle: MuscleGroup) => {
    const stat = recovery[muscle]?.status || 'FRESH';
    switch (stat) {
      case 'FATIGUED': return '#EF4444'; // Red
      case 'RECOVERING': return '#F59E0B'; // Orange/Yellow
      case 'FRESH':
      default:
        return '#10B981'; // Green
    }
  };

  const selectedInfo = selectedMuscle ? recovery[selectedMuscle] : null;
  const targetExercises = selectedMuscle 
    ? DEFAULT_EXERCISES.filter(e => e.primaryMuscle === selectedMuscle)
    : [];

  return (
    <div className="bg-[#181A20] border border-[#272A34] rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Activity size={18} className="text-blue-400" />
            Muscle Recovery Intelligence
          </h3>
          <p className="text-xs text-gray-400">Tap any muscle group to view recovery & exercises</p>
        </div>

        {/* Front / Back Toggle */}
        <div className="flex bg-[#121316] p-1 rounded-xl border border-[#272A34]">
          <button
            onClick={() => setView('FRONT')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              view === 'FRONT' ? 'bg-[#007AFF] text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setView('BACK')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              view === 'BACK' ? 'bg-[#007AFF] text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Back
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 my-2 py-2 bg-[#121316]/60 rounded-xl text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span className="text-gray-300">Ready / Fresh (&gt;60h)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          <span className="text-gray-300">Recovering (24–60h)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
          <span className="text-gray-300">Fatigued (&lt;24h)</span>
        </div>
      </div>

      {/* Interactive Silhouette */}
      <div className="relative flex justify-center py-4">
        <svg 
          viewBox="0 0 300 420" 
          className="w-full max-w-[280px] h-auto drop-shadow-lg cursor-pointer"
        >
          {/* Base Head */}
          <circle cx="150" cy="40" r="22" fill="#2A2E3D" />

          {view === 'FRONT' ? (
            <g id="front-body">
              {/* Shoulders / Delts */}
              <path
                d="M 100 75 Q 120 70 135 72 L 135 88 Q 115 95 95 85 Z"
                fill={getStatusColor('SHOULDERS')}
                onClick={() => setSelectedMuscle('SHOULDERS')}
                className="hover:opacity-80 transition cursor-pointer"
              />
              <path
                d="M 200 75 Q 180 70 165 72 L 165 88 Q 185 95 205 85 Z"
                fill={getStatusColor('SHOULDERS')}
                onClick={() => setSelectedMuscle('SHOULDERS')}
                className="hover:opacity-80 transition cursor-pointer"
              />

              {/* Chest (Pecs) */}
              <path
                d="M 115 85 Q 150 82 150 115 Q 125 125 110 105 Z"
                fill={getStatusColor('CHEST')}
                onClick={() => setSelectedMuscle('CHEST')}
                className="hover:opacity-80 transition cursor-pointer"
              />
              <path
                d="M 185 85 Q 150 82 150 115 Q 175 125 190 105 Z"
                fill={getStatusColor('CHEST')}
                onClick={() => setSelectedMuscle('CHEST')}
                className="hover:opacity-80 transition cursor-pointer"
              />

              {/* Biceps */}
              <rect
                x="85" y="95" width="20" height="42" rx="10"
                fill={getStatusColor('BICEPS')}
                onClick={() => setSelectedMuscle('BICEPS')}
                className="hover:opacity-80 transition cursor-pointer"
              />
              <rect
                x="195" y="95" width="20" height="42" rx="10"
                fill={getStatusColor('BICEPS')}
                onClick={() => setSelectedMuscle('BICEPS')}
                className="hover:opacity-80 transition cursor-pointer"
              />

              {/* Forearms */}
              <rect
                x="80" y="145" width="18" height="48" rx="8"
                fill={getStatusColor('FOREARMS')}
                onClick={() => setSelectedMuscle('FOREARMS')}
                className="hover:opacity-80 transition cursor-pointer"
              />
              <rect
                x="202" y="145" width="18" height="48" rx="8"
                fill={getStatusColor('FOREARMS')}
                onClick={() => setSelectedMuscle('FOREARMS')}
                className="hover:opacity-80 transition cursor-pointer"
              />

              {/* Abs / Core */}
              <rect
                x="132" y="122" width="36" height="58" rx="6"
                fill={getStatusColor('ABS')}
                onClick={() => setSelectedMuscle('ABS')}
                className="hover:opacity-80 transition cursor-pointer"
              />

              {/* Quads */}
              <path
                d="M 115 190 Q 146 190 146 270 Q 120 280 110 210 Z"
                fill={getStatusColor('QUADS')}
                onClick={() => setSelectedMuscle('QUADS')}
                className="hover:opacity-80 transition cursor-pointer"
              />
              <path
                d="M 185 190 Q 154 190 154 270 Q 180 280 190 210 Z"
                fill={getStatusColor('QUADS')}
                onClick={() => setSelectedMuscle('QUADS')}
                className="hover:opacity-80 transition cursor-pointer"
              />

              {/* Calves (Front Shin/Calf) */}
              <rect
                x="116" y="295" width="24" height="65" rx="10"
                fill={getStatusColor('CALVES')}
                onClick={() => setSelectedMuscle('CALVES')}
                className="hover:opacity-80 transition cursor-pointer"
              />
              <rect
                x="160" y="295" width="24" height="65" rx="10"
                fill={getStatusColor('CALVES')}
                onClick={() => setSelectedMuscle('CALVES')}
                className="hover:opacity-80 transition cursor-pointer"
              />
            </g>
          ) : (
            <g id="back-body">
              {/* Rear Delts & Upper Traps / Back */}
              <path
                d="M 105 75 Q 150 70 195 75 L 180 140 Q 150 148 120 140 Z"
                fill={getStatusColor('BACK')}
                onClick={() => setSelectedMuscle('BACK')}
                className="hover:opacity-80 transition cursor-pointer"
              />

              {/* Triceps */}
              <rect
                x="85" y="95" width="20" height="44" rx="10"
                fill={getStatusColor('TRICEPS')}
                onClick={() => setSelectedMuscle('TRICEPS')}
                className="hover:opacity-80 transition cursor-pointer"
              />
              <rect
                x="195" y="95" width="20" height="44" rx="10"
                fill={getStatusColor('TRICEPS')}
                onClick={() => setSelectedMuscle('TRICEPS')}
                className="hover:opacity-80 transition cursor-pointer"
              />

              {/* Glutes */}
              <path
                d="M 115 178 Q 150 174 150 205 Q 120 215 110 195 Z"
                fill={getStatusColor('GLUTES')}
                onClick={() => setSelectedMuscle('GLUTES')}
                className="hover:opacity-80 transition cursor-pointer"
              />
              <path
                d="M 185 178 Q 150 174 150 205 Q 180 215 190 195 Z"
                fill={getStatusColor('GLUTES')}
                onClick={() => setSelectedMuscle('GLUTES')}
                className="hover:opacity-80 transition cursor-pointer"
              />

              {/* Hamstrings */}
              <path
                d="M 116 210 Q 146 210 146 275 Q 120 280 114 220 Z"
                fill={getStatusColor('HAMSTRINGS')}
                onClick={() => setSelectedMuscle('HAMSTRINGS')}
                className="hover:opacity-80 transition cursor-pointer"
              />
              <path
                d="M 184 210 Q 154 210 154 275 Q 180 280 186 220 Z"
                fill={getStatusColor('HAMSTRINGS')}
                onClick={() => setSelectedMuscle('HAMSTRINGS')}
                className="hover:opacity-80 transition cursor-pointer"
              />

              {/* Calves (Gastrocnemius) */}
              <rect
                x="114" y="295" width="26" height="65" rx="12"
                fill={getStatusColor('CALVES')}
                onClick={() => setSelectedMuscle('CALVES')}
                className="hover:opacity-80 transition cursor-pointer"
              />
              <rect
                x="160" y="295" width="26" height="65" rx="12"
                fill={getStatusColor('CALVES')}
                onClick={() => setSelectedMuscle('CALVES')}
                className="hover:opacity-80 transition cursor-pointer"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Selected Muscle Group Detail Modal / Drawer */}
      {selectedMuscle && selectedInfo && (
        <div className="mt-4 p-4 bg-[#121316] border border-[#272A34] rounded-xl text-left animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#272A34]">
            <div className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getStatusColor(selectedMuscle) }} 
              />
              <h4 className="font-bold text-sm text-white">{selectedMuscle}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                selectedInfo.status === 'FRESH' ? 'bg-emerald-500/20 text-emerald-400' :
                selectedInfo.status === 'RECOVERING' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {selectedInfo.status}
              </span>
            </div>
            <button 
              onClick={() => setSelectedMuscle(null)} 
              className="text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-blue-400" />
              Last Trained:
            </span>
            <span className="text-white font-medium">
              {selectedInfo.hoursSince >= 900 ? 'Not trained yet' : `${selectedInfo.hoursSince} hours ago`}
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
              <Dumbbell size={14} className="text-blue-400" />
              Top Exercises in Your Library:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {targetExercises.map(ex => (
                <span 
                  key={ex.id}
                  className="px-2.5 py-1 bg-[#181A20] border border-[#272A34] rounded-lg text-xs text-gray-200"
                >
                  {ex.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
