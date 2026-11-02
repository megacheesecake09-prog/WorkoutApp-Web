import React, { useState, useRef } from 'react';
import { User, Moon, Sun, Download, Upload, Shield, Bell, Lock, Check, Plus, Trash2, Smartphone } from 'lucide-react';
import { UserAccount, UserPreferences, ThemeMode, WeightUnit, Exercise } from '../types';
import { storage } from '../services/storage';

interface SettingsViewProps {
  currentUser: UserAccount;
  preferences: UserPreferences;
  allExercises: Exercise[];
  onOpenAuth: () => void;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  preferences,
  allExercises,
  onOpenAuth,
  onRefresh
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const isGuest = currentUser.id === 'guest_user';

  const handleUpdateUnit = (unit: WeightUnit) => {
    storage.updateProfile({ weightUnit: unit });
    onRefresh();
  };

  const handleUpdateTheme = (theme: ThemeMode) => {
    storage.updateProfile({ theme });
    // Update HTML root theme class
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    onRefresh();
  };

  const handleToggleSound = () => {
    storage.savePreferences({
      ...preferences,
      soundEnabled: !preferences.soundEnabled
    });
    onRefresh();
  };

  const handleToggleWakeLock = () => {
    storage.savePreferences({
      ...preferences,
      wakeLockEnabled: !preferences.wakeLockEnabled
    });
    onRefresh();
  };

  const handleUnblockExercise = (exId: string) => {
    storage.savePreferences({
      ...preferences,
      disabledExerciseIds: preferences.disabledExerciseIds.filter(id => id !== exId)
    });
    onRefresh();
  };

  const handleBlockExercise = (exId: string) => {
    if (!preferences.disabledExerciseIds.includes(exId)) {
      storage.savePreferences({
        ...preferences,
        disabledExerciseIds: [...preferences.disabledExerciseIds, exId]
      });
      onRefresh();
    }
  };

  const handleExportCsv = () => {
    const csv = storage.exportWorkoutsToCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `WorkoutApp_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const json = storage.exportAllDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `WorkoutApp_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const res = storage.importAllDataJson(content);
        if (res.success) {
          setImportStatus(`Successfully restored ${res.count} workouts and your routines!`);
          onRefresh();
        } else {
          setImportStatus(res.error || 'Failed to import file');
        }
      }
    };
    reader.readAsText(file);
  };

  const blockedExercises = allExercises.filter(e => preferences.disabledExerciseIds.includes(e.id));
  const availableToBlock = allExercises.filter(e => !preferences.disabledExerciseIds.includes(e.id));

  return (
    <div className="space-y-6 pb-28 pt-2">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Settings & Account</h2>
        <p className="text-xs text-gray-400">Preferences, backup, and gym equipment</p>
      </div>

      {/* Account Section */}
      <div className="bg-[#181A20] border border-[#272A34] rounded-2xl p-4 shadow-lg">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">User Account</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: currentUser.avatarColor || '#007AFF' }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">{currentUser.name}</h4>
              <p className="text-xs text-gray-400">{isGuest ? 'Guest (Local Only)' : currentUser.email}</p>
            </div>
          </div>

          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs rounded-xl transition shadow"
          >
            {isGuest ? 'Create Account' : 'Manage Account'}
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-[#181A20] border border-[#272A34] rounded-2xl p-4 shadow-lg space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preferences</h3>

        {/* Theme mode */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">App Theme</p>
            <p className="text-xs text-gray-400">Dark, Light, or AMOLED Pure Black</p>
          </div>
          <div className="flex bg-[#121316] p-1 rounded-xl border border-[#272A34] text-xs">
            {(['dark', 'light', 'amoled'] as ThemeMode[]).map(t => (
              <button
                key={t}
                onClick={() => handleUpdateTheme(t)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                  currentUser.theme === t ? 'bg-[#007AFF] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Units */}
        <div className="flex items-center justify-between pt-3 border-t border-[#272A34]">
          <div>
            <p className="text-sm font-semibold text-white">Weight Units</p>
            <p className="text-xs text-gray-400">Kilograms (kg) or Pounds (lbs)</p>
          </div>
          <div className="flex bg-[#121316] p-1 rounded-xl border border-[#272A34] text-xs">
            {(['kg', 'lbs'] as WeightUnit[]).map(u => (
              <button
                key={u}
                onClick={() => handleUpdateUnit(u)}
                className={`px-3 py-1 rounded-lg uppercase font-bold transition ${
                  currentUser.weightUnit === u ? 'bg-[#007AFF] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Screen Wake Lock */}
        <div className="flex items-center justify-between pt-3 border-t border-[#272A34]">
          <div>
            <p className="text-sm font-semibold text-white">Keep Screen Awake</p>
            <p className="text-xs text-gray-400">Prevent phone from sleeping mid-workout</p>
          </div>
          <button
            onClick={handleToggleWakeLock}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
              preferences.wakeLockEnabled ? 'bg-blue-600 justify-end' : 'bg-[#272A34] justify-start'
            }`}
          >
            <span className="bg-white w-4 h-4 rounded-full shadow-md" />
          </button>
        </div>

        {/* Rest Timer Sound */}
        <div className="flex items-center justify-between pt-3 border-t border-[#272A34]">
          <div>
            <p className="text-sm font-semibold text-white">Timer Sound & Chime</p>
            <p className="text-xs text-gray-400">Audio alert when rest ends</p>
          </div>
          <button
            onClick={handleToggleSound}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
              preferences.soundEnabled ? 'bg-blue-600 justify-end' : 'bg-[#272A34] justify-start'
            }`}
          >
            <span className="bg-white w-4 h-4 rounded-full shadow-md" />
          </button>
        </div>
      </div>

      {/* Blocked Exercises Manager */}
      <div className="bg-[#181A20] border border-[#272A34] rounded-2xl p-4 shadow-lg space-y-3">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Blocked Exercises</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Exercises blocked here are automatically excluded from the Wizard and substituted with viable alternatives.
          </p>
        </div>

        {blockedExercises.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {blockedExercises.map(ex => (
              <span
                key={ex.id}
                className="px-2.5 py-1 bg-red-500/15 border border-red-500/30 text-red-300 rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                <span>{ex.name}</span>
                <button 
                  onClick={() => handleUnblockExercise(ex.id)}
                  className="hover:text-white"
                  title="Unblock exercise"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic py-1">No exercises currently blocked.</p>
        )}

        {/* Quick Block Dropdown */}
        <div className="pt-2">
          <select
            onChange={e => {
              if (e.target.value) {
                handleBlockExercise(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="w-full px-3 py-2 bg-[#121316] border border-[#272A34] rounded-xl text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="" disabled>+ Block an exercise...</option>
            {availableToBlock.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.primaryMuscle})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-[#181A20] border border-[#272A34] rounded-2xl p-4 shadow-lg space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Backup & Restore</h3>
        <p className="text-xs text-gray-400">
          Save your complete workout logbook or import past history.
        </p>

        {importStatus && (
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-200">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportCsv}
            className="py-2.5 px-3 bg-[#121316] hover:bg-white/5 border border-[#272A34] rounded-xl text-xs font-semibold text-gray-300 flex items-center justify-center gap-2 transition"
          >
            <Download size={15} />
            <span>Export (CSV)</span>
          </button>

          <button
            onClick={handleExportJson}
            className="py-2.5 px-3 bg-[#121316] hover:bg-white/5 border border-[#272A34] rounded-xl text-xs font-semibold text-gray-300 flex items-center justify-center gap-2 transition"
          >
            <Download size={15} />
            <span>Backup (JSON)</span>
          </button>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-3 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <Upload size={15} />
            <span>Import Backup File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
