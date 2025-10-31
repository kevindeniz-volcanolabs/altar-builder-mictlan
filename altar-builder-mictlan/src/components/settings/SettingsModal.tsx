import { useCallback } from 'react';
import { useAltarStore, useSettings } from '../../store/useAltarStore';
import { useAnimationPerformance } from '../../hooks/useAnimations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const settings = useSettings();
  const updateSettings = useAltarStore(state => state.updateSettings);
  const { fps, animationCount, maxConcurrent, isPerformanceGood } = useAnimationPerformance();

  const handleToggleAnimations = useCallback(() => {
    updateSettings({ animationsEnabled: !settings.animationsEnabled });
  }, [settings.animationsEnabled, updateSettings]);

  const handleToggleAudio = useCallback(() => {
    updateSettings({ audioEnabled: !settings.audioEnabled });
  }, [settings.audioEnabled, updateSettings]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ volume: parseFloat(e.target.value) });
  }, [updateSettings]);

  const handleToggleReducedMotion = useCallback(() => {
    updateSettings({ reducedMotion: !settings.reducedMotion });
  }, [settings.reducedMotion, updateSettings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-orange-500/50 rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
            ⚙️ Configuración
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

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Animations Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
              ✨ Animaciones
            </h3>

            <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
              {/* Enable Animations */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="animations-enabled" className="text-sm font-medium text-gray-300">
                    Habilitar animaciones
                  </label>
                  <p className="text-xs text-gray-500">
                    Animar velas, flores y otros elementos
                  </p>
                </div>
                <button
                  id="animations-enabled"
                  onClick={handleToggleAnimations}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.animationsEnabled ? 'bg-orange-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="reduced-motion" className="text-sm font-medium text-gray-300">
                    Movimiento reducido
                  </label>
                  <p className="text-xs text-gray-500">
                    Reduce las animaciones para mejor accesibilidad
                  </p>
                </div>
                <button
                  id="reduced-motion"
                  onClick={handleToggleReducedMotion}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.reducedMotion ? 'bg-orange-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Performance Info */}
              {settings.animationsEnabled && (
                <div className="border-t border-gray-700 pt-4">
                  <div className="text-xs text-gray-400 space-y-2">
                    <div className="flex justify-between">
                      <span>FPS:</span>
                      <span className={`font-medium ${isPerformanceGood ? 'text-green-400' : 'text-yellow-400'}`}>
                        {fps}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Animaciones activas:</span>
                      <span className="font-medium text-gray-300">{animationCount} / {maxConcurrent}</span>
                    </div>
                    {!isPerformanceGood && (
                      <p className="text-yellow-400 text-xs mt-2">
                        ⚠️ Rendimiento bajo detectado. Las animaciones se ajustarán automáticamente.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audio Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
              🔊 Audio
            </h3>

            <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
              {/* Enable Audio */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="audio-enabled" className="text-sm font-medium text-gray-300">
                    Habilitar sonidos
                  </label>
                  <p className="text-xs text-gray-500">
                    Música de fondo y efectos de sonido
                  </p>
                </div>
                <button
                  id="audio-enabled"
                  onClick={handleToggleAudio}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.audioEnabled ? 'bg-orange-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.audioEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Volume Control */}
              {settings.audioEnabled && (
                <div>
                  <label htmlFor="volume" className="text-sm font-medium text-gray-300 block mb-2">
                    Volumen: {Math.round(settings.volume * 100)}%
                  </label>
                  <input
                    id="volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.volume}
                    onChange={handleVolumeChange}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Appearance Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
              🎨 Apariencia
            </h3>

            <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
              <div>
                <label htmlFor="theme" className="text-sm font-medium text-gray-300 block mb-2">
                  Tema
                </label>
                <select
                  id="theme"
                  value={settings.theme}
                  onChange={(e) => updateSettings({ theme: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="auto">Automático</option>
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                </select>
              </div>

              <div>
                <label htmlFor="language" className="text-sm font-medium text-gray-300 block mb-2">
                  Idioma
                </label>
                <select
                  id="language"
                  value={settings.language}
                  onChange={(e) => updateSettings({ language: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
