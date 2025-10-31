/**
 * Memory Manager Utility
 * 
 * Provides memory management capabilities including asset cleanup,
 * garbage collection optimization, and memory leak prevention.
 */

interface MemoryStats {
  used: number
  total: number
  limit: number
  percentage: number
}

interface CleanupResult {
  freedMemory: number
  itemsCleared: number
  success: boolean
}

class MemoryManager {
  private cleanupCallbacks: Map<string, () => void> = new Map()
  private assetCache: Map<string, any> = new Map()
  private memoryThreshold: number = 0.8 // 80% of available memory
  private isMonitoring: boolean = false
  private monitoringInterval: number | null = null

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    
    // Monitor memory every 10 seconds
    this.monitoringInterval = window.setInterval(() => {
      const stats = this.getMemoryStats()
      if (stats && stats.percentage > this.memoryThreshold) {
        console.warn('[MemoryManager] Memory threshold exceeded, triggering cleanup')
        this.performAutomaticCleanup()
      }
    }, 10000)

    // Listen for performance events
    window.addEventListener('performance:cleanup', this.handlePerformanceCleanup.bind(this))
    
    console.log('[MemoryManager] Memory monitoring started')
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    window.removeEventListener('performance:cleanup', this.handlePerformanceCleanup.bind(this))
    
    console.log('[MemoryManager] Memory monitoring stopped')
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats | null {
    if (!('memory' in performance)) {
      return null
    }

    const memory = (performance as any).memory
    const used = memory.usedJSHeapSize
    const total = memory.totalJSHeapSize
    const limit = memory.jsHeapSizeLimit

    return {
      used: Math.round(used / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      limit: Math.round(limit / 1024 / 1024), // MB
      percentage: used / limit
    }
  }

  /**
   * Register a cleanup callback for a specific component or feature
   */
  registerCleanupCallback(key: string, callback: () => void): void {
    this.cleanupCallbacks.set(key, callback)
  }

  /**
   * Unregister a cleanup callback
   */
  unregisterCleanupCallback(key: string): void {
    this.cleanupCallbacks.delete(key)
  }

  /**
   * Perform automatic cleanup when memory threshold is exceeded
   */
  private async performAutomaticCleanup(): Promise<CleanupResult> {
    console.log('[MemoryManager] Starting automatic cleanup')
    
    const initialStats = this.getMemoryStats()
    let itemsCleared = 0

    try {
      // 1. Clear asset cache
      const cacheCleared = this.clearAssetCache()
      itemsCleared += cacheCleared

      // 2. Run registered cleanup callbacks
      for (const [key, callback] of this.cleanupCallbacks) {
        try {
          callback()
          itemsCleared++
          console.log(`[MemoryManager] Executed cleanup for: ${key}`)
        } catch (error) {
          console.error(`[MemoryManager] Cleanup failed for ${key}:`, error)
        }
      }

      // 3. Clear unused DOM elements
      this.cleanupUnusedDOMElements()

      // 4. Force garbage collection if available
      this.forceGarbageCollection()

      // Wait a bit for cleanup to take effect
      await new Promise(resolve => setTimeout(resolve, 1000))

      const finalStats = this.getMemoryStats()
      const freedMemory = initialStats && finalStats 
        ? initialStats.used - finalStats.used 
        : 0

      console.log(`[MemoryManager] Cleanup completed. Freed: ${freedMemory}MB, Items: ${itemsCleared}`)

      return {
        freedMemory,
        itemsCleared,
        success: true
      }
    } catch (error) {
      console.error('[MemoryManager] Cleanup failed:', error)
      return {
        freedMemory: 0,
        itemsCleared,
        success: false
      }
    }
  }

  /**
   * Clear asset cache
   */
  private clearAssetCache(): number {
    const initialSize = this.assetCache.size
    
    // Keep only recently used assets (last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    
    for (const [key, asset] of this.assetCache) {
      if (asset.lastUsed && asset.lastUsed < fiveMinutesAgo) {
        this.assetCache.delete(key)
      }
    }

    const cleared = initialSize - this.assetCache.size
    console.log(`[MemoryManager] Cleared ${cleared} cached assets`)
    return cleared
  }

  /**
   * Clean up unused DOM elements
   */
  private cleanupUnusedDOMElements(): void {
    // Remove detached DOM nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const element = node as Element
          // Check if element is hidden or has no content
          if (element.offsetParent === null && 
              element.style.display !== 'none' && 
              !element.textContent?.trim()) {
            return NodeFilter.FILTER_ACCEPT
          }
          return NodeFilter.FILTER_SKIP
        }
      }
    )

    const nodesToRemove: Node[] = []
    let node: Node | null

    while (node = walker.nextNode()) {
      nodesToRemove.push(node)
    }

    nodesToRemove.forEach(node => {
      try {
        node.parentNode?.removeChild(node)
      } catch (error) {
        // Ignore errors for nodes already removed
      }
    })

    if (nodesToRemove.length > 0) {
      console.log(`[MemoryManager] Removed ${nodesToRemove.length} unused DOM elements`)
    }
  }

  /**
   * Force garbage collection if available
   */
  private forceGarbageCollection(): void {
    // Force GC in Chrome DevTools or if gc is exposed
    if ('gc' in window) {
      try {
        (window as any).gc()
        console.log('[MemoryManager] Forced garbage collection')
      } catch (error) {
        console.warn('[MemoryManager] Could not force garbage collection:', error)
      }
    }
  }

  /**
   * Cache an asset with usage tracking
   */
  cacheAsset(key: string, asset: any): void {
    this.assetCache.set(key, {
      data: asset,
      lastUsed: Date.now(),
      size: this.estimateObjectSize(asset)
    })
  }

  /**
   * Get cached asset and update usage time
   */
  getCachedAsset(key: string): any {
    const cached = this.assetCache.get(key)
    if (cached) {
      cached.lastUsed = Date.now()
      return cached.data
    }
    return null
  }

  /**
   * Estimate object size in bytes (rough approximation)
   */
  private estimateObjectSize(obj: any): number {
    try {
      return new Blob([JSON.stringify(obj)]).size
    } catch {
      return 0
    }
  }

  /**
   * Handle performance cleanup events
   */
  private handlePerformanceCleanup(event: CustomEvent): void {
    console.log('[MemoryManager] Performance cleanup requested:', event.detail)
    this.performAutomaticCleanup()
  }

  /**
   * Clear all cached assets
   */
  clearAllAssets(): void {
    const count = this.assetCache.size
    this.assetCache.clear()
    console.log(`[MemoryManager] Cleared all ${count} cached assets`)
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { count: number; estimatedSize: number } {
    let estimatedSize = 0
    
    for (const [, asset] of this.assetCache) {
      estimatedSize += asset.size || 0
    }

    return {
      count: this.assetCache.size,
      estimatedSize: Math.round(estimatedSize / 1024) // KB
    }
  }

  /**
   * Optimize memory usage for animations
   */
  optimizeAnimations(): void {
    // Dispatch event to reduce animation complexity
    window.dispatchEvent(new CustomEvent('memory:optimize-animations', {
      detail: { action: 'reduce-complexity' }
    }))
  }

  /**
   * Optimize memory usage for mariposas
   */
  optimizeMariposas(): void {
    // Dispatch event to reduce mariposa count
    window.dispatchEvent(new CustomEvent('memory:optimize-mariposas', {
      detail: { action: 'reduce-count' }
    }))
  }

  /**
   * Manual cleanup trigger
   */
  async cleanup(): Promise<CleanupResult> {
    return this.performAutomaticCleanup()
  }
}

// Create singleton instance
export const memoryManager = new MemoryManager()

// Auto-start monitoring in production
if (!import.meta.env.DEV) {
  memoryManager.startMonitoring()
}

export type { MemoryStats, CleanupResult }