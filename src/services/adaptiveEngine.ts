import { WorkoutSession, CoachRecommendation, MuscleGroup, Routine } from '../types';

export class AdaptiveProgressionEngine {
  /**
   * Evaluates set performance immediately as a lifter checks off a set
   */
  static evaluateCurrentSet(weightKg: number, reps: number, targetReps: number = 10): string {
    const diff = reps - targetReps;
    if (diff >= 3) {
      return '🚀 Outstanding power! Crushed target by +3+ reps. Recommended +2.5kg next session.';
    } else if (diff >= 1) {
      return '💪 Strong set! Beat target rep count. On track for progressive overload.';
    } else if (diff === 0) {
      return '🎯 Perfect execution! Hit exact rep target cleanly.';
    } else if (diff >= -2) {
      return '⚠️ Good grind. Slightly below rep goal — hold weight and aim for full reps next time.';
    } else {
      return '🛑 Tough set / high fatigue. Recommend +30s rest before next set. Consider lowering weight.';
    }
  }

  /**
   * Predicts next session's target weight & reps based on previous session performance
   */
  static predictNextSession(
    exerciseId: string,
    history: WorkoutSession[],
    defaultReps: number = 10,
    startingWeight: number = 20
  ): CoachRecommendation {
    // Find past sets for this exercise across completed sessions
    const pastSets: { weight: number; reps: number; completed: boolean }[] = [];

    for (const session of history) {
      const match = session.exercises.find(e => e.exerciseId === exerciseId);
      if (match && match.sets.length > 0) {
        match.sets.forEach(s => {
          if (s.completed && s.reps > 0) {
            pastSets.push({ weight: s.weightKg, reps: s.reps, completed: true });
          }
        });
        if (pastSets.length > 0) break; // Look at most recent completed workout
      }
    }

    if (pastSets.length === 0) {
      return {
        suggestedWeightKg: startingWeight,
        suggestedReps: defaultReps,
        reasoning: 'Starting baseline weight for this exercise.',
        rpeGuidance: 'Aim for RPE 7-8 (leave 2-3 reps in reserve)'
      };
    }

    const avgWeight = pastSets.reduce((sum, s) => sum + s.weight, 0) / pastSets.length;
    const avgReps = pastSets.reduce((sum, s) => sum + s.reps, 0) / pastSets.length;

    if (avgReps >= defaultReps + 1) {
      // Progress weight up
      const increment = avgWeight >= 50 ? 2.5 : 1.25;
      const nextWeight = Math.round((avgWeight + increment) * 4) / 4;
      return {
        suggestedWeightKg: nextWeight,
        suggestedReps: defaultReps,
        reasoning: `You averaged ${avgReps.toFixed(1)} reps last session (exceeding your target of ${defaultReps}). Progressive overload applied: +${increment}kg!`,
        rpeGuidance: 'RPE 8 — Push hard with clean form.'
      };
    } else if (avgReps < defaultReps - 2) {
      // Struggled
      const decrease = avgWeight >= 40 ? 2.5 : 1.0;
      const nextWeight = Math.max(0, Math.round((avgWeight - decrease) * 4) / 4);
      return {
        suggestedWeightKg: nextWeight,
        suggestedReps: defaultReps,
        reasoning: `You averaged ${avgReps.toFixed(1)} reps last time. A minor deload will help you lock in clean range of motion.`,
        rpeGuidance: 'RPE 7 — Focus on tempo and mind-muscle connection.'
      };
    } else {
      // Maintain weight and push for extra reps
      return {
        suggestedWeightKg: avgWeight,
        suggestedReps: defaultReps + 1,
        reasoning: `Solid consistency last time (${avgReps.toFixed(1)} reps @ ${avgWeight}kg). Keep weight steady and aim for 1 more rep!`,
        rpeGuidance: 'RPE 8-9 — Push for one more rep before next weight jump.'
      };
    }
  }

  /**
   * Calculates estimated 1 Rep Max (Epley Formula)
   */
  static calculateOneRepMax(weightKg: number, reps: number): number {
    if (reps <= 0) return 0;
    if (reps === 1) return weightKg;
    return Math.round(weightKg * (1 + reps / 30));
  }

  /**
   * Evaluates muscle recovery status across all muscle groups
   */
  static getMuscleRecoveryStatus(
    completedWorkouts: WorkoutSession[],
    allExercises: { id: string; primaryMuscle: MuscleGroup }[]
  ): Record<MuscleGroup, { hoursSince: number; status: 'FRESH' | 'RECOVERING' | 'FATIGUED' }> {
    const exMap = new Map(allExercises.map(e => [e.id, e.primaryMuscle]));
    const lastHitMap: Partial<Record<MuscleGroup, number>> = {};
    const now = Date.now();

    completedWorkouts.forEach(session => {
      const sessionTime = new Date(session.endTime || session.startTime).getTime();
      session.exercises.forEach(ex => {
        const muscle = exMap.get(ex.exerciseId) || ex.primaryMuscle;
        if (muscle) {
          const prev = lastHitMap[muscle] || 0;
          if (sessionTime > prev) {
            lastHitMap[muscle] = sessionTime;
          }
        }
      });
    });

    const muscles: MuscleGroup[] = [
      'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 
      'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ABS', 'FOREARMS'
    ];

    const result = {} as Record<MuscleGroup, { hoursSince: number; status: 'FRESH' | 'RECOVERING' | 'FATIGUED' }>;

    muscles.forEach(m => {
      const lastHit = lastHitMap[m];
      if (!lastHit) {
        result[m] = { hoursSince: 999, status: 'FRESH' };
      } else {
        const hours = Math.round((now - lastHit) / (1000 * 60 * 60));
        let status: 'FRESH' | 'RECOVERING' | 'FATIGUED' = 'FRESH';
        if (hours < 24) {
          status = 'FATIGUED';
        } else if (hours < 60) {
          status = 'RECOVERING';
        } else {
          status = 'FRESH';
        }
        result[m] = { hoursSince: hours, status };
      }
    });

    return result;
  }

  /**
   * Determines the next routine in sequence based on completed workouts and skip offset
   */
  static getNextRoutineSuggestion(
    routines: Routine[],
    completedWorkouts: WorkoutSession[],
    skipOffset: number = 0
  ): Routine | null {
    if (routines.length === 0) return null;

    // Filter to only workouts completed with an endTime
    const finishedCount = completedWorkouts.filter(w => !!w.endTime).length;
    const effectiveIndex = (finishedCount + skipOffset) % routines.length;
    return routines[effectiveIndex] || routines[0];
  }
}
