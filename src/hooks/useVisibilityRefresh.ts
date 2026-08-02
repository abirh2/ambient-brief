import { useEffect, useRef } from 'react';

interface RefreshCallbackRegistration {
  id: string;
  isStale: () => boolean;
  refresh: () => Promise<void>;
}

export function useVisibilityRefresh(registrations: RefreshCallbackRegistration[] = []) {
  const hiddenTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Record timestamp when app entered background
        hiddenTimeRef.current = Date.now();
      } else {
        // App became visible again
        const wasHiddenMs = hiddenTimeRef.current ? Date.now() - hiddenTimeRef.current : 0;
        hiddenTimeRef.current = null;

        // If hidden for more than 1 minute, check stale items
        if (wasHiddenMs > 60000 && registrations.length > 0) {
          triggerStaggeredRefreshes(registrations);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [registrations]);

  return {
    isTabHidden: typeof document !== 'undefined' ? document.hidden : false,
  };
}

/**
 * Execute stale callbacks sequentially with randomized jitter delay to prevent thundering herd
 */
async function triggerStaggeredRefreshes(registrations: RefreshCallbackRegistration[]) {
  for (const item of registrations) {
    if (item.isStale()) {
      try {
        await item.refresh();
      } catch (err) {
        console.warn(`[VisibilityRefresh] Refresh failed for ${item.id}:`, err);
      }
      // Add a randomized delay (300ms - 800ms) between consecutive API requests
      const jitterDelay = Math.floor(Math.random() * 500) + 300;
      await new Promise((res) => setTimeout(res, jitterDelay));
    }
  }
}
