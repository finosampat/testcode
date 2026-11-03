# Hindu Texts — digital library (MVP)

Cross-platform mobile app (React Native + Expo) for reading Hindu scriptures and
literature offline, plus a separate Python pipeline that ingests source PDFs into
a generic content schema.

```
hindu-texts-app/
├── app/          Expo (React Native, TypeScript) mobile app
├── ingestion/    Python pipeline: compliance check → download → extract → JSON
└── compliance/   Generated compliance report (source, license basis, caveats)
```

The app never references a specific source: it reads
`app/assets/content/library.generated.json`, which conforms to the schema in
`ingestion/hindu_texts_ingest/schema.py` (mirrored in `app/src/content/schema.ts`).
Adding a new source means adding an adapter to the pipeline — no UI changes.

## Compliance status (read this first)

The MVP source is <https://sai.org.in/en/sai-satcharita>.

- `robots.txt` allows `/en/*` and `/sites/default/files/*.pdf` for our
  User-Agent, with `Crawl-delay: 10` (the fetcher honors it).
- The Trust's [copyright statement](https://sai.org.in/en/terms-and-disclaimer)
  says *"All rights reserved … No one can copy, reproduce or even distribute
  website information"*. **Redistribution is therefore not cleared.**

Consequences, enforced by the pipeline:

- Extracted text is written only when you pass `--allow-uncleared-bundle`
  (local development), and the generated JSON plus the PDF cache are gitignored.
- The reader screen always shows each work's `license.basis`, redistribution
  state and source URL.
- Obtain written permission from Shri Saibaba Sansthan Trust before publishing a
  build containing this content. See `compliance/compliance-report.md`.

The committed `app/assets/content/library.sample.json` holds short public-domain
sample texts so the app is runnable before any ingestion.

### Source PDF quality (what the pipeline can and cannot ingest today)

Every PDF is assessed before extraction (`pdf_extract.assess`) and unusable files
are skipped with a caveat in the compliance report:

| Source PDF | Result |
| --- | --- |
| `sai-samarth-charita-english-*.pdf` (English Satcharita translation, per chapter) | ingested — 8 chapters |
| `Shree Saisatcharit English.pdf` | skipped — scanned images, no text layer (needs OCR) |
| `sai-charitra-hindi-complete-book.pdf` | skipped — scanned images, no text layer (needs OCR) |
| `Saicharitra hindi 1.pdf`, `sai-charitra-marathi-*.pdf` | skipped — legacy non-Unicode Devanagari font encoding, extracts as mojibake |

Adding OCR (Tesseract with `hin`/`mar` data) or a legacy-font transcoder would
unlock the Hindi and Marathi editions; both are follow-up work, not MVP.

## Running the ingestion pipeline

Requires Python 3.10+.

```bash
cd ingestion
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Phase 0 only: robots.txt + licensing review, writes ../compliance/*
python -m hindu_texts_ingest --compliance-only

# Phases 0-1: also download PDFs and normalize them (local dev use only)
python -m hindu_texts_ingest --languages en hi mr --allow-uncleared-bundle
```

Useful flags:

| Flag | Effect |
| --- | --- |
| `--source SLUG` | which registered source to ingest (default `sai-satcharita`) |
| `--languages en hi mr` | restrict to BCP-47 language codes (default: everything linked) |
| `--limit N` | ingest at most N works (smoke tests) |
| `--refresh` | ignore the download cache and re-fetch |
| `--compliance-only` | Phase 0 only, no downloads |
| `--allow-uncleared-bundle` | write content even when redistribution is not cleared |
| `--user-agent` | override the crawler User-Agent |

Outputs:

- `compliance/compliance-report.md` + `.json` — source URLs, license basis, caveats.
- `app/assets/content/library.generated.json` — the single file the app bundles.
- `app/assets/content/index.json` and `app/assets/content/works/<id>.json` —
  per-work files for inspection/diffing.
- `ingestion/.cache/` — cached PDFs, so re-running never re-downloads.

Regenerate content after a source changes: re-run the command above with
`--refresh`, then restart Metro (`npm start --clear` in `app/`).

Pipeline tests and lint:

```bash
cd ingestion && python -m pytest && python -m ruff check .
```

### Adding a new source

1. Create `ingestion/hindu_texts_ingest/sources/<my_source>.py` implementing the
   `SourceAdapter` protocol (`discover`, `license_for`, `attribution_for`,
   `build_work`).
2. Register it in `ingestion/hindu_texts_ingest/sources/__init__.py`.
3. Run `python -m hindu_texts_ingest --source <slug>`.

Heading detection is per-source: pass `headingPatterns` on each `DocumentRef`
(see `HEADING_PATTERNS` in `sources/sai_satcharita.py`).

## Running the app

Requires Node ≥ 20.19.4 (Expo SDK 57) — Node 22.20 is known good.

```bash
cd app
npm install          # postinstall seeds library.generated.json from the sample
npm start            # Metro; press i / a, or scan the QR code with Expo Go
npm run ios          # iOS simulator (macOS + Xcode)
npm run android      # Android emulator or device
npm run lint
npm run typecheck
```

Native release builds use EAS:

```bash
npx eas-cli build --platform ios      # requires an Apple developer account
npx eas-cli build --platform android
```

### Screens

- **Home** — categories (Charitras, Vedas, Upanishads, Puranas, Literature),
  a search bar over work titles, and a link into full-text search.
- **Category** — every work in the selected category.
- **Reader** — long-form scrolling, chapter navigation (list + prev/next),
  `A-`/`A+` font size, light/dark reading mode, last-read position restored on
  reopen, and the source/license footer.
- **Search** — full-text search across all bundled works with snippets that jump
  straight to the matching chapter.

Reading preferences and last-read positions are stored with AsyncStorage, and all
content is bundled, so the app is fully usable offline. Devanagari text is
rendered with Noto Serif Devanagari (works whose `script` is `Deva`).
