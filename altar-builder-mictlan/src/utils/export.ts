import html2canvas from 'html2canvas';

/**
 * Export options for altar image generation
 */
export interface ExportOptions {
  /**
   * Image format (png, jpeg, webp)
   */
  format?: 'png' | 'jpeg' | 'webp';

  /**
   * Image quality (0-1) for jpeg/webp
   */
  quality?: number;

  /**
   * Include watermark
   */
  watermark?: boolean;

  /**
   * Watermark text
   */
  watermarkText?: string;

  /**
   * Background color (for transparent areas)
   */
  backgroundColor?: string;

  /**
   * Scale factor for higher resolution
   */
  scale?: number;
}

/**
 * Default export options
 */
const DEFAULT_OPTIONS: ExportOptions = {
  format: 'png',
  quality: 0.95,
  watermark: true,
  watermarkText: 'Altar Builder Mictlán',
  backgroundColor: '#111827',
  scale: 2
};

/**
 * Export altar element to image
 */
export async function exportAltarToImage(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Generate canvas from element
    const canvas = await html2canvas(element, {
      backgroundColor: opts.backgroundColor,
      scale: opts.scale,
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 0,
      removeContainer: true
    });

    // Add watermark if enabled
    if (opts.watermark && opts.watermarkText) {
      addWatermark(canvas, opts.watermarkText);
    }

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        },
        `image/${opts.format}`,
        opts.quality
      );
    });
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('No se pudo exportar la imagen del altar');
  }
}

/**
 * Export altar and download as file
 */
export async function exportAndDownload(
  element: HTMLElement,
  filename: string = 'mi-altar',
  options: ExportOptions = {}
): Promise<void> {
  try {
    const blob = await exportAltarToImage(element, options);
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${options.format || 'png'}`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

/**
 * Export altar to data URL
 */
export async function exportToDataURL(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<string> {
  const blob = await exportAltarToImage(element, options);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Add watermark to canvas
 */
function addWatermark(canvas: HTMLCanvasElement, text: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Save context
  ctx.save();

  // Watermark styling
  const fontSize = Math.max(12, Math.floor(canvas.width / 50));
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = 'rgba(251, 146, 60, 0.3)'; // Orange with transparency
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  // Position at bottom right
  const padding = 10;
  const x = canvas.width - padding;
  const y = canvas.height - padding;

  // Draw watermark
  ctx.fillText(text, x, y);

  // Restore context
  ctx.restore();
}

/**
 * Get estimated file size for export
 */
export async function estimateExportSize(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<number> {
  try {
    const blob = await exportAltarToImage(element, options);
    return blob.size;
  } catch (error) {
    console.error('Size estimation failed:', error);
    return 0;
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Check if export is supported
 */
export function isExportSupported(): boolean {
  try {
    // Check for required APIs
    return (
      typeof document !== 'undefined' &&
      typeof HTMLCanvasElement !== 'undefined' &&
      typeof Blob !== 'undefined' &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function'
    );
  } catch {
    return false;
  }
}

/**
 * Prepare element for export (add temporary styles)
 */
export function prepareElementForExport(element: HTMLElement): () => void {
  // Store original styles
  const originalStyles = {
    position: element.style.position,
    left: element.style.left,
    top: element.style.top
  };

  // Apply export-friendly styles
  element.style.position = 'relative';
  element.style.left = '0';
  element.style.top = '0';

  // Return cleanup function
  return () => {
    element.style.position = originalStyles.position;
    element.style.left = originalStyles.left;
    element.style.top = originalStyles.top;
  };
}
