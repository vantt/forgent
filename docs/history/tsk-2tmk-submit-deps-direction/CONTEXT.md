# CONTEXT: tsk-2tmk — /fgOS:submit's dependency-candidate scan gains a direction

## Feature boundary

`/fgOS:submit`'s step 2/3 (`plugins/fgOS/skills/submit/SKILL.md:65-146`)
scans for a textually-grounded dependency candidate and asks
confirm/edit/reject, then always attaches the result as `--deps` on the
**new** item. It never asks which direction the relationship actually
goes: the new item may genuinely need the candidate to finish first
(blocking, correctly modeled by `deps`), or the candidate may be an old
item that this new item's work will make moot (a non-blocking relation
the engine already models via `supersededBy`, just never reachable from
this skill).

Real evidence the reporter hit themselves: they created `tsk-3me`
(redesign the gate subsystem, consolidating `tsk-1am` + `tsk-13r`) and set
`deps: [tsk-1am, tsk-13r]` on it — but those two old items are actually
stuck waiting for `tsk-3me` to resolve them, so the reverse-direction deps
silently deadlocked `tsk-3me` (it can never become "ready" until two
items that can't finish without it finish first). No error was raised —
the engine trusts `deps` direction unconditionally.

This item changes `plugins/fgOS/skills/submit/SKILL.md`'s own prose only.
It does not touch the `submit`/`edit` verbs, the work-item schema, or any
other skill.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | /fgOS:submit step 3 becomes ONE unified prompt with 3 choices -- confirm-as-blocked-by (today's deps behavior) / mark the old candidate with its own supersededBy pointing at the new item / reject -- with a pre-selected default: a dependency signal in the new item's text defaults to blocked-by, a consolidation signal (redesign/consolidate/gop/gom/thay-the) defaults to the supersededBy branch, no signal means no default and the person is asked directly. |
| D2 | sequencing stays a single user-facing round -- submit runs first to obtain the new item's real id, then the skill silently loops a supersededBy-setting fgos edit call on every candidate confirmed for that branch in this same submit call, merging the new id and every supersededBy write into one final report with no mid-flow re-prompt. |
| D3 | step 2's candidate scan gains a second, parallel heuristic -- a lightweight consolidation-signal keyword set (redesign/consolidate/gop/gom/thay-the) alongside today's existing deps-signal heuristic -- purely to feed D1's default selection, never a new question of its own. |
| D4 | scope is confined to plugins/fgOS/skills/submit/SKILL.md prose only -- no change to the submit verb (src/cli/command-registry.mjs, bin/fgos.mjs); fgos edit's existing supersededBy-setting flag already covers the write path, so no new intake-time flag for that field is added to submit. |

## Pinned terms

- **blocked-by** — today's only direction: the new item's own `deps` array
  names the candidate id; the new item cannot become `ready` until the
  candidate resolves. Unchanged by this item.
- **supersededBy** — the existing, real work-item field
  (`src/state/work.mjs:342-363`): a directed, singular pointer on the OLD
  item naming the ONE new item that makes it moot ("I lose, that one
  wins" — `docs/history/tsk-2ie-duplicate-superseded-guard/CONTEXT.md`).
  Non-blocking: excluded from the deps/parent cycle graph and from
  `frontier.mjs` start-eligibility; its only real effect today is
  `mergeReadiness` excluding the losing item from `ready`. Settable ONLY
  via `fgos edit <id>` (its own dedicated field-setting flag) — never at
  `fgos submit` time, because the new item's id does not exist yet when
  the candidate scan runs.

## Scout evidence

- `plugins/fgOS/skills/submit/SKILL.md:65-146` (steps 2/3/5) — today's
  scan/confirm/edit/reject flow; every branch of step 5 writes only
  `--deps` on the new item, never anything onto the candidate's record.
- `src/state/work.mjs:342-363` — `supersededBy`'s validation (directed,
  singular, self-reference rejected) and its comment block naming the
  bd-taxonomy precedent (`supersedes`/`duplicates` split) this field
  mirrors.
- `src/state/work.mjs:777-786` (`validateSupersededBy`) — the target id
  must already exist; a typo'd/deleted target fails loud at write time.
- `bin/fgos.mjs:1677-1691` — `edit`'s flag parsing is the only place that
  writes `supersededBy`.
- `src/cli/command-registry.mjs:123-151` — `submit`'s full parameter list
  has no such flag; confirmed the field cannot be set at item-creation
  time.
- `docs/history/tsk-2ie-duplicate-superseded-guard/CONTEXT.md` — the
  locked design record for `supersededBy`/`duplicates`; today's only
  consumer is `mergeReadiness`'s exclusion rule (D2 there), never
  `/fgOS:submit`'s candidate scan.
- Full research trail, including the two-branch mechanical routing this
  evidence was gathered through: `docs/history/tsk-2tmk-submit-deps-
  direction/RESEARCH.md`.
- Impact-analysis capability posture (per `CLAUDE.md`'s gate,
  `fgos tool query --capability impact-analysis --status present`):
  GitNexus registered and `present`, but its index was reported stale
  right after this session's own commit (last indexed a prior commit,
  current HEAD ahead of it) — degraded, not full. Not a blocking gap for
  this item: the change is confined to one skill-prose file with no
  runtime code path GitNexus would trace blast radius through.

## Canonical references

- `docs/history/tsk-2ie-duplicate-superseded-guard/CONTEXT.md` — sibling
  feature, `supersededBy`'s full design record and pinned semantics.
- `docs/how-to/write-verify-for-a-skill-prose-change.md` — this item edits
  a `SKILL.md` path; whichever stage sets the item's real `verify` must
  follow this doc's POSITIVE+NEGATIVE shape.

## Outstanding questions

None
