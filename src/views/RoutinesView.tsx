import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Wand2, Check, ArrowRight, ShieldAlert, Sparkles, X, Dumbbell } from 'lucide-react';
import { Routine, RoutineExerciseConfig, Exercise, Equipment, SplitType, UserPreferences } from '../types';
import { storage } from '../services/storage';
import { createSplitRoutines } from '../data/splitTemplates';

interface RoutinesViewProps {
  routines: Routine[];
  allExercises: Exercise[];
  preferences: UserPreferences;
  onStartWorkout: (routine: Routine) => void;
  onRefreshRoutines: () => void;
}

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  routines,
  allExercises,
  preferences,
  onStartWorkout,
  onRefreshRoutines
}) => {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard State
  const [selectedSplit, setSelectedSplit] = useState<SplitType>(preferences.activeSplit);
  const [blockedIds, setBlockedIds] = useState<string[]>(preferences.disabledExerciseIds);
  const [startingWeights, setStartingWeights] = useState<Record<string, number>>(preferences.startingWeights || {});

  const handleOpenWizard = () => {
    setSelectedSplit(preferences.activeSplit);
    setBlockedIds(preferences.disabledExerciseIds);
    setStartingWeights(preferences.startingWeights || {});
    setWizardStep(1);
    setShowWizard(true);
  };

  const handleFinishWizard = () => {
    // Generate fresh routines according to rules & blacklist substitutions
    const newRoutines = createSplitRoutines(
      selectedSplit,
      blockedIds,
      preferences.availableEquipment,
      startingWeights,
      allExercises
    );

    // Save preferences
    storage.savePreferences({
      ...preferences,
      activeSplit: selectedSplit,
      disabledExerciseIds: blockedIds,
      startingWeights: startingWeights,
      scheduleSkipOffset: 0 // Reset schedule rotation cleanly
    });

    // Save routines
    storage.saveRoutines(newRoutines);
    setShowWizard(false);
    onRefreshRoutines();
  };

  const handleDeleteRoutine = (id: string) => {
    if (confirm('Are you sure you want to delete this routine?')) {
      const updated = routines.filter(r => r.id !== id);
      storage.saveRoutines(updated);
      onRefreshRoutines();
    }
  };

  const toggleBlockExercise = (exId: string) => {
    if (blockedIds.includes(exId)) {
      setBlockedIds(blockedIds.filter(id => id !== exId));
    } else {
      setBlockedIds([...blockedIds, exId]);
    }
  };

  return (
    <div className="space-y-6 pb-24 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Workout Routines</h2>
          <p className="text-xs text-gray-400">Manage and customize your training schedule</p>
        </div>

        <button
          onClick={handleOpenWizard}
          className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition flex items-center gap-1.5"
        >
          <Wand2 size={15} />
          <span>Setup Wizard</span>
        </button>
      </div>

      {/* Routines List */}
      <div className="space-y-3">
        {routines.map((routine, rIdx) => (
          <div 
            key={routine.id}
            className="bg-[#181A20] border border-[#272A34] rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Day {rIdx + 1} in Rotation
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{routine.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{routine.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteRoutine(routine.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
                  title="Delete routine"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Exercises table */}
            <div className="mt-4 pt-3 border-t border-[#272A34] space-y-1.5">
              {routine.exercises.map((cfg, exIdx) => {
                const ex = allExercises.find(e => e.id === cfg.exerciseId);
                return (
                  <div 
                    key={exIdx}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#121316]"
                  >
                    <span className="font-medium text-gray-200">{ex?.name || 'Exercise'}</span>
                    <span className="text-gray-400 font-mono">
                      {cfg.targetSets} sets × {cfg.targetReps} reps {cfg.startingWeightKg > 0 ? `@ ${cfg.startingWeightKg}kg` : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Start Button */}
            <button
              onClick={() => onStartWorkout(routine)}
              className="w-full mt-4 py-2.5 bg-[#121316] hover:bg-blue-600/20 active:scale-[0.98] border border-blue-500/30 text-blue-400 hover:text-blue-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
            >
              <Dumbbell size={15} />
              <span>Start This Workout Now</span>
            </button>
          </div>
        ))}
      </div>

      {/* Split Setup Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#181A20] border border-[#272A34] rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#272A34]">
              <div className="flex items-center gap-2">
                <Wand2 size={20} className="text-blue-400" />
                <h3 className="font-extrabold text-base">Split Setup Wizard</h3>
              </div>
              <button 
                onClick={() => setShowWizard(false)} 
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Wizard Steps indicator */}
            <div className="flex items-center justify-between my-4 text-xs font-bold text-gray-400">
              <span className={wizardStep === 1 ? 'text-blue-400' : ''}>1. Split</span>
              <span>→</span>
              <span className={wizardStep === 2 ? 'text-blue-400' : ''}>2. Block Exercises</span>
              <span>→</span>
              <span className={wizardStep === 3 ? 'text-blue-400' : ''}>3. Starting Weights</span>
            </div>

            {/* STEP 1: Select Split */}
            {wizardStep === 1 && (
              <div className="space-y-4 py-2">
                <h4 className="text-sm font-bold text-white">Choose Your Training Split</h4>
                <div className="space-y-2.5">
                  {[
                    { id: 'arnold' as SplitType, title: 'Arnold Split', desc: 'Chest & Back, Shoulders & Arms, Legs (Antagonistic super-growth)' },
                    { id: 'ppl' as SplitType, title: 'Push / Pull / Legs (PPL)', desc: 'Standard 3-day push, pull, lower pattern' },
                    { id: 'upper_lower' as SplitType, title: 'Upper / Lower', desc: '4-day power and hypertrophy' },
                    { id: 'full_body' as SplitType, title: 'Full Body (A / B)', desc: 'Full body compound stimulation 3x per week' },
                  ].map(split => (
                    <button
                      key={split.id}
                      onClick={() => setSelectedSplit(split.id)}
                      className={`w-full p-4 rounded-xl border text-left transition ${
                        selectedSplit === split.id
                          ? 'bg-blue-600/20 border-blue-500 shadow-md'
                          : 'bg-[#121316] border-[#272A34] hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{split.title}</span>
                        {selectedSplit === split.id && <Check size={18} className="text-blue-400" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{split.desc}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setWizardStep(2)}
                  className="w-full mt-4 py-3 bg-[#007AFF] hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
                >
                  <span>Next: Block Exercises</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* STEP 2: Block Exercises & Substitutions */}
            {wizardStep === 2 && (
              <div className="space-y-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-white">Block Exercises Your Gym Doesn't Have</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    e.g. Block <strong>Cable Fly</strong> or <strong>Barbell Squat</strong>. The wizard will automatically substitute with <strong>Pec Deck / Butterfly Machine</strong> or <strong>Smith Machine Squat</strong>!
                  </p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {allExercises.map(ex => {
                    const isBlocked = blockedIds.includes(ex.id);
                    return (
                      <button
                        key={ex.id}
                        onClick={() => toggleBlockExercise(ex.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                          isBlocked 
                            ? 'bg-red-500/15 border-red-500/40 text-red-200' 
                            : 'bg-[#121316] border-[#272A34] text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <div>
                          <span className="font-semibold">{ex.name}</span>
                          <span className="text-[10px] text-gray-400 block">{ex.primaryMuscle} • {ex.equipment}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          isBlocked ? 'bg-red-500 text-white' : 'bg-[#272A34] text-gray-400'
                        }`}>
                          {isBlocked ? 'BLOCKED' : 'ENABLED'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl text-sm transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="flex-1 py-3 bg-[#007AFF] hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
                  >
                    <span>Next: Set Starting Weights</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Starting Weights Setup */}
            {wizardStep === 3 && (
              <div className="space-y-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-white">Enter Your Starting Weights</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Pre-populate the exercises so your routines open ready with your working weights.
                  </p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {allExercises.slice(0, 10).map(ex => (
                    <div 
                      key={ex.id}
                      className="p-2.5 rounded-xl bg-[#121316] border border-[#272A34] flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-gray-200">{ex.name}</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="2.5"
                          placeholder="20"
                          value={startingWeights[ex.id] || ''}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setStartingWeights({ ...startingWeights, [ex.id]: val });
                          }}
                          className="w-16 px-2 py-1 bg-[#181A20] border border-[#272A34] rounded-lg text-center font-bold text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-gray-400 font-semibold">kg</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl text-sm transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinishWizard}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    <span>Apply & Save Split</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
