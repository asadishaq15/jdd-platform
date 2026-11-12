"use client";

import { ReactNode, useCallback, useEffect, useRef } from "react";
import SlideChrome from "./SlideChrome";
import SlidePips from "./SlidePips";
import { SPACE_SLIDE_COUNT, SPACE_SLIDES } from "./slides";

const SWIPE_THRESHOLD = 50;

export default function SpaceDeck({
  index,
  onIndexChange,
  children,
}: {
  index: number;
  onIndexChange: (index: number) => void;
  children: ReactNode;
}) {
  const touchStartX = useRef<number | null>(null);
  const slide = SPACE_SLIDES[index] || SPACE_SLIDES[0];

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(SPACE_SLIDE_COUNT - 1, next));
    onIndexChange(clamped);
  }, [onIndexChange]);

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  return (
    <div
      className="beta-deck"
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStartX.current == null) return;
        const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
        const delta = endX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) < SWIPE_THRESHOLD) return;
        if (delta < 0) goNext();
        else goPrev();
      }}
    >
      <div className="beta-deck-top">
        <SlideChrome index={index} title={slide.title} />
        <div className="beta-deck-nav">
          <button
            type="button"
            className="beta-nav-btn"
            aria-label="Previous slide"
            disabled={index === 0}
            onClick={goPrev}
          >
            ‹
          </button>
          <button
            type="button"
            className="beta-nav-btn"
            aria-label="Next slide"
            disabled={index === SPACE_SLIDE_COUNT - 1}
            onClick={goNext}
          >
            ›
          </button>
        </div>
      </div>

      <div className="beta-deck-stage" aria-live="polite">
        {children}
      </div>

      <SlidePips index={index} onSelect={goTo} />
    </div>
  );
}
