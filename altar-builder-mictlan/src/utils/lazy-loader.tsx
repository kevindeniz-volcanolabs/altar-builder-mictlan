/**
 * Lazy Loading Utility
 *
 * Provides utilities for lazy loading components and features
 * with proper error handling and loading states.
 */

import React, { type ComponentType, type LazyExoticComponent } from "react";

interface LazyLoadOptions {
  fallback?: React.ComponentType;
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;
  retryAttempts?: number;
  retryDelay?: number;
}



/**
 * Create a lazy-loaded component with enhanced error handling
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const { retryAttempts = 3, retryDelay = 1000 } = options;

  let attemptCount = 0;

  const enhancedImportFn = async (): Promise<{ default: T }> => {
    try {
      attemptCount++;
      const module = await importFn();

      // Reset attempt count on success
      attemptCount = 0;

      return module;
    } catch (error) {
      console.error(
        `[LazyLoader] Failed to load component (attempt ${attemptCount}):`,
        error
      );

      if (attemptCount < retryAttempts) {
        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attemptCount)
        );
        return enhancedImportFn();
      }

      throw error;
    }
  };

  return React.lazy(enhancedImportFn);
}

/**
 * Default loading component
 */
export const DefaultLoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    <span className="ml-2 text-gray-400">Loading...</span>
  </div>
);

/**
 * Default error boundary component
 */
export const DefaultErrorBoundary: React.FC<{
  error: Error;
  retry: () => void;
}> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-red-400 mb-4">
      <svg
        className="w-12 h-12 mx-auto mb-2"
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
    </div>
    <h3 className="text-lg font-semibold text-gray-200 mb-2">
      Failed to load component
    </h3>
    <p className="text-gray-400 mb-4 text-sm">{error.message}</p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);

/**
 * Higher-order component for lazy loading with suspense and error boundary
 */
export function withLazyLoading<P extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  options: LazyLoadOptions = {}
) {
  const {
    fallback: Fallback = DefaultLoadingComponent,
    errorBoundary: ErrorBoundary = DefaultErrorBoundary,
  } = options;

  return React.forwardRef<any, P>((props, ref) => {
    const [error, setError] = React.useState<Error | null>(null);
    const [retryKey, setRetryKey] = React.useState(0);

    const retry = React.useCallback(() => {
      setError(null);
      setRetryKey((prev) => prev + 1);
    }, []);

    if (error) {
      return <ErrorBoundary error={error} retry={retry} />;
    }

    return (
      <React.Suspense fallback={<Fallback />}>
        <LazyComponent {...props} ref={ref} />
      </React.Suspense>
    );
  });
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>
): Promise<void> {
  // Access the _payload to trigger loading
  const payload = (lazyComponent as any)._payload;

  if (payload && typeof payload._result === "undefined") {
    return payload._result;
  }

  return Promise.resolve();
}

/**
 * Feature flag based lazy loading
 */
export function createFeatureLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  featureFlag: string,
  fallbackComponent?: ComponentType<any>
): LazyExoticComponent<T> | ComponentType<any> {
  // Check if feature is enabled (you can implement your feature flag logic here)
  const isFeatureEnabled = checkFeatureFlag(featureFlag);

  if (!isFeatureEnabled && fallbackComponent) {
    return fallbackComponent;
  }

  return createLazyComponent(importFn);
}

/**
 * Simple feature flag checker (implement your own logic)
 */
function checkFeatureFlag(flag: string): boolean {
  // For now, check localStorage or environment variables
  const envFlag = import.meta.env[`VITE_FEATURE_${flag.toUpperCase()}`];
  const localFlag = localStorage.getItem(`feature_${flag}`);

  return envFlag === "true" || localFlag === "true";
}

/**
 * Lazy load based on viewport intersection
 */
export function createIntersectionLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: IntersectionObserverInit = {}
): React.FC<any> {
  return (props) => {
    const [shouldLoad, setShouldLoad] = React.useState(false);
    const [LazyComponent, setLazyComponent] =
      React.useState<LazyExoticComponent<T> | null>(null);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (!ref.current || shouldLoad) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            setLazyComponent(createLazyComponent(importFn));
            observer.disconnect();
          }
        },
        { threshold: 0.1, ...options }
      );

      observer.observe(ref.current);

      return () => observer.disconnect();
    }, [shouldLoad]);

    if (!shouldLoad) {
      return <div ref={ref} className="min-h-[200px]" />;
    }

    if (!LazyComponent) {
      return <DefaultLoadingComponent />;
    }

    return (
      <React.Suspense fallback={<DefaultLoadingComponent />}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
}

/**
 * Bundle size analyzer for lazy components
 */
export function analyzeBundleSize(
  componentName: string,
  importFn: () => Promise<any>
): void {
  if (import.meta.env.DEV) {
    const startTime = performance.now();

    importFn()
      .then(() => {
        const loadTime = performance.now() - startTime;
        console.log(
          `[LazyLoader] ${componentName} loaded in ${loadTime.toFixed(2)}ms`
        );

        // Estimate bundle size from network timing if available
        const entries = performance.getEntriesByType(
          "resource"
        ) as PerformanceResourceTiming[];
        const recentEntry = entries
          .filter(
            (entry) =>
              entry.name.includes(".js") && entry.startTime > startTime - 100
          )
          .sort((a, b) => b.startTime - a.startTime)[0];

        if (recentEntry && recentEntry.transferSize) {
          console.log(
            `[LazyLoader] ${componentName} bundle size: ~${(
              recentEntry.transferSize / 1024
            ).toFixed(1)}KB`
          );
        }
      })
      .catch((error) => {
        console.error(
          `[LazyLoader] Failed to analyze ${componentName}:`,
          error
        );
      });
  }
}
