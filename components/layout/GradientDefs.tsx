export default function GradientDefs() {
  return (
    <svg width="0" height="0" className="defs" aria-hidden="true">
      <defs>
        <radialGradient id="cd" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#FFF0DA" />
          <stop offset="45%" stopColor="#F0C79B" />
          <stop offset="80%" stopColor="#E6B98A" />
          <stop offset="100%" stopColor="#D6A06D" />
        </radialGradient>
        <linearGradient id="cg" gradientUnits="userSpaceOnUse" x1="120" y1="0" x2="780" y2="0">
          <stop offset="0%" stopColor="#A66A3F" />
          <stop offset="50%" stopColor="#F0C79B" />
          <stop offset="100%" stopColor="#C58452" />
        </linearGradient>
        <linearGradient id="cgl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A66A3F" />
          <stop offset="50%" stopColor="#F0C79B" />
          <stop offset="100%" stopColor="#C58452" />
        </linearGradient>
      </defs>
    </svg>
  );
}
