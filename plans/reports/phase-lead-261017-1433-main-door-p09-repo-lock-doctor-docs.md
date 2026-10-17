# Main door P09 repo-lock part: doctor, fences, docs, changelog

Status: DONE_WITH_CONCERNS. Fence F10 honored: nothing of the state part (hot mutex, `stateTx`, `events.lock`/`claims.lock` merge, claim ceiling) is implemented, documented as done or registered; `merge=union`, `.gitattributes` and the `.fgos` strip rule untouched; no test or doc evidence relies on `events.jsonl`, shards, hot-lock or `stateTx`.

## Result
- Merged `main-door/integration` into the draft branch (conflicts in CHANGELOG, holder-lock spec, reading-map resolved by taking integration and re-adding only repo-lock text).
- Drafts verified against merged code and cut: `docs/specs/work-state.md` reverted to integration (it described the hot mutex); `runner.md` kept (hook borrower text matches `.githooks/pre-commit` and `repo-locks.mjs`), one `events.lock` mention restored; holder-lock spec §15 is now a "pending event store" placeholder, §17/§18 and history cut to main checkout, merge slot, `worktree-admin`, `fgos lock fence`; `component-boundary.md` no longer says the store owns a hot mutex; deleted the stale draft report that described it.
- `src/holder-lock/fences.mjs`: fences now also cover `main-checkout` (`.fgos/main-checkout.lock`) and `merge-slot` (one `merge-slot--<encodeURIComponent(ref)>.lock` per local branch, listed with `git for-each-ref refs/heads`, formula of the deleted `mergeSlotLockFile`). `state`/`porting-events` are excluded by name; `worktree-admin` has no fence. Tombstone `by` is `fgos 4.3` for these rows. New exports `fenceBy`, `isCutOverLock`, `MAIN_DOOR_LOCKS`.
- `src/setup/holder-lock-checks.mjs`: `lock-holders` enumerates main-checkout, merge-slot and worktree-admin files (a `FGOS_LOCK_FD=main-checkout:3` holder is a member, a foreign flock holder warns); `lock-fences` follows the registry. `src/setup/registrations.mjs`: hook-wired check text now says kernel lock, borrowed through the description. Skill rename and `unlock` removal were already done by P07.
- Docs: holder-lock spec, runner spec, distribution spec (rows 5g, 7), component-boundary, reading-map (`repo-locks.mjs` row; no `hot-lock.mjs` row), CHANGELOG (two `Changed` lines). `docs/io-contract.md` has no mention to change.
- `lock-record-unreadable` is not added: it only checks hot `state`/`porting-events` records (state part, on hold).

## Tests (env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID, FGOS_HOST_BIN = host built from this checkout in a private target)
- `test/holder-lock/*.test.mjs` + `test/setup/*.test.mjs`: 943 tests, 939 pass, 1 fail, 3 skipped. The one failure, `skill-wrappers` "projection tests ...", needs `.claude/skills/instruction-audit/SKILL.md`, a git-ignored generated file absent in every worktree here (integration has none either); not touched by this phase.
- New `test/holder-lock/fences-main-door.test.mjs` (5 tests) with real v1 code from the base commit: v1 `acquireMainCheckoutLock`, `inspectMainCheckoutLock`, `withMergeTargetSlot` (plain and encoded ref) all fail with `EISDIR` on the tombstones; the v1 pre-commit hook refuses a commit on main (EISDIR, no commit made); a live v1 lock file stops placement; a branch created later is reported missing then fenced.
- `fences-v1-tombstone.test.mjs` already took its v1 code from git history (base `a9e48b67d`), so the concern in the brief did not apply; it was only updated for the two new fenced rows. `holder-lock-checks.test.mjs`: 13 locks, 7 paths, plus a main-door `lock-holders` case.
- `fgos convention check --all` exit 0 (existing warnings only). `fgos doctor --json`: `lock-holders` covers 13 locks, hook-wired check shows new text.

## Impact
GitNexus index stale; grep cross-check: `fenceTargets`/`placeFences`/`fenceStatus` callers are `holder-lock-checks.mjs` and tests only; `cutOverLockFiles` only in `checkLockHolders`. LOW. No HIGH/CRITICAL.

## Concerns / decisions
- `adapters.mjs` still names `FGOS_MAIN_LOCK_HOLDER_PID` in the worker base-env drop list on purpose (a leaked stale value is removed); the plan's `rg` criterion 4 will find it there.
- Fences for `state`, `porting-events` and the claim ceiling wait for the event store decision; the registry rows stay as reserved places.
- Decision: spec §15 kept as a numbered placeholder so cross-references from reading-map and runner stay valid.
