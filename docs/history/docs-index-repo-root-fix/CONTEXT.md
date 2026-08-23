# tsk-1wn — docs-index writes the wrong root, mislabeled as read-only

## Feature boundary

`fgos docs-index` (bin/fgos.mjs, `case 'docs-index'`) regenerates
`docs/enduser-docs-index.json`. This item fixes what it writes to, how
it's labeled in the CLI manifest, and adds a cheap no-op guard — it does
not touch locking/concurrency primitives, and does not touch any other
verb.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `repoRoot` in the `docs-index` handler must resolve from the same main-checkout root as `dir` (the `--dir`-resolved store path), not raw `process.cwd()`. `fgos-indexing` SKILL.md must be updated to have callers pass `--dir <mainRoot>`, matching the convention every other cross-worktree verb already follows. |
| D2 | Registry flags for `docs-index` in `src/cli/command-registry.mjs`: `externalEffect: true` (real write outside `.fgos/`); `touchesState` stays `false` (never appends an event or overwrites `.fgos/state.json`). ~~`requiresExistingStore: true`~~ — superseded by D4. |
| D3 | No `main-checkout-lock` for `docs-index`. Add a write-only-if-changed guard (skip `fs.writeFileSync` when the newly computed JSON is byte-identical to what's on disk) and a deterministic sort of `docEntries` (currently unsorted `fs.readdirSync` order). The true-simultaneous-same-root-race-with-differing-content case is left unguarded (YAGNI — no observed instance, and D1 removes the dominant real-world trigger). |
| D4 | `requiresExistingStore` for `docs-index` stays `false`, contra D2's original text. `test/cli/fgos-manifest.test.mjs:60-67` (tsk-4fu-2) enforces `requiresExistingStore: true` implies `touchesState: true` for every entry except `init`; flipping `requiresExistingStore` alone would fail that existing test, and flipping `touchesState` too would be factually wrong (docs-index never writes `.fgos/state.json`). D1's fix (repoRoot/dir resolved consistently, callers pass `--dir`) already addresses the practical missing-store-silent-degrade concern that originally motivated D2's `requiresExistingStore` clause. Found during `fgos-coding-validating`'s reality gate. |

## Scout evidence

- `bin/fgos.mjs:1276` — `const repoRoot = process.cwd();` inside `case
  'docs-index'`, independent of the `dir` variable used two lines later
  (`listWork(dir)` at `:1306`) for state.
- `bin/fgos.mjs:2590` — `const dir = dataDir(flags.dir);` — `dir` DOES
  honor `--dir`; `repoRoot` does not, and is never derived from it.
- `src/state/store.mjs:750-753` — `listWork(dir)` on a missing/nonexistent
  `dir` rebuilds to an empty view (`{}`), silently — no crash, no
  warning for `docs-index` (it's not in `STORE_MISSING_WARNING_VERBS`,
  `bin/fgos.mjs:2571`).
- `.claude/skills/fgos-indexing/SKILL.md` (and its plugin/worktree
  copies) instructs: "Run `fgos docs-index` once" — no mention of
  `--dir` or main-checkout targeting. Every claimed item works inside
  its own `.claude/worktrees/<id>` (ADR0020: worktrees never carry
  their own `.fgos/`), which is the session's cwd when this runs.
- Net effect today: a worktree session running the bare command as
  instructed reads an empty outcomes view (every `sourceCaptureId`
  silently becomes `null`) AND writes to that worktree's own local
  `docs/enduser-docs-index.json`, never the shared main-checkout file.
  This fully explains the observed 2026-07-29 symptom — the file
  "liên tục dirty/đổi trạng thái staged" while tsk-3ld/tsk-3h4/tsk-6bx-1
  ran in parallel — without requiring any real-time write race on a
  truly shared file.
- `src/cli/command-registry.mjs:15-25` — the file's own doc comment
  defines `touchesState` (appends event / overwrites `.fgos/state.json`)
  and `externalEffect` (real effect outside `.fgos/`) precisely; applying
  that definition to what `docs-index` actually does (line 1309:
  `fs.writeFileSync(manifestPath, ...)` into `docs/`) settles D2 as fact,
  not judgment.
- `src/cli/command-registry.mjs:34-46` — `requiresExistingStore`
  criterion: "true only for a verb whose handler actually reads/writes
  through the CLI's own `dataDir()`". `docs-index`'s `listWork(dir)`
  meets this; it is currently `false` (line 659).
- `src/runner/main-checkout-lock.mjs:269-320` — `acquireMainCheckoutLock`
  is a single-shot ACQUIRED/HELD/AMBIGUOUS check with no wait/retry
  primitive anywhere in this codebase; adopting it for `docs-index` would
  convert today's silent-overwrite behavior into an outright failure
  (exit 7, same as `take`/`pick`) on a route that fires after every
  `fgos-coding-compounding` doc — the user flagged this as unwanted
  lock/bottleneck proliferation, which is why D3 rejects it.
- `bin/fgos.mjs:1283-1305` (`scanDirAsQuadrant`) — `docEntries` is
  appended in raw `fs.readdirSync` order with no sort anywhere downstream
  (`src/report/enduser-index.mjs` has no sort; only unrelated event-log
  timestamp sorts exist elsewhere in `bin/fgos.mjs`, lines 349/392/417).
  Non-deterministic directory-entry order is a second, independent
  source of spurious diffs even from a single session re-running
  identically, motivating D3's sort half.

## Pinned terms

- **"the shared main-checkout file"** — `docs/enduser-docs-index.json`
  as it exists at the true main-checkout root (`git rev-parse
  --path-format=absolute --git-common-dir | xargs dirname`), never a
  linked worktree's own copy of the same relative path.

## Scope

Fixes `docs-index` only. Scouted (`command grep -n "writeFileSync"
bin/fgos.mjs`) — it is the sole verb in the entry file performing a real
file write outside the standard event-log path; no other verb in the
current `read-only`-labeled set (`list`, `ready`, `graph`, `gate-bypass`,
`stale`, `conflicts`, `check`, `rollup`, `triage`, `doc-sources`,
`doctor`, `lock-status`) does a `fs.writeFileSync`. No generalization to
other verbs is in scope.

## Outstanding questions deferred to planning

None — every implementation-level "how" (exact guard shape, exact sort
key, exact SKILL.md wording) is `fgos-coding-planning`'s call, not locked here.
