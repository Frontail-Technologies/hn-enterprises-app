import type { StatusTone } from '@/constants/status';

export function getStatusTone(status: string): StatusTone {
  const value = status.toLowerCase();

  if (value.includes('approved') || value.includes('active') || value.includes('present') || value.includes('submitted')) {
    return 'success';
  }
  if (value.includes('sent back') || value.includes('late') || value.includes('progress') || value.includes('pending')) {
    return 'warning';
  }
  if (value.includes('reject') || value.includes('absent') || value.includes('hold')) {
    return 'danger';
  }
  if (value.includes('leave') || value.includes('half')) {
    return 'info';
  }

  return 'neutral';
}
