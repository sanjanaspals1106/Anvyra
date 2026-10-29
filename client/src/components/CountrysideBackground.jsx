// The page sits on this fixed, full-screen village landscape: a flat vector scene in soft, muted,
// slightly hazy colours with depth from back to front (sky, mountains, hills, village, fields).
// It is original artwork drawn as inline SVG. preserveAspectRatio="xMidYMid slice" fills any screen,
// and a white wash over the top keeps it calm behind the content. `light` lowers the wash (login page).

function Pine({ x, y, h, c = '#456450' }) {
  const w = h * 0.42;
  return (
    <g fill={c}>
      <polygon points={`${x},${y - h} ${x - w * 0.55},${y - h * 0.5} ${x + w * 0.55},${y - h * 0.5}`} />
      <polygon points={`${x},${y - h * 0.72} ${x - w * 0.8},${y - h * 0.22} ${x + w * 0.8},${y - h * 0.22}`} />
      <polygon points={`${x},${y - h * 0.42} ${x - w},${y} ${x + w},${y}`} />
    </g>
  );
}

function House({ x, y, w = 60, h = 34, roof = '#b4593d', wall = '#eadfcc' }) {
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h} fill={wall} />
      <rect x={x + w * 0.12} y={y - h * 0.55} width={w * 0.16} height={h * 0.55} fill="#b8a98d" />
      <rect x={x + w * 0.58} y={y - h * 0.7} width={w * 0.2} height={h * 0.28} fill="#b8a98d" />
      <polygon points={`${x - 5},${y - h} ${x + w / 2},${y - h - h * 0.55} ${x + w + 5},${y - h}`} fill={roof} />
      <rect x={x} y={y - 3} width={w} height={3} fill="#000" opacity="0.06" />
    </g>
  );
}

// A house still being built: low walls and a frame of scaffolding poles.
function HouseInBuild({ x, y }) {
  const w = 64;
  return (
    <g>
      <rect x={x} y={y - 22} width={w} height={22} fill="#d8cdb9" />
      <rect x={x + 4} y={y - 36} width={w - 8} height={14} fill="#e4d9c5" />
      <g stroke="#8c7d62" strokeWidth="1.6" fill="none">
        <path d={`M${x - 6} ${y} V${y - 62} M${x + w + 6} ${y} V${y - 62} M${x + w / 2} ${y} V${y - 62}`} />
        <path d={`M${x - 6} ${y - 20} H${x + w + 6} M${x - 6} ${y - 40} H${x + w + 6} M${x - 6} ${y - 60} H${x + w + 6}`} />
        <path d={`M${x - 6} ${y} L${x + w / 2} ${y - 40} M${x + w / 2} ${y} L${x + w + 6} ${y - 40}`} />
      </g>
    </g>
  );
}

function Pole({ x, y, h = 70 }) {
  return (
    <g stroke="#6f6a63" strokeLinecap="round">
      <path d={`M${x} ${y} V${y - h}`} strokeWidth="3" />
      <path d={`M${x - 14} ${y - h + 6} H${x + 14}`} strokeWidth="2.4" />
    </g>
  );
}

export default function CountrysideBackground({ light = false }) {
  // Gentle furrows across the front fields.
  const furrows = Array.from({ length: 9 }, (_, i) => {
    const y = 700 + i * 24;
    return `M-20 ${y + 14} Q400 ${y - 14} 800 ${y + 6} T1620 ${y - 6}`;
  });
  const poles = [190, 330, 470, 610].map((x, i) => ({ x, y: 640 - i * 14 + (i > 1 ? 4 : 0) }));

  return (
    <div className="fixed inset-0 -z-0 overflow-hidden bg-[#e9edf0]" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c6d6e4" />
            <stop offset="0.6" stopColor="#e3eaef" />
            <stop offset="1" stopColor="#f6f3ec" />
          </linearGradient>
          <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6f3ec" stopOpacity="0" />
            <stop offset="1" stopColor="#f6f3ec" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={light ? 0.28 : 0.5} />
            <stop offset="0.55" stopColor="#fff" stopOpacity={light ? 0.1 : 0.3} />
            <stop offset="1" stopColor="#fff" stopOpacity={light ? 0 : 0.1} />
          </linearGradient>
        </defs>

        {/* Sky, faint diagonal light rays and a few long thin clouds (no sun disc) */}
        <rect width="1600" height="900" fill="url(#sky)" />
        <g fill="url(#ray)">
          <polygon points="180,0 330,0 760,560 560,560" opacity="0.5" />
          <polygon points="470,0 560,0 1010,560 880,560" opacity="0.4" />
          <polygon points="760,0 830,0 1230,560 1130,560" opacity="0.3" />
        </g>
        <g fill="#fff">
          <g className="cloud-drift"><rect x="120" y="110" width="420" height="9" rx="4.5" opacity="0.55" /><rect x="220" y="128" width="260" height="6" rx="3" opacity="0.4" /></g>
          <g className="cloud-drift-slow"><rect x="760" y="70" width="520" height="8" rx="4" opacity="0.5" /><rect x="900" y="90" width="300" height="6" rx="3" opacity="0.35" /></g>
          <g className="cloud-drift"><rect x="1180" y="200" width="340" height="7" rx="3.5" opacity="0.45" /></g>
          <rect x="40" y="250" width="300" height="6" rx="3" opacity="0.35" />
        </g>

        {/* Mountains: three lavender-grey ranges, hazier the further away */}
        <path d="M0 470 L120 380 L230 440 L360 340 L520 450 L650 390 L790 460 L940 360 L1090 450 L1230 380 L1380 450 L1500 390 L1600 440 V560 H0Z" fill="#d3d6e4" />
        <path d="M0 500 L150 430 L260 480 L420 400 L560 490 L720 420 L870 500 L1030 410 L1190 500 L1340 430 L1480 490 L1600 450 V570 H0Z" fill="#bfc4d8" />
        <path d="M0 530 L180 480 L330 520 L500 465 L680 530 L860 485 L1020 535 L1200 480 L1380 530 L1600 495 V580 H0Z" fill="#a9b0c8" />
        <rect y="440" width="1600" height="150" fill="url(#haze)" />

        {/* Rolling hills in muted ochre and sage */}
        <path d="M0 560 Q260 500 520 545 T1040 535 T1600 520 V700 H0Z" fill="#d6c496" />
        <path d="M0 590 Q300 540 620 580 T1180 565 T1600 575 V720 H0Z" fill="#b5c19a" />
        <path d="M0 620 Q280 580 560 615 T1120 600 T1600 610 V760 H0Z" fill="#9db287" />

        {/* Far right: a line of dark-green pines with rounded shrubs at the edges */}
        <g>
          {[1230, 1275, 1315, 1360, 1400, 1445, 1490, 1535, 1580].map((x, i) => (
            <Pine key={x} x={x} y={612 + (i % 3) * 6} h={78 + (i % 4) * 14} c={i % 2 ? '#3f5b49' : '#4b6a55'} />
          ))}
          <ellipse cx="1190" cy="612" rx="30" ry="15" fill="#6d8a63" />
          <ellipse cx="1590" cy="624" rx="40" ry="18" fill="#5f7d57" />
        </g>
        <ellipse cx="60" cy="622" rx="42" ry="17" fill="#7f9a72" />

        {/* The village (left and centre) */}
        <g>
          {/* road, with a row of electric poles and thin wires beside it */}
          <path d="M-20 730 Q320 650 640 640 T1000 625 L1000 636 Q760 650 560 662 T-20 760Z" fill="#d9ccb0" />
          <g>
            {poles.map((p) => <Pole key={p.x} x={p.x} y={p.y} h={74} />)}
            {poles.slice(0, -1).map((p, i) => {
              const q = poles[i + 1];
              return (
                <g key={p.x} fill="none" stroke="#6f6a63" strokeWidth="1.1" opacity="0.8">
                  <path d={`M${p.x - 12} ${p.y - 68} Q${(p.x + q.x) / 2} ${p.y - 46 + (i - 1) * 2} ${q.x - 12} ${q.y - 68}`} />
                  <path d={`M${p.x + 12} ${p.y - 68} Q${(p.x + q.x) / 2} ${p.y - 46 + (i - 1) * 2} ${q.x + 12} ${q.y - 68}`} />
                </g>
              );
            })}
          </g>

          {/* thin canal catching a little light */}
          <path d="M700 680 Q900 642 1120 668 T1520 650" fill="none" stroke="#a9c7d0" strokeWidth="9" strokeLinecap="round" />
          <path d="M700 678 Q900 640 1120 666 T1520 648" fill="none" stroke="#e8f2f4" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

          {/* houses */}
          <House x={150} y={590} roof="#b4593d" />
          <House x={232} y={596} w={54} h={30} roof="#a24b36" wall="#e5d8c0" />
          <House x={318} y={588} w={64} h={36} roof="#c0694a" />
          <House x={408} y={600} w={56} h={30} roof="#9c4a37" wall="#eee3d1" />
          <HouseInBuild x={488} y={596} />

          {/* overhead water tank on legs */}
          <g>
            <g stroke="#8d8f95" strokeWidth="3" strokeLinecap="round">
              <path d="M668 600 L680 520 M716 600 L704 520 M688 600 V520 M698 600 V520" />
              <path d="M672 565 H712 M676 540 H708" strokeWidth="1.5" />
            </g>
            <ellipse cx="692" cy="508" rx="30" ry="9" fill="#c4cad0" />
            <rect x="662" y="470" width="60" height="38" fill="#d9dee2" />
            <ellipse cx="692" cy="470" rx="30" ry="9" fill="#e7ebee" />
            <path d="M662 470 Q692 440 722 470Z" fill="#b9c0c6" />
          </g>

          {/* white fence */}
          <g fill="#f4f1ea" stroke="#f4f1ea">
            {Array.from({ length: 9 }, (_, i) => <rect key={i} x={800 + i * 22} y={622 - (i % 2)} width="4" height="22" rx="1" stroke="none" />)}
            <path d="M796 630 H1000 M796 638 H1000" strokeWidth="2.4" fill="none" />
          </g>

          {/* a couple of animals grazing far away */}
          <g fill="#6b5f52" opacity="0.7">
            <ellipse cx="1040" cy="598" rx="7" ry="3.5" /><rect x="1034" y="600" width="1.6" height="5" /><rect x="1043" y="600" width="1.6" height="5" /><circle cx="1047" cy="595" r="2" />
            <ellipse cx="1072" cy="602" rx="6" ry="3" /><rect x="1067" y="603" width="1.4" height="4" /><rect x="1075" y="603" width="1.4" height="4" /><circle cx="1078" cy="599" r="1.8" />
          </g>
        </g>

        {/* Front fields with gentle curved furrows */}
        <path d="M0 690 Q420 650 820 680 T1600 670 V900 H0Z" fill="#8aa176" />
        <path d="M0 740 Q500 700 900 735 T1600 722 V900 H0Z" fill="#7a9367" />
        <g fill="none" stroke="#5f7d57" strokeWidth="2.2" opacity="0.35">
          {furrows.map((d) => <path key={d} d={d} />)}
        </g>
        <rect y="860" width="1600" height="40" fill="#6c8659" opacity="0.5" />

        {/* White-to-transparent wash so the scene never competes with the content */}
        <rect width="1600" height="900" fill="url(#wash)" />
      </svg>
    </div>
  );
}
