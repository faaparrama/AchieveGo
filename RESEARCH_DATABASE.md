# Research database alongside WWC

The prototype now keeps meta-analyses, systematic reviews, and randomized controlled trials alongside the retained WWC export. This is a purposeful starter catalog, not a systematic search or an exhaustive database.

## What is included

- The original 12 planning records from seven sources remain in `data/library.json`.
- `data/research_catalog.json` contains five publications and ten outcome extractions. Kim (2016) and Steenbergen-Hu et al. (2016) link to their existing library sources, so they are not counted twice. Three publications are new: Dietrichson et al. (2020), Yegencik et al. (2025), and Yeager et al. (2019). There are ten distinct curated sources across both collections.
- The build imports all four CSV tables from the retained WWC ZIP into local SQLite: 18,843 study rows, 14,482 finding rows, 901 intervention-report rows, and 285 dictionary rows. Study rows represent 15,129 distinct StudyIDs. Importing these rows does not appraise them or make them recommendations.
- The website displays research publications with a source-type filter, topic search, per-outcome estimates and intervals where extracted, population, comparison, timepoint, limitations, access basis, and review status. A systematic review can also appear under the meta-analysis filter.

The source papers are linked, not redistributed. Publisher abstracts and selected full-text sections were consulted as recorded per publication; no claim of complete full-text appraisal is made. Positive and null findings remain paired. Statistical nonsignificance is not evidence of equivalence.

## Build and inspect

From `prototype/`:

```sh
python3 scripts/check.py
# Or rebuild just the database:
python3 scripts/research.py
```

The build uses Python's standard library and the local WWC snapshot; it makes no network requests. Generated files:

- `data/generated/evidence.sqlite`: local research database, excluded from Git, website output, and release ZIPs; regenerate from the packaged inputs.
- `data/generated/database_manifest.json`: input checksums and import counts.
- `data/research_findings.csv`: one row per extracted outcome, with publication metadata; also included in the website.

Inspect using Python's `sqlite3`, a SQLite viewer, or the SQLite CLI:

```sql
SELECT publication_type, COUNT(*) FROM publications GROUP BY publication_type;
SELECT publication_id, outcome, direction, estimate, ci_lower, ci_upper
FROM research_findings;
SELECT COUNT(DISTINCT study_id) FROM wwc_rows WHERE member = 'Studies.csv';
```

## Tables and identity

| Table | Role |
|---|---|
| `sources` | Existing WWC/library sources plus external research; stable IDs |
| `publications` | Unique normalized DOI, design, synthesis method, extraction status and source link |
| `research_findings` | Outcome-specific rows with population, comparator context, timing and uncertainty in `record_json` |
| `evidence_records`, `mapping_rules` | Existing curated cards and separate, unvalidated applicability rules |
| `publication_relationships` | Verified `includes`, `same_study`, or `updates` links with locator and reviewer |
| `wwc_rows` | Lossless CSV row objects plus indexed identifiers, snapshot, member and row number |
| `publication_wwc_links` | Manually verified publication-to-WWC StudyID links |
| `metadata` | Source checksums and row counts |

DOI normalization prevents duplicate publications; it does not establish independent studies. Multiple reports may describe the same trial, and multiple reviews may include it. Relationship and WWC crosswalk tables start empty: overlap has not been assessed. Do not sum sample sizes or count confirmations across sources until their study identities and review inclusion relationships are reconciled.

Raw repeated ReviewIDs are preserved. Joining raw study rows directly to findings may multiply outcomes across WWC products. `wwc_study_review_ids` exposes distinct study/review pairs for identity inspection; investigators must still check conflicting identities, protocols and products before analytical joins. Empty raw fields remain empty; indexed missing IDs and unextracted effect estimates become SQL NULL, never zero.

The importer pins the snapshot named in `wwc_audit.json`, verifies its checksum and schema, and checks row counts. New downloads do not silently replace this snapshot. Updates require explicit audit and curation. Database replacement is atomic after successful import.

## Add evidence

1. Search relevant education and psychology sources with a documented question, population, outcome, date range and search terms. Use official publisher pages, Campbell/Cochrane reviews, ERIC and article repositories as appropriate. Log inclusion/exclusion decisions before treating coverage as systematic.
2. Add a publication to `data/research_catalog.json`, using the existing records as field examples. Normalize its DOI, preserve the actual design, and record whether access was an abstract, selected sections, or full text. Record unassessed overlap explicitly.
3. Add separate findings for each relevant outcome, subgroup, comparator and follow-up. Preserve null/negative outcomes. Use JSON null and `missing_reason` for unextracted estimates or intervals; include a source locator for every finding.
4. Independently check extraction and appraise methods. Keep those processes separate: `review_status` concerns extraction; `appraisal` concerns methodological quality. Independent extraction needs a named `extraction_reviewer`; completed appraisal needs a tool, judgement and reviewer. [RoB 2](https://www.riskofbias.info/welcome/rob-2-0-tool) is a candidate for randomized-trial results. [AMSTAR 2](https://amstar.ca/Amstar-2.php) concerns systematic reviews of healthcare interventions; a multidisciplinary team must assess its suitability or select an education-appropriate review tool. No automatic quality score is assigned here.
5. Verify review inclusion, shared-study and WWC identities before adding relationships. Store the verification locator and reviewer. A similar title alone is insufficient.
6. Run `python3 scripts/check.py`. Decide separately whether a reviewed intervention/outcome warrants a curated planning record and an explicitly proposed applicability rule. Adding research never performs this promotion automatically.

Study design, risk of bias, synthesis certainty, WWC ratings, ESSA tiers and individual applicability are separate concepts. External papers cannot inherit WWC ratings. The original two synthesis-based planning cards retain their existing prototype status; the new research catalog does not certify them.

## Chatbot, deployment and later Supabase work

The local chatbot still retrieves the 12 curated planning records. Research-only publications are browsable and exportable but are not in its retrieval index or learner matching. System prompt v1.1.0 adds instructions for source type, overlap, uncertainty and review state in future evidence packets.

Vercel and GitHub Pages still serve a static website. Only HTML and three curated CSVs are published; the raw WWC staging database stays outside `_site`. SQLite is a local prototype artifact, not a shared database service. A later Supabase migration can use these entities with Postgres/JSONB, authentication, reviewer permissions and server-side retrieval; no migration or backend service is provisioned here.

## Starter sources

- [Kim (2016): enrichment meta-analysis](https://doi.org/10.1177/0016986216630607).
- [Steenbergen-Hu et al. (2016): grouping and acceleration meta-analyses](https://doi.org/10.3102/0034654316675417).
- [Dietrichson et al. (2020): targeted academic interventions, Grades 7–12](https://onlinelibrary.wiley.com/doi/10.1002/cl2.1081).
- [Yegencik et al. (2025): school-based ADHD intervention review](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1611145/full).
- [Yeager et al. (2019): growth-mindset randomized trial, author-hosted article](https://www.gregorywalton.com/uploads/4/9/4/4/49448111/yeageretal2019nature.pdf).
