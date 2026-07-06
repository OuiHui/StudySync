const AVATAR_GRADIENTS = [
  'from-violet-400 to-purple-500',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-orange-400 to-amber-500',
  'from-rose-400 to-pink-500',
  'from-indigo-400 to-indigo-600',
  'from-cyan-400 to-cyan-600',
  'from-lime-400 to-green-500',
  'from-fuchsia-400 to-fuchsia-600',
];

export const getAvatarGradient = (str: string) =>
  AVATAR_GRADIENTS[(str?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

export const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
