import React from 'react';

const AVATAR_PALETTES = [
  'from-indigo-600 to-indigo-800 text-indigo-100',
  'from-purple-600 to-purple-800 text-purple-100',
  'from-sky-600 to-blue-800 text-sky-100',
  'from-emerald-600 to-teal-800 text-emerald-100',
  'from-amber-600 to-orange-800 text-amber-100',
  'from-rose-600 to-pink-800 text-rose-100',
];

export function Avatar({
  src,
  name = 'User',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  status = null, // 'online' | 'offline' | 'busy' | 'away'
  className = '',
  avatarId = 0
}) {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const paletteIndex = avatarId ? (avatarId % AVATAR_PALETTES.length) : Math.abs(name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_PALETTES.length);
  const palette = AVATAR_PALETTES[paletteIndex];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeMap[size]} rounded-full object-cover border border-slate-700/60 shadow-sm`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-full bg-gradient-to-br ${palette} font-semibold flex items-center justify-center border border-white/10 shadow-sm`}
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#090d16] ${
            status === 'online'
              ? 'bg-emerald-500'
              : status === 'busy'
              ? 'bg-rose-500'
              : status === 'away'
              ? 'bg-amber-500'
              : 'bg-slate-500'
          }`}
        />
      )}
    </div>
  );
}
