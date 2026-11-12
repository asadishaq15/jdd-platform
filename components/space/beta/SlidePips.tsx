import { SPACE_SLIDE_COUNT } from "./slides";

export default function SlidePips({
  index,
  onSelect,
}: {
  index: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="beta-pips" role="tablist" aria-label="Space slides">
      {Array.from({ length: SPACE_SLIDE_COUNT }, (_, pipIndex) => (
        <button
          key={pipIndex}
          type="button"
          role="tab"
          className={`beta-pip${pipIndex === index ? " active" : ""}`}
          aria-selected={pipIndex === index}
          aria-label={`Go to slide ${pipIndex + 1}`}
          onClick={() => onSelect(pipIndex)}
        />
      ))}
    </div>
  );
}
