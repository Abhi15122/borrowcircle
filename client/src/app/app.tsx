import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '../components/layout/layout';
import { Protected } from '../components/layout/protected';
import { ExplorePage } from '../pages/explore-page';
import { AuthPage } from '../pages/auth-page';
import { ItemDetailPage } from '../pages/item-detail-page';
import { ItemEditorPage } from '../pages/item-editor-page';
import { RequestsPage } from '../pages/requests-page';
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
});
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<ExplorePage />} />
            <Route path="login" element={<AuthPage key="login" mode="login" />} />
            <Route path="register" element={<AuthPage key="register" mode="register" />} />
            <Route path="items/:id" element={<ItemDetailPage />} />
            <Route element={<Protected />}>
              <Route path="my-items" element={<ExplorePage key="mine" mine />} />
              <Route path="items/new" element={<ItemEditorPage key="new" />} />
              <Route path="items/:id/edit" element={<ItemEditorPage key="edit" />} />
              <Route path="borrowing" element={<RequestsPage key="borrowing" view="borrowing" />} />
              <Route path="lending" element={<RequestsPage key="lending" view="lending" />} />
            </Route>
            <Route
              path="*"
              element={
                <div className="empty-state">
                  <h1>That page wandered off.</h1>
                  <Link to="/">Back to your circle</Link>
                </div>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
