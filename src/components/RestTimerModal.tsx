import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, X, Plus, Minus, Bell } from 'lucide-react';
import { sound } from '../services/sound';

interface RestTimerModalProps {
  initialSeconds: number;
  isOpen: boolean;
  onClose: () => void;
  soundEnabled?: boolean;
  adaptiveNote?: string;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  initialSeconds,
  isOpen,
  onClose,
  soundEnabled = true,
  adaptiveNote
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setTotalSeconds(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds, isOpen]);

  useEffect(() => {
    if (!isOpen || !isRunning) return;

    if (secondsLeft <= 0) {
      if (soundEnabled) {
        sound.playCompletionChime();
        sound.vibrate([200, 100, 200, 100, 300]);
      }
      setIsRunning(false);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev === 4 && soundEnabled) {
          sound.playShortBeep();
        } else if (prev === 3 && soundEnabled) {
          sound.playShortBeep();
        } else if (prev === 2 && soundEnabled) {
          sound.playShortBeep();
        } else if (prev === 1 && soundEnabled) {
          sound.playShortBeep();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isRunning, secondsLeft, soundEnabled]);

  if (!isOpen) return null;

  const progress = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const adjustTime = (delta: number) => {
    setSecondsLeft(prev => Math.max(0, prev + delta));
    setTotalSeconds(prev => Math.max(0, prev + delta));
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto bg-[#181A20]/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl p-4 text-white animate-slide-up">
      <div className="flex items-center justify-between pb-2 border-b border-[#272A34]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <h4 className="font-semibold text-xs text-blue-400 uppercase tracking-wider">Rest Timer</h4>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>

      {adaptiveNote && (
        <p className="mt-2 text-[11px] text-blue-200 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
          {adaptiveNote}
        </p>
      )}

      {/* Main Countdown & Progress */}
      <div className="flex items-center justify-between my-3 px-2">
        <div>
          <div className="text-3xl font-extrabold tracking-tight font-mono text-white">
            {formattedTime}
          </div>
          <p className="text-[11px] text-gray-400">
            {secondsLeft === 0 ? 'Rest complete! Time to lift.' : isRunning ? 'Resting...' : 'Paused'}
          </p>
        </div>

        {/* Quick adjustments */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustTime(-15)}
            className="px-2.5 py-1.5 bg-[#121316] hover:bg-white/5 active:scale-95 border border-[#272A34] rounded-lg text-xs font-semibold text-gray-300"
          >
            -15s
          </button>
          <button
            onClick={() => adjustTime(30)}
            className="px-2.5 py-1.5 bg-[#121316] hover:bg-white/5 active:scale-95 border border-[#272A34] rounded-lg text-xs font-semibold text-gray-300"
          >
            +30s
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-2 bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white rounded-lg transition"
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#121316] h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
