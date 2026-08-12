# Plan: autoClose option + /fgOS:terminal-close helper skill

Item: tsk-3v2. Decisions locked in `CONTEXT.md` (D1, D2) are the only
source of truth for scope; this plan does not reopen either.

Mode: **standard** (2 flags per fgos-routing's Mode gate — public
contracts: new skill `/fgOS:terminal-close` plus an optional parameter on
two existing entry-point skills people invoke directly; existing covered
behavior: `pick`/`discover`'s own `$ARGUMENTS` parsing and report steps
are exercised by `npm test` today and must not regress for the plain,
no-flag call shape).

impact-analysis: degraded — GitNexus registered and `present`
(`fgos tool query --capability impact-analysis --status present`), but a
PostToolUse hook in this session flagged the local index stale (last
indexed `4ce7a96`, behind current HEAD). Scope here is skill-prose only
(no symbols GitNexus tracks), so this mostly affects confidence rather
than blocking evidence — noted rather than treated as blocking per
CLAUDE.md's gate.

## Approach

Copy the existing `/fgOS:terminal` / `rename.sh` split exactly (CONTEXT.md
Scout evidence): a thin `SKILL.md` for the direct-invocation case, plus a
script the two call sites (`pick`, `discover`) run directly and inline —
"invoked directly here rather than through a second slash-command round
trip," the same phrase `pick/SKILL.md` step 3 already uses for its own
`terminal/rename.sh` call. `terminal-close`'s script gets the same
guard chain `rename.sh` already has (`HERDR_ENV=1`, `command -v herdr`,
`HERDR_PANE_ID` non-empty), calling `herdr pane close "$HERDR_PANE_ID"`
instead of `rename`. Verb confirmed present: `herdr pane close <pane_id>`
(checked via `herdr pane --help` in this session).

**Call-site shape for `autoClose` (CONTEXT.md's own deferred choice):** an
extra token appended to `$ARGUMENTS` — `/fgOS:pick <id> --autoClose` /
`/fgOS:discover <id> --autoClose` — never an env var or flag file. Reason:
both skills already read `$ARGUMENTS` as free text typed into a fresh pane
by the launcher (`open_pick_pane`/`open_discover_pane` type a literal
`claude '/fgOS:pick <id>'`-shaped string per CONTEXT.md's scout evidence)
— an extra argument token is the one channel that already exists at that
call boundary with zero new plumbing, and it keeps the plain
`/fgOS:pick <id>` human-typed shape byte-identical to today (no default
changed, matching D1's opt-in-only framing).

**Firing-condition mapping (direct application of CONTEXT.md D2, not a new
decision):** each skill already enumerates its own driver-stop report
cases in its own "Report" step. D2's advance/park-vs-error-stop split maps
onto those enumerations plainly:

| Skill | Driver stop case | Fires `terminal-close`? |
|---|---|---|
| `pick` | `awaiting-approval` reached | yes — advance |
| `pick` | anchored by open children | yes — advance (item moved forward into children) |
| `pick` | `awaiting-human` | yes — park (D2 names this explicitly) |
| `pick` | `blocked` | no — error stop, pane stays open for debugging (D2) |
| `pick` | no-progress | no — error stop (D2) |
| `discover` | reached ceiling at `decompose` | yes — advance |
| `discover` | `awaiting-human` | yes — park |
| `discover` | `blocked` | no — error stop |
| `discover` | no-progress | no — error stop |

Assumption (not material — implementation detail `CONTEXT.md` correctly
left unaddressed, pinned here rather than asked): this table is the only
place the mapping is recorded; no new field, no new event kind.

**Ordering guarantee, no delay (confirmed with the user during planning):**
in both `pick` and `discover`, the `close.sh` call is always the final
statement of the skill's flow — nothing runs after it, and it only runs
once the report text for that turn has already been fully emitted. No
`sleep` before the `herdr pane close` call: by the time this step runs,
every state-mutating engine-verb call (`fgos discover`/`decompose`/
`return`) has already completed synchronously, so there is no in-flight
work a delay would protect. The durable record of what happened
(`.fgos/events.jsonl`, readable anytime via `fgos show <id>`) is
unaffected by the pane closing — raw pane scrollback was never the source
of truth this feature needs to preserve, so there is nothing a delay
would let a person or the launcher "catch" that isn't already durable
without one. Capturing raw pane output before close (e.g. `herdr pane
read` to a log) is explicitly out of scope for this item — a different
decision the user chose not to open here.

## Files touched, in order

1. `plugins/fgOS/skills/terminal-close/SKILL.md` (new) — direct-invocation
   entry point, mirrors `terminal/SKILL.md`'s shape and no-op contract.
2. `plugins/fgOS/skills/terminal-close/close.sh` (new) — mirrors
   `rename.sh`'s guard chain; calls `herdr pane close "$HERDR_PANE_ID"`.
3. `plugins/fgOS/skills/pick/SKILL.md` (edit) — parse optional
   `--autoClose` token from `$ARGUMENTS` in step 1; after step 6's report,
   if `autoClose` was set and the driver's stop matches a "fires" row
   above, call `close.sh` inline (same pattern step 3 already uses for
   `rename.sh`).
4. `plugins/fgOS/skills/discover/SKILL.md` (edit) — same shape, applied to
   its own step 1 (id parsing) and step 4 (report).

This order lets 3/4 both depend on 1/2 existing first (no split needed —
one cohesive change, small enough that a further decompose would just add
footprint-tracking overhead for no real parallelism gain: 1-2 are prose
+ one new script, no shared file with 3-4).

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `--autoClose` token parsing added to `pick`/`discover`'s existing `$ARGUMENTS` read | medium — a plain `/fgOS:pick <id>` call (no flag) must stay byte-identical in behavior | `npm test` covers the underlying `fgos pick`/`fgos take` CLI verbs only (unchanged by this item) — it does NOT and cannot assert `$ARGUMENTS`-parsing prose behavior (`docs/how-to/write-verify-for-a-skill-prose-change.md`'s own scoping: no shell command asserts SKILL.md runtime behavior). Real proof surface for this row is `fgos-coding-validating`'s own read-through at implementation time (parsing only strips a trailing `--autoClose` token, id extraction unchanged when absent) plus that doc's documented post-merge channel (`.fgos/events.jsonl` observed on real dispatch) — not a pre-merge shell assertion |
| Firing-condition mapping (table above) | medium — misclassifying a case would either auto-close on a debug-relevant stop (`blocked`/no-progress) or leave a pane open on a real advance | traced 1:1 against every case each skill's own existing Report step already enumerates (see table); no case invented or omitted |
| `terminal-close` script itself | low — new script, but exact structural copy of an already-proven pattern | mirrors `rename.sh`'s guard chain (`HERDR_ENV=1`, `command -v herdr`, `HERDR_PANE_ID` non-empty) line-for-line; verb confirmed via `herdr pane --help` |
| Scope leak into `herdr-plugin/src/` (Rust) | low — mechanical | verify command's own negative check: `! git diff --name-only main...HEAD | grep -q '^herdr-plugin/src/'` |

## Cases to prove against (standard mode — sketch, not exhaustive)

- No `--autoClose` token at all → identical to today's behavior (the
  regression case the medium-risk parsing row above exists to cover).
- `--autoClose` + driver reaches `awaiting-approval` (pick) / ceiling
  `decompose` (discover) → `close.sh` runs.
- `--autoClose` + driver parks `awaiting-human` → `close.sh` runs.
- `--autoClose` + driver reports `blocked` or no-progress → `close.sh`
  does NOT run; pane stays open.
- `--autoClose` + pick's driver reports anchored by open children →
  `close.sh` runs.
- `--autoClose` passed but session isn't in a herdr pane (e.g. a human
  manually adds the flag) → `close.sh` silent no-op, exit 0, never blocks
  (same guard `rename.sh` already proves).
- herdr installed, `HERDR_PANE_ID` unresolved → same silent no-op.
- `close.sh` call is unconditionally the last statement in both `pick`'s
  and `discover`'s flow, with no `sleep`/delay before `herdr pane close`
  — read-through check, no code path runs anything after it.

## Outstanding questions

None
