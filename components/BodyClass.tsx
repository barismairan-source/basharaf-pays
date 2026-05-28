'use client';

import { useEffect } from 'react';

/**
 * Sets a class on <body> for the lifetime of the component.
 * Used to scope the menu's custom display fonts (.is-menu) and the
 * admin panel's neutral typography (.is-admin) without needing a
 * separate route group / layout split.
 */
export function BodyClass({ className }: { className: string }) {
  useEffect(() => {
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, [className]);

  return null;
}
