import { lazy, Suspense } from 'react';
import { Skeleton } from '@/shared/ui/skeleton';

// Las pantallas de administración se cargan aparte: el comprador no descarga el calendario
const AdminPageContent = lazy(() =>
  import('@/features/admin').then((module) => ({ default: module.AdminPage })),
);
const CreateEventPageContent = lazy(() =>
  import('@/features/admin').then((module) => ({ default: module.CreateEventPage })),
);

const CreateUserPageContent = lazy(() =>
  import('@/features/admin').then((module) => ({ default: module.CreateUserPage })),
);

const fallback = <Skeleton aria-label="Loading page" className="h-64 rounded-xl" />;

export function AdminPage() {
  return (
    <Suspense fallback={fallback}>
      <AdminPageContent />
    </Suspense>
  );
}

export function CreateEventPage() {
  return (
    <Suspense fallback={fallback}>
      <CreateEventPageContent />
    </Suspense>
  );
}

export function CreateUserPage() {
  return (
    <Suspense fallback={fallback}>
      <CreateUserPageContent />
    </Suspense>
  );
}
