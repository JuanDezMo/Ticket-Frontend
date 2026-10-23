import { cn } from '@/shared/lib/utils';
import { litSegments, SEGMENTS } from '../lit-segments';

interface HoldRulerProps {
  remainingMs: number;
  totalMs: number;
}

export function HoldRuler({ remainingMs, totalMs }: HoldRulerProps) {
  const lit = litSegments(remainingMs, totalMs);
  return (
    <span aria-hidden="true" className="grid grid-cols-10 gap-0.5">
      {Array.from({ length: SEGMENTS }, (_, index) => (
        <span
          key={index}
          data-lit={index < lit}
          className={cn(
            'h-1.5 first:rounded-l-full last:rounded-r-full',
            index < lit ? 'bg-tier' : 'bg-border',
          )}
        />
      ))}
    </span>
  );
}
