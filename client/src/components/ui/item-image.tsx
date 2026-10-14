import { useState } from 'react';
import { BookOpen, Tent, Wrench, Lamp, Monitor, Trophy, type LucideIcon } from 'lucide-react';
import type { Category } from '@borrowcircle/shared';
const icons: Record<Category, LucideIcon> = {
  Tools: Wrench,
  Outdoors: Tent,
  Electronics: Monitor,
  Home: Lamp,
  Books: BookOpen,
  Sports: Trophy,
};
export function ItemImage({
  url,
  title,
  category,
}: {
  url: string;
  title: string;
  category: Category;
}) {
  const [failedUrl, setFailedUrl] = useState('');
  const Icon = icons[category];
  return (
    <div className={`item-image category-${category.toLowerCase()}`}>
      {url && failedUrl !== url ? (
        <img
          src={url}
          alt={title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <>
          <Icon size={64} strokeWidth={1.2} />
          <span>{category}</span>
        </>
      )}
    </div>
  );
}
