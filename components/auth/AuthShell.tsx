import BrandMark from "../brand/BrandMark";
import GradientDefs from "../layout/GradientDefs";
import ThemeToggle from "../layout/ThemeToggle";

const globeDots = [
  { cx: 180, cy: 180, r: 3.5, tw: "3.4s" },
  { cx: 440, cy: 150, r: 3, tw: "3.85s" },
  { cx: 500, cy: 270, r: 3.5, tw: "4.3s" },
  { cx: 380, cy: 120, r: 2.8, tw: "4.75s" },
  { cx: 145, cy: 260, r: 3.2, tw: "5.2s" },
  { cx: 220, cy: 420, r: 3.5, tw: "3.4s" },
  { cx: 410, cy: 440, r: 3.2, tw: "3.85s" },
  { cx: 330, cy: 200, r: 3, tw: "4.3s" },
  { cx: 255, cy: 150, r: 2.8, tw: "4.75s" },
  { cx: 480, cy: 380, r: 3.5, tw: "5.2s" },
  { cx: 130, cy: 360, r: 3, tw: "3.4s" },
  { cx: 290, cy: 470, r: 3.5, tw: "3.85s" },
  { cx: 380, cy: 330, r: 4, tw: "4.3s" },
  { cx: 200, cy: 300, r: 2.8, tw: "4.75s" },
  { cx: 470, cy: 200, r: 3.5, tw: "5.2s" },
  { cx: 320, cy: 380, r: 3, tw: "3.4s" },
  { cx: 360, cy: 490, r: 3.5, tw: "3.85s" },
  { cx: 250, cy: 240, r: 3, tw: "4.3s" },
  { cx: 415, cy: 250, r: 3.5, tw: "4.75s" },
  { cx: 170, cy: 440, r: 2.8, tw: "5.2s" },
  { cx: 470, cy: 470, r: 3, tw: "3.4s" },
  { cx: 285, cy: 325, r: 5, tw: "3.85s" },
];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell auth-shell">
      <GradientDefs />
      <aside className="aside" aria-hidden="true">
        <div className="brand"><BrandMark className="brand-logo" decorative /></div>
        <div className="art">
          <svg viewBox="0 0 620 620">
            <g className="ggrid">
              <circle className="gouter" cx="310" cy="310" r="260" />
              <ellipse cx="310" cy="310" rx="260" ry="60" /><ellipse cx="310" cy="310" rx="260" ry="130" /><ellipse cx="310" cy="310" rx="260" ry="200" />
              <ellipse cx="310" cy="310" rx="60" ry="260" /><ellipse cx="310" cy="310" rx="130" ry="260" /><ellipse cx="310" cy="310" rx="200" ry="260" />
              <line x1="310" y1="50" x2="310" y2="570" /><line x1="50" y1="310" x2="570" y2="310" />
            </g>
            {globeDots.map((dot) => (
              <circle key={`${dot.cx}-${dot.cy}`} className="gdot" cx={dot.cx} cy={dot.cy} r={dot.r} style={{ "--tw": dot.tw } as React.CSSProperties} />
            ))}
          </svg>
        </div>
        <div>
          <p className="quote">Choose your stay by <em className="cu">State</em><br />— not status.</p>
          <p className="sub">22 States. 22 hospitality worlds.</p>
        </div>
      </aside>
      <main className="main">
        <header className="top">
          <span className="demo-tag" title="All properties are fictional"><a className="demo-restart" href="/">Restart demo</a></span>
          <BrandMark />
          <ThemeToggle />
        </header>
        <div className="stage">
          <div className="panel">{children}</div>
        </div>
        <footer className="code-bar auth-code-bar">
          <svg className="key" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4" /><path d="M12 12h9M18 12v3M21 12v2" /></svg>
          <span>Have an access code from your stay?</span>
          <a className="tlink" href="/discover">Enter your code</a>
        </footer>
      </main>
    </div>
  );
}
