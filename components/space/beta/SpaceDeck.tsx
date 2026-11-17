"use client";

import {
  type AnimationEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import SlideChrome from "./SlideChrome";
import SlidePips from "./SlidePips";
import { SPACE_SLIDE_COUNT, SPACE_SLIDES } from "./slides";

const SWIPE_THRESHOLD = 50;
const WHEEL_THRESHOLD = 40;
const WHEEL_COOLDOWN_MS = 900;

type Phase = "idle" | "exit" | "enter";
type Dir = 1 | -1;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function getDeckScrollStage(deck: HTMLElement | null) {
  if (!deck) return null;
  return deck.querySelector<HTMLElement>(".beta-deck-stage");
}

/** True when the stage can still scroll in the wheel/swipe direction (deltaY > 0 = down). */
function canStageScroll(stage: HTMLElement, deltaY: number) {
  const maxScroll = stage.scrollHeight - stage.clientHeight;
  if (maxScroll <= 1) return false;
  if (deltaY > 0) return stage.scrollTop < maxScroll - 1;
  if (deltaY < 0) return stage.scrollTop > 1;
  return false;
}

export default function SpaceDeck({
  index,
  onIndexChange,
  transitionEnabled = true,
  children,
}: {
  index: number;
  onIndexChange: (index: number) => void;
  transitionEnabled?: boolean;
  children: ReactNode;
}) {
  const [displayedIndex, setDisplayedIndex] = useState(index);
  const [stageMotion, setStageMotion] = useState("");

  const phaseRef = useRef<Phase>("idle");
  const displayedRef = useRef(index);
  const pendingRef = useRef<number | null>(null);
  const dirRef = useRef<Dir>(1);
  const queuedRef = useRef<number | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const wheelAcc = useRef(0);
  const wheelGateUntil = useRef(0);
  const animTimerRef = useRef<number | null>(null);

  const slide = SPACE_SLIDES[displayedIndex] || SPACE_SLIDES[0];

  useEffect(() => {
    if (phaseRef.current !== "idle") return;
    if (index === displayedRef.current) return;
    displayedRef.current = index;
    setDisplayedIndex(index);
  }, [index]);

  const clearAnimTimer = useCallback(() => {
    if (animTimerRef.current != null) {
      window.clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
  }, []);

  const finishEnter = useCallback(() => {
    clearAnimTimer();
    phaseRef.current = "idle";
    pendingRef.current = null;
    setStageMotion("");
    const queued = queuedRef.current;
    queuedRef.current = null;
    if (queued != null && queued !== displayedRef.current) {
      // Defer so idle state commits before the next transition starts.
      requestAnimationFrame(() => {
        goToRef.current(queued);
      });
    }
  }, [clearAnimTimer]);

  const goToRef = useRef<(next: number) => void>(() => {});

  const armAnimTimer = useCallback((ms: number, fn: () => void) => {
    clearAnimTimer();
    animTimerRef.current = window.setTimeout(fn, ms);
  }, [clearAnimTimer]);

  const completeExit = useCallback(() => {
    const next = pendingRef.current;
    if (next == null) {
      finishEnter();
      return;
    }
    displayedRef.current = next;
    setDisplayedIndex(next);
    onIndexChange(next);
    phaseRef.current = "enter";
    const dir = dirRef.current;
    setStageMotion(dir === 1 ? "beta-stage--enter-next" : "beta-stage--enter-prev");
    armAnimTimer(480, () => {
      if (phaseRef.current === "enter") finishEnter();
    });
  }, [armAnimTimer, finishEnter, onIndexChange]);

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(SPACE_SLIDE_COUNT - 1, next));
    if (clamped === displayedRef.current && phaseRef.current === "idle") return;

    if (!transitionEnabled || prefersReducedMotion()) {
      clearAnimTimer();
      phaseRef.current = "idle";
      pendingRef.current = null;
      queuedRef.current = null;
      displayedRef.current = clamped;
      setDisplayedIndex(clamped);
      setStageMotion("");
      onIndexChange(clamped);
      return;
    }

    if (phaseRef.current !== "idle") {
      queuedRef.current = clamped;
      return;
    }

    const dir: Dir = clamped > displayedRef.current ? 1 : -1;
    dirRef.current = dir;
    pendingRef.current = clamped;
    phaseRef.current = "exit";
    setStageMotion(dir === 1 ? "beta-stage--exit-next" : "beta-stage--exit-prev");
    armAnimTimer(420, () => {
      if (phaseRef.current === "exit") completeExit();
    });
  }, [armAnimTimer, clearAnimTimer, completeExit, onIndexChange, transitionEnabled]);

  goToRef.current = goTo;

  const goPrev = useCallback(() => goTo(displayedRef.current - 1), [goTo]);
  const goNext = useCallback(() => goTo(displayedRef.current + 1), [goTo]);

  function onStageAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (phaseRef.current === "exit") {
      completeExit();
      return;
    }
    if (phaseRef.current === "enter") {
      finishEnter();
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!transitionEnabled) return;
      if (isEditableTarget(event.target)) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, transitionEnabled]);

  useEffect(() => {
    const node = deckRef.current;
    if (!node) return;

    function onWheel(event: WheelEvent) {
      if (!transitionEnabled) return;
      if (isEditableTarget(event.target)) return;

      const delta =
        event.deltaMode === 1
          ? event.deltaY * 16
          : event.deltaMode === 2
            ? event.deltaY * window.innerHeight
            : event.deltaY;

      if (Math.abs(delta) < 1) return;

      // Prefer native stage scrolling (e.g. community) before changing slides.
      const stage = getDeckScrollStage(node);
      if (stage && canStageScroll(stage, delta)) {
        wheelAcc.current = 0;
        return;
      }

      // Only claim the gesture when it can change slides.
      const atStart = displayedRef.current <= 0;
      const atEnd = displayedRef.current >= SPACE_SLIDE_COUNT - 1;
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) {
        wheelAcc.current = 0;
        return;
      }

      event.preventDefault();

      // One gesture → one slide: ignore momentum while transitioning or in cooldown.
      if (phaseRef.current !== "idle" || performance.now() < wheelGateUntil.current) {
        wheelAcc.current = 0;
        return;
      }

      wheelAcc.current += delta;
      if (Math.abs(wheelAcc.current) < WHEEL_THRESHOLD) return;
      const dir = wheelAcc.current > 0 ? 1 : -1;
      wheelAcc.current = 0;
      wheelGateUntil.current = performance.now() + WHEEL_COOLDOWN_MS;
      goToRef.current(displayedRef.current + dir);
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [transitionEnabled]);

  return (
    <div
      ref={deckRef}
      className="beta-deck"
      onTouchStart={(event) => {
        const touch = event.changedTouches[0];
        touchStart.current = touch
          ? { x: touch.clientX, y: touch.clientY }
          : null;
      }}
      onTouchEnd={(event) => {
        if (!touchStart.current) return;
        const touch = event.changedTouches[0];
        if (!touch) {
          touchStart.current = null;
          return;
        }
        const dx = touch.clientX - touchStart.current.x;
        const dy = touch.clientY - touchStart.current.y;
        touchStart.current = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) goNext();
          else goPrev();
        } else {
          // Finger up (dy < 0) → next; finger down → prev. Defer to stage scroll when possible.
          const stage = getDeckScrollStage(deckRef.current);
          if (stage && canStageScroll(stage, dy < 0 ? 1 : -1)) return;
          if (dy < 0) goNext();
          else goPrev();
        }
      }}
    >
      <div className="beta-deck-top">
        <div key={displayedIndex} className="beta-slide-chrome-wrap beta-chrome--fade">
          <SlideChrome index={displayedIndex} title={slide.title} />
        </div>
      </div>

      <div className="beta-deck-stage" aria-live="polite">
        <div
          className={`beta-deck-stage-inner ${stageMotion}`.trim()}
          onAnimationEnd={onStageAnimationEnd}
        >
          {children}
        </div>
      </div>

      <SlidePips index={displayedIndex} onSelect={goTo} />
    </div>
  );
}
