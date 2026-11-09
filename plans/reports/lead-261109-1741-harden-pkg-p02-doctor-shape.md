# Lead report: packaging P02, doctor result shape

Branch `harden/pkg-p02-doctor-shape`, from origin/main `308c314a0`. Status: DONE.

## What changed
- `runDoctor(repoRoot, { fix })` in `src/setup/registrations.mjs` (re-exported by `checks.mjs`) builds `{ ok, next, fixed?, checks }`. The `doctor` arm in `bin/fgos.mjs` is now one call; `--strict` reads `!data.ok`; `--pretty` ends with the `Next:` commands.
- Per row: `status` (`ok|warn|fail|skip`) and, on a failing row, `fix` (command or null). `passed` stays and is false exactly when status is `fail`. `next[]` is the failing rows' fix commands, once each, in registry order. Exit code unchanged (0; Q-B).
- `registerFix({ id, fix, repairs })`: `repairs` names rows whose id differs from the fix id. Set for the Git WAL fix, the fetch-mapping fix, and every config fix (from the contract's row to fix map in `config-checks.mjs`).
- Git: `git-repository-config` skips with `git remote add origin <url> && fgos doctor --fix` when no remote exists (other conditions still judged); the fetch-mapping fix repairs nothing and says so; `describeGitError` decodes the port error (cause plus stderr text) where `attemptFix` and the row catch built the number array.
- Ten rows that skipped now say `status: 'skip'`; eight `tsk-*` ids left row descriptions.
- Contract doc and CHANGELOG updated.

## Decisions and deviations
- `warning:` prefix is read centrally in one function (the convention every row module documents), not rewritten in ~60 row sites across 12 files; rows keep their text and every condition. Only the rows I touched set `status` themselves. Prefix words stayed in messages.
- A row result names its own command `fixCommand`; the report calls it `fix`. Reason: the one-door scanner follows the property name `fix` (registered fix functions) and flagged any read of `result.fix`.
- Rows with `fix: null` (need a person), seen on a scratch HOME: `executor-skills-installed`, `omp-natives-present` (P01 rows, left alone), `trust-store-readable`, `confined-pane-accounts`, `agent-cli-project-trusted`. Each message states the user action; none has a runnable command, and making them `skip` would drop a condition. After `doctor --fix` the scratch run still has `ok: false`, `next: ['fgos doctor --fix']` only because the hook rows report `shim-missing` in an un-activated project; an activated project (`fgctl init`) not run here.
- Git WAL and fetch-mapping fixes hit `git-fence-missing` in un-activated projects (message now readable); the fence is placed by `fgctl init`.

## Proof
- Red first: new tests in `test/setup/registrations.test.mjs` (envelope, fix then judge), `test/setup/git-checks.test.mjs` (decode, skip without remote, fix without remote), `test/setup/doctor-strict-exit.test.mjs` (CLI wiring). Seen failing, then green. No test retired.
- Focused plus `test/setup/*`, architecture, doc-health, citation drift, one-door scan (0 unresolved, census regenerated): green. Full `npm test`: 8582 pass, 1 fail (the known V7n addendum); one `fgos-tp-*` leak ERROR whose directory was gone on inspection and that my three files do not reproduce (another lead's run shares `/tmp`).
- Net: Node about +110 in src, tests about +105, doc +7.

## Lessons
- The one-door scanner conflates property names across modules; naming a new field after a registered function key (`fix`) cost three attempts before the cause was clear. Search the scanner's output location first, then rename.
- A scratch HOME without activation is not a converged project; the plan's "scratch HOME loop" needs `fgctl init` first (P06 acceptance).
