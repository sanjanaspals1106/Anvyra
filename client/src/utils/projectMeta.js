import { Home, Droplets, Waves, Zap, Hammer } from 'lucide-react';

// Icon and chart colour for each project type.
export const PROJECT_META = {
  housing: { icon: Home, color: '#0E8FC6' },
  water_tank: { icon: Droplets, color: '#8B5CF6' },
  canal: { icon: Waves, color: '#2E9E44' },
  electricity: { icon: Zap, color: '#E8A317' },
};
export const metaFor = (type) => PROJECT_META[type] || { icon: Hammer, color: '#6b7280' };
