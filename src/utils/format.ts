export function formatDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTime(value?: string | Date | null) {
  if (!value) return '-';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// "super_admin" -> "Super Admin".
export function formatRole(role?: string | null) {
  if (!role) return '-';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase());
}

export function formatCoordinates(latitude?: number, longitude?: number) {
  if (latitude == null || longitude == null) return '-';
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

// "Rs. 1,23,456" formatting. Rounds to whole rupees by default; pass
// `round: false` for a site that needs the unrounded value.
export function formatCurrency(value: number | string | null | undefined, options?: { round?: boolean }) {
  const amount = Number(value) || 0;
  const resolved = options?.round === false ? amount : Math.round(amount);
  return `Rs. ${resolved.toLocaleString('en-IN')}`;
}

// "3 of 12 customers" when a filter/search has actually narrowed the loaded
// set, but just "12 customers" once loaded equals total - "6 of 6" reads as
// a mistake, not as "everything's shown".
export function formatCount(loaded: number, total: number, noun: string) {
  return loaded === total ? `${total} ${noun}` : `${loaded} of ${total} ${noun}`;
}
