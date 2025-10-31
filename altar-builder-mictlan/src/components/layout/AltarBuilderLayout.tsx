import { useCallback, useState, useRef } from 'react';
import { GridWorkspace } from '../grid/GridWorkspace';
import { ElementPanel } from '../elements/ElementPanel';
import { SettingsModal } from '../settings/SettingsModal';
import { AchievementsModal } from '../achievements/AchievementsModal';
import { AchievementToast } from '../achievements/AchievementToast';
import { GalleryModal } from '../gallery/GalleryModal';
import { SaveAltarDialog } from '../gallery/SaveAltarDialog';
import { StorageManager } from '../gallery/StorageManager';
import { ExportModal } from '../export/ExportModal';
import { MariposasCanvas } from '../mariposas/MariposasCanvas';
import { KeyboardHelpModal, useKeyboardHelpModal } from '../accessibility/KeyboardHelpModal';
import { useAltarStore, usePlacedElements, useGridDimensions } from '../../store/useAltarStore';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { usePersistence, useStorageWarnings } from '../../hooks/usePersistence';
import { usePWA, usePWAInstall, usePWAUpdate } from '../../hooks/usePWA';
import { useAnimations } from '../../hooks/useAnimations';
import { useAchievementNotifications } from '../../hooks/useAchievementNotifications';
import { useAltarKeyboardShortcuts, useKeyboardFocusIndicator, useScreenReaderAnnouncement } from '../../hooks/useKeyboardNavigation';
import type { OfrendarElement, GridPosition, SavedAltar } from '../../types';

/**
 * Main Layout Component for Altar Builder
 *
 * This component provides the main application layout structure
 * with header, element panel, grid workspace, and status bar.
 */
export function AltarBuilderLayout() {
  const placedElements = usePlacedElements();
  const gridDimensions = useGridDimensions();
  const {
    placeElement,
    clearAltar,
    removeElement,
    restoreAltar,
    ui: { isOffline }
  } = useAltarStore();

  const { validateDrop } = useDragAndDrop();
  const { clearCurrentAltar } = usePersistence();
  useStorageWarnings();

  // PWA functionality
  usePWA(); // Monitors online/offline status
  const { isInstallable, promptInstall } = usePWAInstall();
  const { needsUpdate, applyUpdate } = usePWAUpdate();

  // Initialize animations
  useAnimations();

  // Achievement notifications
  const { currentAchievement, dismissCurrentAchievement } = useAchievementNotifications();

  // Accessibility features
  useAltarKeyboardShortcuts();
  useKeyboardFocusIndicator();
  const announce = useScreenReaderAnnouncement();
  const keyboardHelp = useKeyboardHelpModal();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Handle element placement
  const handleElementPlace = useCallback((element: OfrendarElement, position: GridPosition) => {
    placeElement(element, position);
  }, [placeElement]);

  // Handle element removal
  const handleElementRemove = useCallback((elementId: string) => {
    removeElement(elementId);
  }, [removeElement]);

  // Handle clear altar with confirmation
  const handleClearAltar = useCallback(() => {
    if (placedElements.length === 0) return;

    if (window.confirm('¿Estás seguro de que quieres limpiar el altar? Esta acción no se puede deshacer.')) {
      clearAltar();
      clearCurrentAltar();
    }
  }, [clearAltar, clearCurrentAltar, placedElements.length]);

  // Handle save altar
  const handleSaveAltar = useCallback(() => {
    if (placedElements.length === 0) {
      alert('No hay elementos en el altar para guardar');
      return;
    }
    setShowSaveDialog(true);
  }, [placedElements.length]);

  // Handle load altar from gallery
  const handleLoadAltar = useCallback((altar: SavedAltar) => {
    if (placedElements.length > 0) {
      if (!window.confirm('¿Cargar este altar? Se perderán los elementos actuales no guardados.')) {
        return;
      }
    }
    clearAltar();
    restoreAltar(altar.elements);
  }, [placedElements.length, clearAltar, restoreAltar]);

  // Handle settings
  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/70 backdrop-blur-sm border-b border-orange-900/30 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">🪔</span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                  Altar Builder Mictlán
                </h1>
                <p className="text-xs text-gray-400 hidden md:block">
                  Construye tu altar del Día de los Muertos
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Element Count */}
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-gray-800/50 rounded-lg">
                <span className="text-lg">🕯️</span>
                <span className="text-sm font-medium text-gray-300">
                  {placedElements.length} elementos
                </span>
              </div>

              {/* Update Available Notification */}
              {needsUpdate && (
                <button
                  onClick={applyUpdate}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
                  title="Nueva versión disponible"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden md:inline">Actualizar</span>
                </button>
              )}

              {/* Install PWA Button */}
              {isInstallable && (
                <button
                  onClick={promptInstall}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
                  title="Instalar aplicación"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden md:inline">Instalar</span>
                </button>
              )}

              {/* Gallery Button */}
              <button
                onClick={() => setShowGallery(true)}
                className="p-2 text-gray-300 hover:text-orange-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                aria-label="Galería"
                title="Galería de altares"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>

              {/* Storage Button */}
              <button
                onClick={() => setShowStorage(true)}
                className="p-2 text-gray-300 hover:text-orange-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                aria-label="Almacenamiento"
                title="Administración de almacenamiento"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </button>

              {/* Keyboard Help Button */}
              <button
                onClick={keyboardHelp.open}
                className="p-2 text-gray-300 hover:text-orange-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200 touch-target"
                aria-label="Ayuda de teclado"
                title="Atajos de teclado (Shift + ?)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>

              {/* Settings Button */}
              <button
                onClick={handleOpenSettings}
                className="p-2 text-gray-300 hover:text-orange-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                aria-label="Configuración"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Element Panel - Sidebar on desktop, collapsible on mobile */}
        <aside className="lg:w-96 border-b lg:border-b-0 lg:border-r border-orange-900/20 bg-gray-900/50">
          <ElementPanel />
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Workspace Header */}
          <div className="p-4 border-b border-orange-900/20 bg-gray-900/30">
            <div className="max-w-screen-xl mx-auto">
              <h2 className="text-xl font-bold text-orange-400 mb-1">
                Tu Altar
              </h2>
              <p className="text-sm text-gray-400">
                Arrastra elementos desde el panel lateral para construir tu altar
              </p>
            </div>
          </div>

          {/* Grid Workspace */}
          <div className="flex-1 overflow-auto p-4">
            <div className="max-w-screen-xl mx-auto h-full">
              <div ref={gridRef} className="bg-gray-900/50 rounded-xl border-2 border-orange-900/20 shadow-2xl overflow-hidden h-full relative">
                <GridWorkspace
                  dimensions={gridDimensions}
                  elements={placedElements}
                  onElementPlace={handleElementPlace}
                  onElementRemove={handleElementRemove}
                  validateDrop={validateDrop}
                  className="h-full"
                />
                {/* Mariposas overlay */}
                <MariposasCanvas enabled={placedElements.length > 0} maxMariposas={5} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-orange-900/20 bg-gray-900/30">
            <div className="max-w-screen-xl mx-auto flex flex-wrap justify-center gap-3">
              <button
                onClick={handleClearAltar}
                disabled={placedElements.length === 0}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-700"
              >
                🗑️ Limpiar Altar
              </button>

              <button
                onClick={handleSaveAltar}
                disabled={placedElements.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                💾 Guardar Altar
              </button>

              <button
                onClick={() => setShowExport(true)}
                disabled={placedElements.length === 0}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                📸 Exportar
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <footer className="bg-gray-900/70 backdrop-blur-sm border-t border-orange-900/30 px-4 py-2 shadow-lg">
        <div className="flex flex-wrap items-center justify-between max-w-screen-2xl mx-auto text-xs md:text-sm text-gray-400 gap-2">
          <div className="flex items-center space-x-3 md:space-x-4">
            <span className="flex items-center gap-1">
              <span className="hidden md:inline">Elementos:</span>
              <span className="font-medium text-orange-400">{placedElements.length}</span>
            </span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">
              Grid: {gridDimensions.cols}×{gridDimensions.rows}
            </span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1">
              <span className="text-lg">🎯</span>
              <span className="hidden md:inline">Nivel 1: Ofrenda</span>
            </span>
            <span className="hidden md:inline">•</span>
            <button
              onClick={() => setShowAchievements(true)}
              className="flex items-center gap-1 hover:text-orange-400 transition-colors cursor-pointer"
            >
              <span className="text-lg">🏆</span>
              <span className="hidden md:inline">Logros</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span>{isOffline ? 'Sin conexión' : 'En línea'}</span>
          </div>
        </div>
      </footer>

      {/* Save Altar Dialog */}
      <SaveAltarDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        elements={placedElements}
        gridRef={gridRef}
      />

      {/* Gallery Modal */}
      <GalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onLoadAltar={handleLoadAltar}
      />

      {/* Storage Manager */}
      <StorageManager
        isOpen={showStorage}
        onClose={() => setShowStorage(false)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        gridRef={gridRef}
        altarName="Mi Altar"
        elementCount={placedElements.length}
      />

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={handleCloseSettings} />

      {/* Achievements Modal */}
      <AchievementsModal isOpen={showAchievements} onClose={() => setShowAchievements(false)} />

      {/* Achievement Toast Notification */}
      {currentAchievement && (
        <AchievementToast
          achievement={currentAchievement}
          onClose={dismissCurrentAchievement}
        />
      )}

      {/* Keyboard Help Modal */}
      <KeyboardHelpModal isOpen={keyboardHelp.isOpen} onClose={keyboardHelp.close} />
    </div>
  );
}

AltarBuilderLayout.displayName = 'AltarBuilderLayout';
