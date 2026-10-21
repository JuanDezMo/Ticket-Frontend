import { Link } from 'react-router';
import { loginPathWithRedirect } from '@/shared/lib/redirect';
import { Button } from '@/shared/ui/button';

// La API solo entrega los seats con sesión; al iniciar sesión se vuelve a `returnTo`
export function SignInToSeeSeats({ returnTo }: { returnTo: string }) {
  return (
    <section
      aria-label="Seat map"
      className="flex flex-col items-start gap-2 rounded-xl border p-4"
    >
      <p>Sign in to see available seats</p>
      <Button asChild>
        <Link to={loginPathWithRedirect(returnTo)}>Sign in</Link>
      </Button>
    </section>
  );
}
