export function defaultExpiration(): { dateStr: string; timeStr: string } {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return { dateStr: d.toISOString().slice(0, 10), timeStr: d.toISOString().slice(11, 19) };
}

/** Combines a yyyy-mm-dd date with a captured time-of-day into a full ISO 8601 instant. */
export function toISODateTime(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}.000Z`).toISOString();
}
