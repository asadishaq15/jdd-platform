"use client";

import { ChangeEvent, FocusEvent, FormEvent, RefObject, useRef, useState } from "react";

/** Read the live DOM value so browser autofill is not lost when React state is still empty. */
export function readInputValue(ref: RefObject<HTMLInputElement | null>, fallback = "") {
  return ref.current?.value ?? fallback;
}

/**
 * Show/hide for controlled password inputs that must survive Chrome autofill.
 * Syncs the DOM value into React state before flipping type (password ↔ text).
 */
export function usePasswordVisibility(value: string, setValue: (value: string) => void) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  function syncFromDom() {
    const next = ref.current?.value;
    if (typeof next === "string" && next !== value) setValue(next);
    return next ?? value;
  }

  function toggleVisible() {
    const next = ref.current?.value ?? value;
    setValue(next);
    setVisible((current) => !current);
  }

  function resetVisible() {
    setVisible(false);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
  }

  function onInput(event: FormEvent<HTMLInputElement>) {
    const next = (event.target as HTMLInputElement).value;
    if (next !== value) setValue(next);
  }

  function onFocus(event: FocusEvent<HTMLInputElement>) {
    if (event.currentTarget.value !== value) setValue(event.currentTarget.value);
  }

  return {
    ref,
    visible,
    type: (visible ? "text" : "password") as "text" | "password",
    toggleVisible,
    resetVisible,
    syncFromDom,
    readValue: () => readInputValue(ref, value),
    inputProps: {
      ref,
      type: (visible ? "text" : "password") as "text" | "password",
      value,
      onChange,
      onInput,
      onFocus,
    },
  };
}
