import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, ShieldCheck } from 'lucide-react';
import { formatDate } from '@borrowcircle/shared';
import { itemApi } from '../features/items/api';
import { useSession } from '../features/auth/use-session';
import { ItemImage } from '../components/ui/item-image';
import { QueryState, ErrorNotice } from '../components/ui/feedback';
import { BorrowForm } from '../features/borrowing/borrow-form';
export function ItemDetailPage() {
  const { id = '' } = useParams();
  const session = useSession();
  const query = useQuery({ queryKey: ['item', id], queryFn: () => itemApi.detail(id) });
  const client = useQueryClient();
  const navigate = useNavigate();
  const archive = useMutation({
    mutationFn: () => itemApi.archive(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['items'] });
      await client.invalidateQueries({ queryKey: ['requests'] });
      navigate('/my-items');
    },
  });
  const item = query.data;
  const owned = item?.owner.id === session.data?.user?.id;
  const confirmArchive = () => {
    if (
      window.confirm(
        'Archive this item? Pending requests will be rejected. Approved or active loans must be resolved first.',
      )
    )
      archive.mutate();
  };
  return (
    <>
      <Link className="back-link" to="/">
        ← Back to Explore
      </Link>
      <QueryState pending={query.isPending} error={query.error} retry={() => void query.refetch()}>
        {item && (
          <div className="detail-grid">
            <div>
              <ItemImage url={item.imageUrl} title={item.title} category={item.category} />
              <div className="detail-copy">
                <div className="row">
                  <span className="eyebrow">{item.category}</span>
                  <span className="badge">{item.condition}</span>
                </div>
                <h1 className="page-title">{item.title}</h1>
                <p className="muted">
                  <MapPin size={16} />
                  {item.pickupArea}
                </p>
                <p className="description">{item.description}</p>
                <p className="owner-line">
                  Shared by <strong>{item.owner.name}</strong>
                </p>
              </div>
            </div>
            <aside className="panel borrow-panel">
              <span className="eyebrow">
                {item.onLoan ? 'Currently on loan' : 'From your neighbourhood'}
              </span>
              <h2>{owned ? 'Your item, their next adventure' : 'Make a little plan'}</h2>
              <p className="muted">Free to borrow · Local pickup</p>
              {owned ? (
                <>
                  <Link className="button full" to={`/items/${id}/edit`}>
                    Edit item
                  </Link>
                  <Link className="button secondary full" to="/lending">
                    View lending requests
                  </Link>
                  <button
                    className="text-button danger"
                    disabled={archive.isPending}
                    onClick={confirmArchive}
                  >
                    {archive.isPending ? 'Archiving…' : 'Archive item'}
                  </button>
                  <ErrorNotice error={archive.error} />
                </>
              ) : session.isPending ? (
                <p>Checking your session…</p>
              ) : session.error ? (
                <ErrorNotice error={session.error} />
              ) : session.data?.user ? (
                <BorrowForm itemId={id} />
              ) : (
                <Link className="button full" to="/login">
                  Log in to request
                </Link>
              )}
              {item.reservedDates.length > 0 && (
                <div className="reserved">
                  <h3>Already reserved</h3>
                  <p>{item.reservedDates.map(formatDate).join(' · ')}</p>
                </div>
              )}
              <div className="kind-note">
                <ShieldCheck size={20} />
                <span>
                  Agree on pickup with your neighbour, look after their item, and return it on time.
                </span>
              </div>
            </aside>
          </div>
        )}
      </QueryState>
    </>
  );
}
