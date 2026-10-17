# Phase lead report: holder-lock doctor, setup, spec, changelog

Plan `plans/261016-1104-holder-lock-kernel-lock-foundation/plan.md`, phase file `phase-11-doctor-setup-spec-changelog.md`. Branch `holder-lock/p11-doctor-docs` (worktree `.claude/worktrees/hl-p11`), merged into `holder-lock/integration` at `a1d4559c2` (`--no-ff`).

## What landed

| Commit (phase branch) | Content |
|---|---|
| `0e377d7b6` (earlier draft) | holder-lock + process specs, component-boundary rows, reading-map, distribution/runner drafts |
| `30e3c0c2d` | merge of `holder-lock/integration` (P02–P10) into the draft branch |
| `137538ce6` | `src/setup/holder-lock-checks.mjs` (six checks, fixes `lock-dirs`, `lock-fences`), registration in `registrations.mjs`, config default `lock: {predecessorKillWaitMs: 2000}`, check `provider-capacity-lock-stale` + `inspectProviderCapacityLock` deleted (test moved to `lockHolders`), manifest row, `checks.test.mjs` id list, fixtures with `lock` key, `test/setup/holder-lock-checks.test.mjs` |
| `9a5cc2df7` | docs: holder-lock spec reconciled with P02–P10 code (§7 registry facts, §12 fence fix gate, §13 doctor table, §14 wedged holder, §15 history 2026-10-17), runner.md stale lock text (clear-cwd-lock, provider-state lock, sessions, runner, advance, RUL75 account lock, RUL86, RUL96, RUL101, 2026-10-15 ttl-writer note), distribution rows 5d/5g/7/7b + Setup, reading-map, doctor how-to rows, CHANGELOG |
| `08329077a` | review fixes M1/M3/L2 (below) |
| `f44512393` | runner.md: gloss every `RUL101` citation (citation-drift test) |

Doctor checks (`fgos doctor --json`, real run on main workspace with the phase host): `lock-kernel-semantics` pass (both mounts flock/kernel, probe green), `lock-borrow-vectors` pass (4 vectors + sibling, git 2.34.1), `lock-holders` pass (7 files of 10 locks), `lock-fences` warn (2253 legacy paths unfenced; expected before P12), `lock-predecessor-kill-wait` pass (2000 default), `state-root` pass.

## Decisions (Lead, inside the plan)

1. **Fence fix gated on the workspace's own activation.** `fgos setup` runs every registered fix (`bin/fgos.mjs`, not editable), and tests run setup with the real `$HOME`. An unguarded fix would fence the real `~/.fgos/runtime/provider-capacity` ledgers from any test or setup on a quiet workspace while all workspaces still run v1 code. The fix acts only when `.fgos/installation/activation.json` activates a release whose legacy-node payload ships `lock-registry.v1.json`. P12 order: activate all three workspaces, then `fgos doctor --fix`.
2. **Probe in Node.** No route exposes `semantics.rs`; the doctor probe reuses the `lock-fd` route (`--try`, then hand the fd to `sleep` at slot 3, `--shared-try` must be held, then free within 500 ms). Same algorithm as fgctl's.
3. **Lock dirs via a fix** (`lock-dirs`), since setup's only extension point is the fix registry; both dirs 0700, existing ones tightened.
4. **Deterministic messages**: no timings (dir-resolution compares doctor output across two runs).
5. **`lock-holders` classifier**: `FGOS_LOCK_FD=<lock>:` (borrowed), `FGOS_STATE_ROOT` pin (host-started), argv payload (`fgos`, `fgos-runner`, `fgos-gateway`, `bin/fgos.mjs`, `scripts/run-tests.mjs`). Predecessor records judged with the Node `judge`.
6. **kill-wait bounds** 1..60000; source reported project/global/default from raw config (not the merged one, so the source is known).
7. **CHANGELOG**: released history (old full-suite reclaim line under an older release) left untouched; the new Unreleased line supersedes it.
8. Out-of-list files edited because they had to change with the code: `src/runner/dispatch/provider-capacity.mjs` + its test (P09 handed `inspectProviderCapacityLock` deletion over), `test/setup/checks-doctor-config.test.mjs` (fixture of "every default key"), `docs/architecture-manifest.json`, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`.

## Review (code-reviewer, Sonnet)

Report `plans/reports/code-reviewer-261017-1029-holder-lock-p11-doctor-checks-review.md`. No Critical/High.
- M1 0700 not enforced on an existing dir → fixed (tighten; test).
- M2 machine-wide ledger fence behind a per-workspace gate → kept: A1 trade-off (old binaries fail loudly); spec §12 now says activate every workspace before any fix.
- M3 warning pointed at a fix that refuses under an old activation → fixed (warning names the activation wait; test).
- L2 state-root compared raw spellings → fixed (resolved paths).
- L1, L3–L7 accepted as noted in the review (L6: top-level unknown keys are not validated by the config loaders on main; not re-checked against every installed release).

GitNexus impact: `checkProviderCapacityLockStale` LOW (1 caller), `inspectProviderCapacityLock` LOW (1 caller + test); grep agrees.

## Tests

Host: phase-private `.fgos/runtime/tmp/cargo-p11` hardlinked from the P10 build (Rust unchanged since P09).

| Run | Result |
|---|---|
| `test/setup/holder-lock-checks.test.mjs` | 12/12 (kill-wait valid/negative/string/fraction/>60000/absent/unparseable; lock-dirs 0700 + tighten; semantics missing→warn, ext4 + tmpfs probe; vectors pass + win32 n/a; `flock -o` foreign holder warns, borrowed child does not; live/dead/unknown-version predecessor; fences missing → no activation refuses → v1 activation refuses → holder-lock activation places 5 → idempotent; running payload blocks with pid; state-root pinned + unpinned) |
| Negative control | borrowed rule disabled → lock-holders test red |
| Related, phase branch | setup/*, provider-capacity, architecture, fgos-setup, fgos-manifest, holder-lock/*: 1017 tests, 1014 pass, 0 fail, 3 skipped |
| Full `npm test`, phase branch | 7937 tests, 7847 pass, 2 fail, 13 skipped: release-tree R1&R2 (pre-existing misnamed 261008 report), citation-drift (my RUL101 citations, fixed, 31/31). S1 live probe passed |
| Integration `a1d4559c2` | same related set + citation-drift: 1048 tests, 1045 pass, 0 fail, 3 skipped |
| `fgos convention check` | 4 new files, 0 violations |

## Concerns / hand-offs (P12)

- Fence order: activate 4.2 in forgentX, mdview, mcp-skill-hub, stop every fgOS process, then `fgos doctor --fix` per workspace. The fix also runs inside `fgos setup`.
- release-tree R1&R2 still red until the misnamed 261008 reports are renamed.
- `docs/platform/README.md` portal lists neither session-identity nor the two new areas (pre-existing pattern; not changed).
- `bin/fgos.mjs:2660` stale comment (not editable).
- Review fixes landed after the full suite started; they were verified by the narrow and integration runs, not a second full suite.

## Unresolved questions

None.
