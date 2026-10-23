import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Path } from 'react-hook-form';
import { ERROR_CODES } from '@/shared/api/api-error';
import { setFormApiError } from '@/shared/api/form-errors';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { FormServerError } from '@/shared/ui/form-server-error';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
import { useCreateUser } from '../hooks';
import { ROLE_LABELS } from '../role-labels';
import { createUserSchema, type CreateUserValues } from '../schemas';
import type { CreatedUser } from '../types';

interface CreateUserFormProps {
  onCreated: (user: CreatedUser) => void;
}

// "Choose" es la opción vacía del rol: crear un administrador siempre es una decisión
const EMPTY_FORM = { email: '', password: '', role: '' } as unknown as CreateUserValues;

const FIELD_BY_CODE: Partial<Record<string, Path<CreateUserValues>>> = {
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: 'email',
};

export function CreateUserForm({ onCreated }: CreateUserFormProps) {
  const { create, isPending } = useCreateUser();
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: EMPTY_FORM,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const user = await create(values);
      if (!user) return;
      form.reset(EMPTY_FORM);
      onCreated(user);
    } catch (error) {
      // Se conservan el email y el rol; la contraseña nunca se deja escrita
      form.resetField('password');
      setFormApiError(error, form.setError, FIELD_BY_CODE);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md">
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="user-email">Email</FieldLabel>
          <Input
            id="user-email"
            type="email"
            autoComplete="off"
            aria-invalid={!!errors.email}
            {...form.register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="user-password">Password</FieldLabel>
          <Input
            id="user-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <Field data-invalid={!!errors.role}>
          <FieldLabel htmlFor="user-role">Role</FieldLabel>
          <NativeSelect
            id="user-role"
            className="w-full"
            defaultValue=""
            aria-invalid={!!errors.role}
            {...form.register('role')}
          >
            <NativeSelectOption value="">Choose</NativeSelectOption>
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <NativeSelectOption key={role} value={role}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError errors={[errors.role]} />
        </Field>
        <FormServerError message={errors.root?.server?.message} />
        <Button type="submit" disabled={isPending} className="sm:self-start">
          {isPending ? 'Creating...' : 'Create user'}
        </Button>
      </FieldGroup>
    </form>
  );
}
