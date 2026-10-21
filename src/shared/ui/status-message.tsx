import type { ReactNode } from 'react';

interface StatusMessageProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

// Mensaje centrado para páginas de estado: sin permiso, no encontrado, error
export function StatusMessage({ title, description, action }: StatusMessageProps) {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
      {action}
    </section>
  );
}
