import { Badge } from '@/shared/ui/badge';
import { EVENT_NOTICES, type EventNotice } from '../event-notice';

const BADGES: Record<EventNotice, { label: string; variant: 'destructive' | 'outline' }> = {
  [EVENT_NOTICES.CANCELLED]: { label: 'Cancelled', variant: 'destructive' },
  [EVENT_NOTICES.STARTED]: { label: 'Started', variant: 'outline' },
};

// Solo se marca lo que el usuario debe notar: los eventos reservables no llevan etiqueta
export function EventStatusBadge({ notice }: { notice: EventNotice | null }) {
  if (!notice) return null;
  const { label, variant } = BADGES[notice];
  return <Badge variant={variant}>{label}</Badge>;
}
