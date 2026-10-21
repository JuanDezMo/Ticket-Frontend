import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Path } from 'react-hook-form';
import { ERROR_CODES } from '@/shared/api/api-error';
import { setFormApiError } from '@/shared/api/form-errors';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { useRegister } from '../hooks';
import { registerSchema, type RegisterValues } from '../schemas';
import { FormServerError } from './FormServerError';

const FIELD_BY_CODE: Partial<Record<string, Path<RegisterValues>>> = {
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: 'email',
};

interface RegisterFormProps {
  onRegistered: (email: string) => void;
}

export function RegisterForm({ onRegistered }: RegisterFormProps) {
  const register = useRegister();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    register.mutate(values, {
      onSuccess: (user) => onRegistered(user.email),
      onError: (error) => setFormApiError(error, form.setError, FIELD_BY_CODE),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="register-email">Email</FieldLabel>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...form.register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="register-password">Password</FieldLabel>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <FormServerError message={errors.root?.server?.message} />
        <Button type="submit" disabled={register.isPending}>
          {register.isPending ? 'Creating account...' : 'Create account'}
        </Button>
      </FieldGroup>
    </form>
  );
}
