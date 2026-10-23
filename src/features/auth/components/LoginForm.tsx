import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ApiError, ERROR_CODES } from '@/shared/api/api-error';
import { setFormApiError } from '@/shared/api/form-errors';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { useLogin } from '../hooks';
import { loginSchema, type LoginValues } from '../schemas';
import { FormServerError } from '@/shared/ui/form-server-error';

interface LoginFormProps {
  defaultEmail?: string;
}

// Tras un login exitoso no navega: GuestOnly lleva al usuario a su destino
export function LoginForm({ defaultEmail = '' }: LoginFormProps) {
  const login = useLogin();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: '' },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, {
      onError: (error) => {
        if (error instanceof ApiError && error.code === ERROR_CODES.INVALID_CREDENTIALS) {
          form.setValue('password', '');
        }
        setFormApiError(error, form.setError);
      },
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...form.register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="login-password">Password</FieldLabel>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <FormServerError message={errors.root?.server?.message} />
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Signing in...' : 'Sign in'}
        </Button>
      </FieldGroup>
    </form>
  );
}
