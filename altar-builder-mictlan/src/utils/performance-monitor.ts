/**
 * Performance Monitor Utility
 * 
 * Provides comprehensive performance monitoring including FPS tracking,
 * memory usage monitoring, bundle size analysis, and user interaction metrics.
 */

interface PerformanceMetrics {
  fps: number
  memoryUsage: {
    used: number
    total: number
    limit: number
  }
  bundleSize: number
  loadTime: number
  interactionDelay: number
}

interface PerformanceReport {
  timestamp: number
  metrics: PerformanceMetrics
  warnings: string[]
  recommendations: string[]
}

class PerformanceMonitor {
  private fpsCounter: number = 0
  private lastFpsTime: number = 0
  private currentFps: number = 60
  private memoryCheckInterval: number | null = null
  private performanceObserver: PerformanceObserver | null = null
  private isMonitoring: boolean = false

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.startFPSTracking()
    this.startMemoryTracking()
    this.startInteractionTracking()
    
    console.log('[PerformanceMonitor] Monitoring started')
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval)
      this.memoryCheckInterval = null
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
      this.performanceObserver = null
    }

    console.log('[PerformanceMonitor] Monitoring stopped')
  }

  /**
   * Track FPS using requestAnimationFrame
   */
  private startFPSTracking(): void {
    const trackFPS = (timestamp: number) => {
      if (!this.isMonitoring) return

      if (this.lastFpsTime === 0) {
        this.lastFpsTime = timestamp
        this.fpsCounter = 0
      }

      this.fpsCounter++

      if (timestamp - this.lastFpsTime >= 1000) {
        this.currentFps = Math.round((this.fpsCounter * 1000) / (timestamp - this.lastFpsTime))
        this.fpsCounter = 0
        this.lastFpsTime = timestamp

        // Warn if FPS drops below thresholds
        if (this.currentFps < 30) {
          console.warn(`[PerformanceMonitor] Low FPS detected: ${this.currentFps}`)
          this.triggerPerformanceOptimization()
        }
      }

      requestAnimationFrame(trackFPS)
    }

    requestAnimationFrame(trackFPS)
  }

  /**
   * Track memory usage
   */
  private startMemoryTracking(): void {
    if (!('memory' in performance)) {
      console.warn('[PerformanceMonitor] Memory API not available')
      return
    }

    this.memoryCheckInterval = window.setInterval(() => {
      if (!this.isMonitoring) return

      const memory = (performance as any).memory
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024)
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024)

      // Warn if memory usage is high
      if (usedMB > 100) {
        console.warn(`[PerformanceMonitor] High memory usage: ${usedMB}MB`)
        this.triggerMemoryCleanup()
      }

      // Critical memory warning
      if (usedMB > limitMB * 0.8) {
        console.error(`[PerformanceMonitor] Critical memory usage: ${usedMB}MB / ${limitMB}MB`)
        this.triggerMemoryCleanup()
      }
    }, 5000) // Check every 5 seconds
  }

  /**
   * Track user interactions and input delay
   */
  private startInteractionTracking(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('[PerformanceMonitor] PerformanceObserver not available')
      return
    }

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            const fid = entry.processingStart - entry.startTime
            if (fid > 100) {
              console.warn(`[PerformanceMonitor] High First Input Delay: ${fid.toFixed(2)}ms`)
            }
          }

          if (entry.entryType === 'largest-contentful-paint') {
            const lcp = entry.startTime
            if (lcp > 2500) {
              console.warn(`[PerformanceMonitor] Slow Largest Contentful Paint: ${lcp.toFixed(2)}ms`)
            }
          }

          if (entry.entryType === 'layout-shift') {
            const cls = (entry as any).value
            if (cls > 0.1) {
              console.warn(`[PerformanceMonitor] High Cumulative Layout Shift: ${cls.toFixed(3)}`)
            }
          }
        }
      })

      // Observe Core Web Vitals
      this.performanceObserver.observe({ 
        entryTypes: ['first-input', 'largest-contentful-paint', 'layout-shift'] 
      })
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to start interaction tracking:', error)
    }
  }

  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    return this.currentFps
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): { used: number; total: number; limit: number } | null {
    if (!('memory' in performance)) return null

    const memory = (performance as any).memory
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
    }
  }

  /**
   * Get bundle size information
   */
  getBundleSize(): number {
    // Estimate bundle size from navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      return navigation.transferSize || 0
    }
    return 0
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): PerformanceReport {
    const memory = this.getMemoryUsage()
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    const metrics: PerformanceMetrics = {
      fps: this.currentFps,
      memoryUsage: memory || { used: 0, total: 0, limit: 0 },
      bundleSize: this.getBundleSize(),
      loadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
      interactionDelay: 0 // Would need to track this over time
    }

    const warnings: string[] = []
    const recommendations: string[] = []

    // Analyze metrics and generate warnings/recommendations
    if (metrics.fps < 30) {
      warnings.push(`Low FPS: ${metrics.fps}`)
      recommendations.push('Reduce animation complexity or element count')
    }

    if (memory && memory.used > 100) {
      warnings.push(`High memory usage: ${memory.used}MB`)
      recommendations.push('Clear unused assets and optimize memory usage')
    }

    if (metrics.loadTime > 3000) {
      warnings.push(`Slow load time: ${metrics.loadTime.toFixed(0)}ms`)
      recommendations.push('Optimize bundle size and implement code splitting')
    }

    if (metrics.bundleSize > 500 * 1024) {
      warnings.push(`Large bundle size: ${(metrics.bundleSize / 1024).toFixed(0)}KB`)
      recommendations.push('Implement lazy loading and tree shaking')
    }

    return {
      timestamp: Date.now(),
      metrics,
      warnings,
      recommendations
    }
  }

  /**
   * Trigger performance optimization measures
   */
  private triggerPerformanceOptimization(): void {
    // Dispatch custom event for performance optimization
    window.dispatchEvent(new CustomEvent('performance:optimize', {
      detail: { fps: this.currentFps }
    }))
  }

  /**
   * Trigger memory cleanup measures
   */
  private triggerMemoryCleanup(): void {
    // Dispatch custom event for memory cleanup
    window.dispatchEvent(new CustomEvent('performance:cleanup', {
      detail: this.getMemoryUsage()
    }))
  }

  /**
   * Track bundle size and loading performance
   */
  trackBundleSize(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && entry.name.includes('.js')) {
            const size = (entry as any).transferSize
            if (size > 100 * 1024) { // > 100KB
              console.warn(`[PerformanceMonitor] Large JS bundle: ${entry.name} (${(size / 1024).toFixed(0)}KB)`)
            }
          }
        }
      })

      observer.observe({ entryTypes: ['resource'] })
    }
  }

  /**
   * Track user interactions for performance impact
   */
  trackUserInteractions(): void {
    const interactionTypes = ['click', 'keydown', 'scroll', 'touchstart']
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        const startTime = performance.now()
        
        // Use requestIdleCallback to measure impact
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            const endTime = performance.now()
            const duration = endTime - startTime
            
            if (duration > 16) { // > 1 frame at 60fps
              console.warn(`[PerformanceMonitor] Slow ${type} interaction: ${duration.toFixed(2)}ms`)
            }
          })
        }
      }, { passive: true })
    })
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Auto-start monitoring in development
if (import.meta.env.DEV) {
  performanceMonitor.startMonitoring()
  performanceMonitor.trackBundleSize()
  performanceMonitor.trackUserInteractions()
}

export type { PerformanceMetrics, PerformanceReport }