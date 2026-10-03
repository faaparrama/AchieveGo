# AchieveGo frontend enhancement plan

Date: October 3, 2026
Status: Frontend 0.2 implemented and prepared for GitHub Pages publication on October 3.
Scope: Enhance the existing GitHub Pages website and demonstrate a complete talent management cycle using fictional cases. Backend services follow later.

## Implementation record

Implemented distinct site views and hash/history navigation; six-stage fictional case planning; authored examples and manually created cases; local persistence; validated import/export and printing; fictional resource selection; synthetic observation entry; descriptive assessment grouped by conditions; review rationales and immutable plan versions; evidence comparison; stage-aware assistant context; and all three figures. The optional library-coverage visualization is deferred. Backend capabilities remain planned.

The source remains based on the verified public commit. Implementation is in a separate website checkout and has been copied back to the local prototype. The previous deployed source is preserved at tag `reviewer-demo-2026-10-01`; the enhanced release uses the existing GitHub Pages workflow.

## 1. Verified starting point

- Website: https://faaparrama.github.io/AchieveGo/
- Website repository: https://github.com/faaparrama/AchieveGo
- Verified main commit: `10a7f0344a4fe8ed894df6a43cf8ae739ab4af15` — “Show both AI roles in talent-management figure.”
- Successful deployment workflow: https://github.com/faaparrama/AchieveGo/actions/runs/36869575438
- Live HTML returned HTTP 200 and matched the repository's index.html byte for byte.
- Live HTML SHA-256: `a28a6a1ef0281a4b7b4b11e9d164d8e4ae767d8e3839bf3f83796ae79bc871cd`.
- Local `prototype/` matched the pinned remote versions of index.html, template, stylesheet, four application/engine scripts, Figure 1 asset, Pages workflow, and browser test file. This was a selected-file comparison, not a full repository identity audit.
- Inspected desktop and narrow-window Chrome renders of the downloaded deployed HTML and figure. The narrow capture showed clipping of the hero and figure; explicitly measure viewport and document widths during implementation testing. This review was not a full live-browser interaction audit.

The public repository contains the prototype at its root. The local research project contains it under `prototype/`. Use a separate checkout of the public repository for website branches. Never push the enclosing research repository or manuscripts to the website remote.

Pre-enhancement baseline: five fictional scenarios; 12 curated planning records; a separate research catalog; local keyword retrieval and authored chat responses; evidence selection; JSON export. There is no provider-connected AI, individual profile classifier, account system, shared database, or persistent implementation/review workflow.

## 2. Product objective

An educator should be able to explore a fictional learner, clarify a goal, compare evidence and feasible opportunities, prepare a plan, record a demonstration follow-up, and document a revision. Every step should preserve the source of information, uncertainty, learner voice, and the distinction between supported performance and learning.

Success for this release means a usable and inspectable workflow. It does not establish educational efficacy or validated profile-to-intervention matching.

Preserve these existing strengths:

- Mississippi State maroon and Ball State cardinal, neutral backgrounds, and the existing wordmark.
- Credits immediately beneath the brand: Andy Parra-Martínez, Mississippi State University, in collaboration with Ophélie Desmet, Ball State University.
- Sticky navigation, source links, explicit null and mixed outcomes, and separate evidence frameworks.
- Advanced challenge alongside participation support.
- Candidate selection based on confirmed goals and applicability; a profile or diagnostic label alone must not assign an intervention.
- Clear public-demo status and no identifying student information.

## 3. Website structure

Use four primary destinations and a contextual assistant. Keep the current Ask AchieveGo destination reachable through an Assistant button and a direct hash URL.

```text
Home
  What AchieveGo helps a team do
  Start a fictional case / Resume this browser's demo
  Figure 1 and a concise explanation with citations
  What works now and what is planned

Workspace
  Choose or create a fictional case
  1 Understand → 2 Plan → 3 Allocate → 4 Monitor → 5 Assess → 6 Review
  Contextual evidence and assistant panels
  Plan versions, local save status, export and reset

Evidence
  Planning records
  Research publications and findings
  Compare evidence / examine coverage and limitations

Framework & About
  Foundations and Figures 1–3
  Evidence methods and profile provenance
  Current capabilities, proposed infrastructure, credits and release history

Assistant
  Open with the current case and stage, or in general evidence mode
  Explain / compare / clarify / draft / review
  Authored local responses clearly identified
```

### Home

Separate Home from the learner workspace. The current Home and Explore buttons both reveal the same view and change scroll position; this makes navigation less predictable.

Place a short introduction and a visible “Explore a fictional learner” action before the full framework explanation. Retain Figure 1 on Home, with a readable preview, full-size access, and a textual six-stage equivalent. Put Figures 2 and 3 on Framework & About with short explanations and clear observed/proposed distinctions.

Use a compact capability statement: “Explore evidence and build a review plan with fictional learners. The assistant uses local examples; live AI and shared accounts are planned.” Keep technical implementation details in the methods/capabilities section.

### Navigation and layout

- Sticky primary navigation remains visible while scrolling; show the current destination.
- Use hash navigation such as `#home`, `#workspace/understand`, `#evidence`, and `#framework`, preserving GitHub Pages project-path compatibility. Refresh and Back/Forward should work without server rewrites.
- Retain a compact case summary within the workspace: case name, domain, goal, and current stage.
- Use a stage rail on desktop and a compact stage selector on mobile. Permit exploration without inventing completion states.
- Stage indicators distinguish “not started,” “draft,” and “ready for demo review.” Completion reflects required information, never treatment success.
- Keep the large hero on Home only. Other destinations open directly into their task.
- Show one primary action per stage and reveal research detail progressively.
- Handle long text, small screens, and zoom without page-level horizontal scrolling. Navigation must not obscure focused fields or headings.
- Preserve credits under the brand without making the entire large masthead sticky.

## 4. The six-stage frontend workflow

| Stage | Frontend interaction | Record produced | Boundary |
|---|---|---|---|
| Understand | Choose a case; inspect strengths, readiness, goals, context, documented needs, learner/family accounts, and unknowns | Confirmed fictional context | A description is not a diagnosis or measured profile |
| Plan | Define a learning goal, compare candidate evidence, choose an AI role and identify a baseline | Draft plan | Generated/authored activities remain design proposals |
| Allocate | Pair an advanced opportunity with needed support; choose a fictional local resource and responsible person | Allocation proposal and rationale | No actual placement or booking occurs |
| Monitor | Enter or load clearly marked synthetic participation, delivery, access, and feedback observations | Dated demonstration observations | Sample observations are not research findings |
| Assess | Compare observations against the goal; separate AI assistance, access accommodations, and independent transfer | Descriptive review of progress and uncertainty | No causal attribution from a before/after change |
| Review | Continue, adapt, replace, or gather more information; record learner/team reasoning | New plan version linked to the previous plan | A local confirmation is not authenticated team approval |

### Learner context

Provide two frontend entry routes: a structured fictional record and an educator-written fictional description. The first release uses manual fields and transparent prompts for missing information; it does not pretend to infer a validated profile from prose.

Each important item should retain: value, source type (measurement/observation/learner report/family report), date where relevant, and confirmation status. Distinguish unknown from absent and zero. Allow “profile unassigned.” Research group means belong in a reference panel, not in an individual's score fields.

Minimum fields: domain strengths/readiness, learner goal, interests, confirmed needs, task conditions, access barriers, available support, and learner/family account. Diagnostic labels remain documented context. An LPA probability or score must never be fabricated for the demonstration.

### Evidence and opportunity comparison

- Keep curated planning records and research awaiting review visibly distinct even when one search spans both.
- Compare two or three items by outcome, studied population, setting, evidence framework, limits, implementation requirements, and proposed relevance.
- Retain companion null/negative outcomes and source-specific ratings. Do not create a universal evidence or success score.
- Add a small fictional resource catalog: enrichment seminar, subject extension, mentor opportunity, or participation support. Show availability, schedule, staffing, access requirements, and unknown costs as unknown.
- Label resource availability as fictional. Matching a local resource to a published intervention does not establish implementation equivalence.
- Distinguish original evidence from a team's adaptation. Record what changed and why.
- Add an optional coverage view based on indexed records, labelled “coverage of this starter library.” It is not a systematic evidence-gap map and must not infer absence of research from missing records.

### Plan, observations, and review

Replace blank export-only fields with an editable plan: goal, baseline/measure, opportunity, support, proposed adaptations, responsible role, intended delivery, AI role, learner preferences, and review date.

Treat AI assistance and accommodations as separate dimensions. A learner can demonstrate independent knowledge while retaining appropriate access accommodations. Show AI conditions such as none, hints, feedback, and generated material; record accommodations separately and preserve comparability notes.

Use descriptive time-series displays or timelines only when there are meaningful observations. Show dates, measure names, missing observations, changes in support, and learner feedback. Do not join incomparable scores into a single progress line. Offer a table alternative.

Include one authored learner-activity preview showing a task, graduated hint, learner explanation, and transfer prompt. Label it a demonstration; do not claim a live tutor or automated validated scoring.

Review prompts should ask whether the opportunity was delivered, whether access was feasible, what the learner experienced, and what independent evidence changed before suggesting a revision. Keep all earlier plan versions. Show differences and the reason for each change.

## 5. Assistant and tools: useful now, replaceable later

Retain the current local assistant while improving its connection to the workflow. It should reference the current case, current stage, and evidence selected by the user. Show the included context and allow general evidence questions without a case. Changing cases must not leak another case's conversation or selections.

Create plain JavaScript service interfaces, backed by local implementations:

| Operation | Frontend implementation now | Later backend responsibility |
|---|---|---|
| Get/save case | Versioned fictional-case store | Authorized shared records |
| Find evidence | Curated metadata/keyword search | Server retrieval, provenance and optional reranking |
| Check applicability | Existing transparent rules with structured reasons | Versioned, validated rules enforced server-side |
| Find opportunities | Fictional resource inventory | School-maintained availability and permissions |
| Draft plan | Editable, stage-specific templates | Model-assisted draft using controlled tools |
| Save plan/review | Local version history and export | Authenticated review, immutable audit events |
| Record observations | Synthetic entries and local timeline | Authorized longitudinal data collection |
| Show review due date | In-app due/overdue display | Reminders and scheduling integrations |

These interfaces are ordinary application functions in the frontend release. They are not evidence that an autonomous model is using tools. Avoid provider code or an unnecessary agent framework in the browser.

Separate read operations, draft creation, and user-confirmed changes. Before updating a plan, display what will change. A citation check may verify an existing ID and source link; semantic support for a claim still needs expert review or a separately evaluated method.

## 6. State, export, and future integration

Use a small versioned state model with explicit IDs and timestamps:

```text
DemoWorkspace
  schemaVersion, activeCaseId, cases[]
Case
  id, synthetic, context, contextSources[], plans[], observations[], reviews[]
Plan
  id, version, previousPlanId, caseId, goal, baseline,
  opportunity, supports, evidenceIds[], adaptations,
  aiConditions, accommodations, responsibilities, reviewDate, status
Observation
  id, caseId, planId, date, measure, value, unit,
  aiConditions, accommodations, implementation, learnerFeedback, synthetic
Review
  id, caseId, planId, date, decision, rationale, nextPlanId
```

Start with browser storage for small synthetic records, behind a storage adapter. Save status must say “Saved in this browser.” Handle unavailable storage and quota errors gracefully with memory-only mode and export. Local storage is not secure student-record infrastructure or a cross-device backup.

Provide JSON export/import with schema version, source versions, size limits, validation, unknown-field handling, and safe rendering. Never execute imported content. Preview an import before it replaces or merges a case; invalid input must not erase current work. Provide a printable, human-readable plan and a reset action with confirmation.

Do not put learner descriptions or plan contents in shareable URLs. Deep links identify views, not private state. Keep demo data clearly synthetic; no real student uploads in this public phase.

Backend later: Supabase authentication and permissions, secure shared persistence, server-side provider keys and requests, controlled tool execution, retrieval services, verified resource integrations, team approval, notifications, and research consent/data governance. Frontend design should not simulate these as operational services.

## 7. Implementation sequence and acceptance criteria

### Release A — website structure and responsive foundations (first work)

- Split Home, Workspace, Evidence, and Framework & About into distinct views.
- Add hash navigation, browser history, active states, and a contextual Assistant entry.
- Preserve credits and Figure 1; introduce a clear first action before the full explanation.
- Fix narrow-screen sizing and establish consistent typography, spacing, form controls, cards, and status messages.
- Retain current matching, evidence, chat, and export behavior.

Acceptance: each destination opens directly and survives refresh; Back/Forward works; keyboard navigation and focus are predictable; no horizontal page overflow at measured 390, 768, and 1440 CSS pixels; sticky navigation does not cover focused content. Existing evidence and chat boundary checks pass. Browser tests demonstrate navigation and current export behavior.

### Release B — learner context, plan builder, and local continuity

- Add a case workspace and six-stage navigation.
- Implement structured fictional context, editable plans, local save/resume, versioned export/import, and printable output.
- Add evidence comparison and a small fictional opportunity catalog.
- Complete one fictional case from context to a proposed allocation.

Acceptance: a plan preserves challenge and support, names responsibilities and review conditions, survives reload, and round-trips through export/import. Invalid imports are rejected without data loss. Cases remain isolated. Changing only a label does not create a benefit claim or remove advanced opportunity access.

### Release C — monitoring, assessment, and revision

- Add authored synthetic follow-up cases and manual demonstration observations.
- Display delivery, participation, learner feedback, assistance conditions, and comparable outcomes.
- Implement review decisions, plan version comparisons, and due-date displays.
- Add one learner-activity preview.

Acceptance: a complete fictional cycle produces two traceable plan versions. The interface distinguishes missing data from zero and AI assistance from accommodations. A change in outcome is described without claiming causal impact. Due-date displays do not claim that a reminder was sent.

### Release D — assistant integration and evidence discovery

- Connect the local assistant to stage-specific context and service interfaces.
- Support proposed edits with a visible preview and confirmation.
- Improve search and source details without automatically promoting unreviewed research to planning evidence.
- Add the optional library-coverage view only if its classifications and denominators are explicit.

Acceptance: the assistant identifies its local mode, accurately states its search scope, preserves source IDs and limitations, and cannot silently overwrite a plan. Changing the case clears or restores only that case's context. Empty retrieval states describe a library gap.

Defer broad feature expansion until one educator can complete the full cycle and explain the evidence, decision, and follow-up without developer assistance.

## 8. Engineering and release boundaries

Keep the existing vanilla JavaScript and static Python build for this phase. A framework migration is not a prerequisite. Extract state, navigation, storage, and view functions into small modules compatible with the current bundling approach. Edit source files, then regenerate index.html; do not hand-edit generated output.

Likely changes: `src/template.html`, `src/styles.css`, `src/app.js`, assistant integration, new local state/storage/workflow modules, fictional fixture data, and focused tests. Retain `engine.js` applicability boundaries unless separately reviewed.

Adding scripts, data, figures, or documentation requires updating the build and release allowlists, including `scripts/package_release.py`. Check both the actual deployed artifact and a fresh source-package rebuild. A local file existing does not mean it is published.

Preserve the current journal-linked version using an explicit release snapshot before changing the deployed site. Implement in a branch from the verified website commit; recheck remote main for changes before merging. Keep the live URL stable and add a release/version statement. GitHub Pages remains the target; no Vercel migration is needed for these frontend changes.

Before publishing: run source/data checks, targeted state and import tests, and browser scenarios for navigation, case isolation, persistence, evidence selection, plan export, and revision. Inspect desktop/mobile layouts, keyboard focus, chart/table alternatives, printing, and empty/error states. After deployment, verify the workflow succeeded and the live artifact matches the tested output. Software tests do not validate the educational framework.

## 9. First implementation ticket

**Title:** Separate AchieveGo's Home and Workspace and establish responsive navigation.

Deliver a distinct Home with a clear demo entry, a dedicated learner workspace, stable sticky navigation, working hash/history behavior, and corrected narrow-screen layout. Preserve the current evidence and local-chat functions. Use the deployed GitHub source as the baseline. No backend configuration, provider calls, manuscript edits, or new efficacy claims are part of this ticket.

This is the first concrete step. It makes the website easier to navigate and creates the structure in which the remaining talent management cycle can be implemented.
