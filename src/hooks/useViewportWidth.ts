import { useEffect, useState } from 'react';

export interface ViewportInfo {
  width: number;
  height: number;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'ultrawide';
}

export function useViewportWidth(): ViewportInfo {
  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return { width: 1440, height: 900, breakpoint: 'xl' };
    }
    return getViewportInfo(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    function handleResize() {
      setViewport(getViewportInfo(window.innerWidth, window.innerHeight));
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
}

function getViewportInfo(width: number, height: number): ViewportInfo {
  let breakpoint: ViewportInfo['breakpoint'] = 'xs';
  if (width >= 2560) breakpoint = 'ultrawide';
  else if (width >= 1536) breakpoint = '2xl';
  else if (width >= 1280) breakpoint = 'xl';
  else if (width >= 1024) breakpoint = 'lg';
  else if (width >= 768) breakpoint = 'md';
  else if (width >= 640) breakpoint = 'sm';

  return { width, height, breakpoint };
}
