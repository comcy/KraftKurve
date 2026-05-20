export function nowIso(): string {
  return new Date().toISOString();
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isExpired(isoDate: string | null): boolean {
  if (!isoDate) return false;
  return new Date(isoDate) < new Date();
}
