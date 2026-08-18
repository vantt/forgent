# merge-standardization — plan

## Mode

**high-risk.** Flags counted (of: auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain):

- **audit/security (hard gate)** — this item automates action inside the
  CTR005 merge-approval gate (L9, `docs/platform-foundations.md`); any
  hard-gate flag forces high-risk regardless of count.
- **existing covered behavior** — `approve` is heavily tested today
  (`test/cli/fgos.test.mjs`: 73 refs to `proposed`; `test/runner/loop.test.mjs`:
  41 refs); a new automated caller must not regress it.
- **public contracts** — adds a new CLI verb / skill surface
  (`command-registry.mjs`, `plugins/fgOS/skills/`).
- **weak proof around the area** — the dep-wait + conflict + impact
  composition this item introduces has no existing test combining all
  three; each signal is separately tested today, the combination is not.

A smaller mode (standard or below) would not honestly cover the CTR005
exposure alone — every path here that ends in an actual merge must be
proven safe before it runs unattended.

## Approach

Two pieces, in this order (dependency is structural — piece 2 needs piece
1's output to have anything to pick from; no `fgos graph --what-if`
ambiguity to resolve here):

1. **Merge readiness/ordering function** (new pure logic, `src/state/` or
   `src/runner/` alongside `impact.mjs`/`merge.mjs` — exact module is an
   implementation choice for whoever builds it, not locked here). Inputs:
   the work-state view (same shape `rankImpact`/`footprintConflicts`
   already take). Computes, per D1/D3/D4/D5 (`CONTEXT.md`):
   - filter to `status === 'proposed'` items whose every `deps` entry is
     itself `done` (dependency-wait gate — genuinely new, `approve` has no
     such check today);
   - among those, split into conflict-free vs. conflicting, via the pairwise
     shared-path comparison extracted out of `footprintOverlap`
     (`src/state/graph-metrics.mjs:509-524`, D4-revised) into its own
     candidate-list function; `footprintOverlap(view)` stays a thin wrapper
     over it calling `frontier(view)` — the 4 existing tests
     (`test/state/graph-metrics.test.mjs:433-478`) and `footprintConflicts`/
     `fgos conflicts` are untouched. This piece calls the extracted
     comparison with the proposed-ready set instead;
   - order conflict-free items by `rankImpact` (reused as-is, blocking
     fan-out then goalTier).
   Exposed read-only, same shape as `fgos triage`/`fgos conflicts` today.

2. **Merge-next automation skill** (depends on piece 1). Picks the top item
   from piece 1's ordering and drives the merge by calling the *existing*
   `approve <id>` mechanics (local `git merge --no-commit --no-ff` /
   `--github` transport, whichever `classifySource` already resolves) —
   never a parallel merge path (D6). Runs unattended, from the main
   checkout (same structural guard `approve` already enforces against
   running from a worktree). `role: 'human'` attribution stays exactly as
   `approve` already hardcodes it — this piece does not touch that.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| Readiness/ordering function (new composition of dep-wait + an extracted candidate-list overlap comparison + rankImpact) | Medium — new combination + extracting shared logic out of `footprintOverlap` | Unit tests: an item with an unmerged dep is excluded; a conflicting pair has the lower-impact one deprioritized/excluded; goalTier tie-break matches `rankImpact`'s existing behavior byte-for-byte; all 4 existing `test/state/graph-metrics.test.mjs` footprint-overlap tests (lines 433-478) and `fgos conflicts` output stay byte-for-byte unchanged after the extraction |
| Merge-next calling `approve` unattended, agent-driven | High — touches CTR005, the worktree/main-checkout structural guards, the Iron Law gate (runner-sourced items), and local-vs-github transport branching | Confirm merge-next refuses identically to `approve` when run from a worktree; confirm a real conflict still ends in `blocked`/`merge-conflict` with main byte-for-byte untouched (existing `merge-abort-probe` guarantee); confirm `role: 'human'` attribution is unchanged |
| Regression risk on existing `approve`/`review` behavior | Medium — full existing suite must stay green | `test/cli/fgos.test.mjs` + `test/runner/loop.test.mjs` unchanged and green after this item lands |
| New CLI verb / skill manifest surface | Low — mechanical registration | `test/cli/fgos-manifest.test.mjs` (`dispatchedVerbs`) covers the new verb the same way it covers every other one |

## Shape / split

Two child items, each carrying `parent: tsk-4j9`:

1. **"Merge readiness/ordering function + read-only listing verb"**
   Verify: `node --test test/state/merge-readiness.test.mjs` — new suite
   proving the three risk-map cases above (dep-wait exclusion, conflict
   deprioritization, impact tie-break) against fixture work-state views,
   plus a CLI-level check that the new verb's output matches.
   No dependency on piece 2.

2. **"Merge-next automation skill (drives approve/CTR005 unattended)"**
   Depends on child 1 (needs its ordering output to have anything to
   pick). Verify: `node --test test/runner/merge-next.test.mjs` — proving
   the two High-risk proof points above (worktree refusal parity,
   conflict-safe-fail parity) plus `npm test` staying green end to end.

`fgos discover tsk-4j9` (the engine's own decompose judgment, not this
skill) is what actually creates these as real items with real ids and
wires the dependency between them — this plan only sketches the shape it
should find when it reads this file.

The `proposed`-rename item (D2, deferred) is deliberately **not** one of
these two children — it is its own separate item, sequenced after this
item's functionality ships, per the user's own call.
