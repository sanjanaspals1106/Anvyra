// The whole website sits on this fixed, full-screen countryside scene.
// It is drawn here as an inline SVG (no stock image): sky, sun, clouds, green hills,
// a sandy path and flowers. preserveAspectRatio="xMidYMid slice" makes it fill any screen.

// A small repeatable random generator, so the grass and flowers are the same on every load.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// A flat cloud made of overlapping circles. (x, y) is the left baseline, w is its width.
function Cloud({ x, y, w, opacity = 1 }) {
  const u = w / 10;
  return (
    <g fill="#fff" opacity={opacity}>
      <rect x={x} y={y - u * 1.6} width={w} height={u * 1.6} rx={u * 0.8} />
      <circle cx={x + u * 3} cy={y - u * 1.9} r={u * 1.7} />
      <circle cx={x + u * 5.6} cy={y - u * 2.5} r={u * 2.3} />
      <circle cx={x + u * 8} cy={y - u * 1.8} r={u * 1.5} />
    </g>
  );
}

function Daisy({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 V28" stroke="#2f8f2a" strokeWidth="3" />
      {[0, 45, 90, 135].map((a) => (
        <ellipse key={a} cx="0" cy="-13" rx="4.5" ry="11" fill="#fff" transform={`rotate(${a} 0 0) translate(0 0)`} />
      ))}
      {[0, 45, 90, 135].map((a) => (
        <ellipse key={`b${a}`} cx="0" cy="13" rx="4.5" ry="11" fill="#fff" transform={`rotate(${a} 0 0)`} />
      ))}
      <circle r="7" fill="#FFC928" />
    </g>
  );
}

function PinkFlower({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 V26" stroke="#2f8f2a" strokeWidth="3" />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx="0" cy="-8" r="6" fill="#E0368C" transform={`rotate(${a})`} />
      ))}
      <circle r="4" fill="#FFE27A" />
    </g>
  );
}

function Tulip({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 V34" stroke="#2f8f2a" strokeWidth="3" />
      <path d="M-9 -14 Q-9 4 0 4 Q9 4 9 -14 L4 -7 L0 -16 L-4 -7 Z" fill="#FFC72C" />
    </g>
  );
}

export default function CountrysideBackground() {
  const rnd = seeded(42);

  // Grass tufts on the two hills.
  const tufts = Array.from({ length: 46 }, () => {
    const x = 20 + rnd() * 1560;
    const y = 640 + rnd() * 230;
    return { x, y, s: 0.7 + rnd() * 0.9 };
  });
  // Tiny white dots: distant flowers.
  const dots = Array.from({ length: 70 }, () => ({ x: rnd() * 1600, y: 610 + rnd() * 270, r: 1.2 + rnd() * 1.6 }));
  // Row of flowers along the bottom edge.
  const flowers = Array.from({ length: 30 }, (_, i) => ({
    x: 20 + i * 54 + rnd() * 30,
    y: 835 + rnd() * 30,
    s: 0.8 + rnd() * 0.5,
    kind: i % 3,
  }));
  const blades = Array.from({ length: 70 }, () => ({ x: rnd() * 1600, h: 30 + rnd() * 45, lean: (rnd() - 0.5) * 22 }));

  return (
    <svg
      aria-hidden="true"
      className="fixed inset-0 h-full w-full pointer-events-none"
      style={{ zIndex: 0 }}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14A3D6" />
          <stop offset="1" stopColor="#9BE3F2" />
        </linearGradient>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5BC236" />
          <stop offset="1" stopColor="#3FA52A" />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#FFF3A0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFF3A0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky, from deep blue at the top to pale cyan at the horizon */}
      <rect width="1600" height="900" fill="url(#sky)" />

      {/* Sun, with a small cloud over its lower edge */}
      <circle cx="260" cy="170" r="130" fill="url(#sunGlow)" />
      <circle cx="260" cy="170" r="68" fill="#FFD93B" />
      <Cloud x={215} y={238} w={150} />

      {/* Small soft clouds that drift slowly */}
      <g className="cloud-drift"><Cloud x={620} y={150} w={170} opacity={0.8} /></g>
      <g className="cloud-drift-slow"><Cloud x={1010} y={95} w={130} opacity={0.75} /></g>
      <g className="cloud-drift"><Cloud x={1290} y={225} w={190} opacity={0.8} /></g>

      {/* Big cloud banks sitting on the horizon, partly behind the hills */}
      <g fill="#fff" opacity="0.95">
        <circle cx="70" cy="590" r="95" /><circle cx="190" cy="560" r="115" /><circle cx="330" cy="585" r="100" />
        <circle cx="450" cy="610" r="80" /><rect x="-20" y="585" width="520" height="60" />
        <circle cx="1130" cy="610" r="80" /><circle cx="1260" cy="578" r="108" /><circle cx="1400" cy="560" r="118" />
        <circle cx="1530" cy="590" r="100" /><rect x="1100" y="590" width="540" height="60" />
      </g>

      {/* Two broad rounded hills meeting near the middle */}
      <path d="M-120 900 V700 Q-60 590 330 585 Q700 580 820 650 Q860 700 860 900 Z" fill="url(#hill)" />
      <path d="M1720 900 V690 Q1650 590 1270 583 Q900 578 780 650 Q740 700 740 900 Z" fill="#4DB82F" />
      <path d="M-120 900 V760 Q200 690 560 740 Q760 770 840 900 Z" fill="#46B02D" opacity="0.55" />
      <path d="M1720 900 V770 Q1400 700 1040 745 Q840 775 760 900 Z" fill="#46B02D" opacity="0.55" />

      {/* Darker bushes and trees at the far left and far right */}
      <g fill="#2E8B2A">
        <circle cx="30" cy="640" r="60" /><circle cx="110" cy="660" r="52" /><circle cx="-10" cy="720" r="70" />
        <circle cx="1570" cy="640" r="60" /><circle cx="1490" cy="662" r="50" /><circle cx="1610" cy="720" r="70" />
      </g>
      <g fill="#24771F">
        <circle cx="65" cy="690" r="40" /><circle cx="150" cy="715" r="34" />
        <circle cx="1535" cy="690" r="40" /><circle cx="1450" cy="715" r="34" />
      </g>

      {/* Winding sandy path: wide at the bottom, narrow at the horizon */}
      <path
        d="M500 900 C560 800 880 790 800 705 C745 650 835 625 790 585 L812 585 C862 625 790 655 850 705 C940 785 640 800 1110 900 Z"
        fill="#B98530"
      />
      <path
        d="M520 900 C585 812 885 798 815 708 C760 655 842 630 797 588 L808 588 C852 628 778 658 840 708 C925 780 665 805 1085 900 Z"
        fill="#D9A441"
      />

      {/* Grass tufts and distant flowers */}
      <g stroke="#2f8f2a" strokeWidth="2.5" strokeLinecap="round" fill="none">
        {tufts.map((t, i) => (
          <path key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`} d="M-8 0 L-11 -14 M0 0 L0 -18 M8 0 L11 -14" />
        ))}
      </g>
      <g fill="#fff" opacity="0.9">
        {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} />)}
      </g>

      {/* Row of flowers and tall grass along the bottom edge */}
      <g stroke="#2f8f2a" strokeWidth="3" strokeLinecap="round" fill="none">
        {blades.map((b, i) => <path key={i} d={`M${b.x} 905 Q${b.x + b.lean / 2} ${905 - b.h / 2} ${b.x + b.lean} ${905 - b.h}`} />)}
      </g>
      {flowers.map((f, i) => {
        const Comp = [Daisy, PinkFlower, Tulip][f.kind];
        return <Comp key={i} x={f.x} y={f.y} s={f.s} />;
      })}
    </svg>
  );
}
