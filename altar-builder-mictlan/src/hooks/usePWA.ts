import { useEffect, useCallback, useState } from 'react';
import { useAltarStore } from '../store/useAltarStore';

/**
 * Extended BeforeInstallPromptEvent interface
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/**
 * Hook for managing PWA functionality and offline status
 */
export function usePWA() {
  const setOfflineStatus = useAltarStore(state => state.setOfflineStatus);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('App is online');
      setOfflineStatus(false);
    };

    const handleOffline = () => {
      console.log('App is offline');
      setOfflineStatus(true);
    };

    // Set initial status
    setOfflineStatus(!navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus]);

  return {
    isOnline: navigator.onLine
  };
}

/**
 * Hook for managing PWA installation
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      console.log('PWA install prompt ready');
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome} the install prompt`);

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === 'accepted';
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    promptInstall
  };
}

/**
 * Hook for managing service worker updates
 */
export function usePWAUpdate() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // Check for updates periodically
        const checkForUpdates = () => {
          reg.update().catch((error) => {
            console.error('Error checking for updates:', error);
          });
        };

        // Check for updates every hour
        const intervalId = setInterval(checkForUpdates, 60 * 60 * 1000);

        // Check for updates when tab becomes visible
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            checkForUpdates();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          clearInterval(intervalId);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      });

      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setNeedsUpdate(true);
        console.log('New service worker available');
      });
    }
  }, []);

  const applyUpdate = useCallback(() => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  return {
    needsUpdate,
    applyUpdate
  };
}
