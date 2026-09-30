# Ask AchieveGo — educator chatbot

Open `index.html` and choose **Ask AchieveGo**. The current chatbot works entirely in the browser. It searches the versioned 12-record evidence index and returns authored explanations, source cards, questions, and planning templates. **It is a local evidence demonstration, not a connected Anthropic or DeepSeek model.** The interface and exported conversation state that distinction.

## What works now

- Free-text search and suggested educator tasks: explain, compare, assess, plan, and monitor.
- Explicit inclusion/exclusion of the fictional learner context, with a preview of grades, goals, and labels.
- Grade/goal applicability kept separate from search relevance; companion Check & Connect outcomes and null findings remain visible.
- Links to original sources, original evidence ratings, and readable limitations.
- An authored four-week review sequence, labeled as a proposal rather than a validated intervention protocol.
- Explicit additions of eligible evidence to the existing review plan.
- Conversation export with mode, context, source records, index hash, and prompt version.
- Context changes reset the conversation; Clear removes it from the interface. No chat persistence or provider requests.
- Limits of 1,200 characters per message and 12 turns per conversation for this local demonstration.

The index uses metadata and keyword matching with domain synonyms. It does not have an LLM's language understanding or broad conversational knowledge. Unrecognized questions return a library gap; complex or ambiguous questions may need rephrasing. Suggested prompts are useful starting points for the demonstration.

## System prompt

The authoritative draft is [prompts/educator-system.md](prompts/educator-system.md), version **1.1.0**. It specifies educator tone, evidence grounding, citation obligations, limits of LPA and diagnostic applicability, preservation of challenge, separation of proposed adaptations from evaluated interventions, privacy, and honest failure handling.

`data/bot-config.json` records the prompt version and explicitly sets local mode. The build checks consistency with the prompt file. The prompt is prepared for the future backend; no model executes it in this release. The local templates implement a subset of its intended behavior and are not an evaluation of model adherence to the prompt.

## Structure and future connection

| File | Responsibility |
|---|---|
| `data/library.json` | Curated source records and proposed mappings |
| `data/evidence_index.json` | Generated metadata/keyword index with hash of the library |
| `src/chat-engine.js` | Indexed retrieval, applicability context, companion outcomes, and local response templates |
| `src/chat-app.js` | Chat interface, context preview, transcript, and explicit plan additions |
| `prompts/educator-system.md` | Versioned policy for the future model |
| `data/bot-config.json` | Public demo settings only; no credentials or endpoint |

Later, the chat transport can call an authenticated Supabase function using the same message/task/context/evidence-ID contract. The server must reload its own evidence, recompute applicability, apply the system prompt, verify login and invitation status, enforce quotas, and normalize/validate provider citations. It must not trust ratings, system instructions, identity, or applicability results submitted by a browser.

For Anthropic, native document citation blocks can be normalized into the existing source-card presentation. For DeepSeek, validate returned evidence references against the retrieved packet. Keep provider keys in Supabase secret storage and choose the provider on the server. A failed provider request must display an unavailable state rather than silently substituting the local demo as an AI answer.

No Supabase project, accounts, login enforcement, API route, or live provider connection is created by this version. The static demonstration is accessible to anyone who can access its deployed URL. Selected-user authentication remains a backend milestone; a future login form alone would not secure provider access. See [the integration plan](AI_BOT_INTEGRATION_PLAN.md).

## Release checks

Run `python3 scripts/check.py`. The checks cover source/index integrity, applicability and export boundaries, chatbot retrieval, explicit local mode, diagnosis-only non-assignment, null/out-of-grade outcomes, and release packaging. `tests/browser.test.js` additionally exercises chat navigation, safe text rendering, evidence additions, context resets, general browsing, and conversation export in a browser.

Source packaging now uses an explicit file allowlist. A dummy-secret test verifies that ignored `.env`, `.dev.vars`, private JSON, Vercel state, and prospective Supabase secret files do not enter the source ZIP. Public website output remains separately allowlisted.

The expanded research catalog is searchable in Evidence library. It is not yet included in local chatbot retrieval or matching; see [RESEARCH_DATABASE.md](RESEARCH_DATABASE.md) for the extraction and review workflow.
