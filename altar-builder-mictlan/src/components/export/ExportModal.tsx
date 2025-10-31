import { useState, useCallback } from 'react';
import type { ExportOptions } from '../../utils/export';
import { exportAndDownload, exportAltarToImage, formatBytes, isExportSupported } from '../../utils/export';
import {
  shareWithFallback,
  generateShareText,
  generateShareURL,
  blobToFile,
  getShareCapabilities,
  isWebShareSupported
} from '../../utils/share';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridRef?: React.RefObject<HTMLDivElement>;
  altarName: string;
  elementCount: number;
}

type ExportFormat = 'png' | 'jpeg' | 'webp';

export function ExportModal({ isOpen, onClose, gridRef, altarName, elementCount }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(95);
  const [scale, setScale] = useState(2);
  const [watermark, setWatermark] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supported = isExportSupported();
  const shareCapabilities = getShareCapabilities();

  const handleExport = useCallback(async () => {
    if (!gridRef?.current) {
      setError('No se encontró el altar para exportar');
      return;
    }

    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const options: ExportOptions = {
        format,
        quality: quality / 100,
        scale,
        watermark,
        watermarkText: 'Altar Builder Mictlán',
        backgroundColor: '#111827'
      };

      await exportAndDownload(gridRef.current, altarName, options);
      setSuccess(`Altar exportado exitosamente como ${format.toUpperCase()}`);
    } catch (err) {
      setError('Error al exportar el altar. Por favor intenta de nuevo.');
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }, [gridRef, format, quality, scale, watermark, altarName]);

  const handleShare = useCallback(async () => {
    if (!gridRef?.current) {
      setError('No se encontró el altar para compartir');
      return;
    }

    setSharing(true);
    setError(null);
    setSuccess(null);

    try {
      const options: ExportOptions = {
        format: 'png',
        quality: 0.95,
        scale: 2,
        watermark: true,
        watermarkText: 'Altar Builder Mictlán',
        backgroundColor: '#111827'
      };

      // Generate image
      const blob = await exportAltarToImage(gridRef.current, options);
      const file = blobToFile(blob, `${altarName}.png`);

      // Generate share data
      const shareText = generateShareText(altarName, elementCount);
      const shareUrl = generateShareURL();

      // Try to share
      const result = await shareWithFallback({
        title: `Mi Altar: ${altarName}`,
        text: shareText,
        url: shareUrl,
        file
      });

      if (result.success) {
        if (result.method === 'native') {
          setSuccess('¡Altar compartido exitosamente!');
        } else if (result.method === 'clipboard') {
          setSuccess('Enlace copiado al portapapeles');
        }
      } else {
        if (result.error?.includes('cancelado')) {
          // User cancelled, don't show error
          setError(null);
        } else {
          setError('No se pudo compartir. Intenta descargar la imagen.');
        }
      }
    } catch (err) {
      setError('Error al compartir el altar. Por favor intenta de nuevo.');
      console.error('Share error:', err);
    } finally {
      setSharing(false);
    }
  }, [gridRef, altarName, elementCount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-orange-500/50 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 flex items-center gap-2">
              📸 Exportar y Compartir
            </h2>
            <button
              onClick={onClose}
              disabled={exporting || sharing}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Exporta tu altar como imagen o compártelo en redes sociales
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!supported && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              Tu navegador no soporta la exportación de imágenes
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 text-green-400">
              {success}
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-orange-300">Opciones de Exportación</h3>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Formato de Imagen
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    disabled={exporting || sharing}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      format === fmt
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {format === 'png' && 'Mejor calidad, archivos más grandes'}
                {format === 'jpeg' && 'Balance entre calidad y tamaño'}
                {format === 'webp' && 'Mejor compresión, no todos los navegadores lo soportan'}
              </p>
            </div>

            {/* Quality Slider (for JPEG/WebP) */}
            {(format === 'jpeg' || format === 'webp') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Calidad: {quality}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={exporting || sharing}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-600 disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Menor tamaño</span>
                  <span>Mayor calidad</span>
                </div>
              </div>
            )}

            {/* Scale Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resolución
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    disabled={exporting || sharing}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      scale === s
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mayor resolución = mejor calidad pero archivos más grandes
              </p>
            </div>

            {/* Watermark Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="font-medium text-gray-300">Incluir marca de agua</p>
                <p className="text-xs text-gray-500">Agrega "Altar Builder Mictlán" a la imagen</p>
              </div>
              <button
                onClick={() => setWatermark(!watermark)}
                disabled={exporting || sharing}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  watermark ? 'bg-orange-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    watermark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
            <h4 className="font-medium text-orange-300 mb-2 flex items-center gap-2">
              ℹ️ Vista Previa
            </h4>
            <div className="text-sm text-gray-400 space-y-1">
              <p>• Altar: {altarName}</p>
              <p>• Elementos: {elementCount}</p>
              <p>• Formato: {format.toUpperCase()}</p>
              <p>• Resolución: {scale}x</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-800 space-y-3">
          {/* Share Button (if supported) */}
          {isWebShareSupported() && (
            <button
              onClick={handleShare}
              disabled={!supported || exporting || sharing || !gridRef?.current}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {sharing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Preparando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Compartir Altar
                </>
              )}
            </button>
          )}

          <div className="flex gap-3">
            {/* Download Button */}
            <button
              onClick={handleExport}
              disabled={!supported || exporting || sharing || !gridRef?.current}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={exporting || sharing}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200"
            >
              Cerrar
            </button>
          </div>

          {/* Share capabilities info */}
          {!shareCapabilities.nativeShare && (
            <p className="text-xs text-gray-500 text-center">
              💡 Tu navegador no soporta compartir directamente. Descarga la imagen y compártela manualmente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
