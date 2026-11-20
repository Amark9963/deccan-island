'use client';

import type { ReactNode } from 'react';
import { track } from '@vercel/analytics';

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export default function TrackedLink({
  href,
  eventName,
  eventProperties,
  children,
  className,
  target,
  rel,
}: {
  href: string;
  eventName: string;
  eventProperties?: EventProperties;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}) {
  function handleClick() {
    track(eventName, eventProperties);
  }

  return <a href={href} className={className} target={target} rel={rel} onClick={handleClick}>{children}</a>;
}
