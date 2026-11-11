// Local-time helpers (spec §10.1).

export type PartOfDay = "morning" | "afternoon" | "evening" | "night";

const pad = (n: number) => String(n).padStart(2, "0");

export function localDayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 05–11 morning, 11–17 afternoon, 17–22 evening, 22–05 night. */
export function partOfDay(ms: number): PartOfDay {
  const h = new Date(ms).getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

/** 22:00–06:00. */
export function isNight(ms: number): boolean {
  const h = new Date(ms).getHours();
  return h >= 22 || h < 6;
}
