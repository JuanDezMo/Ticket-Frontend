import { Link } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/button';
import { StatusMessage } from '@/shared/ui/status-message';

// Páginas del marco de la aplicación. Las placeholder se reemplazan en las iteraciones siguientes.

export function MyTicketsPage() {
  return <StatusMessage title="My tickets" description="Your tickets will appear here soon." />;
}

export function AdminPage() {
  return <StatusMessage title="Admin" description="Event and user management is coming soon." />;
}

export function NotFoundPage() {
  return (
    <StatusMessage
      title="Page not found"
      action={
        <Button asChild variant="outline">
          <Link to={ROUTES.home}>Go to home</Link>
        </Button>
      }
    />
  );
}

export function RouteErrorPage() {
  return (
    <StatusMessage
      title="Something went wrong"
      description="An unexpected error occurred while showing this page."
      action={<Button onClick={() => window.location.reload()}>Reload</Button>}
    />
  );
}
