'use client';

/**
 * Lightweight inline SVG icons used across the AAOP "Fusion MCP" UI.
 * Each icon takes a `size` (px) and inherits `currentColor`, so it picks up the
 * surrounding MUI / theme color naturally.
 */

import type { SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'size'> { size?: number; }

const make = (path: React.ReactNode) => function Icon({ size = 16, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {path}
    </svg>
  );
};

export const IconGrid       = make(<><rect x="3"  y="3"  width="7" height="7" /><rect x="14" y="3"  width="7" height="7" /><rect x="3"  y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>);
export const IconWorkflow   = make(<><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="M8 6h8M6 8v6a2 2 0 0 0 2 2h2M18 8v6a2 2 0 0 1-2 2h-2" /></>);
export const IconBolt       = make(<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />);
export const IconShield     = make(<path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3z" />);
export const IconUsers      = make(<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 19c0-3 3-5 6-5s6 2 6 5M14 19c0-2 2-3.5 4-3.5s3 1 3 3" /></>);
export const IconKey        = make(<><circle cx="8" cy="14" r="3" /><path d="M11 14h10M17 14v3M14 14v2" /></>);
export const IconScroll     = make(<><path d="M5 4h11a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V4z" /><path d="M9 8h7M9 12h7M9 16h4" /></>);
export const IconFlag       = make(<><path d="M5 3v18" /><path d="M5 4h11l-2 4 2 4H5" /></>);
export const IconActivity   = make(<path d="M3 12h4l3-8 4 16 3-8h4" />);
export const IconAlert      = make(<><path d="M12 4 2 20h20L12 4z" /><path d="M12 10v5M12 17h.01" /></>);
export const IconDeploy     = make(<><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><rect x="4" y="15" width="16" height="6" rx="1.5" /></>);
export const IconAgent      = make(<><circle cx="12" cy="9" r="4" /><path d="M5 21c0-4 3-6 7-6s7 2 7 6" /><circle cx="12" cy="9" r="1.2" fill="currentColor" /></>);
export const IconChevron    = make(<path d="m9 6 6 6-6 6" />);
export const IconSearch     = make(<><circle cx="11" cy="11" r="6" /><path d="m20 20-4-4" /></>);
export const IconBell       = make(<><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16z" /><path d="M10 20a2 2 0 0 0 4 0" /></>);
export const IconMenu       = make(<><path d="M3 6h18M3 12h18M3 18h18" /></>);
export const IconClose      = make(<><path d="m6 6 12 12M18 6 6 18" /></>);
export const IconPlay       = make(<path d="m6 4 14 8L6 20V4z" />);
export const IconPause      = make(<><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></>);
export const IconStop       = make(<rect x="5" y="5" width="14" height="14" rx="1.5" />);
export const IconRefresh    = make(<><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 4v4h-4" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 20v-4h4" /></>);
export const IconCheck      = make(<path d="m5 12 4 4 10-10" />);
export const IconX          = IconClose;
export const IconClock      = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IconLogo       = make(<><polygon points="12,2 21,7 21,17 12,22 3,17 3,7" /><circle cx="12" cy="12" r="2" fill="currentColor" /></>);
export const IconLogout     = make(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>);
export const IconCog        = make(<><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.13-1.32l2-1.55-2-3.46-2.36.95a7 7 0 0 0-2.28-1.32l-.36-2.5h-4l-.36 2.5a7 7 0 0 0-2.28 1.32l-2.36-.95-2 3.46 2 1.55A7 7 0 0 0 5 12c0 .45.05.88.13 1.32l-2 1.55 2 3.46 2.36-.95a7 7 0 0 0 2.28 1.32l.36 2.5h4l.36-2.5a7 7 0 0 0 2.28-1.32l2.36.95 2-3.46-2-1.55c.08-.44.13-.87.13-1.32z" /></>);
export const IconSparkles   = make(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></>);
export const IconFingerprint= make(<><path d="M12 4a8 8 0 0 0-8 8" /><path d="M12 4a8 8 0 0 1 8 8" /><path d="M8 12a4 4 0 0 1 8 0v4a3 3 0 0 0 3 3" /><path d="M8 12v6" /><path d="M12 12v8" /></>);
export const IconKeyShield  = make(<><circle cx="9" cy="14" r="3" /><path d="M12 14h6M18 14v3" /><path d="M12 4 4 6v6c0 5 3.5 8.5 8 9" /></>);
export const IconChip       = make(<><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 4v2M15 4v2M9 18v2M15 18v2M4 9h2M4 15h2M18 9h2M18 15h2" /><rect x="9" y="9" width="6" height="6" /></>);
