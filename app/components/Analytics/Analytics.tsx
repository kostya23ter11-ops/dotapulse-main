'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view
    const track = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer || undefined,
            userAgent: navigator.userAgent,
          }),
        });
      } catch {
        // Silently fail
      }
    };

    track();
  }, [pathname]);

  return null;
}
