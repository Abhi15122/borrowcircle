import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categories } from '@borrowcircle/shared';
import { ArrowUpRight, Search, Leaf, Handshake } from 'lucide-react';
import { itemApi } from '../features/items/api';
import { ItemCard } from '../features/items/item-card';
import { QueryState, Pagination } from '../components/ui/feedback';
import type { FormEvent } from 'react';

export function ExplorePage({ mine = false }: { mine?: boolean }) {
  const [params, setParams] = useSearchParams();
  const apiParams = new URLSearchParams(params);
  if (mine) apiParams.set('mine', 'true');
  const query = useQuery({
    queryKey: ['items', apiParams.toString()],
    queryFn: () => itemApi.list(apiParams.toString()),
  });
  const update = (key: string, value: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });
  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const key of ['search', 'startDate', 'endDate']) {
        const value = String(data.get(key) ?? '');
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.delete('page');
      return next;
    });
  };
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">
            {mine ? 'Your contribution to the circle' : 'A neighbourhood worth sharing'}
          </span>
          <h1>
            {mine ? (
              'Your shelf of good things.'
            ) : (
              <>
                Own less.
                <br />
                Do a little more<span className="accent">.</span>
              </>
            )}
          </h1>
          <p>
            {mine
              ? 'Keep your listings useful, up to date, and ready for their next adventure.'
              : 'Borrow the things you need, share the things you love. Good neighbours make great possibilities.'}
          </p>
          <Link className="button" to="/items/new">
            Share something useful
            <ArrowUpRight size={18} />
          </Link>
        </div>
        {!mine && (
          <div className="hero-art" aria-hidden="true">
            <div className="art-ring" />
            <div className="art-note">
              <Leaf size={28} />
              <span>
                A little less stuff.
                <br />A lot more community.
              </span>
            </div>
            <div className="art-tag">
              <Handshake size={24} />
              Good things, shared.
            </div>
          </div>
        )}
      </section>
      <section className="browse-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{mine ? 'My items' : 'The community shelf'}</span>
            <h2>{mine ? 'What you’re sharing' : 'What will you borrow next?'}</h2>
          </div>
          {query.data && (
            <span className="muted">
              {query.data.total} {query.data.total === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        <form className="filters" onSubmit={submitFilters}>
          <label className="search-field">
            <Search size={18} />
            <span className="sr-only">Search items</span>
            <input
              name="search"
              placeholder="A drill, a tent, a good book…"
              defaultValue={params.get('search') ?? ''}
            />
          </label>
          <label className="date-filter">
            From
            <input name="startDate" type="date" defaultValue={params.get('startDate') ?? ''} />
          </label>
          <label className="date-filter">
            Until
            <input name="endDate" type="date" defaultValue={params.get('endDate') ?? ''} />
          </label>
          <button className="button secondary">Find items</button>
        </form>
        <div className="category-tabs" aria-label="Category filters">
          <button
            className={!params.get('category') ? 'selected' : ''}
            onClick={() => update('category', '')}
          >
            Everything
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={params.get('category') === category ? 'selected' : ''}
              onClick={() => update('category', category)}
            >
              {category}
            </button>
          ))}
        </div>
        <QueryState
          pending={query.isPending}
          error={query.error}
          retry={() => void query.refetch()}
        >
          {query.data?.data.length ? (
            <div className="item-grid">
              {query.data.data.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Leaf size={32} />
              <h3>
                {mine ? 'Your shelf is ready for its first item' : 'Nothing on this shelf yet'}
              </h3>
              <p>
                {mine
                  ? 'List something your neighbours could use.'
                  : 'Try a different search or be the first to share.'}
              </p>
              <Link to="/items/new" className="button secondary">
                List an item
              </Link>
            </div>
          )}
        </QueryState>
        {query.data && (
          <Pagination
            page={query.data.page}
            pages={query.data.pages}
            onPage={(page) => update('page', String(page))}
          />
        )}
      </section>
    </>
  );
}
