import { padSlideIndex, SPACE_SLIDE_COUNT } from "./slides";

export default function SlideChrome({
  index,
  title,
}: {
  index: number;
  title: string;
}) {
  return (
    <p className="beta-slide-chrome">
      <span className="beta-slide-index">
        {padSlideIndex(index)} / {String(SPACE_SLIDE_COUNT).padStart(2, "0")}
      </span>
      <span className="beta-slide-title">{title}</span>
    </p>
  );
}
