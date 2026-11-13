"use client";

import { useEffect, useRef } from "react";

export default function BetaLoopVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      video.pause();
      video.removeAttribute("autoplay");
      return;
    }

    const play = () => {
      void video.play().catch(() => {});
    };
    play();
    return () => {
      video.pause();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      autoPlay
    />
  );
}
