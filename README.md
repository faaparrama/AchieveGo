# AchieveGo evidence prototype

**Live reviewer demonstration:** https://faaparrama.github.io/AchieveGo/

**Prototype-only source:** https://github.com/faaparrama/AchieveGo

### Consider: Grow your talent

Open [**index.html**](index.html) in a browser. It is a self-contained page and works offline. Only following a source link opens an external website. No package installation, AI key, server, student-data upload, or account is needed.

Start on **Home**, then open **Workspace**. In **Understand**, choose Maya and select **Fill empty fields with an authored example**. Review those fictional details, move to **Plan**, select evidence, and check feasibility in **Allocate**. Confirm the demo plan, load synthetic observations in **Monitor**, inspect assistance conditions in **Assess**, then record a decision in **Review**. Adapt the draft and confirm another version to see a traceable revision.

Drafts, evidence selections, confirmed plan versions, synthetic observations, and reviews are saved in this browser when storage is available. Use **Export workspace** to retain a portable JSON copy; **Import workspace** validates and previews replacement. **Print plan** provides a human-readable draft. This public demonstration is for fictional information only. Browser storage is not shared or authenticated student-record infrastructure.

The website has distinct Home, Workspace, Evidence, Framework & About, and Ask AchieveGo views, with hash navigation compatible with GitHub Pages. Figure 1 is on Home; Figures 2 and 3 appear in Framework & About. Evidence comparison preserves source-specific ratings. The assistant searches a local index using authored responses and includes the current stage and confirmed fictional context. No AI provider is connected. See [CHATBOT.md](CHATBOT.md), [EVIDENCE.md](EVIDENCE.md), and [the enhancement plan](FRONTEND_ENHANCEMENT_PLAN.md).

## What is included

- Five original fictional scenarios, plus manually created fictional cases; no individual classifier runs.
- A six-stage talent management workspace: understand, plan, allocate, monitor, assess, and review.
- Editable learner accounts, readiness provenance, goals, access conditions, and an illustrative resource inventory.
- Browser-local continuity, immutable plan snapshots, explicit review rationales, safe JSON import/export, and plan printing.
- Synthetic observations; missing values and zero remain distinct. Measures, plan versions, AI assistance, and accommodations are displayed separately.
- Twelve curated planning records from seven sources, plus five research publications with ten outcome extractions; ten distinct curated sources across both collections.
- A retained WWC bulk snapshot, retrieval manifest, schema/checksum audit, and Check & Connect companion outcomes.
- Source-specific evidence comparison, visible library gaps, and a local educator assistant.

All evidence extraction and matching decisions remain **prototype work awaiting independent expert review**. The frontend workflow does not establish treatment effects or validated personalization. Resource availability, authored activities, planning examples, and observations are explicitly fictional or proposed. LLM/tool use, vector retrieval, authenticated approval, notifications, and shared records are future infrastructure.

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

Python uses only its standard library. JavaScript tests use Node if installed, otherwise macOS JavaScriptCore. Optional real-browser checks use Playwright as a development dependency: `python3 scripts/browser_check.py` after building. Install with `python3 -m pip install playwright` and, outside macOS with Chrome, `python3 -m playwright install chromium`. The browser runner uses a temporary static server and tests the GitHub project-path layout. The application itself only needs a modern browser.

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

## October 3 frontend implementation

Implemented the six-stage frontend workflow and responsive site structure in an isolated website checkout. The earlier journal-linked version is preserved at tag `reviewer-demo-2026-10-01`; this source is prepared for the enhanced GitHub Pages release. The build, public-file allowlist, source package, state/import integrity tests, and desktop/tablet/mobile browser workflows are checked before handoff. See DEPLOYMENT.md for publishing from the prototype-only repository.
