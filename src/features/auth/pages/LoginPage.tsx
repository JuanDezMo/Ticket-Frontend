import { Link, useLocation } from 'react-router';
import { ROUTES } from '@/shared/config/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { LoginForm } from '../components/LoginForm';

// El registro deja el email en el state de la navegación para no ponerlo en la URL
function readRegisteredEmail(state: unknown): string | undefined {
  if (state && typeof state === 'object' && 'email' in state && typeof state.email === 'string') {
    return state.email;
  }
  return undefined;
}

export function LoginPage() {
  const location = useLocation();

  return (
    <Card className="mx-auto mt-12 w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your email and password to continue.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <LoginForm defaultEmail={readRegisteredEmail(location.state)} />
        <p className="text-muted-foreground text-sm">
          Don&apos;t have an account?{' '}
          <Link to={ROUTES.register} className="underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
