import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { CircleDot, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession, sessionKey } from '../../features/auth/use-session';
import { authApi } from '../../features/auth/api';
import { ErrorNotice } from '../ui/feedback';
export function Layout() {
  const session = useSession();
  const user = session.data?.user;
  const client = useQueryClient();
  const navigate = useNavigate();
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      client.clear();
      client.setQueryData(sessionKey, { user: null });
      navigate('/');
    },
  });
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/">
            <CircleDot size={30} />
            BorrowCircle<span className="brand-dot">.</span>
          </Link>
          <nav aria-label="Main navigation">
            <NavLink to="/" end>
              Explore
            </NavLink>
            {user && (
              <>
                <NavLink to="/my-items">My items</NavLink>
                <NavLink to="/borrowing">Borrowing</NavLink>
                <NavLink to="/lending">Lending</NavLink>
              </>
            )}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <Link className="button small" to="/items/new">
                  <Plus size={16} />
                  List an item
                </Link>
                <button
                  className="text-button"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link className="button small" to="/login">
                Join your circle
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="container">
        <ErrorNotice error={logout.error} />
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>BorrowCircle · Good things, shared.</span>
        <span>Borrow thoughtfully. Return kindly.</span>
      </footer>
    </>
  );
}
