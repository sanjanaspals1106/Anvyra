import { Home, Droplets, Waves, Zap, Hammer } from 'lucide-react';

// Icon and chart colour for each project type (muted colours taken from the village scene).
export const PROJECT_META = {
  housing: { icon: Home, color: '#2F5D62' },
  water_tank: { icon: Droplets, color: '#6C7FA3' },
  canal: { icon: Waves, color: '#5B8466' },
  electricity: { icon: Zap, color: '#C79A4B' },
};
export const metaFor = (type) => PROJECT_META[type] || { icon: Hammer, color: '#64748b' };
export const COLORS = { onTrack: '#5B8466', late: '#A4473D', ochre: '#C79A4B', teal: '#2F5D62', grid: '#e2e8f0', axis: '#64748b' };
