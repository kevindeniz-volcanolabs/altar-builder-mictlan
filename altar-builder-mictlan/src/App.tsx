import React from 'react'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { AltarBuilderLayout } from './components/layout/AltarBuilderLayout'

/**
 * Main App Component for Altar Builder Mictlán
 * 
 * This is the root component that sets up the application structure
 * with error boundaries, loading states, and the main layout.
 */
function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <React.Suspense fallback={<LoadingSpinner />}>
          <AltarBuilderLayout />
        </React.Suspense>
      </div>
    </ErrorBoundary>
  )
}

export default App