import f1 from '../assets/Avtar/Female/f1.jpg';
import f2 from '../assets/Avtar/Female/f2.jpg';
import f3 from '../assets/Avtar/Female/f3.jpg';
import f4 from '../assets/Avtar/Female/f4.jpg';
import f5 from '../assets/Avtar/Female/f5.jpg';
import f6 from '../assets/Avtar/Female/f6.jpg';

import m1 from '../assets/Avtar/Male/m1.jpg';
import m2 from '../assets/Avtar/Male/m2.jpg';
import m3 from '../assets/Avtar/Male/m3.jpg';
import m4 from '../assets/Avtar/Male/m4.jpg';
import m5 from '../assets/Avtar/Male/m5.jpg';
import m6 from '../assets/Avtar/Male/m6.jpg';
import m7 from '../assets/Avtar/Male/m7.jpg';
import m8 from '../assets/Avtar/Male/m8.jpg';
import m9 from '../assets/Avtar/Male/m9.jpg';
import m10 from '../assets/Avtar/Male/m10.jpg';
import m11 from '../assets/Avtar/Male/m11.jpg';

const resolveImage = (imported, publicPath) => {
  if (typeof imported === 'string' && imported.trim()) return imported;
  if (imported && typeof imported === 'object' && typeof imported.default === 'string' && imported.default.trim()) return imported.default;
  return publicPath;
};

export const MALE_AVATARS = [
  { id: 'm1', name: 'Male 1', image: resolveImage(m1, '/avatars/Male/m1.jpg') || '/avatars/Male/m1.jpg', color: '#3b82f6' },
  { id: 'm2', name: 'Male 2', image: resolveImage(m2, '/avatars/Male/m2.jpg') || '/avatars/Male/m2.jpg', color: '#10b981' },
  { id: 'm3', name: 'Male 3', image: resolveImage(m3, '/avatars/Male/m3.jpg') || '/avatars/Male/m3.jpg', color: '#f59e0b' },
  { id: 'm4', name: 'Male 4', image: resolveImage(m4, '/avatars/Male/m4.jpg') || '/avatars/Male/m4.jpg', color: '#8b5cf6' },
  { id: 'm5', name: 'Male 5', image: resolveImage(m5, '/avatars/Male/m5.jpg') || '/avatars/Male/m5.jpg', color: '#06b6d4' },
  { id: 'm6', name: 'Male 6', image: resolveImage(m6, '/avatars/Male/m6.jpg') || '/avatars/Male/m6.jpg', color: '#ef4444' },
  { id: 'm7', name: 'Male 7', image: resolveImage(m7, '/avatars/Male/m7.jpg') || '/avatars/Male/m7.jpg', color: '#6366f1' },
  { id: 'm8', name: 'Male 8', image: resolveImage(m8, '/avatars/Male/m8.jpg') || '/avatars/Male/m8.jpg', color: '#ec4899' },
  { id: 'm9', name: 'Male 9', image: resolveImage(m9, '/avatars/Male/m9.jpg') || '/avatars/Male/m9.jpg', color: '#14b8a6' },
  { id: 'm10', name: 'Male 10', image: resolveImage(m10, '/avatars/Male/m10.jpg') || '/avatars/Male/m10.jpg', color: '#84cc16' },
  { id: 'm11', name: 'Male 11', image: resolveImage(m11, '/avatars/Male/m11.jpg') || '/avatars/Male/m11.jpg', color: '#f97316' },
];

export const FEMALE_AVATARS = [
  { id: 'f1', name: 'Female 1', image: resolveImage(f1, '/avatars/Female/f1.jpg') || '/avatars/Female/f1.jpg', color: '#ec4899' },
  { id: 'f2', name: 'Female 2', image: resolveImage(f2, '/avatars/Female/f2.jpg') || '/avatars/Female/f2.jpg', color: '#8b5cf6' },
  { id: 'f3', name: 'Female 3', image: resolveImage(f3, '/avatars/Female/f3.jpg') || '/avatars/Female/f3.jpg', color: '#06b6d4' },
  { id: 'f4', name: 'Female 4', image: resolveImage(f4, '/avatars/Female/f4.jpg') || '/avatars/Female/f4.jpg', color: '#f59e0b' },
  { id: 'f5', name: 'Female 5', image: resolveImage(f5, '/avatars/Female/f5.jpg') || '/avatars/Female/f5.jpg', color: '#10b981' },
  { id: 'f6', name: 'Female 6', image: resolveImage(f6, '/avatars/Female/f6.jpg') || '/avatars/Female/f6.jpg', color: '#ef4444' },
];
