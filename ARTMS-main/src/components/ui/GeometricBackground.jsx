/**
 * GeometricBackground — Reusable decorative background component
 * -----------------------------------------------------------------------
 * Renders ultra-subtle geometric SVG/CSS patterns behind any section.
 * All elements are pointer-events:none and aria-hidden.
 *
 * Variants:
 *   "mesh"      — Fine cross-grid lines with soft radial glow (default)
 *   "polygons"  — Floating abstract polygon outlines (layered facets)
 *   "waves"     — Stacked soft sine-wave paths
 *   "isometric" — Isometric triangle tessellation grid
 *
 * Usage:
 *   <section className="relative isolate overflow-hidden py-20">
 *     <GeometricBackground variant="mesh" />
 *     <div className="relative z-10">...content...</div>
 *   </section>
 */

export default function GeometricBackground({
  variant = "mesh",
  className = "",
  color = "6,15,90",
  accentColor = "249,115,22",
}) {
  // ─── MESH ──────────────────────────────────────────────────────────────────
  if (variant === "mesh") {
    return (
      <div
        className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="geo-mesh" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={`rgba(${color},0.07)`} strokeWidth="0.75" />
            </pattern>
            <radialGradient id="geo-mesh-mask-grad" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="geo-mesh-fade">
              <rect width="100%" height="100%" fill="url(#geo-mesh-mask-grad)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#geo-mesh)" mask="url(#geo-mesh-fade)" />
        </svg>
        <div
          className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(${color},0.04) 0%, transparent 70%)` }}
        />
        <div
          className="absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(${accentColor},0.05) 0%, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, rgba(${color},0.04) 0%, transparent 70%)` }}
        />
      </div>
    );
  }

  // ─── POLYGONS ──────────────────────────────────────────────────────────────
  if (variant === "polygons") {
    return (
      <div
        className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1200 700"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="900,0 1200,120 1200,0" fill="none" stroke={`rgba(${color},0.06)`} strokeWidth="1" />
          <polygon points="800,-40 1200,200 1100,0" fill={`rgba(${color},0.018)`} stroke={`rgba(${color},0.05)`} strokeWidth="0.8" />
          <polygon points="0,200 220,100 180,320" fill="none" stroke={`rgba(${color},0.06)`} strokeWidth="1" />
          <polygon points="-60,280 200,160 140,400" fill={`rgba(${color},0.015)`} stroke={`rgba(${color},0.04)`} strokeWidth="0.8" />
          <polygon points="580,180 680,300 580,420 480,300" fill="none" stroke={`rgba(${color},0.04)`} strokeWidth="1" />
          <polygon points="560,200 660,300 560,400 460,300" fill={`rgba(${color},0.012)`} stroke={`rgba(${color},0.035)`} strokeWidth="0.6" />
          <polygon points="900,600 1200,520 1200,700 850,700" fill={`rgba(${color},0.018)`} stroke={`rgba(${color},0.05)`} strokeWidth="0.8" />
          <polygon points="0,0 280,0 0,200" fill={`rgba(${accentColor},0.025)`} stroke={`rgba(${accentColor},0.06)`} strokeWidth="0.6" />
          <polygon points="440,60 490,20 510,80" fill="none" stroke={`rgba(${color},0.07)`} strokeWidth="0.7" />
          <polygon points="700,520 760,480 780,560" fill="none" stroke={`rgba(${color},0.07)`} strokeWidth="0.7" />
          <polygon points="120,560 180,510 210,590" fill="none" stroke={`rgba(${color},0.06)`} strokeWidth="0.6" />
        </svg>
        <div
          className="absolute right-0 top-0 h-80 w-80 blur-3xl opacity-40"
          style={{ background: `radial-gradient(circle, rgba(${color},0.04) 0%, transparent 70%)` }}
        />
      </div>
    );
  }

  // ─── WAVES ─────────────────────────────────────────────────────────────────
  if (variant === "waves") {
    return (
      <div
        className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,160 C240,260 480,60 720,160 C960,260 1200,60 1440,160 L1440,320 L0,320 Z" fill={`rgba(${color},0.025)`} />
          <path d="M0,200 C200,120 400,280 600,200 C800,120 1000,280 1200,200 C1320,160 1380,180 1440,200 L1440,320 L0,320 Z" fill={`rgba(${color},0.035)`} />
          <path d="M0,240 C300,200 600,280 900,240 C1100,220 1280,260 1440,240 L1440,320 L0,320 Z" fill={`rgba(${color},0.045)`} />
        </svg>
        <svg className="absolute top-0 left-0 w-full" style={{ transform: "rotate(180deg) scaleX(-1)" }} viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C360,100 720,0 1080,60 C1260,90 1380,40 1440,40 L1440,120 L0,120 Z" fill={`rgba(${color},0.025)`} />
        </svg>
        <svg className="absolute inset-0 h-full w-full opacity-40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="geo-waves-dots" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill={`rgba(${color},0.08)`} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geo-waves-dots)" />
        </svg>
      </div>
    );
  }

  // ─── ISOMETRIC ─────────────────────────────────────────────────────────────
  if (variant === "isometric") {
    const W = 80;
    const H = Math.round(W * Math.sin(Math.PI / 3));
    const cols = 20;
    const rows = 12;
    const triangles = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * W;
        const y = r * H;
        const offset = r % 2 === 0 ? 0 : W / 2;
        triangles.push(`M${x + offset},${y + H} L${x + offset + W / 2},${y} L${x + offset + W},${y + H} Z`);
        if (c < cols - 1) {
          triangles.push(`M${x + offset + W / 2},${y} L${x + offset + W},${y + H} L${x + offset + W + W / 2},${y} Z`);
        }
      }
    }

    return (
      <div
        className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${cols * W + W / 2} ${rows * H}`}
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="iso-fade-grad" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="white" stopOpacity="1" />
            </radialGradient>
            <mask id="iso-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect width="100%" height="100%" fill="url(#iso-fade-grad)" />
            </mask>
          </defs>
          {triangles.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={`rgba(${color},0.055)`} strokeWidth="0.6" mask="url(#iso-mask)" />
          ))}
        </svg>
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(${accentColor},0.028) 0%, transparent 70%)` }}
        />
      </div>
    );
  }

  return null;
}
