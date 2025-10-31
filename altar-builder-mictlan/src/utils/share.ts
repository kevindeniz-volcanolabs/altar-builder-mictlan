/**
 * Share options for altar sharing
 */
export interface ShareOptions {
  /**
   * Title for the share
   */
  title?: string;

  /**
   * Description text
   */
  text?: string;

  /**
   * URL to share
   */
  url?: string;

  /**
   * Image file to share
   */
  file?: File;
}

/**
 * Share result
 */
export interface ShareResult {
  /**
   * Whether share was successful
   */
  success: boolean;

  /**
   * Share method used
   */
  method: 'native' | 'clipboard' | 'download' | 'fallback';

  /**
   * Error message if failed
   */
  error?: string;
}

/**
 * Check if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function'
  );
}

/**
 * Check if Web Share API supports files
 */
export function isWebShareFilesSupported(): boolean {
  if (!isWebShareSupported()) return false;

  try {
    // Check if navigator.canShare exists and supports files
    return (
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [] as File[] })
    );
  } catch {
    return false;
  }
}

/**
 * Share using native Web Share API
 */
export async function shareNative(options: ShareOptions): Promise<ShareResult> {
  if (!isWebShareSupported()) {
    return {
      success: false,
      method: 'native',
      error: 'Web Share API no está soportado'
    };
  }

  try {
    const shareData: ShareData = {};

    if (options.title) shareData.title = options.title;
    if (options.text) shareData.text = options.text;
    if (options.url) shareData.url = options.url;

    // Add file if supported
    if (options.file && isWebShareFilesSupported()) {
      if (navigator.canShare && navigator.canShare({ files: [options.file] })) {
        shareData.files = [options.file];
      }
    }

    await navigator.share(shareData);

    return {
      success: true,
      method: 'native'
    };
  } catch (error) {
    // User cancelled or error occurred
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    // AbortError means user cancelled, not a real error
    if (errorMessage.includes('AbortError') || errorMessage.includes('canceled')) {
      return {
        success: false,
        method: 'native',
        error: 'Compartir cancelado por el usuario'
      };
    }

    return {
      success: false,
      method: 'native',
      error: errorMessage
    };
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern Clipboard API
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);

    return success;
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
}

/**
 * Copy image to clipboard (if supported)
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.write === 'function' &&
      ClipboardItem
    ) {
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Copy image to clipboard failed:', error);
    return false;
  }
}

/**
 * Share with fallback methods
 */
export async function shareWithFallback(
  options: ShareOptions
): Promise<ShareResult> {
  // Try native share first
  if (isWebShareSupported()) {
    const result = await shareNative(options);
    if (result.success) {
      return result;
    }
    // If user didn't cancel, fall through to alternatives
    if (!result.error?.includes('cancelado')) {
      console.warn('Native share failed, trying fallback:', result.error);
    }
  }

  // Try clipboard if URL is provided
  if (options.url) {
    const copied = await copyToClipboard(options.url);
    if (copied) {
      return {
        success: true,
        method: 'clipboard'
      };
    }
  }

  // Fallback to showing share modal
  return {
    success: false,
    method: 'fallback',
    error: 'Se requiere compartir manualmente'
  };
}

/**
 * Generate share text for altar
 */
export function generateShareText(altarName: string, elementCount: number): string {
  return `¡Mira mi altar "${altarName}" con ${elementCount} elementos! Construido con Altar Builder Mictlán 🕯️💀🌺`;
}

/**
 * Generate share URL
 */
export function generateShareURL(baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}?ref=share`;
}

/**
 * Convert blob to File object for sharing
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Get social media share URLs
 */
export function getSocialShareURLs(
  url: string,
  text: string
): Record<string, string> {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  };
}

/**
 * Open social media share in new window
 */
export function openSocialShare(
  platform: keyof ReturnType<typeof getSocialShareURLs>,
  url: string,
  text: string
): void {
  const shareUrls = getSocialShareURLs(url, text);
  const shareUrl = shareUrls[platform];

  if (shareUrl) {
    window.open(
      shareUrl,
      '_blank',
      'width=600,height=400,resizable=yes,scrollbars=yes'
    );
  }
}

/**
 * Check if sharing is supported (any method)
 */
export function isSharingSupported(): boolean {
  return (
    isWebShareSupported() ||
    (typeof navigator.clipboard !== 'undefined' &&
      typeof navigator.clipboard.writeText === 'function') ||
    typeof document.execCommand === 'function'
  );
}

/**
 * Get share capabilities
 */
export interface ShareCapabilities {
  nativeShare: boolean;
  nativeShareFiles: boolean;
  clipboard: boolean;
  clipboardImage: boolean;
}

export function getShareCapabilities(): ShareCapabilities {
  return {
    nativeShare: isWebShareSupported(),
    nativeShareFiles: isWebShareFilesSupported(),
    clipboard:
      typeof navigator.clipboard !== 'undefined' &&
      typeof navigator.clipboard.writeText === 'function',
    clipboardImage:
      typeof navigator.clipboard !== 'undefined' &&
      typeof navigator.clipboard.write === 'function' &&
      typeof ClipboardItem !== 'undefined'
  };
}
