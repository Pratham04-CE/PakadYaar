import React, { useState } from 'react';
import { MALE_AVATARS, FEMALE_AVATARS } from '../data/avatars';
import PlayerAvatar, { getAvatarSrc } from './PlayerAvatar';
import sound from '../utils/sound';

export default function AvatarPicker({ selectedAvatar, onAvatarChange }) {
  const [activeGender, setActiveGender] = useState('male');

  const currentList = activeGender === 'male' ? MALE_AVATARS : FEMALE_AVATARS;

  const handleSelectAvatar = (item) => {
    sound.click();
    onAvatarChange({
      id: item.id,
      image: item.image,
      color: item.color,
      initial: selectedAvatar?.initial || 'P'
    });
  };

  return (
    <div className="flex flex-col gap-3 my-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-white/70 font-bold uppercase tracking-wider">Choose Profile Avatar</label>
        <span className="text-[10px] text-purple-300 font-medium">Tap photo to select</span>
      </div>

      {/* Gender Selection Tabs */}
      <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
        <button
          type="button"
          onClick={() => { sound.click(); setActiveGender('male'); }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeGender === 'male'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <span>👨</span> Male ({MALE_AVATARS.length})
        </button>
        <button
          type="button"
          onClick={() => { sound.click(); setActiveGender('female'); }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeGender === 'female'
              ? 'bg-pink-600 text-white shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <span>👩</span> Female ({FEMALE_AVATARS.length})
        </button>
      </div>

      {/* Preview Circle */}
      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
        <PlayerAvatar avatar={selectedAvatar} className="w-14 h-14" textClassName="text-lg" />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white">Selected Profile Avatar</p>
          <p className="text-[10px] text-white/50 truncate">
            {getAvatarSrc(selectedAvatar) ? 'Photo Avatar active' : 'Default Badge active'}
          </p>
        </div>
      </div>

      {/* Avatar Image Selection Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto pr-1 p-1 bg-black/20 rounded-xl border border-white/5">
        {currentList.map((item) => {
          const isSelected = selectedAvatar?.id === item.id || selectedAvatar?.image === item.image;
          const imgSrc = getAvatarSrc(item);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectAvatar(item)}
              className={`
                relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer active:scale-95
                ${isSelected ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-lg' : 'border-white/10 opacity-75 hover:opacity-100 hover:border-white/30'}
              `}
            >
              <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
              {isSelected && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-amber-400 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center shadow">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}