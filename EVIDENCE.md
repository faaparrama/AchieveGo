# Evidence and prototype boundaries

AchieveGo demonstrates how a team might connect learner context and confirmed goals to traceable research, select support and advanced opportunities, and plan a later review. It does not establish that a particular profile and diagnosis predict response to a particular intervention.

The three illustrative profiles come from the existing project's latent profile analysis of 48,789 students in 108 Dutch schools. Six indicators cover verbal, numerical, and figural ability, school motivation, school well-being, and self-perception. Only aggregate group means are included here. The prototype does not contain participant-level data, run a classifier, or establish validity in a new population. Names, US grades, and diagnosis combinations in the scenarios are fictional.

The library has 12 recommendation/outcome records from seven sources: seven WWC practice-guide recommendations, three Check & Connect outcomes, and two external research syntheses concerning enrichment and acceleration. These are not 12 independently evaluated programs. Sources, original rating frameworks, dates, scope limits, and proposed matching rules are preserved in `data/library.json` and the review CSVs. Independent expert curation is pending.

A real download from the [WWC export page](https://ies.ed.gov/ncee/wwc/StudyFindings) is retained with a checksum and retrieval manifest. The September 13, 2026 snapshot contains 18,843 study rows, 14,482 finding rows, and 901 intervention-report rows. Study rows include multiple review statuses and can repeat under different products. Counts must not be interpreted as counts of effective interventions. The website export endpoint is an observed interface, not a documented or guaranteed public API.

For [Check & Connect](https://ies.ed.gov/ncee/wwc/EvidenceSnapshot/78), outcomes retain separate effectiveness ratings and ESSA tiers. The bulk export and website differ on the progressing-in-school grade scope; the curated card uses the narrower grade-9 scope and records the discrepancy. Null completion findings remain visible. A diagnosis or a distressed profile does not by itself establish dropout risk.

Candidate retrieval checks confirmed goals, subject, and grade scope. Diagnostic context and selected profiles inform review questions without changing evidence ratings or asserting subgroup effects. No-match messages refer to gaps in this small starter library, not absence of effective support in the wider literature. Opportunities for greater challenge remain available across profiles. The enrichment card's broad browsing range is a prototype convention requiring program- and age-specific review.

The frontend provides editable goals, baseline measures, opportunities, support, responsibilities, and review dates. The review-plan export includes these draft fields and the fictional case history; workspace export retains all cases and plan versions. Synthetic observations are grouped by plan, measure, scale, AI assistance, and accommodations. Independent learning can be assessed while retaining appropriate access accommodations. Authenticated monitoring of real learners, automated adaptation, school accounts, and AI-generated instruction remain future work.

Next steps are independent evidence appraisal, multidisciplinary usability work, population-appropriate measurement validation, and prospective evaluation. Evaluation should distinguish the benefit of access to the evidence library from any added benefit of profile-informed decisions. Software test results do not substitute for these studies.

## Expanded research intake — September 22, 2026

The separate [research catalog](data/research_catalog.json) adds structured meta-analysis, systematic-review and randomized-trial records. [Database documentation](RESEARCH_DATABASE.md) describes outcome extraction, appraisal, study overlap and WWC crosswalks. Research catalog entries are not new planning recommendations; no automatic rating or individual treatment effect is inferred.
