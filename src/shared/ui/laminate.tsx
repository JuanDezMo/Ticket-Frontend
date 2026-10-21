import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

interface LaminateProps extends ComponentProps<'div'> {
  // Franja de nivel arriba: marca el pase principal (cabecera del evento, pase de selección)
  tier?: boolean;
  // Ranura del cordón: decorativa, se oculta a lectores de pantalla
  punched?: boolean;
}

/**
 * Superficie de pase plastificado: borde, brillo superior y sombra suave.
 * No se anida un Laminate dentro de otro.
 */
export function Laminate({
  tier = false,
  punched = false,
  className,
  children,
  ...props
}: LaminateProps) {
  return (
    <div
      data-slot="laminate"
      className={cn(
        'laminate-sheen relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-laminate',
        tier && 'border-t-0 before:block before:h-2 before:bg-tier',
        className,
      )}
      {...props}
    >
      {punched && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute right-4 size-3 rounded-full bg-background shadow-[inset_0_1px_2px_var(--punch-rim)] ring-1 ring-(--punch-rim)',
            tier ? 'top-5' : 'top-3',
          )}
        />
      )}
      {children}
    </div>
  );
}
