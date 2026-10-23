import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { REDIRECT_PARAM, ROUTES } from '@/shared/config/routes';
import { getSafeRedirect, loginPathWithRedirect } from '@/shared/lib/redirect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { RegisterForm } from '../components/RegisterForm';

export const ACCOUNT_CREATED_MESSAGE = 'Account created. Please sign in';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get(REDIRECT_PARAM);

  // Si venía de otra página (por ejemplo un evento), el login la recuerda para volver
  const handleRegistered = (email: string) => {
    toast.success(ACCOUNT_CREATED_MESSAGE);
    const loginPath = redirect ? loginPathWithRedirect(getSafeRedirect(redirect)) : ROUTES.login;
    navigate(loginPath, { state: { email } });
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
