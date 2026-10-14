# Red team: `fgos run --account` and the partial-writes stop (feat/rununit-account)

Target: `git diff main...feat/rununit-account` (a1f69644e pin, dc22a2e51 partial-writes).
Attack harness: `/tmp/claude-1000/-home-vantt-projects-forgentX-worktrees-rununit-account/267c326d-814e-4b40-a522-5f1242e9240c/scratchpad/redteam/redteam-rununit-account.test.mjs`.
It reuses the bwrap fake-worker fixture from `run-provider-failover.test.mjs` and adds `x-<behaviour>` logins. Each one makes the worker change the worktree in some way and then exit on the codex usage-limit text.
Run it with `env -u CLAUDE_CODE_SESSION_ID node --test <file>`. It takes about 20 s. Of 24 tests, 17 pass and 7 fail. A failing test means the claim did not hold. The verify false-positive test is a HIT even though it was expected to pass.

## Verdict table

| # | Attack | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Pin a quarantined account | refused before unit run, message names until | the existing test covers it; confirmed | MISS |
| 1b | Pin `constructor` / `__proto__` / `toString` / `hasOwnProperty` | refused as `account-pin-unknown`, listing the real accounts | `resolveAccountPin` **accepts** them because of the prototype lookup on `accounts[accountId]`. The run is then refused only by chance, with a false message: "account "constructor" … is quarantined with no end time (cleared by hand)" | **HIT (low)** |
| 2 | Pin an account of another provider; pin plus an `--override executor` of another provider | refused before unit run | refused with `"a1" … providers.beta.accounts`; no unit run | MISS |
| 2b | `openai` executor with the inventory key `codex` | normalized, pin works | pass, leased `o2` | MISS |
| 3 | Pin plus failover (rotation, walk, in-dispatch `attemptProviderCapacityFallback`) | no other account or executor | `bound.account` stops the retry before rotation and before the walk. The in-dispatch fallback has nothing to walk to: unit-run assignments carry no `fallbackExecutors`, so `executorPreference` is `[primary]` | MISS |
| 4a | Resume while the pinned account is quarantined | refused | the existing test covers it; confirmed | MISS |
| 4b | Resume after the quarantine expired | dispatches again on the same account, no rotation | `account-pinned` again, no `-fb1` dir, both runs leased `spent1` | MISS |
| 4c | Does a resume drop the pin? | no | no. It reuses the recorded binding with `account`, and seats bound later read `unitRecord.overrides`. The CLI refuses `--account` together with `--resume` | MISS |
| 4d | Resume after a partial-writes stop, keeping the work | the resumed seat's own clean limit rotates or walks | **stopped again as `partial-writes` ("HEAD moved")**, judged against the old attempt's baseline | **HIT (medium)** |
| 5 | Delete / rename / write / pre-dirty file touched again | stop | stop (existing tests) | MISS |
| 5a | chmod of a tracked file | stop | stop (`README.md`) | MISS |
| 5b | `git add` / `git commit` / `update-index --skip-worktree` / `--assume-unchanged` / `info/exclude` | stop | the worker gets `index.lock: Read-only file system` because the gitdir is RO in bwrap. Its file writes were still caught | MISS (confinement blocks it) |
| 5c | New file inside an untracked dir that already existed | stop | stop (`--untracked-files=all`) | MISS |
| 5d | Write into a **gitignored** path (`build/out.txt`) | stop | rotated, then pass | **HIT (low; documented in code)** |
| 5e | Write into `<worktree>/.fgos/` | stop | rotated, then pass. The worker *can* write there, and `inStore` filters it out | **HIT (low-medium)** |
| 5f | Change inside an untracked **nested git repo** (`vendor/` with its own `.git`) | stop | rotated, then pass. git lists `vendor/` as one entry and `contentOf` hashes only `type:dir`, which stays the same. Dirty submodules are blind too (`--ignore-submodules=dirty`) | **HIT (low-medium)** |
| 5g | chmod-only change on a file that was already dirty | stop | rotated (only the content is hashed, not the mode) | HIT (negligible) |
| 5h | Empty dir; a file written and then restored | (nothing observable) | rotated | MISS (harmless) |
| 6 | Limit on the read-only reviewer of a mutating unit | rotates | rotates (existing test, confirmed) | MISS |
| 6b | Same, with a capability `verify` command that writes a file | rotates | **stopped as `partial-writes` (`verify-out.txt`); the unit ends `provider-limit`** | **HIT (medium), false positive** |
| 7 | Pin scoped to a role that does not exist | refused | "applies to no seat"; no unit run | MISS |
| 7b | Two scoped overrides with different accounts per role | each seat on its own account | producer `a2`, reviewer `b2`, pass | MISS |
| 7c | Unscoped `--account` on a `reviewed` (or panel) unit | (the CLI help says "every seat") | the whole run is refused: the reviewer must be another family, which has no such account | Concern (design) |

## HITs in detail

### H1 (medium): false positive on a read-only seat from the concurrent `verify` command
`run.mjs` takes `writeBaseline` whenever `writeScope.length > 0`, which is decided per unit, not per seat. So a **read-only** checker of a writing unit also gets the partial-writes check. In `patterns/reviewed.mjs`, the checkers and `verify` run together (`Promise.allSettled`). `verify` is an `execSync` in the worktree. It runs after the checker's baseline is taken and while the checker is still running. Any verify command that touches a non-ignored path then makes the reviewer's provider limit look like partial writes. Examples: a lockfile, a snapshot, emitted code, a report file. The seat is not rotated and the whole unit settles as `provider-limit`.
- Repro: test `ATTACK read-only reviewer of a writing unit is stopped as partial-writes because verify wrote a file`. It sets capability `verify: 'echo built > verify-out.txt'`, uses pattern `reviewed`, and gives the reviewer logins `{q2: quota, live2: live}`. Result: `reviewer=[["beta","provider-limit",{"reason":"partial-writes","paths":["verify-out.txt"]}]]`, outcome `provider-limit`.
- The same mechanism means that any writer outside the seat counts as the seat's own work. A read-only seat cannot write, so for a read-only seat every detected change is a false positive.
- Fix direction: take the baseline only when `!readOnly`.

### H2 (medium): resuming after a partial-writes stop keeps a stale baseline
The stop message says "keep, finish or undo the changes, then resume". On resume, `runRole` reuses the last attempt slot (`attemptNo = recorded.length - 1`). `writeBaseline` is set only once (`!attempts[attemptNo].writeBaseline`), so the resumed seat is compared with the worktree **as it was before the first launch**. If the person keeps or finishes the work, whether committed (HEAD moves) or left dirty (paths differ), every later provider limit of the resumed seat is stopped as `partial-writes`, even when the resumed worker wrote nothing. Only "undo" gets rotation back.
- Repro: test `ATTACK resume after a partial-writes stop…`. The first run stops (`partial1`). The person commits the half-done work and resumes. The resumed seat leases `q1`, which writes nothing and hits the limit. Result: `partial-writes … (HEAD moved)`.
- Fix direction: take a new baseline whenever an attempt is relaunched, for example by clearing `writeBaseline` when `retryStopped` is set or on resume.

### H3 (low-medium): blind spots in the worktree snapshot
- `<worktree>/.fgos/**` is excluded (`inStore`), but in a linked worktree that directory is ordinary content: 102 tracked files in this repo, for example `.fgos/config.json` and `events.jsonl`. The bwrap worker could write to it, so a half-edit there is rerun over.
- Untracked nested repos and dirty submodules: the change cannot be seen (5f).
- Gitignored paths: cannot be seen. The code says so, but neither the claim nor the stop message mentions it.
- Mode-only change on a file that was already dirty: cannot be seen (negligible).

### H4 (low): prototype keys accepted as account ids
`resolveAccountPin` checks `!accounts[accountId]` on a plain `{}` built by `validateProviderAccountInventory`. Because of that, `constructor`, `__proto__`, `toString` and `hasOwnProperty` resolve as known accounts. Today no run starts, but only because `inspectProviderCapacity` happens to report them as not healthy, so the person is told the account is "quarantined with no end time (cleared by hand)". The real reason is that the account does not exist. `configPinnedToAccount` has the same lookup (`entry.accounts[accountId]`).
- Repro: `node -e` calling `resolveAccountPin(cfg, {accountId:'constructor', …})` returns `{"provider":"alpha","id":"constructor"}`; also the tests `ATTACK pin odd id …`.
- Fix direction: use `Object.hasOwn(accounts, accountId)`, and validate the id against the same safe-key regex `validateAccountId` uses.

## Concerns (not defects against the stated claim)
- **C1: an unscoped `--account` cannot be used with `reviewed` or `panel`.** Independence pushes the checker or panelists onto other families, and those have no such account, so the pre-run check refuses the whole run. `fgos run --help` says "Pin the provider account every seat runs on". In practice it only works for solo, or through a hand-written scoped `--override`. Options: apply the CLI `--account` only to the seats whose provider lists it, or say in the help that it pins the producer.
- **C2: the bind picks the executor before checking the pin.** If the capability's first candidate is another provider, the run is refused even though a later candidate in the pool owns the account. This is consistent with the claim but surprising.
- **C3: resume checks only seats that already have an attempt.** A pinned seat that was not yet bound when the run died is not refused before dispatch if its account is quarantined. The lease still refuses it at dispatch, but without the pre-run "until" message. Not tested.
- **C4: untested.** Real executors (claude/codex CLIs) or the herdr transport may write files into the worktree during a launch, for example trust or settings files. That would cause the same false positive as H1 for any seat. The fake worker cannot show it.

## Verified as safe (evidence)
- In-dispatch fallback (`assignment-runner.mjs` `attemptProviderCapacityFallback`): `executorList = [primary, ...fallbackExecutors]`, and unit-run assignments never set `fallbackExecutors`. A pinned lease refusal therefore cannot be turned into another executor there.
- The worker cannot move HEAD or touch the index or `info/exclude` (gitdir is RO in bwrap), so the skip-worktree and assume-unchanged tricks to hide writes fail.

Status: DONE_WITH_CONCERNS
Summary: The pin holds against every bypass attempt (quarantine, cross-provider, failover, resume). The partial-writes stop has two medium HITs: a false positive on read-only reviewers when the concurrent `verify` command writes the worktree, and a stale baseline after a "keep and resume" that blocks rotation for good. There are also low-severity blind spots (`.fgos/` in a worktree, nested repos, gitignored paths) and prototype-key account ids that are refused with a false "quarantined" message.
