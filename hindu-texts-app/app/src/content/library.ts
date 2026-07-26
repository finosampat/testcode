/**
 * Offline content access. `library.generated.json` is produced by the ingestion
 * pipeline; `scripts/ensure-content.js` seeds it from the committed sample so a
 * fresh checkout always bundles readable content.
 */

import type { Library, Work } from './schema';

const bundled = require('../../assets/content/library.generated.json') as Library;

export const library: Library = bundled;

export const categories: string[] = bundled.categories;

export function worksInCategory(category: string): Work[] {
  return bundled.works.filter((work) => work.category === category);
}

export function categoryCounts(): Record<string, number> {
  return bundled.categories.reduce<Record<string, number>>((counts, category) => {
    counts[category] = worksInCategory(category).length;
    return counts;
  }, {});
}

export function getWork(id: string): Work | undefined {
  return bundled.works.find((work) => work.id === id);
}

export function languageLabel(work: Work): string {
  return work.languageLabel ?? work.language;
}
