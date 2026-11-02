import { UserAccount, UserPreferences, Routine, WorkoutSession, Exercise } from '../types';
import { DEFAULT_EXERCISES } from '../data/defaultExercises';
import { createSplitRoutines } from '../data/splitTemplates';

const USERS_KEY = 'workout_users_v1';
const CURRENT_USER_ID_KEY = 'workout_current_user_id_v1';
const GUEST_ID = 'guest_user';

export const DEFAULT_PREFERENCES: UserPreferences = {
  activeSplit: 'arnold',
  scheduleSkipOffset: 0,
  disabledExerciseIds: [],
  availableEquipment: ['BARBELL', 'DUMBBELL', 'CABLE', 'MACHINE', 'SMITH_MACHINE', 'BODYWEIGHT'],
  defaultRestSeconds: 90,
  soundEnabled: true,
  vibrationEnabled: true,
  wakeLockEnabled: true,
  startingWeights: {}
};

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

class StorageService {
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // --- ACCOUNTS ---
  getAllUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getCurrentUserId(): string {
    return localStorage.getItem(CURRENT_USER_ID_KEY) || GUEST_ID;
  }

  getCurrentUser(): UserAccount {
    const currentId = this.getCurrentUserId();
    const users = this.getAllUsers();
    const found = users.find(u => u.id === currentId);
    if (found) return found;

    // Default Guest profile
    return {
      id: GUEST_ID,
      email: 'guest@workoutapp.local',
      name: 'Guest Lifter',
      passwordHash: '',
      createdAt: new Date().toISOString(),
      avatarColor: '#007AFF',
      weightUnit: 'kg',
      theme: 'dark',
      experienceLevel: 'intermediate',
      fitnessGoal: 'hypertrophy'
    };
  }

  register(email: string, name: string, password: string): { success: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return { success: false, error: 'Email and password required' };

    const users = this.getAllUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const colors = ['#007AFF', '#AF52DE', '#34C759', '#FF9500', '#FF3B30', '#5856D6'];
    const newUser: UserAccount = {
      id: 'usr_' + Date.now().toString(36),
      email: cleanEmail,
      name: name.trim() || cleanEmail.split('@')[0],
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      weightUnit: 'kg',
      theme: 'dark',
      experienceLevel: 'intermediate',
      fitnessGoal: 'hypertrophy'
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Migrate any guest data to the new user if guest had data
    this.migrateGuestDataToUser(newUser.id);
    localStorage.setItem(CURRENT_USER_ID_KEY, newUser.id);

    this.notify();
    return { success: true };
  }

  login(email: string, password: string): { success: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const hash = simpleHash(password);
    const users = this.getAllUsers();
    const match = users.find(u => u.email.toLowerCase() === cleanEmail && u.passwordHash === hash);
    if (!match) {
      return { success: false, error: 'Invalid email or password' };
    }
    localStorage.setItem(CURRENT_USER_ID_KEY, match.id);
    this.notify();
    return { success: true };
  }

  logout() {
    localStorage.setItem(CURRENT_USER_ID_KEY, GUEST_ID);
    this.notify();
  }

  updateProfile(partial: Partial<UserAccount>) {
    const currentId = this.getCurrentUserId();
    if (currentId === GUEST_ID) {
      // Allow modifying guest unit/theme
      const cur = this.getCurrentUser();
      Object.assign(cur, partial);
      localStorage.setItem('workout_guest_profile', JSON.stringify(cur));
      this.notify();
      return;
    }

    const users = this.getAllUsers();
    const idx = users.findIndex(u => u.id === currentId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...partial };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      this.notify();
    }
  }

  // --- SCOPED DATA PER USER ---
  private getUserKey(suffix: string): string {
    return `workout_${this.getCurrentUserId()}_${suffix}`;
  }

  private migrateGuestDataToUser(userId: string) {
    const keys = ['workouts', 'routines', 'preferences', 'custom_exercises'];
    keys.forEach(k => {
      const guestVal = localStorage.getItem(`workout_${GUEST_ID}_${k}`);
      const userVal = localStorage.getItem(`workout_${userId}_${k}`);
      if (guestVal && !userVal) {
        localStorage.setItem(`workout_${userId}_${k}`, guestVal);
      }
    });
  }

  getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(this.getUserKey('preferences'));
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  savePreferences(prefs: UserPreferences) {
    localStorage.setItem(this.getUserKey('preferences'), JSON.stringify(prefs));
    this.notify();
  }

  getRoutines(): Routine[] {
    try {
      const data = localStorage.getItem(this.getUserKey('routines'));
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // Initialize with default Arnold split
    const prefs = this.getPreferences();
    const defaults = createSplitRoutines(prefs.activeSplit, prefs.disabledExerciseIds, prefs.availableEquipment, prefs.startingWeights);
    this.saveRoutines(defaults);
    return defaults;
  }

  saveRoutines(routines: Routine[]) {
    localStorage.setItem(this.getUserKey('routines'), JSON.stringify(routines));
    this.notify();
  }

  getCompletedWorkouts(): WorkoutSession[] {
    try {
      const data = localStorage.getItem(this.getUserKey('workouts'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveCompletedWorkout(workout: WorkoutSession) {
    const list = this.getCompletedWorkouts();
    // Prepend new workout (most recent first)
    const updated = [workout, ...list.filter(w => w.id !== workout.id)];
    localStorage.setItem(this.getUserKey('workouts'), JSON.stringify(updated));
    this.notify();
  }

  deleteWorkout(id: string) {
    const list = this.getCompletedWorkouts();
    const filtered = list.filter(w => w.id !== id);
    localStorage.setItem(this.getUserKey('workouts'), JSON.stringify(filtered));
    this.notify();
  }

  getCustomExercises(): Exercise[] {
    try {
      const data = localStorage.getItem(this.getUserKey('custom_exercises'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getAllExercises(): Exercise[] {
    const custom = this.getCustomExercises();
    return [...DEFAULT_EXERCISES, ...custom];
  }

  addCustomExercise(ex: Exercise) {
    const current = this.getCustomExercises();
    current.push(ex);
    localStorage.setItem(this.getUserKey('custom_exercises'), JSON.stringify(current));
    this.notify();
  }

  // --- BACKUP & EXPORT / IMPORT ---
  exportAllDataJson(): string {
    const bundle = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      account: this.getCurrentUser(),
      preferences: this.getPreferences(),
      routines: this.getRoutines(),
      workouts: this.getCompletedWorkouts(),
      customExercises: this.getCustomExercises()
    };
    return JSON.stringify(bundle, null, 2);
  }

  importAllDataJson(jsonStr: string): { success: boolean; count: number; error?: string } {
    try {
      const bundle = JSON.parse(jsonStr);
      if (bundle.preferences) this.savePreferences(bundle.preferences);
      if (Array.isArray(bundle.routines)) this.saveRoutines(bundle.routines);
      if (Array.isArray(bundle.workouts)) {
        localStorage.setItem(this.getUserKey('workouts'), JSON.stringify(bundle.workouts));
      }
      if (Array.isArray(bundle.customExercises)) {
        localStorage.setItem(this.getUserKey('custom_exercises'), JSON.stringify(bundle.customExercises));
      }
      this.notify();
      return { success: true, count: bundle.workouts?.length || 0 };
    } catch (e) {
      return { success: false, count: 0, error: 'Invalid JSON backup file' };
    }
  }

  exportWorkoutsToCsv(): string {
    const workouts = this.getCompletedWorkouts();
    const headers = [
      'WorkoutId',
      'WorkoutName',
      'StartTime',
      'EndTime',
      'ExerciseName',
      'SetNumber',
      'WeightKg',
      'Reps',
      'RPE',
      'Completed'
    ];
    const rows: string[] = [headers.join(',')];

    workouts.forEach(w => {
      w.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          rows.push([
            w.id,
            `"${w.name.replace(/"/g, '""')}"`,
            w.startTime,
            w.endTime || '',
            `"${ex.exerciseName.replace(/"/g, '""')}"`,
            set.setNumber,
            set.weightKg,
            set.reps,
            set.rpe || '',
            set.completed ? '1' : '0'
          ].join(','));
        });
      });
    });

    return rows.join('\n');
  }
}

export const storage = new StorageService();
