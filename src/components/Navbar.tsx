import React from 'react';
import { Dumbbell, Flame, User } from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  currentUser: UserAccount;
  streakDays: number;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, streakDays, onOpenAuth }) => {
  const isGuest = currentUser.id === 'guest_user';

  return (
    <header className="sticky top-0 z-30 bg-[#0D0E11]/85 backdrop-blur-md border-b border-[#272A34] px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* App Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Dumbbell size={18} />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white">WorkoutApp</h1>
            <p className="text-[10px] text-gray-400 font-medium">Smart Coach & Recovery</p>
          </div>
        </div>

        {/* Right Stats & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Streak */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-semibold text-amber-400">
            <Flame size={14} className="fill-amber-400 text-amber-400" />
            <span>{streakDays}d streak</span>
          </div>

          {/* User Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 p-1 pr-2 rounded-full bg-[#181A20] hover:bg-white/10 border border-[#272A34] transition active:scale-95"
            title="Account Profile"
          >
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: currentUser.avatarColor || '#007AFF' }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-gray-300 max-w-[70px] truncate">
              {isGuest ? 'Guest' : currentUser.name}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
