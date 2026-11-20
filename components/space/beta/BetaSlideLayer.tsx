"use client";

import { createContext, useContext, type ReactNode } from "react";

type DeckSlideContextValue = {
  activeIndex: number;
  stageMotion: string;
};

const DeckSlideContext = createContext<DeckSlideContextValue>({
  activeIndex: 0,
  stageMotion: "",
});

/** True when this slide layer is the visible deck slide (default true outside deck). */
const SlideLayerActiveContext = createContext(true);

export function useSlideLayerActive() {
  return useContext(SlideLayerActiveContext);
}

export function BetaDeckSlideProvider({
  activeIndex,
  stageMotion,
  children,
}: {
  activeIndex: number;
  stageMotion: string;
  children: ReactNode;
}) {
  return (
    <DeckSlideContext.Provider value={{ activeIndex, stageMotion }}>
      {children}
    </DeckSlideContext.Provider>
  );
}

export function BetaSlideLayer({
  index,
  slideId,
  children,
}: {
  index: number;
  slideId: string;
  children: ReactNode;
}) {
  const { activeIndex, stageMotion } = useContext(DeckSlideContext);
  const isActive = index === activeIndex;

  return (
    <SlideLayerActiveContext.Provider value={isActive}>
      <div
        className={[
          "beta-slide-layer",
          slideId ? `beta-slide-layer--${slideId}` : "",
          isActive ? "is-active" : "",
          isActive && stageMotion ? stageMotion : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden={!isActive}
        {...(isActive ? {} : { inert: true })}
      >
        {children}
      </div>
    </SlideLayerActiveContext.Provider>
  );
}