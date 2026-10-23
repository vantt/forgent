# Code review: Agent Mailbox rung V5, the native `fgos hook mailbox` door

Reviewer: code-reviewer (independent, read-only). Date: 2026-10-23 (Asia/Saigon).
Branch `mailbox/v1-v3` at `3c6207771`. Changes reviewed: `git diff --first-parent 15fa93992 3c6207771`, which covers the V5 commits `ecdb84f3d` to `a96f11da5`. Merge noise from main was excluded.

## Scope and method

- **Files read:**
  - `apps/fgos/src/main.rs` and `wiring/mailbox_{hook,root,verbs}.rs`;
  - in `packages/mailbox/rust/store/src`: `hook/{shell,breaker,resolve}.rs`, `head.rs`, `ancestry.rs`, `adapters/{codex_head,claude_head,version}.rs`, `limits.rs`;
  - `packages/git/rust/src/driver.rs` (`main_checkout_root`);
  - `packages/distribution/rust/src/shim.rs`;
  - `src/setup/{agent-hooks,mailbox-limits,registrations}.mjs` and `bin/fgos.mjs` `handleHook`;
  - the route contracts and the catalog;
  - spec §6–§8, §14 (V5 row) and §16; the closing report, both research reports, and the V4 review.
- **Build location:** a scratch export (`git archive 3c6207771`) under `/tmp/fgos-work/v5rev`, built with `CARGO_TARGET_DIR=/tmp/fgos-work/v5build`, `CARGO_BUILD_JOBS=4` and `--test-threads=4`. At least 21 GB was available throughout.
- **What I ran:**
  - `cargo test -p fgos-mailbox -p fgos-distribution -p fgos-identity`: all green. The one exception is `test_resolve_workspace_root_in_current_repo`, which needs a real repository and is an environmental failure of the scratch copy.
  - `cargo test -p fgos --test mailbox_routes`: 10 of 10 pass.
  - `node --test test/setup/agent-hooks.test.mjs`: 20 of 20 pass.
  - `test/setup/registrations.test.mjs`: both mailbox tests pass. Six other tests fail because the scratch copy has no `FGOS_HOST_BIN`; that is environmental and unrelated to V5.
- **Probes against the built host binary:**
  - the hook with usage errors, a bad config, `budgetMs: 0`, broken JSON, a 3 MB stdin and an empty stdin;
  - the verbs from linked worktrees (absolute links, relative links, a symlinked parent) and from a submodule.
- **Shim:** I ran a differential test of the old and new `sh` shim bodies, regenerated from both commits. It covered 4 shells (dash, bash --posix, busybox sh, zsh in sh emulation), 9 directory names (space, quote, `$`, glob characters, a leading dash, backslash, tab, and others) and 10 shapes of activation file: 360 cases in all.
- **Mutations:** 10 hand mutants in the scratch copy. 9 were killed and 1 survived (see Quality).
- **Nothing touched outside the scratch copy:** no real CLI, no live suite, no herdr pane, no activation or real shim, and no edit or commit in the repository.

## Overall assessment

The Rust half of V5 is solid:

- the native hook branch is straight-line and quiet;
- the caller check is driven by the contract, and the mutations confirm the tests pin it;
- the breaker refuses an opening time planted in the future;
- the limits loader is real;
- `main_checkout_root` is disk-only;
- the shim rewrite behaves exactly like the old shim on every realistic input.

The defects are in the Node install half and at the edges of the rollout:

- One commit pasted an `import` into the generated OMP/Pi extension source, which breaks the existing guards of those two CLIs. This is a regression in hook kinds that already worked.
- The installer writes the mailbox rows unconditionally. That contradicts the owner's default for spec §16 question 2, and it makes Codex print an error on every tool call on any machine whose release predates V5.
- Several promised observability items regressed to silent.

## Critical

None.

## High

### H1. The generated OMP and Pi extensions import a file that does not exist, so both CLIs lose their dispatch-decide and decision-question guards (regression)

- **Location:** `src/setup/agent-hooks.mjs:307`, inside the template string of `generateInProcessExtensionSource()`. The same line is also, correctly, at `:18`. Introduced by `4bc78a9d2`: the diff adds `import { mailboxHookTimeoutSec } from './mailbox-limits.mjs';` twice, once after each `import { spawnSync } from 'node:child_process';`.
- **Status:** CONFIRMED. I called `installOmpHook(<scratch dir>)` and the written `.omp/extensions/fgos-hooks.ts` contains the line `import { mailboxHookTimeoutSec } from './mailbox-limits.mjs';`. No `.omp/extensions/mailbox-limits.mjs` exists, and nothing ever writes one.
- **Failure scenario:**
  1. `fgos setup` or `fgos doctor --fix` runs `installAllAgentHooks`, which always rewrites both extension files.
  2. On its next start, OMP or Pi loads `fgos-hooks.ts`. The static import fails to resolve (`ERR_MODULE_NOT_FOUND` or the loader's equivalent).
  3. The extension does not load. The `task` dispatch guard and the `ask` decision guard stop running in OMP and Pi, so either they are silently fail-open or the extension load error surfaces at startup.
  4. `checkOmpHook` and `checkPiHook` still pass, because they only check that the text contains `dispatch-decide` and `decision-question`.
- **Why no test caught it:** `agent-hooks.test.mjs` "mailbox rows install … none for agy, omp or pi" checks for the absence of a mailbox row, not that the generated source is valid.
- **Fix:**
  - Delete line 307.
  - Make the owning OMP/Pi test assert that the generated source imports only `node:` builtins. Better still, import the written file through a TypeScript-stripping loader, or parse its import specifiers.
  - Make `checkOmpHook` and `checkPiHook` compare the file against `generateInProcessExtensionSource()` byte for byte, which is the same rule `check_workspace_shims` uses, so doctor fails on drift.

### H2. The installer writes the mailbox rows unconditionally, before the owner's install decision and before every machine has the native kind; on an older release Codex shows an error on every tool call and every Stop

- **Location:** `src/setup/agent-hooks.mjs:115-124` (the rows) and `installRows`. Spec §16 item 23 and the closing report's "Owner questions 2": default (a) is "at merge, after every machine has a release with the native kind".
- **Status:** CONFIRMED that the rows are unconditional: nothing gates them on the activated release or on a config flag. The Codex symptom is PLAUSIBLE, because I did not run a real Codex. It follows from the code:
  - On a pre-V5 release, `fgos hook mailbox` reaches the old `handleHook`, which writes `Error: Unknown hook kind "mailbox"` to stderr and exits 1. That is the current `bin/fgos.mjs` before this change, and pre-V5 Rust hosts route every `hook` to legacy.
  - The Codex rows are the plain shim form, which has no `|| true` (`:120-124`; this was a deliberate choice to keep the `direct` topology).
  - Claude Code is safe in the same situation, because its guarded command ends in `|| true`.
- **Failure scenario:**
  1. The lane merges.
  2. A user on a machine still activated on an older release runs `fgos setup` from a newer global `fgos`, or a teammate pulls a tracked `.codex/hooks.json`.
  3. Every Codex tool call and every Stop then reports a failed hook. The same happens when the activation is missing or not ready, because the shim exits 3 with stderr; the code comment at `:121-122` admits this.
- **Fix:** make installing the mailbox rows an explicit decision.
  - Either gate `rowsOf` for `kind === mailbox` on a capability probe of the activated release (`fgos hook mailbox` exits 0 with empty stdout, which `isShimRunnable` already knows how to run),
  - or gate it on a `mailbox.install` config key that is false until the owner answers item 23.
  - Until then, the doctor check must not demand the rows: today `checkRows` reports them as "missing canonical hooks" and fails every existing project's doctor.

## Medium

### M1. `fgos setup` writes every contract default into the project config, and the loader then reads those copies as overrides, so later contract tuning never reaches a project that has run setup

- **Location:** `src/setup/registrations.mjs:2360-2371` (`registerConfigDefault` with `mailboxConfigShape()`) and `packages/mailbox/rust/store/src/limits.rs` `load`, where any key present in the section is inserted as an override.
- **Status:** CONFIRMED by reading. `ensureSharedConfigDefaults` fills every missing key with the contract default and writes the tracked `.fgos/config.json`, and `load` cannot tell a copied default from a deliberate override.
- **Failure scenario:**
  1. The contract's values are, in the registration's own words, "unmeasured placeholders". V5 already re-tuned one bound, 4,608 to 8,192, in `adapters.v1.json`.
  2. When a later rung corrects `budgetMs`, `lockWaitMs`, `queue.cap` or `breaker.*` in `limits.v1.json`, every project that ran setup keeps the old value forever, and its tracked config makes that look like a deliberate project choice.
  3. The comment "a value here matters only when someone changes it" is false once setup has written it.
- **Fix:** do not register the mailbox section's values as config defaults. Either:
  - register nothing and document the keys (the loader already falls back to the contract), or
  - register an empty `mailbox: {}` with the comment pointing at `limits.v1.json`.

  Under RUL104 this is smaller, not bigger. The doctor "config not stale" check stays green either way.

### M2. A linked worktree whose back-link git wrote as a relative path is refused, so the mailbox is silently off there and the verbs say "try once more later" for a permanent condition

- **Location:** `packages/git/rust/src/driver.rs:1580` (`Path::new(line(&backlink)?) != main.join(".git")`); the error text comes from `record_error_text`.
- **Status:** CONFIRMED with git 2.53.0 and the built host:
  - `git -c worktree.useRelativePaths=true worktree add ../wtrel`, then `fgos mailbox inbox` from inside it, prints `Not done: the mailbox record failed (repository-unreadable) … Try once more later; do not loop.` and exits 1.
  - The same command in an absolute-path worktree exits 0.
  - A worktree under a symlinked parent works.
  - From inside a submodule the command also prints `repository-unreadable`.
- **Why it matters:**
  - `worktree.useRelativePaths` (git 2.48 and later) can be set globally.
  - fgOS leans on linked worktrees: `fgos run --worktree` and the parallel lanes.
  - The hook's answer is quiet, so a session in such a worktree never gets mail and nothing says why.
  - The refusal predates V5 in `resolve_topology`, but V5 puts it on the hook's path.
- **Fix:**
  - Resolve a relative back-link against the admin directory before comparing, which is how git reads it, and compare canonicalized paths.
  - Map `untrusted-worktree` and `trusted-main-gitfile-unsupported` to a permanent-error text, not "try once more".
  - Add a relative-path case and a submodule case to `inspect.rs`.
  - The Git lane owns `driver.rs`, so file an item for it if the mailbox lane does not take this.

### M3. V4's M6 ("a quiet reason that `last_drain_at` or `status` can see") is recorded as closed, but the product entry logs nothing, so over-cap payloads and every other quiet reason are invisible

- **Location:**
  - `apps/fgos/src/wiring/mailbox_hook.rs:1-14` ("no log line") and `:117-121`, where `shell::run`'s `ShellOutcome` is dropped;
  - `packages/mailbox/rust/store/src/hook/shell.rs:211` (`Quiet::OverReadCap`);
  - spec §6.1: "over the cap the drain is skipped with the shell's own quiet reason `OverReadCap`, which the entry logs".
- **Status:** CONFIRMED. The V4 test entry logged; the V5 host entry throws the outcome away. Phase 1 closed M6 by citing a test of the shell's return value. The "largest `PostToolUse` payload" that the spec's §14 V5 row hands over was not measured in either research report.
- **Failure scenario:**
  - A heavy step (a large `Read` or `Write`) skips the drain.
  - So do a breaker that opened, a `finish` that failed (its warnings are dropped too), and a `NotTheHead` refusal on a `/bin/sh` user.
  - None of these leaves a trace for `status` (V7) or for an operator. The spec says the opposite.
- **Fix:** take the smallest honest option.
  - Either correct the spec and the phase note to say the host entry records nothing, and reopen M6 for V7's `status`,
  - or append one bounded line per non-benign outcome to a capped file under `runtime/mailbox/`, as the breaker already does without the lock.

  Do not count M6 as closed.

### M4. No `CHANGELOG.md` line, although V5 adds user-visible verbs, installs new hooks into user hook files, and changes every workspace shim

- **Location:** `CHANGELOG.md`, which is unchanged on the branch's first parent. The closing report defers the line to V7.
- **Status:** CONFIRMED.
- **Why it matters:** the AGENTS.md install gate requires an `[Unreleased]` line for anything a user would see. `fgos mailbox send|inbox`, the new `Stop` and `PostToolUse` rows, and the doctor result "workspace shim differs; run fgctl repair" on the first activation are all user-visible. This blocks a merge to main; it does not block the rung.
- **Fix:** add the line before the merge.

## Low

### L1. A panic before `shell::run` exits with status 101, not 0

- **Location:** `apps/fgos/src/wiring/mailbox_hook.rs:27-31, 63-116`. Only `shell::run` wraps its work in `catch_unwind`, and `silence_panics` silences the output but does not change the exit code.
- **Status:** PLAUSIBLE. I found no reachable panic in the git read, the loader or `HookEnv::from_process`.
- **Impact:** status 101 is not 2, so Claude's Stop is not blocked, but it breaks the "exit 0 on every path" rule.
- **Fix:** make the entry's panic hook call `std::process::exit(0)`, or wrap `run` in `catch_unwind`.

### L2. The hook start directory honours `CLAUDE_PROJECT_DIR` for Codex as well

- **Location:** `mailbox_root.rs`, called from `mailbox_hook.rs:73-76` for both adapters.
- **Status:** PLAUSIBLE. A Codex session launched from a shell or pane that carries a stale `CLAUDE_PROJECT_DIR` (exported by the user, or by an fgOS pane launcher) would register in, and drain from, another project's record.
- **Fix:** read the variable only when `adapter == Claude`.

### L3. `hookFacts.measuredOn.platform` is parsed and ignored

- **Location:** `adapters/mod.rs:149` (`_platform`).
- **Status:** PLAUSIBLE. On macOS, `/bin/sh` is a launcher that execs bash or zsh, so `canonicalize("/bin/sh") != exe` and the Claude caller check would always refuse. The mailbox would then be off, quietly.
- **Fix:** treat facts measured on another platform as untested (`QuietReason::Untested`), and say so in the spec's residuals, so this is a stated limit and not a silent one.

### L4. The Codex writer key is taken from the payload, and the guard is weaker than its name suggests

- **What happens:** a Codex tool process sits directly under `codex` and passes the position check. It can run `env -u CODEX_THREAD_ID fgos hook mailbox --cli codex …` and pipe any `session_id`, which bypasses `WriterMismatch`.
- **Assessment:**
  - It cannot steal a live binding: `registry.rs:176` refuses with `Conflict`.
  - A dead session's binding gets a new generation, and old mail is not replayed.
  - The spec states that same-user processes are outside the guard (owner decision), and the guard is correct within that model.
  - The same goes for Claude via `exec /bin/sh -c '…; :'` from a tool. That defeats the hop check, but the session file still binds the writer to the head pid.
  - Another user's process cannot read `/proc/<pid>/exe` and gets `WrongExecutable`.
- **Recommendation:** no change. The spec's §6.1 sentence should name the `env -u` case explicitly.

### L5. `fgctl` rewrites a shim that is now executed on every tool call, and it rewrites it in place rather than atomically

- **Location:** `packages/distribution/rust/src/shim.rs:183` (`std::fs::write`).
- **Status:** PLAUSIBLE but low. The script is about 1.5 KB and shells read it in one buffer. The test changes in `72042d720` show `ETXTBSY` races were seen.
- **Fix:** write to a temporary file and rename it over the shim, as `fgos_durable_file::replace_durably` does. The Distribution lane owns this.

### L6. Smaller items

- **L6a.**
  - **Location:** `command-routes.json` `subcommand_flags.send`.
  - **Problem:** the list includes `body`, which is a positional. The host's flag gate accepts `--body`, and the provider then rejects it with exit 4.
  - **Fix:** drop positionals when exporting the flags.
- **L6b.**
  - **Location:** `mailbox_hook.rs` `parse`.
  - **Problem:** the `cli.is_none()` duplicate guard has no test (the mutant survived). The effect is harmless, since it still exits 0.
  - **Fix:** add the case to `every_hook_mailbox_usage_error_exits_0…`.
- **L6c.**
  - **Location:** `breaker.rs` `after`.
  - **Problem:** any benign quiet resets the failure count. So the doctor probe, which runs `{}` and gets `NoHead`, writes a reset when the stored count is above 0. That makes the probe "read-only except for clearing the breaker", and interleaved foreign calls keep the breaker from ever opening.
  - **Fix:** reset only after a call that reached the record.

## Answers to the eight focus questions

### 1. Exit 0 and quiet failure

Paths verified with the built binary:

| Path | Result |
|---|---|
| Unknown or duplicate flags, missing values, extra arguments | exit 0, empty stdout and stderr |
| Bad config type, `budgetMs: 0`, broken JSON | exit 0 |
| A 3 MB stdin, an empty stdin | exit 0 |
| No `HOME`, outside a repository, no `.fgos` | exit 0 (owned by `mailbox_routes.rs`) |
| Breaker open, lock busy, panic inside the shell | quiet (owned by `hook_shell.rs`) |
| `--help` or `-h` | goes to legacy, whose `handleHook` exits 0 for `mailbox` |

Remaining gaps:

- a pre-shell panic exits 101 (L1);
- the shim exits 3 on a missing or not-ready activation, which Claude swallows through `|| true` and Codex shows (H2);
- an older release exits 1 with stderr, swallowed by Claude and shown by Codex (H2).

No path returns 2.

### 2. Routing

- `native_kind` is consulted only for routes that declare `native_kinds`; only `hook` does, and only for `mailbox`. The route test pins this.
- `other_hook_kinds_still_reach_the_legacy_payload` passes, and the mutant that sends help down the native path is killed.
- The catalog count went from 9 to 12, and the version envelope vector was updated.
- The existing hook kinds still reach legacy.
- The one real regression is H1, in the OMP and Pi installer, not in routing.

### 3. Caller check and writer key

- The argv0 and exe checks against the contract's `hookShell` are pinned: both mutants are killed.
- A symlink named `sh` elsewhere fails the argv0 check.
- `exec -a /bin/sh` or `exec /bin/sh -c` from a tool passes, inside the stated same-user residual.
- The Codex `WriterMismatch` guard is pinned (mutant killed) but can be bypassed with `env -u` (L4).
- Binding theft from a live head is refused.
- Another user's process gets `WrongExecutable`.
- Runner heads are pinned (mutant killed).

### 4. Installer

- It does not delete user hooks: it only splices or replaces objects that `isOwnedHook` matches, which is an anchored regex on the shim prefix.
- It is idempotent; tested, and confirmed by reading `installNestedRow`.
- One edge: pre-existing duplicate owned entries are only partly normalised, so a duplicate row can remain. This is minor.
- The tracked `.claude/settings.json` is not modified on the branch. The installer rewrites it with `JSON.stringify(…, 2)`, which normalises formatting, as it did before V5.
- Codex `hooks.json` is handled.
- The doctor probe writes nothing except a possible breaker reset (L6c).
- Two problems remain: H1 (OMP and Pi broken) and H2 (installation not gated).

### 5. Shim

- Of the 360 differential cases, the old and new shims behaved identically on everything except paths containing a raw carriage return. Those cases are not reachable through valid JSON, and the remaining harness noise was checked by hand: the new shim drops an inner CR, as its doc says.
- There is no eval and every expansion is quoted, so it introduces no injection.
- `set -eu` is safe: `value` is only called in `if` conditions, and every variable is initialised.
- A missing activation still exits 3 with the same messages.
- After activation, `check_workspace_shims` reports drift until `fgctl repair` runs, which the closing report states. It needs DIST review (L5).

### 6. `main_checkout_root`

- It is disk-only: `canonicalize` and `read` only, no process and no write, and its test asserts the tree is unchanged.
- It is correct for the main checkout, a subdirectory, absolute linked worktrees and a symlinked parent.
- It refuses relative back-links and submodules (M2).
- A separate git dir (`--separate-git-dir`) is refused as `trusted-main-gitfile-unsupported`.
- Bare repositories return the bare directory, which has no `.fgos`, so the result is quiet.
- From inside `.git/`, it returns the `.git` directory itself, which also has no `.fgos`, so the result is quiet.
- `GIT_*` variables are ignored.

### 7. Breaker and limits

- A future planted time beyond 5 s is ignored (mutant killed).
- A planted time within 5 s gives at most a pause of `pauseSec` plus 5 s.
- Large values in the tracked config can keep the mailbox paused or off (`pauseSec`, `budgetMs: 0`). That is accepted by design, because tracked config is trusted.
- A bad config is quiet and does not trip the breaker.
- Invented numbers: none found. Each key cites spec §12, an owner decision, or the repository's 1 MiB bounds. `CODEX_VERSION_TIMEOUT` of 2 s cites plan decision 12. `CLOCK_SKEW_MS` of 5,000 is the review's own constant and documented.
- The real hazard is M1: defaults frozen into project configs.

### 8. Quality

- **Mutations:** 9 of 10 hand mutants were killed (argv0 check, exe check, `WriterMismatch`, breaker skew, runner head, back-link, help routing, `CLAUDE_PROJECT_DIR`, the shim's trailing CR). The duplicate `--cli` mutant survived (L6b).
- **Test-only switches:** none in product code. The V4 test entry is retired, and its tests were moved to `hook_shell.rs` and `mailbox_routes.rs`.
- **Paths:** mailbox paths are defined once in `record/paths.rs`.
- **Shared resolver:** `claude_config_dir` is shared, and Observe's copy is deleted.
- **Setup and doctor registration:** both are present, with the M1 and H2 caveats above.
- **CHANGELOG:** missing (M4).

## Inherited items from V3 and V4

| Item | Status at V5 |
|---|---|
| V3: caller check by process record, not by parent pid | Closed (`caller_is_head`, `same_complete_head`) |
| V4 H1: usage error exits 0 | Closed in the product entry (`mailbox_routes.rs` test, probed) |
| V4 M1: three-state write gate | Closed (`WriteGate`, test `the_shell_moves_the_write_gate_to_writing_before_the_first_byte_of_stdout`) |
| V4 M3: pinned hop-shell set, per CLI | Closed (contract `hookShell` `/bin/sh` for Claude; argv0 and exe mutants killed). Residual: `$SHELL=/bin/sh`, macOS (L3) |
| V4 M4: Codex head identity | Closed (`headExecutables: ["codex"]`, `WrongExecutable`) |
| Output bound for PostToolUse | Closed (8,192 bytes per CLI, measured per hook, plus the pointer line) |
| Real limits loader | Closed. Defaults are frozen by setup (M1) |
| Lock order | Holds: the hook takes no other `LockScope`, and the breaker writes outside the lock |
| V4 M5: query-path mkdir | Closed (`createBlindRootsWhenMissing` only on the launch path) |
| V4 M6: over-cap visibility | **Not closed** (M3) |

## Recommended actions, in order

1. **H1:** delete the stray import from the OMP/Pi template, add a test of the generated source, and make the OMP/Pi checks compare the file byte for byte.
2. **H2:** gate the mailbox rows, on install and in doctor, behind the owner's §16 item 23 answer or a release capability probe.
3. **M1:** stop writing contract values into the project config.
4. **M3:** reopen V4 M6, and fix the spec's "the entry logs" sentence or add a bounded outcome log.
5. **M2:** relative back-links and submodules in `main_checkout_root`, plus a permanent-error text. This touches the Git lane's file, so coordinate or open an item.
6. **M4:** the CHANGELOG line, before the merge.
7. The Low items, as convenient. L5 goes to DIST together with the shim review.

## Verdict

**Does V5 meet its rung? Yes, with concerns.**

Every deliverable named in the §14 V5 row exists and is proven at its owning layer:

- the native kind and verbs;
- the per-CLI caller check;
- the bounded claim, the breaker, the loader and runner heads;
- the install rows and the doctor probe;
- the live runs through the product door, and the p95 under 50 ms in both CLIs.

The failure-quiet contract holds on every path I could reach. The one rung item not met is the handed-over V4 M6 visibility (M3).

**What blocks a future merge to main:**

- **H1.** It breaks two CLIs' existing guards as soon as setup runs.
- **H2.** The installer would roll the hook out before the owner's install decision and before every machine has the native kind, and Codex would show errors on every call where the release is older.
- **M4.** The CHANGELOG line.
- **The DIST review of the shim** (already named by the lane).
- **M1.** It should land before any project runs setup with this release, because the frozen defaults cannot be cleaned up automatically afterwards.

## Unresolved questions

- Does the OMP/Pi loader treat a failed extension import as fatal at startup, or does it silently skip the extension? Either way the guards are lost; this only changes how visible the failure is.
- Does Codex 0.161.0 show a non-zero, non-2 exit from a `PostToolUse` or `Stop` hook to the user or the model? This decides how loud H2 is.
- Do any users already set `worktree.useRelativePaths` globally? This decides M2's priority.

Status: DONE_WITH_CONCERNS
Summary: V5 meets its rung. The Rust door is sound: it stays quiet with exit 0 on every probed path, and 9 of 10 mutants were killed. But the installer commit breaks the existing OMP and Pi guards by pasting an import into their generated extension (H1), and it installs the mailbox rows with no gate (H2).
Concerns/Blockers: H1, H2, M1 and M4 block a merge to main. The shim still needs the DIST review. V4 M6 visibility is not actually closed (M3).
