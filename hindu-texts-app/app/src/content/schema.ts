/**
 * Mirror of the ingestion pipeline's content schema (ingestion/hindu_texts_ingest/schema.py).
 * The app is source-agnostic: it only ever sees `Library`.
 */

export type Redistribution = 'permitted' | 'prohibited' | 'unknown';

export type License = {
  basis: string;
  redistribution: Redistribution;
  holder?: string | null;
  notes?: string | null;
  termsUrl?: string | null;
};

export type Chapter = {
  heading: string;
  body: string;
  order: number;
};

export type Work = {
  id: string;
  title: string;
  category: string;
  language: string;
  languageLabel?: string | null;
  script?: string | null;
  author?: string | null;
  attribution?: string | null;
  chapters: Chapter[];
  sourceUrl: string;
  license: License;
  sourceFiles?: string[];
  schemaVersion?: number;
};

export type Library = {
  schemaVersion: number;
  categories: string[];
  works: Work[];
};
