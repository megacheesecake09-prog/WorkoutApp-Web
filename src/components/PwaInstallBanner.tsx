import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user is on iOS / iPadOS and not already installed as standalone PWA
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const dismissed = localStorage.getItem('workout_pwa_banner_dismissed');

    if (isIos && !isStandalone && !dismissed) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem('workout_pwa_banner_dismissed', 'true');
    setShow(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow-2xl border border-white/20 animate-bounce-subtle">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
            <Smartphone size={24} />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Install on your iPhone / iPad</h4>
            <p className="text-xs text-blue-100 mt-0.5 leading-snug">
              Tap <span className="font-bold inline-flex items-center gap-0.5"><Share size={12} /> Share</span> in Safari, then tap <span className="font-bold inline-flex items-center gap-0.5"><PlusSquare size={12} /> Add to Home Screen</span> for the full fullscreen app experience!
            </p>
          </div>
        </div>
        <button 
          onClick={dismiss} 
          className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
