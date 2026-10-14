import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { categories, conditions, itemSchema, type ItemInput } from '@borrowcircle/shared';
import { Field } from '../../components/ui/field';
import { ErrorNotice } from '../../components/ui/feedback';

export function ItemForm({
  initial,
  pending,
  error,
  onSubmit,
}: {
  initial?: ItemInput;
  pending: boolean;
  error: unknown;
  onSubmit: (input: ItemInput) => void;
}) {
  const form = useForm<z.input<typeof itemSchema>, unknown, ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: initial ?? {
      title: '',
      description: '',
      category: 'Tools',
      condition: 'Good',
      pickupArea: '',
      imageUrl: '',
    },
  });
  const errors = form.formState.errors;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Field label="Item title" error={errors.title?.message}>
        {(id) => (
          <input id={id} placeholder="What would you like to share?" {...form.register('title')} />
        )}
      </Field>
      <Field label="Description" error={errors.description?.message}>
        {(id) => (
          <textarea
            id={id}
            rows={4}
            placeholder="Tell neighbours about the item and how to look after it."
            {...form.register('description')}
          />
        )}
      </Field>
      <div className="form-columns">
        <Field label="Category" error={errors.category?.message}>
          {(id) => (
            <select id={id} {...form.register('category')}>
              {categories.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Condition" error={errors.condition?.message}>
          {(id) => (
            <select id={id} {...form.register('condition')}>
              {conditions.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <Field
        label="General pickup area"
        hint="Use a neighbourhood or public meeting point, rather than your home address."
        error={errors.pickupArea?.message}
      >
        {(id) => (
          <input
            id={id}
            placeholder="e.g. Saket community centre"
            {...form.register('pickupArea')}
          />
        )}
      </Field>
      <Field
        label="Image URL (optional)"
        hint="An HTTPS image link. We’ll use a category illustration if it’s unavailable."
        error={errors.imageUrl?.message}
      >
        {(id) => <input id={id} type="url" {...form.register('imageUrl')} />}
      </Field>
      <ErrorNotice error={error} />
      <button className="button full" disabled={pending}>
        {pending ? 'Saving…' : initial ? 'Save changes' : 'Add to the community shelf'}
      </button>
    </form>
  );
}
