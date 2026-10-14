import type { ReactNode } from 'react';
import { errorMessage } from '../../lib/http';
export function ErrorNotice({ error }: { error: unknown }) {
  return error ? (
    <p role="alert" className="notice error">
      {errorMessage(error)}
    </p>
  ) : null;
}
export function QueryState({
  pending,
  error,
  retry,
  children,
}: {
  pending: boolean;
  error: unknown;
  retry: () => void;
  children: ReactNode;
}) {
  if (pending)
    return (
      <p role="status" className="notice">
        Loading your circle…
      </p>
    );
  if (error)
    return (
      <div>
        <ErrorNotice error={error} />
        <button className="button secondary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  return children;
}
export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages < 2) return null;
  return (
    <nav aria-label="Pagination" className="pagination">
      <button className="button secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button
        className="button secondary"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
