import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { requestApi } from '../features/borrowing/api';
import { RequestCard } from '../features/borrowing/request-card';
import { QueryState, Pagination } from '../components/ui/feedback';
export function RequestsPage({ view }: { view: 'borrowing' | 'lending' }) {
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get('page') ?? 1);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const query = useQuery({
    queryKey: ['requests', view, page],
    queryFn: () => requestApi.list(view, page),
  });
  return (
    <section className="dashboard">
      <span className="eyebrow">Good neighbours, good habits</span>
      <h1 className="page-title">{view === 'borrowing' ? 'My borrowing' : 'Your lending inbox'}</h1>
      <p className="muted">
        {view === 'borrowing'
          ? 'From your first request to a thoughtful return. Your plans and history live here.'
          : 'Review requests, agree on a handover, and welcome your items home.'}
      </p>
      <QueryState pending={query.isPending} error={query.error} retry={() => void query.refetch()}>
        {query.data?.data.length ? (
          <div className="request-grid">
            {query.data.data.map((request) => (
              <RequestCard key={request.id} request={request} view={view} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>
              {view === 'borrowing' ? 'Your next adventure is waiting' : 'All quiet in your circle'}
            </h3>
            <p>
              {view === 'borrowing'
                ? 'Find something useful on the community shelf.'
                : 'Incoming requests will appear here.'}
            </p>
            <Link className="button secondary" to={view === 'borrowing' ? '/' : '/my-items'}>
              {view === 'borrowing' ? 'Explore items' : 'View my items'}
            </Link>
          </div>
        )}
      </QueryState>
      {query.data && (
        <Pagination
          page={query.data.page}
          pages={query.data.pages}
          onPage={(next) => setParams({ page: String(next) })}
        />
      )}
    </section>
  );
}
