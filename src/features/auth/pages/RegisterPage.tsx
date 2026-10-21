import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ROUTES } from '@/shared/config/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { RegisterForm } from '../components/RegisterForm';

export const ACCOUNT_CREATED_MESSAGE = 'Account created. Please sign in';

export function RegisterPage() {
  const navigate = useNavigate();

  const handleRegistered = (email: string) => {
    toast.success(ACCOUNT_CREATED_MESSAGE);
    navigate(ROUTES.login, { state: { email } });
  };

  return (
    <Card className="mx-auto mt-12 w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Sign up to book seats and buy tickets.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <RegisterForm onRegistered={handleRegistered} />
        <p className="text-muted-foreground text-sm">
          Already have an account?{' '}
          <Link to={ROUTES.login} className="underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
