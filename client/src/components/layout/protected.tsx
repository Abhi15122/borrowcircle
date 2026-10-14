import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../../features/auth/use-session';
import { QueryState } from '../ui/feedback';
export function Protected() {
  const session = useSession();
  const location = useLocation();
  return (
    <QueryState
      pending={session.isPending}
      error={session.error}
      retry={() => void session.refetch()}
    >
      {session.data?.user ? (
        <Outlet />
      ) : (
        <Navigate to="/login" state={{ from: location.pathname }} replace />
      )}
    </QueryState>
  );
}
