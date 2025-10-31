import React, { useEffect, useState } from 'react'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { AltarBuilderLayout } from './components/layout/AltarBuilderLayout'
import { initializeMCP, cleanupMCP } from './engines/mcp-config'
import { performanceMonitor } from './utils/performance-monitor'
import { memoryManager } from './utils/memory-manager'
import { initializeProgressiveLoading } from './components/lazy'

/**
 * Main App Component for Altar Builder Mictlán
 * 
 * This is the root component that sets up the application structure
 * with error boundaries, loading states, MCP initialization, and the main layout.
 */
function App() {
  const [mcpInitialized, setMcpInitialized] = useState(false)
  const [mcpError, setMcpError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const initializeApp = async () => {
      try {
        // Start performance monitoring
        performanceMonitor.startMonitoring()
        memoryManager.startMonitoring()
        
        // Initialize progressive loading
        initializeProgressiveLoading()
        
        // Initialize MCP system
        await initializeMCP()
        
        if (mounted) {
          setMcpInitialized(true)
          console.log('[App] Application initialized successfully')
        }
      } catch (error) {
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error'
          setMcpError(errorMessage)
          console.error('[App] Application initialization failed:', error)
          
          // Continue without MCP for graceful degradation
          setMcpInitialized(true)
        }
      }
    }

    initializeApp()

    // Setup performance optimization listeners
    const handlePerformanceOptimize = (event: CustomEvent) => {
      console.log('[App] Performance optimization triggered:', event.detail)
      // Reduce animation complexity, mariposa count, etc.
    }

    const handleMemoryCleanup = (event: CustomEvent) => {
      console.log('[App] Memory cleanup triggered:', event.detail)
      // Clear caches, reduce memory usage
    }

    window.addEventListener('performance:optimize', handlePerformanceOptimize as EventListener)
    window.addEventListener('performance:cleanup', handleMemoryCleanup as EventListener)

    // Cleanup on unmount
    return () => {
      mounted = false
      performanceMonitor.stopMonitoring()
      memoryManager.stopMonitoring()
      cleanupMCP()
      
      window.removeEventListener('performance:optimize', handlePerformanceOptimize as EventListener)
      window.removeEventListener('performance:cleanup', handleMemoryCleanup as EventListener)
    }
  }, [])

  // Show loading spinner while MCP initializes
  if (!mcpInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-300">Initializing Kiro MCP system...</p>
          {mcpError && (
            <p className="mt-2 text-yellow-400 text-sm">
              Warning: {mcpError}
            </p>
          )}
        </div>
      </div>
    )
  }

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