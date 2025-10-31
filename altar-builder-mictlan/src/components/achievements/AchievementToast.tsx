import { useEffect, useState } from 'react';
import type { Achievement } from '../../types';

interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg shadow-2xl border-2 border-orange-400 overflow-hidden transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      {/* Celebration Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-shimmer" />

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <span className="text-sm font-bold uppercase tracking-wide">
              ¡Logro Desbloqueado!
            </span>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Achievement Content */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center text-3xl backdrop-blur-sm animate-bounce-in">
            {achievement.icon}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg mb-1">{achievement.name}</h4>
            <p className="text-sm text-white/90">{achievement.description}</p>
          </div>
        </div>

        {/* Progress Bar Animation */}
        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-progress-fill" />
        </div>
      </div>
    </div>
  );
}
