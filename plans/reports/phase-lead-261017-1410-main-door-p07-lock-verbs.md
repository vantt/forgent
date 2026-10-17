# Main door P07, repo-lock part: lock verbs

Status: DONE_WITH_CONCERNS. Fence F10 honored: no state-part contract; lock core imports nothing about the event log; `merge=union`, `.gitattributes`, `.fgos` strip untouched.

## Result
- `fgos lock fence <name> [--param k=v]... [--yes] [--attest-stopped]` (`src/runner/lock-fence.mjs`): free (no lock file or no holder, probe free) -> exit 0; holders listed (pid, start time, cmdline); confirmation on a TTY, else refused unless `--yes`; SIGTERM by identity (pid + start time), 5 s, SIGKILL, 3 s, probe must say free. Never signals own pid chain (`lock-fence-self`); a held lock with no visible holder is refused; unlistable platform needs `--attest-stopped` (probe only). `--param` is repeatable (parseArgs `REPEATABLE_FLAGS`).
- `unlock` verb, registry row, `MUTATING_ONLY_VERBS` entry, route and `/fgOS:unlock` command skill removed; `lock` registered with a `fence` sub-verb (mutating predicate keeps the disconnected-worktree guard).
- `lock-status` (`src/runner/lock-status.mjs`): every repo/machine registry row as `free|held`, holders, guarantee; parametric rows (merge-slot, dispatch-cwd, provider-account) list existing lock files, read by holders; nothing is created. Top-level keys `mainCheckout`, `locks`, `beacon`.
- `main-checkout-reset`: all git work inside `withMainCheckout(scope,'reset',...)`; held -> `lock-timeout` (exit 7) naming lock and pid, nothing touched. Refuses at once (no wait flag).
- take/pick: `await` claimWork, `waitMs` passed from `withLockRetry`; `--no-wait` is one awaited try. Return's verify worktree add -> `addWorktree`.
- Skill `fgos-unlock` -> `fgos-lock-fence` (+ task spec, placeholder agent list, `CORE_TASK_SPECS` line in registrations.mjs, stale plugin mirror removed, `approve` skill row); `npm run build:skills` rendered. Routes, envelope vector, architecture manifest rows regenerated/added; CHANGELOG lines.
- Harness: stale import of the deleted lock module removed (`DEFAULT_TTL_MS`, `writeLiveLock`, `mainCheckoutLockPath` dropped from harness and 33 importers). `.fgos/locks/*` added to footprint noise paths (kernel lock files persist now; 3 return tests failed on it).

## Evidence
`FGOS_HOST_BIN` = phase-private build, `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`.
- Before (integration tip): claim-2, approve-6, merge, claim-port... cli files fail to load (`ERR_MODULE_NOT_FOUND main-checkout-lock.mjs` from harness).
- After, phase branch: `test/cli/*.test.mjs` + help/command-routes + envelope-contract + architecture: 1134 tests, 6 fail -> all 6 fixed (manifest rows x2, beacon path in a test, footprint noise x3), rerun green. Broad `test/{runner,state,direct,holder-lock,setup,workflow,skills}/**` + borrow-hook + help/command-routes: 5630 tests, 5614 pass, 0 fail, 6 skipped (stale-import failures of the 9 + 26 gone).
- Integration after merge (b0554763c): fence, claim, claim-2, approve-6, merge, flag-drift, architecture, help/command-routes, claim-port: 223/223.
- Plan tests: 1 fence main (pid listed, refused without --yes, --yes ends holder, lock free) + SIGKILL escalation; 4 reset while held; 5 `unlock` unknown verb + manifest; 3 lock-status lists rows (free/held, merge-slot instance). Test 2 skipped (state part).

## Skipped (F10)
- Fence of hot-mutex records (`state`, `porting-events`): unreadable-record cleanup under `reclaim` needs the hot lock, which is on hold. `lock fence state` works only as a generic kernel-holder fence.
- Reset in the state mutex; claim narrowing.

## Impact
GitNexus index stale and ambiguous across repos; `bin/fgos.mjs` has no indexed symbols (grep-confirmed). No indexed symbol edited. `rg "case 'unlock'|forceReclaimAmbiguousLock|inspectMainCheckoutLock" bin src`: empty.

## Concerns / decisions
- Removed `/fgOS:unlock` command skill (hand-written, called the dead verb); no `/fgOS:lock-fence` command added (YAGNI).
- Touched `registrations.mjs` one line (CORE_TASK_SPECS) since the renamed task spec would turn doctor red; the later docs/doctor phase should not re-edit it.
- `test/rust-host/fgctl-init*.test.mjs` still import the deleted module (owned by the fgctl phase).
- Unlistable-platform path (macOS) not testable here.
- No Opus review run; fence signalling covered by real-process tests.

## Unresolved
None.
