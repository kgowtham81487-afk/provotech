'use client';

import React, { useEffect } from 'react';

interface AdBannerProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: boolean;
  className?: string;
}

export function AdBanner({
  slotId,
  format = 'auto',
  responsive = true,
  className = '',
}: AdBannerProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  const isConfigured =
    clientId && !clientId.includes('PENDING') && clientId.startsWith('ca-pub-') && slotId;

  useEffect(() => {
    if (isConfigured && typeof window !== 'undefined') {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.warn('AdSense push error:', err);
      }
    }
  }, [isConfigured]);

  if (!isConfigured) {
    // In development or when unconfigured, collapse or render subtle development placeholder
    if (process.env.NODE_ENV === 'development') {
      return (
        <aside
          aria-label="Advertisement Placeholder"
          className={`border border-dashed border-surface-border/60 bg-surface/30 rounded-lg p-3 text-center text-xs text-slate-500 min-h-[90px] flex items-center justify-center ${className}`}
        >
          <span>[AdSense Placement Slot — Ready for Production Config]</span>
        </aside>
      );
    }
    return null;
  }

  return (
    <aside aria-label="Sponsored Content" className={`my-4 overflow-hidden text-center min-h-[90px] ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </aside>
  );
}
