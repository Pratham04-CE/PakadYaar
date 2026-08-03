import React, { useState, useEffect } from 'react';
import { MALE_AVATARS, FEMALE_AVATARS } from '../data/avatars';

export function getAvatarSrc(avatar) {
  if (!avatar) return null;
  
  let img = avatar.image;
  if (img && typeof img === 'object' && typeof img.default === 'string') {
    img = img.default;
  }
  
  if (typeof img === 'string' && img.trim()) {
    return img;
  }

  // Fallback by ID if image property is missing or invalid
  if (avatar.id) {
    const found = MALE_AVATARS.find(a => a.id === avatar.id) || FEMALE_AVATARS.find(a => a.id === avatar.id);
    if (found && found.image) return found.image;
  }

  return null;
}

export default function PlayerAvatar({ avatar, name = '', className = "w-9 h-9", textClassName = "text-sm" }) {
  const [imgError, setImgError] = useState(false);
  const rawSrc = getAvatarSrc(avatar);

  // Reset imgError whenever avatar changes
  useEffect(() => {
    setImgError(false);
  }, [avatar?.id, avatar?.image, rawSrc]);

  const showImage = rawSrc && !imgError;
  const initial = avatar?.initial || (name ? name[0].toUpperCase() : '👤');
  const bgColor = avatar?.color || '#7c3aed';

  return (
    <div
      className={`${className} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md overflow-hidden relative border border-white/20`}
      style={{ backgroundColor: bgColor }}
    >
      {showImage ? (
        <img
          src={rawSrc}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={textClassName}>
          {initial}
        </span>
      )}
    </div>
  );
}
