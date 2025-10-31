import { useState, useEffect } from 'react';
import { useIndexedDB } from '../../hooks/useIndexedDB';
import type { SavedAltar } from '../../types';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadAltar: (altar: SavedAltar) => void;
}

export function GalleryModal({ isOpen, onClose, onLoadAltar }: GalleryModalProps) {
  const { altars, loading, error, deleteAltar, getThumbnail } = useIndexedDB();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load thumbnails for all altars
  useEffect(() => {
    if (!isOpen || loading) return;

    const loadThumbnails = async () => {
      const thumbs: Record<string, string> = {};
      for (const altar of altars) {
        const thumb = await getThumbnail(altar.id);
        if (thumb) {
          thumbs[altar.id] = thumb;
        }
      }
      setThumbnails(thumbs);
    };

    loadThumbnails();
  }, [isOpen, loading, altars, getThumbnail]);

  const handleDelete = async (id: string) => {
    const success = await deleteAltar(id);
    if (success) {
      setDeleteConfirmId(null);
      // Remove thumbnail from state
      setThumbnails(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleLoad = (altar: SavedAltar) => {
    onLoadAltar(altar);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-orange-500/50 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 flex items-center gap-2">
              🖼️ Galería de Altares
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
          <p className="text-gray-400 text-sm mt-2">
            {altars.length} {altars.length === 1 ? 'altar guardado' : 'altares guardados'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p>Cargando altares...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && altars.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <svg className="w-24 h-24 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-lg mb-2">No hay altares guardados</p>
              <p className="text-sm">Guarda tu primer altar para verlo aquí</p>
            </div>
          )}

          {!loading && !error && altars.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {altars.map(altar => (
                <AltarCard
                  key={altar.id}
                  altar={altar}
                  thumbnail={thumbnails[altar.id]}
                  onLoad={() => handleLoad(altar)}
                  onDelete={() => setDeleteConfirmId(altar.id)}
                  isDeleting={deleteConfirmId === altar.id}
                  onCancelDelete={() => setDeleteConfirmId(null)}
                  onConfirmDelete={() => handleDelete(altar.id)}
                />
              ))}
            </div>
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

interface AltarCardProps {
  altar: SavedAltar;
  thumbnail?: string;
  onLoad: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

function AltarCard({
  altar,
  thumbnail,
  onLoad,
  onDelete,
  isDeleting,
  onCancelDelete,
  onConfirmDelete
}: AltarCardProps) {
  const elementCount = altar.elements.length;
  const updatedDate = new Date(altar.updatedAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (isDeleting) {
    return (
      <div className="bg-gray-800 border-2 border-red-500/50 rounded-lg p-4 flex flex-col items-center justify-center gap-3">
        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-white font-medium text-center">¿Eliminar este altar?</p>
        <p className="text-gray-400 text-sm text-center">Esta acción no se puede deshacer</p>
        <div className="flex gap-2 w-full mt-2">
          <button
            onClick={onCancelDelete}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmDelete}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border-2 border-gray-700 hover:border-orange-500/50 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/20 flex flex-col">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-gray-900">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={altar.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Element count badge */}
        <div className="absolute top-2 right-2 bg-orange-600/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white">
          {elementCount} {elementCount === 1 ? 'elemento' : 'elementos'}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-orange-300 mb-1 truncate">{altar.name}</h3>
        <p className="text-xs text-gray-400 mb-4">Actualizado: {updatedDate}</p>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={onLoad}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 text-sm"
          >
            Cargar
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg transition-all duration-200"
            aria-label="Eliminar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
