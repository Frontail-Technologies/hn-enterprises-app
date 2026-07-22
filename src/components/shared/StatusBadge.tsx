import { Badge } from '@/components/ui/Badge';
import { getStatusTone } from '@/utils/status';

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge label={status} tone={getStatusTone(status)} />;
}
