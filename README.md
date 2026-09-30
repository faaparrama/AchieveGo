# AchieveGo evidence prototype

**Live reviewer demonstration:** https://faaparrama.github.io/AchieveGo/

**Prototype-only source:** https://github.com/faaparrama/AchieveGo

### Consider: Grow your talent

Open [**index.html**](index.html) in a browser. It is a self-contained page and works offline. Only following a source link opens an external website. No package installation, AI key, server, student-data upload, or account is needed.

Start with Maya for mathematics plus challenge, Noor for an explicit well-being evidence gap, or Jordan for outcome-specific Check & Connect evidence. Select **Add to plan**, then **Export review plan** to download a JSON document for discussion. The file includes blank implementation and follow-up fields; the app does not collect actual outcomes or persist learner records.

The reviewer demo is published on **GitHub Pages**. Follow [DEPLOYMENT.md](DEPLOYMENT.md) for updates. Choose **Ask AchieveGo** to try the educator chatbot: it searches a local index and returns cited evidence with authored response templates. No AI provider is connected yet. See [CHATBOT.md](CHATBOT.md) and the [versioned system prompt](prompts/educator-system.md). Read [EVIDENCE.md](EVIDENCE.md) for research boundaries.

## What is included

-   Five fictional scenarios using selectable research profiles; no individual classifier runs.
-   Twelve planning records from seven sources, plus five research publications with ten outcome extractions. Two research publications link to existing sources; ten distinct curated sources in total.
-   Separate evidence and proposed matching records, with source dates, applicability limits, and explicit gaps.
-   A real WWC bulk snapshot, retrieval manifest, schema/checksum audit, and Check & Connect rows preserved for comparison.
-   A portable browser interface, searchable library, and review-plan export.
-   A local educator chatbot, context preview, indexed source retrieval, explicit plan additions, and conversation export.

All extraction and matching decisions are **prototype work awaiting independent expert review**. Nothing here establishes a treatment effect for a specific profile × diagnosis combination. The enrichment card's broad grade browsing range is a prototype convention requiring program-specific review.

## Expanded research database

Browse meta-analyses, systematic reviews and randomized trials in **Evidence library**. Research-only records remain separate from learner matching and chatbot retrieval. The build also creates a local SQLite database containing the retained WWC CSV rows and structured research records. See [RESEARCH_DATABASE.md](RESEARCH_DATABASE.md) for sources, schema, review workflow and future Supabase migration.

## Files

| Path | Purpose |
|----|----|
| `data/library.json` | Editable source of truth: evidence, sources, proposed mappings, fictional scenarios, aggregate profile means |
| `data/evidence_library.csv` | Generated spreadsheet for evidence review |
| `data/proposed_mappings.csv` | Generated spreadsheet for reviewing matching hypotheses separately |
| `data/wwc_snapshots/` | Immutable downloaded public-data ZIP and provenance manifest |
| `data/wwc_audit.json` | Download inventory, identifiers, ratings, selected raw rows, and curation issues |
| `src/` | HTML template, CSS, browser app, and deterministic matching engine |
| `scripts/fetch_wwc.py` | Download the observed WWC website export; does not publish catalog changes |
| `scripts/inspect_wwc.py` | Check snapshot integrity/schema and generate a data audit |
| `scripts/build.py` | Validate the curated library; generate HTML and review CSVs |
| `scripts/check.py` | Build and run Python plus JavaScript checks |
| `tests/browser.test.js` | Browser interaction harness for a temporary copy of the built page |

## Maintain and test

From this `prototype/` directory (run `cd prototype` first when starting at the AchieveGo project root):

``` sh
python3 scripts/build.py
python3 scripts/check.py
```

Python uses only its standard library. JavaScript tests use Node if installed, otherwise macOS JavaScriptCore. The application itself only needs a modern browser.

To inspect the retained snapshot:

``` sh
python3 scripts/inspect_wwc.py
```

To retrieve a new snapshot, with network access:

``` sh
python3 scripts/fetch_wwc.py
```

That script uses the request observed at [WWC's export page](https://ies.ed.gov/ncee/wwc/StudyFindings). It is not a documented or guaranteed public API. New downloads do not automatically replace curated evidence. Use `inspect_wwc.py path/to/snapshot` to inspect an explicit snapshot; otherwise it selects the newest directory. Updating the audit does not update `library.json`: a curator must reconcile differences, source dates, ratings, and applicability before building again.

The fetch script also exposes WWC's merged export mode for inspection. The audit expects the default separate-files mode because it preserves non-meeting and other study records. A merged snapshot is not accepted by that audit.

Edit `data/library.json` and `src/`, then rebuild. `index.html` and both CSVs are generated artifacts. Existing R analysis scripts and models are not modified by these commands.

## Validation record — September 13, 2026

-   Public WWC ZIP downloaded successfully; SHA-256 and required CSV schemas checked.
-   Twelve Python integrity, validation, static-site, and secret-exclusion packaging tests passed.
-   Twenty-two JavaScript matching and export assertions passed; app JavaScript parsed successfully.
-   Twenty chatbot retrieval and boundary assertions passed.
-   Twenty-five browser assertions passed at desktop and narrow widths, covering chat and scenario changes, plan selection/reset, evidence gaps, grade limits, visible null outcomes, exported JSON contents, library search, navigation, and horizontal layout bounds. The harness appends `tests/browser.test.js` to a temporary copy of the built HTML; it is not included in the application. Desktop and narrow layouts were visually inspected.

These are software and source-integrity checks, not scientific validation of interventions or personalization.

## September 22 research expansion checks

Validation on September 22: 23 Python tests, 22 matching/export assertions and 20 chatbot assertions passed; the extracted source release also rebuilt successfully. The browser harness now includes research-filter and outcome checks, but automated Chrome runs timed out locally, so those new browser interactions have not been verified by a completed browser run.

## September 30 reviewer deployment

The prototype-only repository was published to GitHub Pages. The source release rebuilt from a fresh extraction and passed 23 Python tests, 22 matching/export assertions, 20 chatbot assertions, and 33 headless-browser assertions. The GitHub Actions build and deployment succeeded. The live page and all three downloadable CSVs returned HTTP 200 and matched the locally tested build by SHA-256. These checks establish deployment and software behavior, not the educational effectiveness of recommendations.
