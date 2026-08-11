# pick/take repoRoot cwd fix — locked decisions

## Feature boundary

`fgos pick`/`fgos take` pass `repoRoot: process.cwd()` into `claimWork`
(`src/runner/claim-port.mjs`) instead of deriving `repoRoot` from the
already-resolved `--dir` value. When a claim-release + re-pick sequence
runs from inside the very worktree being torn down, git operations spawn
with `cwd` pointed at a directory `git worktree remove --force` (via
`reclaimOrphanedCheckout`) just deleted, surfacing as `spawnSync git
ENOENT`. Reproduced 2026-08-02 on tsk-2ie (session inside worktree A for
`fgw/tsk-2ie`; discover/decompose released the claim; `take` correctly
refused with "has own branch, use pick"; `pick` force-removed worktree A
via `reclaimOrphanedCheckout` while `repoRoot == process.cwd() == worktree
A's own path`, then failed re-adding it from the now-deleted cwd).

tsk-4m0's D1 auto-revert (`claim-port.mjs:256-264`) already saves the
CLAIM (uses `dir`, unaffected) so retrying from the main checkout works —
but tsk-4m0 explicitly scoped out fixing the ENOENT trigger itself.

Fix boundary locked this round: bin/fgos.mjs's `pick` and `take` CLI
handlers only — not `claimWork`'s own default parameter, not `return`'s
unrelated `process.cwd()` uses (return never calls
`reclaimOrphanedCheckout`/`createWorktree`, so it isn't hit by this
failure mode), not any other verb's `process.cwd()` use in the file.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix includes defense-in-depth: `reclaimOrphanedCheckout`/`createWorktree` in `src/runner/worktree.mjs` refuse instead of force-remove when `orphanPath` resolves to `repoRoot` itself, in addition to the minimal `repoRoot` derivation fix. |
| D2 | `pick`'s `worktreeDir` default (`bin/fgos.mjs`, currently `path.join(process.cwd(), '.claude', 'worktrees')` on the same `claimWork` call as the `repoRoot:` field) also derives from the same fixed `repoRoot` instead of `process.cwd()` — same claim door, same cwd-instability root cause, same call site. |

Both confirmed by user: "Fix trọn vẹn cả D1 và D2" (fix both fully).

## Pinned terms

- **repoRoot** — the stable main-checkout path a claim operation's git
  commands should run against; must equal `path.dirname(dir)` where `dir`
  is the `--dir`-resolved `.fgos` path, never the caller's possibly-doomed
  shell `process.cwd()`.
- **doomed cwd** — a shell `cwd` that points inside a worktree the current
  claim operation is about to (or just did) `git worktree remove --force`.

## Scout evidence

- `bin/fgos.mjs` `take` handler (current line 1722, filed as 1652):
  `claimWork(dir, { id, actor: role, isolate: false, repoRoot:
  process.cwd() })`.
- `bin/fgos.mjs` `pick` handler (current line 1785-1786, filed as 1715):
  `claimWork(dir, { id, actor: 'session', isolate: true, claimTrigger,
  repoRoot: process.cwd(), worktreeDir: path.join(process.cwd(),
  '.claude', 'worktrees') })`.
- Established correct pattern already exists elsewhere in the same file:
  `bin/fgos.mjs:1537` (`wiki` verb) — `const repoRoot =
  path.dirname(dir);` — and `src/intake/plan.mjs:438` — same pattern.
  `dataDir()`/`fgosDirFromRoot` (`bin/fgos.mjs:89-100`) confirms `dir ===
  <repoRoot>/.fgos` whenever `--dir` is passed; without `--dir`, `dir`
  resolves from `process.cwd()` too, so `path.dirname(dir)` is
  byte-identical to today's `process.cwd()` in the no-`--dir` case — the
  fix only changes behavior when `--dir` is explicitly passed (exactly the
  worktree-chaining scenario that needs it; `/fgOS:pick` and
  `fgos-coding-driving`'s claim hard rule both always pass `--dir`
  explicitly).
- `claimWork` (`src/runner/claim-port.mjs:88`) itself already documents
  `repoRoot` as defaulting to `process.cwd()` when the caller omits it —
  the bug is the CLI handlers passing that same doomed value explicitly
  rather than the caller's own responsibility to supply a stable one.
- `reclaimOrphanedCheckout`/`createWorktree` (`src/runner/worktree.mjs:192,
  282`) both take `repoRoot` as a parameter and call `git(repoRoot, [...])`
  with `cwd: repoRoot` — confirms the crash mechanism: once `repoRoot`
  itself no longer exists on disk, every subsequent `execFileSync` in the
  same call chain (including the re-add) spawns with a nonexistent `cwd`.
- Existing unit tests (`test/runner/claim-port.test.mjs`) already call
  `claimWork` directly with an explicit `repoRoot` param — they exercise
  `claimWork` correctly today and won't catch this bug, since the bug is
  entirely in which `repoRoot` value the CLI handler passes in. A
  regression test needs the CLI layer (`test/cli/fgos.test.mjs` already
  exists as that layer) — spawn `pick`/`take` with `--dir` pointed at a
  main checkout while `cwd` is set to a different (e.g. already-removed or
  simply different) directory, and confirm no ENOENT / correct repoRoot
  used. Left to `fgos-coding-planning` to shape the actual test.
- `fgos tool query --capability impact-analysis --status present` →
  `gitnexus` present. Posture: **impact-analysis: full** — GitNexus's
  MUST rules (impact analysis before editing `claimWork`,
  `reclaimOrphanedCheckout`, `createWorktree`, and the `pick`/`take`
  handlers; `detect_changes()` before commit) apply as written to whoever
  implements this.

## Canonical references

- `bin/fgos.mjs` (pick/take handlers, `dataDir`/`fgosDirFromRoot`, wiki
  verb's existing `repoRoot = path.dirname(dir)` pattern)
- `src/runner/claim-port.mjs` (`claimWork`)
- `src/runner/worktree.mjs` (`reclaimOrphanedCheckout`, `createWorktree`)
- `src/intake/plan.mjs:438` (sibling correct pattern)
- `test/runner/claim-port.test.mjs`, `test/cli/fgos.test.mjs` (existing
  test layers)

## Outstanding questions deferred to planning

- Exact shape of the CLI-layer regression test (how to simulate a doomed
  cwd deterministically without flaking on real `git worktree remove`
  timing).
- Exact wording/exit behavior of the D1 refuse-path in
  `reclaimOrphanedCheckout`/`createWorktree` (error message, whether it's
  a `StoreError` or a lower-level throw) — implementation detail, not a
  product decision.
