import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ name, avatar, size = 'md', className }: UserAvatarProps) {
  const sizes = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };
  if (avatar) {
    return <img src={avatar} alt={name} className={cn(`${sizes[size]} rounded-full object-cover`, className)} />;
  }
  return (
    <div className={cn(`${sizes[size]} rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold flex-shrink-0`, className)}>
      {getInitials(name)}
    </div>
  );
}
