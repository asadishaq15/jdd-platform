"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  measureSuggestPlacement,
  rankLocationItems,
} from "../../lib/location-suggest";
import { foldLocationQuery } from "../../lib/world-cities";

export type LocationSuggestFieldProps<T> = {
  value: string;
  onChange: (value: string) => void;
  onPick: (item: T) => void;
  items: T[];
  getMain: (item: T) => string;
  getAll: (item: T) => string;
  renderOption: (item: T) => ReactNode;
  placeholder: string;
  "aria-label": string;
  maxLength?: number;
  inputRef?: RefObject<HTMLInputElement | null>;
  id?: string;
};

export default function LocationSuggestField<T>({
  value,
  onChange,
  onPick,
  items,
  getMain,
  getAll,
  renderOption,
  placeholder,
  "aria-label": ariaLabel,
  maxLength = 60,
  inputRef: externalInputRef,
  id,
}: LocationSuggestFieldProps<T>) {
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? localInputRef;
  const boxRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [matches, setMatches] = useState<T[]>([]);
  const [up, setUp] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);

  function refresh(nextValue: string) {
    const next = rankLocationItems(nextValue, items, getMain, getAll);
    setMatches(next);
    setActive(-1);
    setOpen(next.length > 0 && foldLocationQuery(nextValue).length > 0);
  }

  useLayoutEffect(() => {
    if (!open || !inputRef.current || !boxRef.current) return;
    const scr = inputRef.current.closest(".scr");
    const actions = scr?.querySelector(".actions") ?? null;
    const place = measureSuggestPlacement(
      inputRef.current,
      boxRef.current.scrollHeight,
      actions,
    );
    setUp(place.up);
    setMaxHeight(place.maxHeight);
  }, [open, matches, inputRef]);

  useEffect(() => {
    if (!open) return;
    function onScrollOrResize() {
      if (!inputRef.current || !boxRef.current) return;
      const scr = inputRef.current.closest(".scr");
      const actions = scr?.querySelector(".actions") ?? null;
      const place = measureSuggestPlacement(
        inputRef.current,
        boxRef.current.scrollHeight,
        actions,
      );
      setUp(place.up);
      setMaxHeight(place.maxHeight);
    }
    window.addEventListener("resize", onScrollOrResize);
    return () => window.removeEventListener("resize", onScrollOrResize);
  }, [open, inputRef]);

  function pick(item: T) {
    onPick(item);
    setOpen(false);
    setActive(-1);
    setMatches([]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || matches.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && active > -1) {
      event.preventDefault();
      pick(matches[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <span className="loc-f">
      <input
        ref={inputRef}
        id={id}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        maxLength={maxLength}
        autoComplete="off"
        spellCheck={false}
        required
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          refresh(event.target.value);
        }}
        onFocus={() => refresh(value)}
        onBlur={() => {
          window.setTimeout(() => {
            setOpen(false);
            setActive(-1);
          }, 120);
        }}
        onKeyDown={onKeyDown}
      />
      {open ? (
        <div
          ref={boxRef}
          className={`sugg${up ? " up" : ""}`}
          role="listbox"
          style={maxHeight != null ? { maxHeight } : undefined}
        >
          {matches.map((item, index) => (
            <button
              key={`${getMain(item)}-${getAll(item)}-${index}`}
              type="button"
              className={`sg${index === active ? " on" : ""}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(item);
              }}
            >
              {renderOption(item)}
            </button>
          ))}
        </div>
      ) : null}
    </span>
  );
}
