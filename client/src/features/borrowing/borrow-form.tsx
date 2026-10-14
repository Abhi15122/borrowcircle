import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { borrowSchema, communityToday, type BorrowInput } from '@borrowcircle/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestApi } from './api';
import { Field } from '../../components/ui/field';
import { ErrorNotice } from '../../components/ui/feedback';
import { Link } from 'react-router-dom';
export function BorrowForm({ itemId }: { itemId: string }) {
  const form = useForm<z.input<typeof borrowSchema>, unknown, BorrowInput>({
    resolver: zodResolver(borrowSchema),
    defaultValues: { startDate: communityToday(), endDate: communityToday(), note: '' },
  });
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: BorrowInput) => requestApi.create(itemId, input),
    onSuccess: () => client.invalidateQueries({ queryKey: ['requests'] }),
  });
  if (mutation.isSuccess)
    return (
      <div role="status" className="notice success">
        <h3>Request sent!</h3>
        <p>The owner will review your dates.</p>
        <Link to="/borrowing">Track it in My borrowing →</Link>
        <button className="text-button" onClick={() => mutation.reset()}>
          Request other dates
        </button>
      </div>
    );
  return (
    <form onSubmit={form.handleSubmit((input) => mutation.mutate(input))}>
      <div className="form-columns">
        <Field label="From" error={form.formState.errors.startDate?.message}>
          {(id) => (
            <input id={id} type="date" min={communityToday()} {...form.register('startDate')} />
          )}
        </Field>
        <Field label="Until" error={form.formState.errors.endDate?.message}>
          {(id) => (
            <input id={id} type="date" min={communityToday()} {...form.register('endDate')} />
          )}
        </Field>
      </div>
      <p className="muted small-text">
        Borrow for 1–14 days. Both dates are included. Dates are reserved after approval.
      </p>
      <Field label="A note for the owner (optional)" error={form.formState.errors.note?.message}>
        {(id) => (
          <textarea
            id={id}
            rows={3}
            placeholder="What do you have planned?"
            {...form.register('note')}
          />
        )}
      </Field>
      <ErrorNotice error={mutation.error} />
      <button className="button full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Sending…' : 'Request to borrow'}
      </button>
    </form>
  );
}
