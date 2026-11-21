import type { ReactNode } from "react";
import BrandMark from "../brand/BrandMark";
import GradientDefs from "../layout/GradientDefs";
import ThemeToggle from "../layout/ThemeToggle";
import BetaLoopVideo from "../space/beta/BetaLoopVideo";

const ASIDE_VIDEO_SRC = "/assets/bg-06-my-community-globe-stars-loop-15s.mp4";
const ASIDE_VIDEO_LIGHT_SRC = "/assets/bg-06-my-community-globe-stars-loop-15s_light.mp4";
const ASIDE_VIDEO_POSTER = "/assets/bg-06-my-community-globe-stars-poster.jpg";

export default function AuthShell({
  children,
  topStart,
  topCenter,
  className,
  wide = false,
}: {
  children: ReactNode;
  /** Replaces the empty top-left slot (e.g. Restart demo). */
  topStart?: ReactNode;
  /** Replaces the center brand mark (e.g. step label “1 of 2”). */
  topCenter?: ReactNode;
  className?: string;
  /**
   * My Space dashboard chrome: single column, no globe aside
   * (matches embedded dashboard in space (1).html).
   */
  wide?: boolean;
}) {
  const shellClass = [
    "shell",
    wide ? "shell-wide" : "auth-shell",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      <GradientDefs />
      {!wide ? (
        <aside className="aside" aria-hidden="true">
          <div className="brand"><BrandMark className="brand-logo" decorative /></div>
          <div className="art">
            <BetaLoopVideo
              className="auth-aside-video"
              src={ASIDE_VIDEO_SRC}
              lightSrc={ASIDE_VIDEO_LIGHT_SRC}
              poster={ASIDE_VIDEO_POSTER}
            />
          </div>
          <div>
            <p className="quote">
              Choose your stay
              <br />
              by <em className="cu">State</em>,
              <br />
              not status.
            </p>
            <p className="sub">22 States. 22 hospitality worlds.</p>
          </div>
        </aside>
      ) : null}
      <main className="main">
        <header className="top">
          {topStart ?? <span aria-hidden="true" />}
          {topCenter ?? <BrandMark />}
          <ThemeToggle />
        </header>
        <div className="stage">
          <div className="panel">{children}</div>
        </div>
        {/* Legacy access-code entry UI is intentionally hidden while activation links are in use.
        <footer className="code-bar auth-code-bar">
          <svg className="key" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4" /><path d="M12 12h9M18 12v3M21 12v2" /></svg>
          <span>Have an access code from your stay?</span>
          <a className="tlink" href="/discover">Enter your code</a>
        </footer>
        */}
      </main>
    </div>
  );
}
