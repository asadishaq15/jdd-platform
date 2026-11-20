"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const FADE_MS = 600;

function isNightTheme() {
  if (typeof document === "undefined") return false;
  return document.body.classList.contains("night");
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function playVideo(video: HTMLVideoElement | null) {
  if (!video) return;
  void video.play().catch(() => {});
}

function whenCanPlay(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const done = () => {
      video.removeEventListener("canplay", done);
      resolve();
    };
    video.addEventListener("canplay", done);
  });
}

export default function BetaLoopVideo({
  src,
  lightSrc,
  poster,
  className,
}: {
  src: string;
  lightSrc?: string;
  poster: string;
  className?: string;
}) {
  const nightRef = useRef<HTMLVideoElement | null>(null);
  const lightRef = useRef<HTMLVideoElement | null>(null);
  const singleRef = useRef<HTMLVideoElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const [night, setNight] = useState(isNightTheme);
  const [activeLayer, setActiveLayer] = useState<"night" | "light">(() =>
    isNightTheme() ? "night" : "light",
  );

  useLayoutEffect(() => {
    const initialNight = isNightTheme();
    setNight(initialNight);
    setActiveLayer(initialNight ? "night" : "light");
    const observer = new MutationObserver(() => {
      setNight(isNightTheme());
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Keep encodings playing even on hidden deck slides — avoids poster flash on resume.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const list = lightSrc ? [nightRef.current, lightRef.current] : [singleRef.current];
    void (async () => {
      const videos = list.filter((v): v is HTMLVideoElement => Boolean(v));
      await Promise.all(videos.map((v) => whenCanPlay(v)));
      videos.forEach(playVideo);
    })();
  }, [lightSrc, src]);

  // Single-source path (no light variant)
  useEffect(() => {
    if (lightSrc) return;
    const video = singleRef.current;
    if (!video) return;

    if (prefersReducedMotion()) {
      video.pause();
      video.removeAttribute("autoplay");
      return;
    }

    playVideo(video);
  }, [lightSrc, src]);

  // Dual-source theme crossfade (no src reload; do not pause on deck hide)
  useEffect(() => {
    if (!lightSrc) return;

    const nightVideo = nightRef.current;
    const lightVideo = lightRef.current;
    if (!nightVideo || !lightVideo) return;

    if (fadeTimerRef.current) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    if (prefersReducedMotion()) {
      nightVideo.pause();
      lightVideo.pause();
      nightVideo.removeAttribute("autoplay");
      lightVideo.removeAttribute("autoplay");
      setActiveLayer(night ? "night" : "light");
      return;
    }

    const nextLayer: "night" | "light" = night ? "night" : "light";
    const incoming = nextLayer === "night" ? nightVideo : lightVideo;
    const outgoing = nextLayer === "night" ? lightVideo : nightVideo;

    let cancelled = false;

    playVideo(incoming);
    setActiveLayer(nextLayer);

    void (async () => {
      await whenCanPlay(incoming);
      if (cancelled) return;
      playVideo(incoming);
      fadeTimerRef.current = window.setTimeout(() => {
        if (!cancelled && outgoing !== incoming) {
          outgoing.pause();
        }
        fadeTimerRef.current = null;
      }, FADE_MS);
    })();

    return () => {
      cancelled = true;
      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, [lightSrc, night]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  if (!lightSrc) {
    return (
      <video
        ref={singleRef}
        className={className}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="auto"
        autoPlay
      />
    );
  }

  const wrapClass = ["beta-loop-video", className].filter(Boolean).join(" ");

  return (
    <div className={wrapClass}>
      <video
        ref={nightRef}
        className={`beta-loop-video-layer${activeLayer === "night" ? " is-active" : ""}`}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="auto"
        autoPlay
      />
      <video
        ref={lightRef}
        className={`beta-loop-video-layer${activeLayer === "light" ? " is-active" : ""}`}
        src={lightSrc}
        poster={poster}
        muted
        loop
        playsInline
        preload="auto"
        autoPlay
      />
    </div>
  );
}