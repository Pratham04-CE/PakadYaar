import React from 'react';
import sound from '../utils/sound';

const PRESET_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#3b82f6', '#8b5cf6'];

export default function AvatarPicker({ selectedAvatar, onAvatarChange }) {
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sound.click();
        onAvatarChange({
          ...selectedAvatar,
          image: reader.result, // Base64 image from gallery
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorSelect = (color) => {
    sound.click();
    onAvatarChange({
      image: null, // Clear custom image if preset color is chosen
      color: color,
      initial: selectedAvatar?.initial || 'P'
    });
  };

  return (
    <div className="flex flex-col gap-3 my-3">
      <label className="text-xs text-white/60 font-medium">Choose Avatar / Upload from Gallery</label>
      
      <div className="flex items-center gap-4">
        {/* Preview Avatar */}
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-amber-400 overflow-hidden shadow-lg flex-shrink-0"
          style={{ backgroundColor: selectedAvatar?.image ? 'transparent' : (selectedAvatar?.color || '#7c3aed') }}
        >
          {selectedAvatar?.image ? (
            <img src={selectedAvatar.image} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            selectedAvatar?.initial || '👤'
          )}
        </div>

        {/* Gallery Upload Button */}
        <div className="flex-1">
          <label className="btn-accent text-xs py-2 px-3 inline-block cursor-pointer text-center rounded-xl font-bold shadow-md">
            📁 Choose from Gallery
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
            />
          </label>
          <p className="text-[10px] text-white/40 mt-1">Supports PNG, JPG, JPEG</p>
        </div>
      </div>

      {/* Preset Color Swatches */}
      <div>
        <p className="text-[10px] text-white/50 mb-1.5">Or pick a badge color:</p>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => handleColorSelect(col)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${selectedAvatar?.color === col && !selectedAvatar?.image ? 'scale-110 border-white' : 'border-transparent'}`}
              style={{ backgroundColor: col }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}