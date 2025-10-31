/**
 * KeyboardHelpModal Component
 *
 * Displays all available keyboard shortcuts and navigation help.
 */

import { useEffect, useState } from 'react';
import { useFocusTrap } from '../../hooks/useKeyboardNavigation';
import { useRef } from 'react';

interface KeyboardShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const KEYBOARD_SHORTCUTS: KeyboardShortcutGroup[] = [
  {
    title: 'Navegación General',
    shortcuts: [
      { keys: ['↑', '↓', '←', '→'], description: 'Navegar por la cuadrícula' },
      { keys: ['Tab'], description: 'Mover entre elementos' },
      { keys: ['Shift', 'Tab'], description: 'Mover hacia atrás' },
      { keys: ['Enter'], description: 'Seleccionar/Activar elemento' },
      { keys: ['Espacio'], description: 'Seleccionar/Colocar elemento' },
      { keys: ['Esc'], description: 'Cancelar acción actual' }
    ]
  },
  {
    title: 'Acciones del Altar',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Guardar altar' },
      { keys: ['Ctrl', 'Shift', 'D'], description: 'Limpiar altar' },
      { keys: ['Ctrl', 'Z'], description: 'Deshacer' },
      { keys: ['Ctrl', 'Y'], description: 'Rehacer' },
      { keys: ['Delete'], description: 'Eliminar elemento seleccionado' }
    ]
  },
  {
    title: 'Panel de Elementos',
    shortcuts: [
      { keys: ['1-5'], description: 'Cambiar categoría' },
      { keys: ['Home'], description: 'Primer elemento' },
      { keys: ['End'], description: 'Último elemento' }
    ]
  },
  {
    title: 'Ayuda',
    shortcuts: [
      { keys: ['Shift', '?'], description: 'Mostrar/Ocultar esta ayuda' }
    ]
  }
];

interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardHelpModal({ isOpen, onClose }: KeyboardHelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Setup focus trap
  useFocusTrap(modalRef, {
    enabled: isOpen,
    returnFocus: true,
    allowOutsideClick: false
  });

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-help-title"
    >
      <div
        ref={modalRef}
        className="bg-gray-900 border-2 border-orange-500 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex items-center justify-between">
          <h2
            id="keyboard-help-title"
            className="text-2xl font-bold text-white flex items-center gap-3"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            Atajos de Teclado
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded-lg p-2"
            aria-label="Cerrar ayuda de teclado"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {KEYBOARD_SHORTCUTS.map((group, groupIndex) => (
              <div
                key={groupIndex}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <h3 className="text-lg font-semibold text-orange-400 mb-4">
                  {group.title}
                </h3>
                <div className="space-y-3">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex gap-2 flex-wrap">
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="px-3 py-1.5 text-sm font-semibold text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm min-w-[2.5rem] text-center"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                      <span className="text-gray-300 text-sm flex-1 text-right">
                        {shortcut.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Tips */}
          <div className="mt-6 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-400 mb-2 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Consejos
            </h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Usa Tab para navegar entre diferentes secciones de la aplicación</li>
              <li>• Las teclas de flecha te permiten moverte por la cuadrícula del altar</li>
              <li>• Presiona Enter o Espacio para colocar un elemento en la posición actual</li>
              <li>• Puedes usar Ctrl+S para guardar tu progreso en cualquier momento</li>
              <li>• La tecla Escape cancela cualquier acción en progreso</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 border-t border-gray-700 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage keyboard help modal state
 */
export function useKeyboardHelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowHelp = () => setIsOpen(true);

    document.addEventListener('altar:show-keyboard-help', handleShowHelp);

    return () => {
      document.removeEventListener('altar:show-keyboard-help', handleShowHelp);
    };
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  };
}
