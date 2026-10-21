import { Badge } from '@/shared/ui/badge';
import { EVENT_STATUS_LABELS } from '../constants';
import { EVENT_STATUSES, type EventStatus } from '../types';

// Solo se marca el estado que el usuario debe notar: los activos no llevan etiqueta
export function EventStatusBadge({ status }: { status: EventStatus }) {
  if (status !== EVENT_STATUSES.CANCELLED) return null;
  return <Badge variant="destructive">{EVENT_STATUS_LABELS[status]}</Badge>;
}
