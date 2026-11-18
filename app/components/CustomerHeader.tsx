import type { ReactNode } from 'react';

type CustomerHeaderProps = {
  actionHref?: string;
  actionLabel?: ReactNode;
  actionAriaLabel?: string;
};

export default function CustomerHeader({
  actionHref,
  actionLabel,
  actionAriaLabel,
}: CustomerHeaderProps) {
  return (
    <header className="customer-header">
      <a className="customer-brand" href="/" aria-label="Deccan Island home">
        <img
          src="/deccan-island-logo.svg"
          alt="Deccan Island — Hyderabadi Dum Kitchen"
        />
      </a>
      {actionHref && actionLabel ? (
        <a
          className="customer-header-action"
          href={actionHref}
          aria-label={actionAriaLabel}
        >
          {actionLabel}
        </a>
      ) : null}
    </header>
  );
}
