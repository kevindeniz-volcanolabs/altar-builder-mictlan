import { useState, useRef, useEffect } from 'react';
import { useIndexedDB, useThumbnailGenerator } from '../../hooks/useIndexedDB';
import type { PlacedElement } from '../../types';

interface SaveAltarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  elements: PlacedElement[];
  gridRef?: React.RefObject<HTMLDivElement>;
}

export function SaveAltarDialog({ isOpen, onClose, elements, gridRef }: SaveAltarDialogProps) {
  const [altarName, setAltarName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { saveAltar } = useIndexedDB();
  const { generateThumbnail } = useThumbnailGenerator();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Generate default name
      const now = new Date();
      const defaultName = `Altar ${now.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      setAltarName(defaultName);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!altarName.trim()) {
      setError('Por favor ingresa un nombre para el altar');
      return;
    }

    if (elements.length === 0) {
      setError('No hay elementos para guardar');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Generate thumbnail if grid reference is available
      let thumbnail: string | undefined;
      if (gridRef?.current) {
        try {
          // Try to convert grid to canvas for thumbnail
          const canvas = await convertToCanvas(gridRef.current);
          if (canvas) {
            thumbnail = await generateThumbnail(canvas);
          }
        } catch (err) {
          console.warn('Failed to generate thumbnail:', err);
          // Continue without thumbnail
        }
      }

      const altarId = await saveAltar(altarName.trim(), elements, thumbnail);

      if (altarId) {
        onClose();
        setAltarName('');
      } else {
        setError('Error al guardar el altar');
      }
    } catch (err) {
      setError('Error al guardar el altar');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-orange-500/50 rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 flex items-center gap-2">
            💾 Guardar Altar
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <label htmlFor="altar-name" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre del altar
            </label>
            <input
              ref={inputRef}
              id="altar-name"
              type="text"
              value={altarName}
              onChange={(e) => setAltarName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 focus:border-orange-500 rounded-lg text-white placeholder-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Mi altar de Día de Muertos"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {elements.length} {elements.length === 1 ? 'elemento' : 'elementos'} en el altar
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Info */}
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
            <p className="text-xs text-gray-400">
              💡 Tu altar se guardará localmente en este dispositivo. Podrás cargarlo desde la galería en cualquier momento.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !altarName.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Convert HTML element to canvas for thumbnail generation
 */
async function convertToCanvas(element: HTMLElement): Promise<HTMLCanvasElement | null> {
  try {
    // Create canvas with same dimensions
    const canvas = document.createElement('canvas');
    const rect = element.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill background
    ctx.fillStyle = '#111827'; // gray-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    const gridSize = 60; // approximate cell size
    ctx.strokeStyle = '#374151'; // gray-700
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw elements (simplified - just text for now)
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const elements = element.querySelectorAll('[data-element-id]');
    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const elRect = htmlEl.getBoundingClientRect();
      const x = elRect.left - rect.left + elRect.width / 2;
      const y = elRect.top - rect.top + elRect.height / 2;

      // Draw element emoji/icon
      const icon = htmlEl.textContent?.trim().split('\n')[0] || '📦';
      ctx.fillText(icon, x, y);
    });

    return canvas;
  } catch (err) {
    console.error('Failed to convert to canvas:', err);
    return null;
  }
}
