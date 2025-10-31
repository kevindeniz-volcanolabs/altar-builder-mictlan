import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center p-8 max-w-md">
            <div className="mb-6">
              <svg 
                className="w-16 h-16 mx-auto text-red-500 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
              <h1 className="text-2xl font-bold text-red-400 mb-2">
                ¡Oops! Algo salió mal
              </h1>
              <p className="text-gray-300 mb-6">
                Ha ocurrido un error inesperado en la aplicación. 
                Por favor, recarga la página para continuar.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-altar-purple hover:bg-purple-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Recargar Página
              </button>
              
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                  Detalles del error
                </summary>
                <pre className="mt-2 p-3 bg-gray-800 rounded text-xs text-red-300 overflow-auto">
                  {this.state.error?.message}
                  {this.state.error?.stack}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}