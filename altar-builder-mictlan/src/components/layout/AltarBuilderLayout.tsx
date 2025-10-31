import React from 'react'

/**
 * Main Layout Component for Altar Builder
 * 
 * This component provides the main application layout structure
 * with header, sidebar, and main content areas.
 */
export const AltarBuilderLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-altar-orange to-altar-gold rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AM</span>
            </div>
            <h1 className="text-xl font-bold text-white">
              Altar Builder Mictlán
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-300 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar - Element Panel */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 p-4">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Elementos</h2>
            
            {/* Category Tabs Placeholder */}
            <div className="flex space-x-2">
              <button className="category-tab category-tab-active">
                Esenciales
              </button>
              <button className="category-tab category-tab-inactive">
                Decorativos
              </button>
            </div>
            
            {/* Elements Grid Placeholder */}
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="element-card">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg mx-auto mb-2"></div>
                  <p className="text-sm text-gray-300 text-center">Elemento {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Tu Altar</h2>
              <p className="text-gray-400">
                Arrastra elementos desde el panel lateral para construir tu altar del Día de los Muertos
              </p>
            </div>
            
            {/* Grid Workspace Placeholder */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="grid grid-cols-9 gap-2 max-w-3xl mx-auto">
                {Array.from({ length: 108 }).map((_, index) => (
                  <div 
                    key={index} 
                    className="grid-cell aspect-square flex items-center justify-center"
                  >
                    <span className="text-xs text-gray-500">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <button className="btn-secondary">
                Limpiar Altar
              </button>
              <button className="btn-primary">
                Guardar Altar
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Elementos colocados: 0</span>
            <span>•</span>
            <span>Nivel 1: Ofrenda</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>En línea</span>
          </div>
        </div>
      </footer>
    </div>
  )
}