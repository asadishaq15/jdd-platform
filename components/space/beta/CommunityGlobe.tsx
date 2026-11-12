"use client";

const DOTS = [
  [160, 170, 3.2], [240, 120, 3], [350, 145, 3.5], [440, 180, 3], [190, 250, 2.8],
  [310, 275, 4], [420, 260, 3.2], [150, 370, 3], [250, 390, 3.5], [390, 380, 4],
  [470, 330, 2.8], [210, 470, 3.2], [330, 460, 3.5], [430, 440, 3.2], [285, 325, 5],
  [365, 220, 3], [115, 310, 2.8], [500, 290, 3.2], [375, 500, 3], [490, 430, 3.5],
  [275, 180, 3], [455, 235, 3.2],
] as const;

export default function CommunityGlobe() {
  return (
    <div className="beta-globe-wrap" aria-hidden="true">
      <svg className="beta-globe-wisps" viewBox="0 0 640 200" preserveAspectRatio="none">
        <path d="M0 110 C120 40 200 170 320 90 C440 20 520 150 640 70" />
        <path d="M0 130 C140 70 220 180 340 110 C460 50 540 160 640 95" opacity=".45" />
      </svg>
      <svg className="beta-community-globe" viewBox="0 0 620 620">
        <g className="beta-ggrid">
          <circle className="beta-gouter" cx="310" cy="310" r="260" />
          <ellipse cx="310" cy="310" rx="260" ry="60" />
          <ellipse cx="310" cy="310" rx="260" ry="130" />
          <ellipse cx="310" cy="310" rx="260" ry="200" />
          <ellipse cx="310" cy="310" rx="60" ry="260" />
          <ellipse cx="310" cy="310" rx="130" ry="260" />
          <ellipse cx="310" cy="310" rx="200" ry="260" />
          <line x1="310" y1="50" x2="310" y2="570" />
          <line x1="50" y1="310" x2="570" y2="310" />
        </g>
        {DOTS.map(([cx, cy, radius], index) => (
          <circle
            key={index}
            className="beta-gdot"
            cx={cx}
            cy={cy}
            r={radius}
            style={{ "--tw": `${3.4 + (index % 5) * 0.45}s` } as React.CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}
