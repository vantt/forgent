# Plan: tsk-49i Iron Law port follow-up audit (tsk-bc7)

Mode: **high-risk** (hard-gate flag: audit/security — the item under audit
IS the Iron Law safety gate for trunk merges; also touches existing
covered behavior, `npm test`'s merge-cluster suite, and the port being
audited is explicitly flagged as weak-proof: self-checked only, never
independently reviewed). Decided directly per `fgos-routing`'s Mode-gate
subsection — no prior lane was handed off (this item entered via
`/fgOS:cook`, discovery verdict `clear` skipped `exploring`, so no
`CONTEXT.md`/lane exists yet).

## No `CONTEXT.md` — description is the only source of truth

Discovery returned `clear` for tsk-bc7 (no ambiguity: the submission
already names exact SHAs, exact files, and an exact checklist), so
`exploring` was skipped and no `CONTEXT.md` was ever created for this
item. Every decision below cites the item's own description
(`fgos show tsk-bc7`) instead of a D-ID.

## Impact-analysis capability posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
registered and `present`. But `gitnexus://repo/forgent/context` reports
`"⚠️ Index is 228 commits behind HEAD"` — **stale**. Per `CLAUDE.md`'s
gate: posture = **degraded**. Any blast-radius claim in this audit is
backed by direct `git diff`/`git show`/`grep` cross-checks, not GitNexus
queries, and is marked as such rather than treated as fresh index
evidence.

## Approach

Two layers, both already scoped by the submitter with exact SHAs:

- **Layer 1** (`tsk-49i` cluster) — already independently audited once,
  clean. Re-reading the existing report only; not redone from scratch
  unless layer 2's cross-check surfaces something layer 1 missed.
- **Layer 2** (the `tsk-1y6-1` → `tsk-49i` merge port) — never
  independently reviewed. This is where real bugs, if any, are likely.

No split candidates — this is one honest piece of work (verify-and-fix),
not several independently workable ones. `fgos graph --json`'s
`topUnblock`/`criticalPath` do not surface tsk-bc7 (it is a fresh
standalone item with no deps/children), so there is no multi-piece
ordering decision to make here.

### Risk map

| Component | How risky | What proves it |
|---|---|---|
| `src/verbs/merge/iron-law-level.mjs` (new in port) | high — mediates whether a trunk merge is gated at all | Line-by-line semantic diff against `d694a7d2`'s version of the same logic (originally inline in `bin/fgos.mjs`) |
| `src/verbs/merge/approve.mjs` discriminator (`resolveRoot(view,id)===id`) | high — wrong discriminator silently widens or narrows which merges get gated | Diff against `d694a7d2`'s `case 'approve'` gate condition; confirm call-site semantics unchanged |
| `src/verbs/merge/sync-root.mjs` discriminator (`!item.parent`) | high — intentionally different from approve's; a copy-paste error here is the single highest-value bug to find | Diff against `d694a7d2`'s `case 'sync-root'`; confirm `!item.parent` (not `resolveRoot`) is preserved and correct per the item's own stated reason (`sync-root` targets `fgw/<item.parent>` directly) |
| `src/verbs/merge/merge.mjs`'s `wouldTripIronLaw` | medium — early-return ordering matters (warn-level bypass, non-trunk bypass) | Diff against `d694a7d2`; confirm both early returns present and in a semantically equivalent position |
| `CHANGELOG.md` / `docs/architecture-manifest.json` | low — no runtime behavior | Presence/content check only |
| `.fgos/` cleanliness in merge commit `5f4005fa` | medium — a stray `.fgos/` diff from a 3-way auto-merge would corrupt shared event-log state | `git show 5f4005fa --stat -- .fgos` vs `ede5994b` baseline, must be empty |
| Files `d694a7d2` touched beyond `bin/fgos.mjs` that layer 2 might have missed (e.g. `src/setup/checks.mjs`'s `ensureSharedConfigDefaults`) | medium — a missed call site means the new level-aware gate isn't wired everywhere the old one was | `git show d694a7d2 --stat`, cross-reference against the 6 files layer 2 actually touched |

Every medium/high row above gets a proof point at `fgos-coding-validating`,
not a guess here.

## Shape

Single-piece audit-and-fix, scaled to high-risk: full checklist execution
(not a shortcut), every claim traced to a specific `git diff`/`git show`/
`npm test` invocation, real bugs fixed in-branch with re-verified `npm
test`.

Concrete cases to prove against (from the item's own checklist):
- Semantic equivalence of all 6 layer-2 files vs `d694a7d2`'s originals.
- Discriminator correctness at each of the 3 call sites (`approve` uses
  `resolveRoot(view,id)===id`; `sync-root` uses `!item.parent` — these
  must NOT be swapped or conflated).
- No file `d694a7d2` touched was silently dropped from the port.
- `.fgos/` diff-free in the merge commit.
- `npm test` green, run fresh (not trusted from memory/prior report).

## Verify

`npm test` (already set as the item's real verify at discovery time —
matches the submission's own explicit mandatory-proof constraint). The
audit's own checklist items (diff comparisons, `git show --stat`) are
evidence gathered during `fgos-coding-implement`, reported with
file:line/command citations per the item's own constraint; they are not
separate `verify` commands since they are one-shot inspections, not
regression-guarding assertions.

## Outstanding questions

None
