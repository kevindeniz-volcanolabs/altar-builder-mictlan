import { useState, useEffect } from 'react';
import { useIndexedDB } from '../../hooks/useIndexedDB';

interface StorageManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StorageManager({ isOpen, onClose }: StorageManagerProps) {
  const { getStorageEstimate, clearAll, countAltars } = useIndexedDB();
  const [storage, setStorage] = useState({ usage: 0, quota: 0, percentage: 0 });
  const [altarCount, setAltarCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadStorageInfo = async () => {
      setLoading(true);
      try {
        const estimate = await getStorageEstimate();
        const count = await countAltars();
        setStorage(estimate);
        setAltarCount(count);
      } catch (err) {
        console.error('Failed to load storage info:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStorageInfo();
  }, [isOpen, getStorageEstimate, countAltars]);

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const success = await clearAll();
      if (success) {
        setAltarCount(0);
        setShowClearConfirm(false);
        // Refresh storage estimate
        const estimate = await getStorageEstimate();
        setStorage(estimate);
      }
    } catch (err) {
      console.error('Failed to clear storage:', err);
    } finally {
      setClearing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getStorageStatusColor = (): string => {
    if (storage.percentage < 50) return 'from-green-500 to-green-600';
    if (storage.percentage < 80) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getStorageStatusText = (): string => {
    if (storage.percentage < 50) return 'Excelente';
    if (storage.percentage < 80) return 'Bien';
    if (storage.percentage < 90) return 'Advertencia';
    return 'Crítico';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-orange-500/50 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 flex items-center gap-2">
              💾 Administración de Almacenamiento
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p>Cargando información...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Storage Overview */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-orange-300 mb-4 flex items-center gap-2">
                  📊 Uso de Almacenamiento
                </h3>

                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Usado</span>
                      <span className="font-medium text-white">
                        {formatBytes(storage.usage)} / {formatBytes(storage.quota)}
                      </span>
                    </div>
                    <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getStorageStatusColor()} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(storage.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-gray-500">{storage.percentage}% usado</span>
                      <span className={`font-medium ${
                        storage.percentage < 50 ? 'text-green-400' :
                        storage.percentage < 80 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        Estado: {getStorageStatusText()}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Altares guardados</p>
                      <p className="text-2xl font-bold text-orange-400">{altarCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Espacio disponible</p>
                      <p className="text-2xl font-bold text-orange-400">
                        {formatBytes(storage.quota - storage.usage)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Storage Tips */}
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                <h4 className="font-medium text-orange-300 mb-2 flex items-center gap-2">
                  💡 Consejos
                </h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Los altares se guardan localmente en tu navegador</li>
                  <li>• Limpia los altares que ya no necesites para liberar espacio</li>
                  <li>• El almacenamiento está limitado por tu navegador (~50-100 MB típicamente)</li>
                  <li>• Los datos permanecerán aunque cierres el navegador</li>
                </ul>
              </div>

              {/* Clear All Section */}
              {altarCount > 0 && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-red-300 mb-2 flex items-center gap-2">
                    ⚠️ Zona de peligro
                  </h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Elimina todos los altares guardados. Esta acción no se puede deshacer.
                  </p>

                  {!showClearConfirm ? (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg transition-all duration-200 font-medium"
                    >
                      Eliminar todos los altares
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-red-300 font-medium">
                        ¿Estás seguro? Se eliminarán {altarCount} {altarCount === 1 ? 'altar' : 'altares'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          disabled={clearing}
                          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleClearAll}
                          disabled={clearing}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {clearing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Eliminando...
                            </>
                          ) : (
                            'Sí, eliminar todo'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Browser Support Info */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-300 mb-2 flex items-center gap-2">
                  ℹ️ Información técnica
                </h4>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Tecnología: IndexedDB API</p>
                  <p>• Capacidad estimada: {formatBytes(storage.quota)}</p>
                  <p>• Navegador: {navigator.userAgent.includes('Chrome') ? 'Chrome' :
                                   navigator.userAgent.includes('Firefox') ? 'Firefox' :
                                   navigator.userAgent.includes('Safari') ? 'Safari' : 'Otro'}</p>
                </div>
              </div>
            </>
          )}
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
