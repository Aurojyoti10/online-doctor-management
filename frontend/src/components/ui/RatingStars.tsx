import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviews?: number;
}

export function RatingStars({ rating, size = 'md', showValue = true, reviews }: RatingStarsProps) {
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center text-warning-500">
        {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={cn(sizes[size], star <= Math.round(rating) ? 'fill-current' : 'fill-navy-100 text-navy-200')} />)}
      </div>
      {showValue && <span className="text-sm font-semibold text-navy-800">{rating.toFixed(1)}</span>}
      {reviews !== undefined && <span className="text-xs text-navy-500">({reviews} reviews)</span>}
    </div>
  );
}
