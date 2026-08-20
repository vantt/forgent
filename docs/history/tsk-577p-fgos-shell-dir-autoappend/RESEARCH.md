# RESEARCH: tsk-577p — fgos() shell wrapper auto-append --dir

## Round 1 — 2026-08-20 (discovery stage)

**Asked:** Is the proposed fix (edit `scripts/fgos-shell-integration.sh`'s
`fgos()` to auto-append `--dir "$root"` when the caller omits it, then
flatten the ~21-file two-step call-site pattern in `.agents/skills/`, plus
document `scripts/write-wrapper-script.mjs`) clear enough to plan directly,
or does it need a person's judgment first?

**Checked:**

- `scripts/fgos-shell-integration.sh:57-87` (read in full). `fgos()`
  already resolves `root` itself via `git rev-parse --path-format=absolute
  --git-common-dir` + `dirname` (line 59/63), then calls `node
  "$root/bin/fgos.mjs" "$@"` (line 65) with NO `--dir` forwarded. Confirms
  the item's premise exactly: the wrapper already does the git-resolve
  work, it just never passes the result through as `--dir`.
- `docs/history/tsk-3k2-shell-fgos-function-inline-root-resolution/CONTEXT.md`
  (prior item touching this same function). D2 there inlined a private
  helper `_fgos_repo_root` into `fgos()`/`fgos-runner()` because Claude
  Code's shell-function-snapshotting drops underscore-prefixed helpers.
  Orthogonal fix, already landed (matches the inlined resolution seen in
  the current file read above) — no conflict with tsk-577p's proposal, and
  no re-litigation needed.
- `docs/history/fgos-worktree-state-write-guard/CONTEXT.md:10-12,86`
  — the actual text behind the item description's "D5 cấm CLI tự
  git-resolve ngược lên": `bin/fgos.mjs`'s CLI resolves `.fgos/` strictly
  under `process.cwd()` (`dataDir()`, D5) and never git-resolves upward
  itself. This constrains the **node CLI**, not the **bash wrapper**. The
  proposed fix keeps this intact: the shell function does its own
  git-resolve (as it already does today) and passes the result as an
  explicit `--dir` argv element — `bin/fgos.mjs` still receives an
  explicit flag, never re-derives anything on its own. No D5 violation.
- `scripts/write-wrapper-script.mjs` (read in full) — exists exactly as
  described: `writeWrapperScript({command, dir, name})` + a `runCli` using
  `parseArgs` for `--command`/`--dir`/`--name`, writes an executable `.sh`
  file, prints its path. `grep -rn "write-wrapper-script"
  .agents/skills/` → exactly ONE reference site
  (`_shared/executor-dispatch-fallback.md:127`), confirming the item's
  claim that it's effectively undiscoverable from the doc sites that
  actually hit the worktree-isolation guard friction.
- `grep -rl 'root=\$(git rev-parse --path-format=absolute
  --git-common-dir' .agents/skills/` → 22 files (item claimed "21 file" —
  off by one, immaterial; scope confirmed real and roughly the claimed
  size).
- `grep -rn 'fgos-runner\.mjs' .agents/skills/` → 0 hits. The friction is
  specific to `fgos.mjs`/`fgos()`; `fgos-runner()` is not exercised by any
  skill doc site, so it is out of scope by evidence, not by omission.
- No existing bash convention in this repo for "detect if caller already
  passed a given flag, to avoid overriding it" (searched `scripts/*.sh` —
  none besides this file). This is a normal, standard bash idiom (scan
  `"$@"` for `--dir`/`--dir=*`) — an implementation choice for planning,
  not a discovery-level gap.
- `test/scripts/fgos-shell-integration.test.mjs` already exists (9 tests
  per tsk-3k2's D3, sources the whole script) — the natural extension
  point for a new test asserting the auto-append/no-override behavior.
  `package.json:27` → `"test": "node --test 'test/**/*.test.mjs'"`, so a
  real, runnable, scoped verify command is `node --test
  test/scripts/fgos-shell-integration.test.mjs`.

**Found:** Proposal is fully grounded in real code, no unresolved
conflict with prior work, no rule violation, scope confirmed by direct
grep (not guessed), and a real verify command exists. Nothing left open.

**Still open:** Nothing that blocks planning. The "don't override an
explicit --dir" case flagged in the item's own description is a
verify/test-scope concern for planning/validating, not a discovery
ambiguity — it's already named plainly there and covered by the same test
file extension point noted above.
