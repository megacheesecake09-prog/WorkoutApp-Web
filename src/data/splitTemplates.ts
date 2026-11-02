import { Routine, RoutineExerciseConfig, Equipment, Exercise, SplitType } from '../types';
import { DEFAULT_EXERCISES } from './defaultExercises';

function resolveExercise(
  preferredId: string,
  disabledIds: string[],
  availableEquipment: Equipment[],
  allExercises: Exercise[]
): Exercise {
  const preferred = allExercises.find(e => e.id === preferredId);
  const isAvailable = (ex: Exercise) => {
    if (disabledIds.includes(ex.id)) return false;
    if (availableEquipment.length > 0 && !availableEquipment.includes(ex.equipment)) return false;
    return true;
  };

  if (preferred && isAvailable(preferred)) {
    return preferred;
  }

  // Find suitable replacement targeting same muscle
  const targetMuscle = preferred ? preferred.primaryMuscle : 'CHEST';
  const alternative = allExercises.find(ex => ex.primaryMuscle === targetMuscle && isAvailable(ex));
  return alternative || preferred || allExercises[0];
}

export function createSplitRoutines(
  splitType: SplitType,
  disabledIds: string[] = [],
  availableEquipment: Equipment[] = [],
  startingWeights: Record<string, number> = {},
  allExercises: Exercise[] = DEFAULT_EXERCISES
): Routine[] {
  const makeCfg = (preferredId: string, sets: number, reps: number, order: number): RoutineExerciseConfig => {
    const resolved = resolveExercise(preferredId, disabledIds, availableEquipment, allExercises);
    return {
      exerciseId: resolved.id,
      targetSets: sets,
      targetReps: reps,
      startingWeightKg: startingWeights[resolved.id] || 0,
      order
    };
  };

  switch (splitType) {
    case 'arnold':
      return [
        {
          id: 'routine_arnold_1',
          name: 'Arnold Split — Chest & Back',
          description: 'Antagonistic upper body superset builder',
          splitDayIndex: 0,
          exercises: [
            makeCfg('ex_bench_press', 3, 8, 0),
            makeCfg('ex_lat_pulldown', 3, 10, 1),
            makeCfg('ex_incline_db_press', 3, 10, 2),
            makeCfg('ex_seated_cable_row', 3, 10, 3),
            makeCfg('ex_pec_deck', 3, 12, 4), // Pec deck / fly alternative
            makeCfg('ex_pullups', 3, 8, 5)
          ]
        },
        {
          id: 'routine_arnold_2',
          name: 'Arnold Split — Shoulders & Arms',
          description: 'Deltoids, Biceps, and Triceps hypertrophy',
          splitDayIndex: 1,
          exercises: [
            makeCfg('ex_overhead_press', 3, 8, 0),
            makeCfg('ex_lateral_raise', 4, 12, 1),
            makeCfg('ex_bicep_barbell_curl', 3, 10, 2),
            makeCfg('ex_tricep_pushdown', 3, 12, 3),
            makeCfg('ex_hammer_curl', 3, 10, 4),
            makeCfg('ex_skull_crusher', 3, 10, 5)
          ]
        },
        {
          id: 'routine_arnold_3',
          name: 'Arnold Split — Legs & Core',
          description: 'Quads, Hamstrings, Calves and Abs',
          splitDayIndex: 2,
          exercises: [
            makeCfg('ex_barbell_squat', 3, 8, 0),
            makeCfg('ex_romanian_deadlift', 3, 10, 1),
            makeCfg('ex_leg_press', 3, 10, 2),
            makeCfg('ex_leg_curl', 3, 12, 3),
            makeCfg('ex_calf_raise', 4, 15, 4),
            makeCfg('ex_hanging_leg_raise', 3, 15, 5)
          ]
        }
      ];

    case 'ppl':
      return [
        {
          id: 'routine_ppl_push',
          name: 'Push Day (Chest, Shoulders, Triceps)',
          description: 'Horizontal and vertical pressing hypertrophy',
          splitDayIndex: 0,
          exercises: [
            makeCfg('ex_bench_press', 3, 8, 0),
            makeCfg('ex_overhead_press', 3, 8, 1),
            makeCfg('ex_incline_db_press', 3, 10, 2),
            makeCfg('ex_lateral_raise', 4, 12, 3),
            makeCfg('ex_tricep_pushdown', 3, 12, 4),
            makeCfg('ex_pec_deck', 3, 12, 5)
          ]
        },
        {
          id: 'routine_ppl_pull',
          name: 'Pull Day (Back, Rear Delts, Biceps)',
          description: 'Vertical and horizontal pulling power',
          splitDayIndex: 1,
          exercises: [
            makeCfg('ex_lat_pulldown', 3, 10, 0),
            makeCfg('ex_barbell_row', 3, 8, 1),
            makeCfg('ex_seated_cable_row', 3, 10, 2),
            makeCfg('ex_face_pull', 3, 15, 3),
            makeCfg('ex_bicep_barbell_curl', 3, 10, 4),
            makeCfg('ex_hammer_curl', 3, 12, 5)
          ]
        },
        {
          id: 'routine_ppl_legs',
          name: 'Legs Day (Quads, Hamstrings, Calves)',
          description: 'Lower body foundation & power',
          splitDayIndex: 2,
          exercises: [
            makeCfg('ex_barbell_squat', 3, 8, 0),
            makeCfg('ex_romanian_deadlift', 3, 10, 1),
            makeCfg('ex_leg_press', 3, 10, 2),
            makeCfg('ex_leg_extension', 3, 12, 3),
            makeCfg('ex_leg_curl', 3, 12, 4),
            makeCfg('ex_calf_raise', 4, 15, 5)
          ]
        }
      ];

    case 'upper_lower':
      return [
        {
          id: 'routine_ul_upper',
          name: 'Upper Body Power & Hypertrophy',
          description: 'Complete chest, back, shoulders and arms',
          splitDayIndex: 0,
          exercises: [
            makeCfg('ex_bench_press', 3, 8, 0),
            makeCfg('ex_lat_pulldown', 3, 10, 1),
            makeCfg('ex_overhead_press', 3, 8, 2),
            makeCfg('ex_seated_cable_row', 3, 10, 3),
            makeCfg('ex_lateral_raise', 3, 12, 4),
            makeCfg('ex_bicep_barbell_curl', 3, 10, 5),
            makeCfg('ex_tricep_pushdown', 3, 12, 6)
          ]
        },
        {
          id: 'routine_ul_lower',
          name: 'Lower Body & Core',
          description: 'Squat patterns, hinges and abs',
          splitDayIndex: 1,
          exercises: [
            makeCfg('ex_barbell_squat', 3, 8, 0),
            makeCfg('ex_romanian_deadlift', 3, 10, 1),
            makeCfg('ex_leg_press', 3, 10, 2),
            makeCfg('ex_leg_curl', 3, 12, 3),
            makeCfg('ex_calf_raise', 4, 15, 4),
            makeCfg('ex_hanging_leg_raise', 3, 15, 5)
          ]
        }
      ];

    case 'full_body':
    default:
      return [
        {
          id: 'routine_fb_a',
          name: 'Full Body Day A',
          description: 'Heavy compound baseline',
          splitDayIndex: 0,
          exercises: [
            makeCfg('ex_barbell_squat', 3, 8, 0),
            makeCfg('ex_bench_press', 3, 8, 1),
            makeCfg('ex_lat_pulldown', 3, 10, 2),
            makeCfg('ex_overhead_press', 3, 8, 3),
            makeCfg('ex_bicep_barbell_curl', 3, 10, 4)
          ]
        },
        {
          id: 'routine_fb_b',
          name: 'Full Body Day B',
          description: 'Hinge and upper density',
          splitDayIndex: 1,
          exercises: [
            makeCfg('ex_romanian_deadlift', 3, 10, 0),
            makeCfg('ex_incline_db_press', 3, 10, 1),
            makeCfg('ex_barbell_row', 3, 8, 2),
            makeCfg('ex_lateral_raise', 3, 12, 3),
            makeCfg('ex_tricep_pushdown', 3, 12, 4)
          ]
        }
      ];
  }
}
