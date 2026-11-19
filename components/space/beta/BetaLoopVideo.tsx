"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

function isNightTheme() {
  if (typeof document === "undefined") return false;
  return document.body.classList.contains("night");
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [night, setNight] = useState(false);
  const activeSrc = !night && lightSrc ? lightSrc : src;

  useLayoutEffect(() => {
    setNight(isNightTheme());
    const observer = new MutationObserver(() => {
      setNight(isNightTheme());
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      video.pause();
      video.removeAttribute("autoplay");
      return;
    }

    if (video.getAttribute("src") !== activeSrc) {
      video.setAttribute("src", activeSrc);
      video.load();
    }

    const play = () => {
      void video.play().catch(() => {});
    };
    play();
    return () => {
      video.pause();
    };
  }, [activeSrc]);

  return (
    <video
      ref={videoRef}
      className={className}
      src={activeSrc}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      autoPlay
    />
  );
}
