---
phase: 1
title: "Confined launch: the safety gate"
status: pending
live_invocations: 2
---

# Phase 1: Confined launch, the safety gate

<!-- Updated: Red team 1 - request-shape spike first; one writable run directory; login stores masked; SIGKILL and orphan sweep; driver cleanup never called; reuse of readCredentialExpiry and codex-auth-guard; two-head and real-session-file checks; W8 check -->

## Context

The V4 review's H2 (`plans/261022-1501-mailbox-v4-claude-live-end-to-end/reports/code-review-v4.md:63-75`, verdict `:293`, `:314`): every V4 live case ran `--dangerously-skip-permissions` with no sandbox and the real `~/.claude` linked into the case HOME. Spec §11 "Safety of the live suites" requires a confined CLI before any adversarial body. Plan section 3 chose the confined case launch; this phase builds and proves it. **No adversarial body runs anywhere until this phase's gate is green.**

## Preconditions (checked first; any failure stops the phase)

1. V5 is closed and W1-W8 of plan section 6 are checked **by command**, results recorded in the phase notes: the private shim answers `fgos hook mailbox` and `fgos mailbox send --help` from a host built from the branch (W1); the Codex entry's owning tests are green (W2); a limits value set in a project config is read at runtime (W3); the `PostToolUse` output bound's owning test is green (W4); for W8, whether a claim's start and finish times can be read after a run without changing the entry (snapshot fields, or a measurement mode V5 documents). A W8 "no" is reported to the controller at once: plan outcome 3 is then not claimed, and owner question 1's scope already says so.
2. `cd /home/vantt/projects/forgent-mailbox || exit 1` then `git status --short` is empty (another session's uncommitted edits stop the phase: report, never stash), then `git fetch origin && git merge --no-edit origin/main`.
3. `free -g | awk '/Mem:/{print $7}'` prints 8 or more.
4. `bwrap --version` prints 0.11.1, or the new version is recorded; `~/.fgos/confinement-backends.json` still names `bwrap` enabled.

## Step 0: request-shape spike (no CLI, before any other build)

Build, in a scratch script under `${TMPDIR:-/tmp}/fgos-work/mailbox-v6/`, the exact request and resource set of the design below and call `prepareBwrapSync` on it, then print the argv (paths only). It answers, before anything else is written: does the driver accept a writable run-directory workspace (the probe harness's workspace grant is read-only, `probes/harness.mjs:488-517`), a `private-home` whose host target lies inside the run directory, a `home-files` source with the nested `.claude/.credentials.json`, and a request context outside any `.fgos` tree (`assertAttestationStoreIsolated`, `bwrap.mjs:492`)? Any "no" that only a change to `src/runner/dispatch/confinement/**` could turn into "yes" stops the phase with a decision question to the owner (new infrastructure, outside this plan's frame). The spike's created directories are removed by the spike itself; it copies no login (it points the credential source at a scratch file).

## Files

- New `scripts/lib/mailbox-live-confined.mjs`: the confined launch. Imports `prepareBwrapSync` (`drivers/bwrap.mjs`), `resolveConfinementResources` (`confinement/resources.mjs`) when the spike shows it serves, `readCredentialExpiry` and `DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS` (`src/runner/dispatch/provider-credential-renewal.mjs:51`, `:500`), and `stopProcessesInside` (`src/runner/dispatch/stop-processes-inside.mjs:59`) if its contract fits the orphan sweep. It adds only the masks of plan section 3 to the driver's argv.
- Changed `scripts/lib/codex-auth-guard.mjs` and its owning test `test/scripts/codex-auth-guard.test.mjs`: the set-aside rule extended from "a link replaced by a file" to "a copy that differs from its snapshot", one set-aside name for both, never deleting.
- New `test/scripts/mailbox-live-confined.test.mjs`: the owning proof of the confined launch.
- `scripts/lib/mailbox-live-cli.mjs`: reused as is (`cliEnv`, `seedClaudeState`); `makeClaudeHome` and the linking `makeCodexHome` stay for the V4 suite (plan decision 7) and are not called by V6.
- No change to `src/runner/**`.

## Design

`launchConfined({ base, runId, cli, argv, env, login })` returns `{ child, sandboxPid, runDir, privateHome, loginGuard }`:

1. **One writable directory.** `<base>/<runId>/` holds `ws/`, the run's own project `.fgos/`, `log/`, `bin/` (the shim, a symlink to the pinned shim) and `home/`. It is the only writable bind. The base itself and every sibling run directory are read-only inside. The shim and the host binary it executes are bound read-only (outside `/tmp`, or bound explicitly, because the driver's `--tmpfs /tmp` hides the host's `/tmp`).
2. **Masks.** Inserted after the driver's base flags and before its resource binds: `--tmpfs` over `~/.claude`, `~/.codex`, every Codex account home (`live.accountHome` for each account the machine config lists), `~/.fgos`, `~/.ssh`, `~/.gnupg`, `~/.aws`, `~/.config/gh`; `--ro-bind /dev/null` over `~/.claude.json` and over each `secrets.local.env` found by `find ~/projects -maxdepth 4 -name secrets.local.env` at launch; then the pinned Codex release directory bound back read-only. The Claude Code binary (`~/.local/share/claude/versions/<v>`) is not under a mask.
3. **Login copy by the driver.** Claude Code: `credentialStore { use: 'claude', homeEnv: 'HOME', files: ['.claude/.credentials.json'] }` with a `home-files` source at the login home owner question 4 picks. Codex: `credentialStore { use: 'codex', homeEnv: 'CODEX_HOME' }` with a `codex-home` source at the test account's home. `credentialWriteBack` off. The harness then writes the non-secret first-run files: `.claude.json` (`seedClaudeState`: onboarding done, workspace trusted); Codex `config.toml` (hooks on, workspace trusted, `model_reasoning_effort = "low"`) and `hooks.json`.
4. **Login guard.** Before a run: `readCredentialExpiry` on the source must be at least `DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS` ahead; stale means the batch waits, re-checking every 5 minutes for up to 2 hours (the owner's own sessions refresh the source), then stops with "login near expiry". It prints only "fresh" or "stale". The snapshot hash is taken right after the copy. After the run, the copy is compared with that hash. Equal: only the copied file is removed (by its listed name); transcripts stay. Different: the copy is moved out of the home and set aside by the extended `codex-auth-guard` rule, mode 0600, never deleted; the run directory is then never removed; the batch stops with "login refreshed inside a run; the copy may hold the only valid token; ask the owner". A change of the **source** by another writer (the owner's sessions) is not a breach: the guard re-reads the source before the next copy.
5. **The driver's `cleanup` is never called**: it removes the whole private home (`cleanup.mjs`), transcripts included.
6. **Ending a run, and orphans.** The harness finds the sandbox's pid 1 by its host pid (the child of bwrap, from `/proc/<bwrap pid>/task/*/children`), records it in the run's ledger entry, ends the run with SIGKILL to it and then to bwrap, and confirms that no process is left inside the run directory (`stopProcessesInside`, or a `/proc` scan by cwd and root). At every harness start, a sweep finds ledger entries without a result, kills any process still inside their run directories, records them `error`, and refuses to start a run while any remains.
7. **Pid namespaces.** A head registers from inside its own namespace; the harness's `send` runs outside. Process facts judge a record from another namespace `Unknown`, not `Dead` (`packages/process/rust/src/facts.rs:212-218`; mailbox head records carry no anchor, `facts.rs:57`), and name resolution skips only dead bindings, so the name resolves. Tests 5 and 8 prove it; the fallback, if they fail, is a sender started inside the same sandbox (an inner driver as the sandbox's command), decided here and recorded.

## Tests first (TDD), in `test/scripts/mailbox-live-confined.test.mjs`

Real bwrap, a stub CLI (`node` script) and the real shim; skipped only when no working bwrap backend exists, the pattern of `test/runner/dispatch-confinement-blind.test.mjs:349` (a platform capability, not a test switch). Each test name states its behaviour:

1. "a confined run writes its own run directory and nothing else": the stub writes `ws/`, `.fgos/runtime/mailbox/`, `log/` and its home; writing a sibling run directory, the base, the repository root, a planted host file, and the real `~/.claude` path each fails, and the planted file's hash is unchanged.
2. "a confined run cannot read a real login store or a listed secret": reading `~/.claude/.credentials.json`, `~/.claude.json`, the Codex test account's `auth.json` and a planted `secrets.local.env` returns nothing (empty mask or `/dev/null`), while the run's own copy is readable.
3. "the falsifier: the same stub without the confined launch can write the planted host file and read the planted secret": proves tests 1 and 2 are not vacuous.
4. "a confined run holds a copy of its login, never a link": `lstat` is a regular file, mode 0600, bytes equal the source, inode differs.
5. "a send from outside reaches a head registered inside the sandbox": the stub's first hook call registers (and claims nothing); the harness waits for the binding, sends, writes the go file; the stub's next hook call receives the frame; the snapshot shows the message `offered`. Also: "a send before registration is refused as an unknown name".
6. "ending a confined run leaves no process": one stub traps SIGTERM, one forks a `setsid` child that sleeps; after the harness ends each run, no process is left inside the run directory.
7. "the orphan sweep kills a run the harness did not finish": the harness process is killed with SIGKILL mid-run; the next harness start finds the orphan, kills it, records `error`, and only then starts a run.
8. "two heads in two sandboxes share one record": two stub heads, each in its own confined launch over one project directory, both register (no `Deferred`, no `Conflict`) and each receives the other's frame. Gate for phase 6.
9. "a changed login copy is set aside, never deleted, and stops the batch": the stub rewrites its copy; the guard sets it aside, refuses to remove the run directory and returns the stop reason (the set-aside rule itself is owned by `codex-auth-guard.test.mjs`; this is the wiring proof).

Run: `free -g | awk '/Mem:/{print $7}'` (8 or more), then `timeout 900 node --test test/scripts/mailbox-live-confined.test.mjs test/scripts/codex-auth-guard.test.mjs 2>&1 | tee ${TMPDIR:-/tmp}/fgos-work/mailbox-v6/p1-confined.log` and `echo "exit=$?"` next.

## Benign smoke (2 live invocations, legitimate content only)

After the tests pass: one `claude -p` and one `codex exec` with the models of owner question 2, each under the confined launch through the real shim, with task `T` of phase 2 and one benign PT message from the fixed sender (the LR body). Checks: the CLI starts logged in; **Claude Code's session file in the private home names pid 1 and a `procStart` equal to the start time of the sandbox's pid 1 read from outside, and the head registered** (`store/src/adapters/claude_head.rs` checks both; a mismatch is a silent `NoHead`, so this check is the only way to see it); the message ends `offered`; the transcript (Claude Code) or rollout (Codex) holds the frame and the record type of its channel; the hashes of the source login files are unchanged or their change is explained by another writer; the copy is unchanged; peak resident memory of each CLI process tree is recorded (`VmHWM`, sampled). These two runs count toward the ceiling, not toward any cell.

## Gate G-SAFE (all must hold; otherwise stop and report to the controller)

- Step 0 answered every question with "yes" without changing `src/runner/**`.
- Tests 1-9 and `codex-auth-guard.test.mjs` green on a fresh main merge.
- Both smokes: logged in, registered (session file check), delivered, login copy unchanged (or set aside and reported).
- The phase notes record: bwrap version, the exact argv of one run (paths only), the mask list, peak memory per CLI, the W1-W8 results.

## Sync and commit

Start and end: merge `origin/main`. Commits on the branch only, conventional, no plan IDs in messages, for example `test(mailbox): confine the live CLI to its run directory`. Census with every hashed change. Push the branch.

## Risk

- Claude Code may need a writable path outside HOME (for example `~/.cache` when HOME is honoured, or `$XDG_RUNTIME_DIR`): HOME is the private home; any other path found is added as a run-directory bind, never a host bind.
- A mask over `~/.codex` hides the Codex binary unless the release directory is bound back: test 2's stub runs the real `codex --version` path check (no session) to prove it stays executable.
- Rollback: the new module and test are new files; the `codex-auth-guard` extension is one function with its test.
