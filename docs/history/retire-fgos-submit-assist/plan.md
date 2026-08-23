# Plan: retire fgos-submit-assist if it has no step of its own left

Item: tsk-6ar (mục 5 của tsk-5wz, tách ra vì tsk-4ns chưa merge lúc đó).
Mode: tiny

## Lane — how it was counted

No prior lane hand-off existed for this session (direct-entry into
`fgos-coding-planning`; `fgos discover`'s caller-supplied verdict jumped
`clarify -> decompose` directly, so no Orient step ran first). Applying
`fgos-routing`'s own Mode-gate table directly:

| Flag | Applies? | Why |
|---|---|---|
| auth / authorization | No | — |
| data model | No | no schema/field change |
| audit/security | No | — |
| external systems | No | tsk-4ns already stripped this skill's own `agy` cli-spawn branch |
| public contracts | No | `.claude/skills/fgos-submit-assist/SKILL.md` is an internal, standalone-invoke Claude Code skill, not a published API/schema |
| cross-platform | No | — |
| existing covered behavior | No | `grep -rl fgos-submit-assist test/` → zero hits, no test names or exercises this skill |
| weak proof around the area | No | the question ("does this skill still have a step of its own") is directly answerable by reading two files, done below |
| multi-domain | No | — |

0 flags → **tiny** — one direct task (delete one file, confirm one
fragment keeps other consumers), no gray areas.

## Decisions this plan is built on

No `CONTEXT.md` exists for this item — `fgos-clarifying` verdicted the
item's own description **understood** with no gray area, so the deep
Socratic `exploring` path never ran. The description's own "VIEC CAN LAM"
/ "KEM THEO" sections are the locked decisions for this plan.

Verified independently, not taken on the item's word alone:
- `.claude/skills/fgos-submit-assist/SKILL.md` (read in full, current
  state on this branch, post-tsk-4ns):
  - Step 1 ("Read the ask") explicitly defers title-derivation to the
    verb itself ("submit itself derives the item's title... mechanically
    ... never this skill's judgment") — confirms the item's own claim,
    no step of its own here.
  - Step 2 ("Classify tier, kind, and risk yourself") already had its
    subprocess-dispatch branch retired by tsk-4ns (its own inline note:
    "this step used to optionally dispatch to a `submit-assist-classify`
    capacity ... retired"). What remains is inline reasoning the skill
    performs on the **raw, pre-submit** ask text.
  - Step 3 ("Print, then submit") is the verb call itself.
- `plugins/fgOS/skills/submit/SKILL.md` step 6 (read in full, current
  state, tsk-5wz's own landed change): for ANY live session invoking
  `/fgOS:submit` — the ordinary, non-standalone door — step 6a runs
  `fgos-clarifying` first, then step 6b re-judges `tier`/`kind`/`risk`
  itself, in-session, on the now-clean text, and applies it via `fgos
  edit`. This is the exact same classification job `fgos-submit-assist`
  step 2 does, except on cleaner input (post-clarify) and via the
  ordinary door a person would reach for anyway.
- Consequence: `fgos-submit-assist` step 2 is not a unique capability —
  it duplicates step 6b's job with strictly worse input (raw text,
  pre-clarify — the exact "reading the same text twice, dirty before
  clean" defect tsk-5wz's own description named and fixed at the
  `/fgOS:submit` door). Both this skill and `fgos-submit-assist` can only
  ever be reached by a live session (a person or agent chatting with
  Claude) — there is no no-soul caller of `fgos-submit-assist` to
  preserve, so there is no case step 6b fails to already cover.
  `fgos-submit-assist` also does not perform `/fgOS:submit`'s own
  dependency-scan step (steps 2-3 there) — it is strictly a subset of
  what the ordinary door already does automatically.
- `grep -rl "fgos-submit-assist" test/` → zero hits. No test names or
  exercises this skill; nothing to update or regress.
- `grep -rl "capacity-dispatch-fallback" .claude/skills plugins/fgOS/skills
  test/` → 8 hits: `fgos-coding-implement`, `fgos-coding-validating`,
  `fgos-coding-exploring`, `fgos-researching`, `fgos-fanout`, `fgos-coding-planning`
  (this file), `test/docs/launcher-vocabulary-guard.test.mjs`, and
  `fgos-submit-assist` itself. Removing `fgos-submit-assist` leaves SIX
  other real consumers — `capacity-dispatch-fallback.md` keeps its
  reason to exist; the item's own "KEM THEO" condition (retire it too
  only if it loses its LAST consumer) does not fire.
- Impact-analysis posture (`fgos tool query --capability impact-analysis
  --status present`): **full** (GitNexus registered and present) — not
  load-bearing here regardless: this change deletes a prose skill file,
  not a code symbol, so GitNexus's code-graph has no node for it. The
  real evidence is the two greps above (test coverage, fragment
  consumers), not blast-radius analysis.

## Approach

**Chosen path**: delete `.claude/skills/fgos-submit-assist/SKILL.md`
outright. All three of its own steps are either already owned elsewhere
(step 1: the verb; step 3: the verb call) or fully superseded by a
strictly-better version of the same job reachable through the ordinary
door (step 2, superseded by `/fgOS:submit` step 6b). Nothing left to
keep.

Per AGENTS.md's install/setup/doctor gate ("does this change something a
user of fgOS would see?") — yes, a discoverable, user-invocable skill is
being removed — add one `## [Unreleased]` line to `CHANGELOG.md`.

**Rejected alternatives**
- Keep the file as a thin pointer to `/fgOS:submit` — rejected: the item's
  own instruction is binary (retire if no step of its own remains; this
  plan found none), and a pointer-only file is exactly the "half-finished
  shim" `AGENTS.md`'s YAGNI/KISS priority rejects when the real door
  already exists and is already the one a person would reach for.
- Also retire `_shared/capacity-dispatch-fallback.md` — rejected: it has
  six other real consumers today (verified by grep above), so it is not
  losing its last one.

**Files touched**
- `.claude/skills/fgos-submit-assist/SKILL.md` — delete.
- `CHANGELOG.md` — one `## [Unreleased]` line.

**Order**: single step, no ordering concern.

## Concrete cases to prove against (tiny depth)

- The verify's negative grep (`! grep -rq 'fgos-submit-assist' .claude/skills
  plugins/fgOS/skills`) must fail to find the string anywhere, including
  in any OTHER skill file that might reference it by name (checked above:
  none do — the file is standalone-invoke only, never linked from another
  skill's flow).
- `npm test` must stay green — no test names this file, so no test change
  is expected; the full suite is still the honest proof nothing else
  silently depended on it.

## Outstanding questions

None
