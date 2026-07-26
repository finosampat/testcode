import { library } from '../content/library';
import type { Work } from '../content/schema';

export type SearchHit = {
  workId: string;
  workTitle: string;
  category: string;
  language: string;
  chapterIndex: number;
  chapterHeading: string;
  snippet: string;
};

const SNIPPET_RADIUS = 90;

function normalize(value: string): string {
  return value.toLocaleLowerCase();
}

function snippetAround(body: string, index: number, queryLength: number): string {
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(body.length, index + queryLength + SNIPPET_RADIUS);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < body.length ? '…' : '';
  return `${prefix}${body.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`;
}

/** Full-text search across every bundled work. Works fully offline. */
export function searchLibrary(query: string, limit = 60): SearchHit[] {
  const needle = normalize(query.trim());
  if (needle.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const work of library.works) {
    work.chapters.forEach((chapter, chapterIndex) => {
      const haystack = normalize(`${chapter.heading}\n${chapter.body}`);
      const at = haystack.indexOf(needle);
      if (at === -1) return;
      const bodyOffset = chapter.heading.length + 1;
      const inBody = at >= bodyOffset;
      hits.push({
        workId: work.id,
        workTitle: work.title,
        category: work.category,
        language: work.languageLabel ?? work.language,
        chapterIndex,
        chapterHeading: chapter.heading,
        snippet: inBody
          ? snippetAround(chapter.body, at - bodyOffset, needle.length)
          : chapter.heading,
      });
    });
    if (hits.length >= limit) break;
  }
  return hits.slice(0, limit);
}

export function searchWorks(query: string): Work[] {
  const needle = normalize(query.trim());
  if (!needle) return library.works;
  return library.works.filter((work) =>
    normalize(`${work.title} ${work.category} ${work.languageLabel ?? work.language} ${work.author ?? ''}`).includes(
      needle,
    ),
  );
}
