import type { ZodiacSign } from "./zodiac";

export const SPACE_ICON_CALENDAR = "/assets/icons/icon-calendar-birth-date.svg";
export const SPACE_ICON_PIN = "/assets/icons/icon-location-pin.svg";
export const SPACE_ICON_SCENT = "/assets/icons/icon-scent-nose.svg";

export function zodiacIconSrc(sign: ZodiacSign): string {
  return `/assets/icons/zodiac/zodiac-${sign.toLowerCase()}.svg`;
}
