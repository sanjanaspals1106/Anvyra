// The page sits on this fixed, full-screen village picture. The image is dimmed (a lower brightness
// and a soft slate wash) so it stays calm behind the content. `light` dims it a little less (login page).
import background from '../assets/background.webp';

export default function CountrysideBackground({ light = false }) {
  return (
    <div className="fixed inset-0 -z-0 overflow-hidden bg-slate-700" aria-hidden="true">
      <img
        src={background}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        style={{ filter: `brightness(${light ? 0.8 : 0.68}) saturate(0.85)` }}
      />
      <div className={`absolute inset-0 ${light ? 'bg-slate-900/10' : 'bg-slate-900/25'}`} />
    </div>
  );
}
