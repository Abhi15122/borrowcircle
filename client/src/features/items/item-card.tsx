import { Link } from 'react-router-dom';
import { MapPin, ArrowUpRight } from 'lucide-react';
import type { ItemDto } from '@borrowcircle/shared';
import { ItemImage } from '../../components/ui/item-image';
export function ItemCard({ item }: { item: ItemDto }) {
  return (
    <Link to={`/items/${item.id}`} className="item-card">
      <ItemImage url={item.imageUrl} title={item.title} category={item.category} />
      <div className="card-content">
        <div className="row">
          <span className="eyebrow">{item.category}</span>
          <span className="badge">{item.condition}</span>
        </div>
        <h3>
          {item.title}
          <ArrowUpRight size={18} />
        </h3>
        <p className="muted">
          <MapPin size={14} />
          {item.pickupArea}
        </p>
        <div className="card-footer">
          <span>Shared by {item.owner.name}</span>
          <strong>{item.onLoan ? 'On loan' : 'Free to borrow'}</strong>
        </div>
      </div>
    </Link>
  );
}
