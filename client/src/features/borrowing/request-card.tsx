import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  formatDate,
  communityToday,
  type BorrowRequestDto,
  type RequestAction,
} from '@borrowcircle/shared';
import { requestApi } from './api';
import { actionLabels, permittedActions } from './actions';
import { ErrorNotice } from '../../components/ui/feedback';
export function RequestCard({
  request,
  view,
}: {
  request: BorrowRequestDto;
  view: 'borrowing' | 'lending';
}) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (action: RequestAction) => requestApi.action(request.id, action),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['requests'] });
      await client.invalidateQueries({ queryKey: ['items'] });
      await client.invalidateQueries({ queryKey: ['item', request.item.id] });
    },
  });
  const actions = permittedActions(request, view);
  const overdue = request.status === 'borrowed' && request.endDate < communityToday();
  const act = (action: RequestAction) => {
    if (window.confirm(`${actionLabels[action]} for “${request.item.title}”?`))
      mutation.mutate(action);
  };
  return (
    <article className="panel request-card">
      <div className="row">
        <div>
          <span className="eyebrow">
            {view === 'lending'
              ? `Requested by ${request.borrower.name}`
              : `Shared by ${request.owner.name}`}
          </span>
          <h3>
            {request.item.archived ? (
              request.item.title
            ) : (
              <Link to={`/items/${request.item.id}`}>{request.item.title}</Link>
            )}
          </h3>
        </div>
        <span className={`badge status-${request.status}`}>
          {overdue ? 'Overdue' : request.status}
        </span>
      </div>
      <p>
        {formatDate(request.startDate)} → {formatDate(request.endDate)}
      </p>
      <p className="muted">Pickup: {request.item.pickupArea}</p>
      {request.note && <p className="request-note">“{request.note}”</p>}
      {request.handedOverAt && (
        <p className="muted small-text">
          Handed over:{' '}
          {new Date(request.handedOverAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </p>
      )}
      {request.returnedAt && (
        <p className="muted small-text">
          Returned:{' '}
          {new Date(request.returnedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </p>
      )}
      <ErrorNotice error={mutation.error} />
      <div className="request-actions">
        {actions.map((action) => (
          <button
            key={action}
            className={`button small ${action === 'reject' || action === 'cancel' ? 'secondary' : ''}`}
            disabled={mutation.isPending}
            onClick={() => act(action)}
          >
            {actionLabels[action]}
          </button>
        ))}
      </div>
    </article>
  );
}
