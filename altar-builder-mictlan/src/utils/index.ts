import type { GridPosition, GridDimensions } from '../types'

/**
 * Utility functions for Altar Builder Mictlán
 */

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Check if a grid position is valid within dimensions
 */
export const isValidPosition = (
  position: GridPosition,
  dimensions: GridDimensions
): boolean => {
  return (
    position.row >= 0 &&
    position.row < dimensions.rows &&
    position.col >= 0 &&
    position.col < dimensions.cols
  )
}

/**
 * Convert pixel coordinates to grid position
 */
export const pixelToGridPosition = (
  x: number,
  y: number,
  cellSize: number,
  gridOffset: { x: number; y: number }
): GridPosition => {
  const col = Math.floor((x - gridOffset.x) / cellSize)
  const row = Math.floor((y - gridOffset.y) / cellSize)
  
  return { row, col }
}

/**
 * Convert grid position to pixel coordinates
 */
export const gridToPixelPosition = (
  position: GridPosition,
  cellSize: number,
  gridOffset: { x: number; y: number }
): { x: number; y: number } => {
  return {
    x: gridOffset.x + position.col * cellSize,
    y: gridOffset.y + position.row * cellSize
  }
}

/**
 * Calculate responsive grid dimensions based on viewport width
 */
export const getResponsiveGridDimensions = (viewportWidth: number): GridDimensions => {
  if (viewportWidth < 768) {
    return { rows: 8, cols: 6 }
  } else if (viewportWidth < 1024) {
    return { rows: 10, cols: 9 }
  } else {
    return { rows: 12, cols: 9 }
  }
}

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Calculate distance between two grid positions
 */
export const calculateDistance = (pos1: GridPosition, pos2: GridPosition): number => {
  const dx = pos1.col - pos2.col
  const dy = pos1.row - pos2.row
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Check if two positions are adjacent (including diagonally)
 */
export const arePositionsAdjacent = (pos1: GridPosition, pos2: GridPosition): boolean => {
  const distance = calculateDistance(pos1, pos2)
  return distance <= Math.sqrt(2) // Adjacent or diagonal
}

/**
 * Get all adjacent positions to a given position
 */
export const getAdjacentPositions = (
  position: GridPosition,
  dimensions: GridDimensions
): GridPosition[] => {
  const adjacent: GridPosition[] = []
  
  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
      if (rowOffset === 0 && colOffset === 0) continue
      
      const newPos = {
        row: position.row + rowOffset,
        col: position.col + colOffset
      }
      
      if (isValidPosition(newPos, dimensions)) {
        adjacent.push(newPos)
      }
    }
  }
  
  return adjacent
}

/**
 * Clamp a number between min and max values
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation between two values
 */
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * clamp(factor, 0, 1)
}

/**
 * Check if the user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Check if the user prefers high contrast
 */
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches
}

/**
 * Get viewport dimensions
 */
export const getViewportDimensions = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

/**
 * Check if device is mobile based on viewport width
 */
export const isMobile = (): boolean => {
  return window.innerWidth < 768
}

/**
 * Check if device is tablet based on viewport width
 */
export const isTablet = (): boolean => {
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

/**
 * Check if device is desktop based on viewport width
 */
export const isDesktop = (): boolean => {
  return window.innerWidth >= 1024
}

/**
 * Convert base64 to blob for file operations
 */
export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64.split(',')[1])
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

/**
 * Download a file from blob data
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  }
}

/**
 * Check if Web Share API is supported
 */
export const isWebShareSupported = (): boolean => {
  return 'share' in navigator
}

/**
 * Share content using Web Share API
 */
export const shareContent = async (data: ShareData): Promise<boolean> => {
  try {
    if (isWebShareSupported()) {
      await navigator.share(data)
      return true
    }
    return false
  } catch (error) {
    return false
  }
}