import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

/**
 * Loading Spinner Component
 * 
 * Displays a loading spinner with optional message.
 * Supports different sizes and custom styling.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Cargando...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div 
          className={`${sizeClasses[size]} spinner border-4 border-gray-600 border-t-altar-purple rounded-full animate-spin`}
          role="status"
          aria-label="Cargando"
        />
        
        {/* Loading Message */}
        {message && (
          <p className="text-gray-300 text-lg font-medium animate-pulse">
            {message}
          </p>
        )}
        
        {/* Altar Builder Logo/Title */}
        <div className="text-center mt-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-altar-orange to-altar-gold bg-clip-text text-transparent">
            Altar Builder Mictlán
          </h1>
          <p className="text-gray-400 mt-2">
            Construye altares virtuales del Día de los Muertos
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline Loading Spinner
 * 
 * Smaller spinner for inline use within components
 */
export const InlineSpinner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`w-4 h-4 border-2 border-gray-400 border-t-altar-purple rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Cargando"
    />
  )
}