# Plan — tsk-535: work items with no description at all

Mode: **standard**

Lane decided via `fgos-routing`'s Mode-gate (direct-entry fallback — no
prior Orient handoff existed for this item in this session): 2 flags
counted — **public contracts** (`fgos add --description` becomes a
required flag, breaking any existing caller/script that omits it) and
**existing covered behavior** (`test/cli/fgos.test.mjs` and `test/intake/
decompose.test.mjs` both already cover the exact surfaces this item
changes exhaustively). No hard-gate flag — this is additive-and-required
data, not auth/data-loss/audit/external-provider/removed-validation — so
2 flags lands at standard per the table (2–3 → standard).

## Proof surface (whole item)

`node --test test/cli/fgos.test.mjs test/intake/plan.test.mjs
test/runner/loop.test.mjs` — real, runnable, verified passing today
(52/52 in `loop.test.mjs` alone, confirmed this session; the other two
files' current counts are already proven green earlier this session via
tsk-3xd). Scoped to the exact three files covering all three write paths
this item touches (`add`/`edit` CLI in `fgos.test.mjs`, decompose-child in
`decompose.test.mjs`, discovered-work in `loop.test.mjs`) — not the
generic whole-suite `npm test` the clarify-stage second-pass judge
correctly flagged as unable to prove this item's specific claim.
Execution adds the new `test()` blocks named in the risk map above into
these same files; this same command then exercises them. Supersedes the
item's clarify-stage placeholder verify, recorded via `fgos edit
--verify` before the `planApprove` gate.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
`present`. **Degraded**, not full: the same stale-index flag this session
has seen on every prior check (`last indexed: 251d0b5`). No proof point
below leans on GitNexus blast-radius numbers — every claim here is a
direct grep/read, same discipline tsk-3xd's own plan used.

## Approach

**Chosen path:** three small, independent write-path fixes plus one
backfill pass, landed together (all touch the same underlying invariant —
"description is never silently absent" — and the backfill's own proof
depends on all three write paths already being fixed, or new items could
slip back into the broken count while the backfill runs).

1. **`fgos add --description` (D1).** Add `description` to the `add`
   verb's `parameters.properties` and `parameters.required`
   (`src/cli/command-registry.mjs`), then wire `description:
   requireField(flags.description, ...)` into `bin/fgos.mjs`'s `add` case
   handler (mirrors how `title`'s own generateId call already uses
   `requireField` for its own required-ness error). **Enforced at the CLI
   handler layer only, NOT in `work.mjs`'s `validateWorkShape`** — real
   evidence two OTHER `addWork` callers legitimately omit `description`
   by design: `src/runner/loop.mjs:626` (discovered-work, description
   optional until D4's own fix below) and `bin/fgos.mjs:3207`
   (`promote-to-component`'s fresh-root creation, a deliberately minimal
   "pure milestone-style grouping item" with no description at all).
   Making `description` schema-required would break both. `add`'s own
   `required` array is documentation/manifest-only (confirmed:
   `bin/fgos.mjs`'s `publicManifestEntries` reads it only for `--help`
   text) — the real enforcement is the `requireField` call in the
   handler, same pattern `add --title`'s own id-generation step already
   uses.

2. **Decompose-child `description` (D2).** `src/intake/plan.mjs`'s
   `addWork` loop (~line 988, right where tsk-3xd's own `action` field was
   just added) gets one more field: `description: child.title`. No schema
   change — `description` already exists as an optional field
   (`work.mjs`); this is a call-site addition only, mirroring the existing
   `action: child.action` line immediately above it.

3. **Discovered-work `description` (D4).** `src/runner/loop.mjs:626`'s
   `addWork` call changes `description: block.description` to
   `description: (typeof block.description === 'string' &&
   block.description.trim()) ? block.description : block.title` — prefer
   the worker's own real description when it supplied one (unchanged
   behavior for the common case), fall back to `title` only when it
   didn't (closes the gap D4 found).

4. **Backfill (D3).** A one-time pass over every currently-broken item
   (measured 112 live: 92 decompose children + 20 root), writing
   `description = title` via `fgos edit --description <title>` per item —
   same mechanical `edit` door tsk-4zg's own closure (commit `5679d82`)
   already used for its 110-item title re-derive. Lands as a `.fgos/`
   state-only commit, same shape tsk-4zg's own closure took (per
   `docs/explanation/pure-fgos-state-items-cannot-close-through-return.md`,
   cited in `CONTEXT.md`) — this item's own source-code changes (1-3
   above) land in one commit on `fgw/tsk-535` as usual; the backfill's
   `.fgos/events.jsonl` entries are a separate concern from that diff,
   the same split tsk-4zg's own item took between its code (none — pure
   state item) and its event-log writes.

5. **Update the 3 live in-repo examples that would break under D1
   (`fgos-coding-validating` finding, mid-planning).** Real evidence: these
   `fgos add --title ...` examples are executable prose a session
   literally copies and runs — none currently pass `--description`, so
   D1's required flag would break every one of them:
   - `.claude/skills/fgos-coding-exploring/SKILL.md:212` (docsRef-creation
     example)
   - `.claude/skills/fgos-coding-planning/SKILL.md:193` (split-child creation
     example — this very skill's own canonical `fgos add --parent`
     command)
   - `docs/how-to/set-or-clear-a-work-items-parent-lineage-via-cli.md:24`

   Each gets a real `--description "..."` value added to its example
   command (matching that example's own `--title`, since these are
   documentation prose, not live data — a description repeating the
   title in a doc example is not the same duplication concern D2 avoided
   for real LLM-authored content). `docs/history/*/plan.md` entries that
   already ran the OLD example (e.g. `docs/history/parallel-dispatch-
   demo-format-utils/plan.md`) are historical records, not live
   workflow — explicitly excluded, matching D3's own "fix going forward,
   backfill separately" shape.

**Rejected alternative:** a schema-level `validateWorkShape` requirement
for `description` — rejected per point 1 above, real evidence of two
legitimate optional-description callers that would break.

**Order:** three write-path fixes first (so the backfill's own "0 items
missing description" proof point can't be undermined by a new item
landing broken mid-backfill), backfill last. `fgos graph tsk-535 --json`
confirms this item sits in the same 6-node component as tsk-3xd/tsk-4zg
(`tsk-52g`, `tsk-52g-1`, `tsk-52g-2`, `tsk-4zg`, `tsk-535`, `tsk-3xd`);
no `topUnblock` entry for this item specifically today, so ordering here
rests on the write-before-backfill dependency above, not graph priority.

## Risk map

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| `fgos add --description` required, CLI-handler-only enforcement | MEDIUM — a breaking CLI change; any existing script/caller that invokes `add` without `--description` now fails | Unit test: `add` without `--description` exits non-zero with a clear message (mirrors existing `add` without `--title` test in `test/cli/fgos.test.mjs`); `add` WITH `--description` succeeds and the item carries it. |
| `description` stays schema-optional (not added to `validateWorkShape`) | LOW — the two other legitimate callers (`loop.mjs` before D4's own fix lands, `promote-to-component`) keep working unchanged | Existing `test/state/work.test.mjs` coverage for `validateWork` continues passing unmodified — no new assertion needed here, only that nothing regresses. |
| Decompose-child `description = title` | LOW — mechanical call-site addition, same shape as tsk-3xd's own `action: child.action` line it sits beside | Unit test mirroring tsk-3xd's own `resolveDecompose writes action on every child` test: a decompose child's `description` equals its `title` after `resolveDecompose`. |
| Discovered-work fallback (`block.description \|\| block.title`) | MEDIUM — touches a real runtime path (`loop.mjs`'s discovered-work capture), and must not regress the common case where a worker DOES supply a real description | Two tests: worker supplies `description` → item carries the worker's own text unchanged (regression guard); worker omits it → item carries `title` instead of `undefined`. |
| Backfill (112 items, `description = title` via `edit`) | MEDIUM — writes to all 112 items in one pass; a bug corrupts a large slice of the live backlog in one run, same class of risk tsk-4zg's own risk map named for its re-derive pass | `fgos-coding-validating`: confirm the backfill goes through the `edit` door (event-log append, `rebuild()` recovery intact) and dry-run the diff (list of ids + old/new description) before writing, same "dry-run first" discipline tsk-4zg's own plan.md used for its re-derive phase. |
| 3 live in-repo doc examples missing `--description` (piece 5) | LOW — pure prose edits, no runtime behavior, no test coverage exists or is needed for doc text | Direct read of each file post-edit: the example command now includes a real `--description` value. |

## Assumptions (unproven, flagged for fgos-coding-validating)

- ~~No existing script or CI job outside this repo invokes `fgos add`
  without `--description`~~ — **checked mid-planning, real evidence
  found**: 3 in-repo files DID rely on the old optional shape (piece 5
  above, added as a direct result). Whether any caller OUTSIDE this repo
  exists remains genuinely unverifiable from inside it — flagged as the
  one residual unproven piece of this assumption for `fgos-coding-validating`.
- `block.title` is always a reasonable stand-in for `description` when a
  worker omits the latter — same reasoning D2 already accepted for
  decompose children (mirrors that precedent rather than re-deriving it).

## Split decision

No split. Five small, causally-ordered pieces (three write-path fixes,
one backfill, one doc-example fixup found mid-planning) in one coherent
item — matches `CONTEXT.md`'s own scope boundary. Proceeds as itself.
