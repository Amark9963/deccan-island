const timezone = 'Asia/Kuala_Lumpur';

export function formatServiceDate(value: string) {
  return new Intl.DateTimeFormat('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: timezone,
  }).format(new Date(`${value}T12:00:00+08:00`));
}

export function formatBookingDeadline(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(new Date(value));
}
