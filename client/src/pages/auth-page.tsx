import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginSchema, registerSchema, type RegisterInput } from '@borrowcircle/shared';
import { z } from 'zod';
import { authApi } from '../features/auth/api';
import { sessionKey } from '../features/auth/use-session';
import { Field } from '../components/ui/field';
import { ErrorNotice } from '../components/ui/feedback';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const registering = mode === 'register';
  const schema = registering ? registerSchema : loginSchema.extend({ name: z.string() });
  const form = useForm<RegisterInput>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const client = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (input: RegisterInput) =>
      registering
        ? authApi.register(input)
        : authApi.login({ email: input.email, password: input.password }),
    onSuccess: (result) => {
      client.clear();
      client.setQueryData(sessionKey, result);
      navigate('/');
    },
  });
  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <span className="eyebrow">A little closer, a little greener</span>
        <h1>
          More sharing.
          <br />
          Less buying.
        </h1>
        <p>
          That drill you use once a year? Someone nearby needs it this weekend. Start a circle of
          good neighbours.
        </p>
        <div className="quote">“The best things in a community are the things we share.”</div>
      </div>
      <div className="panel auth-panel">
        <h2>{registering ? 'Find your circle' : 'Welcome back'}</h2>
        <p className="muted">
          {registering
            ? 'A few details, then you’re ready to share.'
            : 'Your next small adventure starts here.'}
        </p>
        <form onSubmit={form.handleSubmit((input) => mutation.mutate(input))}>
          {registering && (
            <Field label="Your name" error={form.formState.errors.name?.message}>
              {(id) => <input id={id} autoComplete="name" {...form.register('name')} />}
            </Field>
          )}
          <Field label="Email address" error={form.formState.errors.email?.message}>
            {(id) => (
              <input id={id} type="email" autoComplete="email" {...form.register('email')} />
            )}
          </Field>
          <Field label="Password" error={form.formState.errors.password?.message}>
            {(id) => (
              <input
                id={id}
                type="password"
                autoComplete={registering ? 'new-password' : 'current-password'}
                {...form.register('password')}
              />
            )}
          </Field>
          <ErrorNotice error={mutation.error} />
          <button className="button full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Please wait…' : registering ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="muted">
          {registering ? 'Already part of the circle?' : 'New around here?'}{' '}
          <Link to={registering ? '/login' : '/register'}>
            {registering ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </section>
  );
}
