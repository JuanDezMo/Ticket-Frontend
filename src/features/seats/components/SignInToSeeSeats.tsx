import { Link } from 'react-router';
import { loginPathWithRedirect, registerPathWithRedirect } from '@/shared/lib/redirect';
import { Button } from '@/shared/ui/button';
import { Laminate } from '@/shared/ui/laminate';

// La API solo entrega los seats con sesión; al iniciar sesión o registrarse se vuelve a `returnTo`
export function SignInToSeeSeats({ returnTo }: { returnTo: string }) {
  return (
    <section aria-label="Seat map">
      <Laminate punched className="flex flex-col items-start gap-3 px-4 pt-8 pb-4 sm:max-w-md">
        <p className="font-semibold">Sign in to see available seats</p>
        <p className="text-muted-foreground text-sm">
          Seats are shown to signed-in buyers. Creating an account is free and takes a minute.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={loginPathWithRedirect(returnTo)}>Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={registerPathWithRedirect(returnTo)}>Sign up</Link>
          </Button>
        </div>
      </Laminate>
    </section>
  );
}
