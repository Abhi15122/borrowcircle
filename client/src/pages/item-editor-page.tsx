import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ItemInput } from '@borrowcircle/shared';
import { itemApi } from '../features/items/api';
import { ItemForm } from '../features/items/item-form';
import { QueryState } from '../components/ui/feedback';
import { useSession } from '../features/auth/use-session';

export function ItemEditorPage() {
  const { id } = useParams();
  const session = useSession();
  const navigate = useNavigate();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['item', id],
    queryFn: () => itemApi.detail(id ?? ''),
    enabled: Boolean(id),
  });
  const mutation = useMutation({
    mutationFn: (input: ItemInput) => (id ? itemApi.edit(id, input) : itemApi.create(input)),
    onSuccess: async (item) => {
      await client.invalidateQueries({ queryKey: ['items'] });
      await client.invalidateQueries({ queryKey: ['item', item.id] });
      navigate(`/items/${item.id}`);
    },
  });
  const item = query.data;
  const initial: ItemInput | undefined = item
    ? {
        title: item.title,
        description: item.description,
        category: item.category,
        condition: item.condition,
        pickupArea: item.pickupArea,
        imageUrl: item.imageUrl,
      }
    : undefined;
  const form = (
    <ItemForm
      initial={initial}
      pending={mutation.isPending}
      error={mutation.error}
      onSubmit={(input) => mutation.mutate(input)}
    />
  );
  return (
    <section className="narrow">
      <Link className="back-link" to={id ? `/items/${id}` : '/my-items'}>
        ← Back to your shelf
      </Link>
      <div className="panel">
        <span className="eyebrow">Make someone’s day</span>
        <h1 className="page-title">{id ? 'A little update' : 'Share something useful'}</h1>
        <p className="muted">A clear description helps your neighbours borrow with confidence.</p>
        {id ? (
          <QueryState
            pending={query.isPending}
            error={query.error}
            retry={() => void query.refetch()}
          >
            {item && item.owner.id !== session.data?.user?.id ? (
              <p role="alert">Only the owner can edit this item.</p>
            ) : (
              form
            )}
          </QueryState>
        ) : (
          form
        )}
      </div>
    </section>
  );
}
