export type MuscleGroup = 
  | 'CHEST' 
  | 'BACK' 
  | 'SHOULDERS' 
  | 'BICEPS' 
  | 'TRICEPS' 
  | 'QUADS' 
  | 'HAMSTRINGS' 
  | 'GLUTES' 
  | 'CALVES' 
  | 'ABS' 
  | 'FOREARMS';

export type Equipment = 
  | 'BARBELL' 
  | 'DUMBBELL' 
  | 'CABLE' 
  | 'MACHINE' 
  | 'SMITH_MACHINE' 
  | 'BODYWEIGHT' 
  | 'OTHER';

export type ThemeMode = 'dark' | 'light' | 'amoled';
export type WeightUnit = 'kg' | 'lbs';
export type SplitType = 'ppl' | 'arnold' | 'upper_lower' | 'full_body' | 'custom';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  defaultSets: number;
  defaultReps: number;
  notes?: string;
  isCustom?: boolean;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  completed: boolean;
  targetReps?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  order: number;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  routineId?: string;
  name: string;
  startTime: string; // ISO string
  endTime?: string;   // ISO string
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface RoutineExerciseConfig {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  startingWeightKg: number;
  order: number;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: RoutineExerciseConfig[];
  splitDayIndex?: number;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // Simple hash for local security
  createdAt: string;
  avatarColor: string;
  weightUnit: WeightUnit;
  theme: ThemeMode;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  fitnessGoal: 'hypertrophy' | 'strength' | 'endurance';
}

export interface UserPreferences {
  activeSplit: SplitType;
  scheduleSkipOffset: number;
  disabledExerciseIds: string[];
  availableEquipment: Equipment[];
  defaultRestSeconds: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  wakeLockEnabled: boolean;
  startingWeights: Record<string, number>; // exerciseId -> weightKg
}

export interface CoachRecommendation {
  suggestedWeightKg: number;
  suggestedReps: number;
  reasoning: string;
  rpeGuidance: string;
}
