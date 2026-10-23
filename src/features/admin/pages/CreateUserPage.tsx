import { ArrowLeftIcon } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/button';
import { CreateUserForm } from '../components/CreateUserForm';
import { ROLE_LABELS } from '../role-labels';

export function CreateUserPage() {
  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" className="-ml-3 self-start">
        <Link to={ROUTES.admin}>
          <ArrowLeftIcon aria-hidden="true" />
          Back to admin
        </Link>
      </Button>
      <h1 className="display text-code-lg">Create user</h1>
      <CreateUserForm
        onCreated={(user) =>
          toast.success(`User created: ${user.email} (${ROLE_LABELS[user.role]})`)
        }
      />
    </div>
  );
}
