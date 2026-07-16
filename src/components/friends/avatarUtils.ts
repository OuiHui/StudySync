const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-fuchsia-500',
];

export const getAvatarColor = (str: string) =>
  AVATAR_COLORS[(str?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

export const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
