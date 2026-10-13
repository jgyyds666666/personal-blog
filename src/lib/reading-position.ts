export interface ReadingPosition {
  version: 1;
  contentVersion: string;
  progress: number;
  headingId: string | null;
  sectionProgress: number;
  updatedAt: number;
}

const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function readingPositionKey(id: string): string {
  return `moxiang:reading:${id}`;
}

export function parseReadingPosition(raw: string | null, contentVersion: string, now: number): ReadingPosition | null {
  if (!raw || raw.length > 2048) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1
      || !('contentVersion' in value) || value.contentVersion !== contentVersion
      || !('progress' in value) || typeof value.progress !== 'number' || !Number.isFinite(value.progress) || value.progress < 0 || value.progress > 100
      || !('headingId' in value) || (value.headingId !== null && (typeof value.headingId !== 'string' || !/^heading-\d{1,6}$/.test(value.headingId)))
      || !('sectionProgress' in value) || typeof value.sectionProgress !== 'number' || !Number.isFinite(value.sectionProgress) || value.sectionProgress < 0 || value.sectionProgress > 1
      || !('updatedAt' in value) || typeof value.updatedAt !== 'number' || !Number.isFinite(value.updatedAt) || now - value.updatedAt > MAX_AGE || value.updatedAt > now + 60_000) return null;
    return { version: 1, contentVersion, progress: value.progress, headingId: value.headingId, sectionProgress: value.sectionProgress, updatedAt: value.updatedAt };
  } catch {
    return null;
  }
}

export function readReadingPosition(id: string, contentVersion: string): ReadingPosition | null {
  try {
    const key = readingPositionKey(id);
    const raw = window.localStorage.getItem(key);
    const position = parseReadingPosition(raw, contentVersion, Date.now());
    if (raw && !position) window.localStorage.removeItem(key);
    return position;
  } catch {
    return null;
  }
}

export function writeReadingPosition(id: string, position: ReadingPosition | null): void {
  try {
    const key = readingPositionKey(id);
    if (position) window.localStorage.setItem(key, JSON.stringify(position));
    else window.localStorage.removeItem(key);
  } catch {
    // Reading remains available when browser storage is blocked or full.
  }
}

export function getReadingProgress(content: HTMLElement): number {
  const bounds = content.getBoundingClientRect();
  const start = Math.max(0, bounds.top + window.scrollY - 80);
  const end = bounds.bottom + window.scrollY - window.innerHeight;
  if (bounds.bottom <= window.innerHeight + 1) return 100;
  return end > start ? clamp((window.scrollY - start) / (end - start)) * 100 : 0;
}

export function captureReadingPosition(content: HTMLElement, contentVersion: string): ReadingPosition {
  const headings = Array.from(content.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'));
  const index = headings.findLastIndex((heading) => heading.getBoundingClientRect().top <= 96);
  const heading = headings[index];
  const nextTop = headings[index + 1]?.getBoundingClientRect().top ?? content.getBoundingClientRect().bottom;
  const top = heading?.getBoundingClientRect().top ?? 0;
  return {
    version: 1, contentVersion, progress: getReadingProgress(content), headingId: heading?.id || null,
    sectionProgress: heading && nextTop > top ? clamp((80 - top) / (nextTop - top)) : 0,
    updatedAt: Date.now(),
  };
}

export function getResumeScrollTop(content: HTMLElement, position: ReadingPosition): number {
  const headings = Array.from(content.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'));
  const index = headings.findIndex((heading) => heading.id === position.headingId);
  if (index >= 0) {
    const top = headings[index].getBoundingClientRect().top + window.scrollY;
    const next = headings[index + 1]?.getBoundingClientRect().top ?? content.getBoundingClientRect().bottom;
    return Math.max(0, top + (next + window.scrollY - top) * position.sectionProgress - 80);
  }
  const bounds = content.getBoundingClientRect();
  const start = Math.max(0, bounds.top + window.scrollY - 80);
  const end = Math.max(start, bounds.bottom + window.scrollY - window.innerHeight);
  return start + (end - start) * position.progress / 100;
}
