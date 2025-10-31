import { useAchievements } from '../../store/useAltarStore';
import type { Achievement } from '../../types';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementsModal({ isOpen, onClose }: AchievementsModalProps) {
  const achievements = useAchievements();

  if (!isOpen) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = Math.round((unlockedCount / totalCount) * 100);

  // Since achievements don't have categories in the interface, we'll show them in a grid
  const allAchievements = achievements;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-orange-500/50 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 flex items-center gap-2">
              🏆 Logros
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Progreso Total</span>
              <span className="font-bold text-orange-400">{unlockedCount} / {totalCount}</span>
            </div>
            <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              {progress}% completado
            </p>
          </div>
        </div>

        {/* Achievements List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allAchievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isLocked = !achievement.unlocked;

  return (
    <div
      className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
        isLocked
          ? 'bg-gray-800/30 border-gray-700/50 opacity-60'
          : 'bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-600/50 shadow-lg'
      }`}
    >
      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute top-2 right-2">
          <span className="text-2xl opacity-50">🔒</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
            isLocked ? 'bg-gray-700/50 grayscale' : 'bg-orange-600/20'
          }`}
        >
          {achievement.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold mb-1 ${isLocked ? 'text-gray-400' : 'text-orange-300'}`}>
            {achievement.name}
          </h4>
          <p className="text-sm text-gray-400 mb-2">
            {isLocked ? '???' : achievement.description}
          </p>

          {/* Unlocked Date */}
          {!isLocked && achievement.unlockedAt && (
            <p className="text-xs text-gray-500">
              Desbloqueado: {new Date(achievement.unlockedAt).toLocaleDateString('es-MX')}
            </p>
          )}

          {/* Locked Hint - using description for locked achievements */}
          {isLocked && (
            <p className="text-xs text-gray-500 italic">
              💡 Sigue construyendo altares para desbloquear
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

