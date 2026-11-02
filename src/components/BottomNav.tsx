import React from 'react';
import { Dumbbell, Layers, Activity, TrendingUp, Settings } from 'lucide-react';

export type NavTab = 'home' | 'routines' | 'muscles' | 'analytics' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeWorkoutRunning: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, activeWorkoutRunning }) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Today', icon: Dumbbell, hasBadge: activeWorkoutRunning },
    { id: 'routines' as NavTab, label: 'Routines', icon: Layers },
    { id: 'muscles' as NavTab, label: 'Muscles', icon: Activity },
    { id: 'analytics' as NavTab, label: 'Progress', icon: TrendingUp },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0D0E11]/90 backdrop-blur-xl border-t border-[#272A34] pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center w-16 py-1 transition-all duration-200 active:scale-95 ${
                isActive ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                {tab.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-[#0D0E11] animate-ping" />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold text-[#007AFF]' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
