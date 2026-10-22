# Code review: Agent Mailbox rung V4 (Claude Code live end to end, test-only entry)

Date: 2026-10-23, Asia/Saigon. Reviewer: code-reviewer, read-only. Branch `mailbox/v1-v3` at `9bb562808`, V4 base `a5853a1bd`. No repository file was edited or committed.

## Scope

- Mailbox files: `packages/mailbox/rust/store/src/hook/shell.rs`, `src/head.rs`, `src/adapters/claude_head.rs`, `src/verbs.rs`, `examples/mailbox-test-hook.rs`, `tests/common/ancestry.rs`, `core/src/report.rs`, the contracts (`limits.v1.json`, `frame.v1.txt`, `adapters.v1.json`, the Claude fixtures), and the tests `hook_shell.rs`, `test_hook_entry.rs`, `head_finder.rs`, `head.rs`, `verbs.rs`, `core/tests/report.rs`.
- The harness and recorder: `test/live/mailbox-claude.live.mjs`, `scripts/lib/mailbox-live-cli.mjs`, `scripts/lib/codex-auth-guard.mjs`, `scripts/record-mailbox-hook-fixtures.mjs`.
- Confinement: `src/runner/dispatch/confinement/resources.mjs`, `test/runner/dispatch-confinement-blind.test.mjs`, `docs/specs/confinement-authority.md`.
- Spec `docs/platform/agent-mailbox/spec.md` sections 6.1, 7.4, 8, 11, 12, 14 (V4 and V5 rows); the branch reports `research-261022-1825-mailbox-v4-live-suite.md` and `closing-261022-2306-mailbox-v4-claude-live-end-to-end.md`.
- The other roughly 100 files in the diff come from merges of `origin/main` (holder-lock, setup, run-supervisor and so on). I did not review them.

## How I verified

- I exported the commit with `git archive 9bb562808` to `/tmp/fgos-work/v4rev` and built with `CARGO_TARGET_DIR=/tmp/fgos-work/v4build`, `CARGO_BUILD_JOBS=4` and `--test-threads=4`, after checking that 16 to 22 GB was free.
- These V4 test files pass: `hook_shell` 8, `test_hook_entry` 6, `head_finder` 7, `head` 4, `verbs` 3.
- I ran 11 mutations one at a time, each under `timeout 300`, with the full `fgos-mailbox` suite and `--no-fail-fast`:

| Mutation | Result |
|---|---|
| M1: drop `write_started.store(true)` before the stdout write | **survives** (no test fails) |
| M2: finish after a failed write | killed by `hook_shell` and `test_hook_entry` |
| M3: skip the caller check | killed |
| M4: drop `zsh` from `HOP_SHELLS` | **survives** |
| M5: skip the `procStart` check | killed |
| M6: stdin `take(cap)` instead of `cap+1` | killed |
| M7: `Direct` accepts a shell parent | killed |
| M8: the watchdog ignores `write_started` | killed |
| M9: own suffix taken without `nameSource: derived` | killed |
| M10: skip the session file's pid check | killed |
| M11: caller check by pid alone | killed |

- I ran no real CLI, no live case, no demo, no harness `check` and no herdr command. I made no edits.

## Overall assessment

The V4 library code is careful. Write happens before finish, a failed write never finishes, panics are caught, stdin is capped, the session file is opened without following a symlink and is size-capped, and the head check is a full-record comparison (pid plus start time) against pid reuse. The tests are mostly real: 9 of 11 mutations are killed by a test whose name states the behaviour.

The gaps are at the edges:

- the watchdog has a race;
- usage errors exit 2 on the hook path;
- the live harness's safety comments claim more isolation than it has;
- the harness lacks the recorder's guard for a replaced Codex `auth.json`.

None of these blocks V4 as a test-only rung. Several must be closed before V5 ships a product door.

## Critical

None.

## High

### H1. A usage error in `hook` exits 2, which Claude Code treats as a blocking Stop (can loop the session)

- Location: `examples/mailbox-test-hook.rs:16`, `:44-55`, `:168`, `:173`, `:180`, `:185`.
- Status: CONFIRMED in code. The impact is PLAUSIBLE: it was not run, and it relies on Claude Code's documented hook exit codes.
- What happens: `hook` returns 2 for a bad `--cli`, `--topology`, `--event` or `--fault`, or a missing `--fgos-dir` or `--project`. `main` also exits 2 with a stderr usage line when the flags do not parse. For Claude Code, exit code 2 from a `Stop` hook means "block the stop and give stderr to the model". From `PostToolUse` it shows stderr to the model.
- Failure scenario: one bad flag in an installed hook line, for example an entry older than the installer that does not know a new flag. Every Stop is then blocked, with empty stderr or "usage: see the module doc", and the model is pushed into another turn on every Stop. Nothing bounds this, because the Stop-block cap lives in the drain, which never runs. The spec requires the opposite: "Fails quiet and exits 0" (§6.1) and "a hook that fails prints nothing and exits 0" (§8 item 7).
- Why it is not a V4 blocker: the harness generates the command lines, so this does not happen today.
- Fix: in the `hook` verb, map every usage error to exit 0 with nothing on stdout or stderr, and log the cause to `--log`. Keep exit 2 for `send` and `inbox` only. Add one case to `test_hook_entry.rs`: a bad `--topology` exits 0 and prints nothing. V5's `fgos hook mailbox` must have the same rule.

### H2. The live harness claims more isolation than it has: a full-bypass model can write the owner's real `~/.claude` and the repository

- Location: `scripts/lib/mailbox-live-cli.mjs:17-18`, `:130-138`, `:172-186`; `test/live/mailbox-claude.live.mjs:155-161`, `:219-236`, `:922-931`.
- Status: CONFIRMED in code. The extra writes into `~/.claude` are CONFIRMED by the suite report: L3a wrote `~/.claude/projects/<workspace>/<session>/tool-results/hook-…-additionalContext.txt`.
- What happens:
  - Every real case runs `claude --dangerously-skip-permissions`, with no sandbox, with `HOME=<case>/home` whose `.claude` is a symlink to the real `~/.claude`.
  - The comment at `mailbox-live-cli.mjs:17` says "the run directory is outside every git checkout, so a full-bypass agent cannot write the repository". That is false. `assertOutsideCheckout` only sets the working directory; the model's Bash tool can write any path the user can, including `/home/vantt/projects/forgent` and every file under the real `~/.claude` (`settings.json`, `CLAUDE.md`, `agents/`, `.credentials.json`).
- What gets mutated in the owner's real Claude state even when nothing goes wrong:
  - `~/.claude/projects/-tmp-fgos-work-…` transcripts. L3a/L3b alone put about 4 x 0.9 MB of Stop reasons in transcripts and 4 persisted `additionalContext` files there.
  - `~/.claude/sessions/<pid>.json` while each session runs.
  - Shell snapshots, and probably `history.jsonl` for the interactive scenes D3/D4 (PLAUSIBLE, not checked).
- What is never touched: the real `~/.claude.json`. Each case HOME gets its own, which is the right choice.
- What the check covers: `claudeHomeIntact` only checks that the link still exists, not what is behind it.
- Failure scenario: V6 runs adversarial peer bodies (variants B, C, D, K, L, M) through this harness as it stands. A model that obeys a laundering body has unrestricted write access to the owner's account and checkout.
- Fix:
  1. Correct the comment so it says the working directory is outside a checkout and no repository settings file loads, not that writes are prevented.
  2. Before V6 runs any adversarial cell, run the CLI under the existing confinement (bwrap with the case directory writable and `~/.claude` limited to what Claude Code needs: `.credentials.json` read-write, `sessions/` and `projects/` read-write, everything else read-only). Otherwise drop `--dangerously-skip-permissions` and allow-list only `Bash(fgos mailbox *)` and the wait loop.
  3. After each case, remove the `~/.claude/projects/<encoded case ws>` directory, or at least report it.

## Medium

### M1. Watchdog race: the process can exit in the middle of a stdout write

- Location: `src/hook/shell.rs:232-241` (setting `write_started`, then writing) and `:269-281` (`arm_budget`).
- Status: CONFIRMED by reading the code (time-of-check to time-of-use). How often it happens: PLAUSIBLE, but rare.
- What happens:
  - The watchdog reads `write_started == false`, then runs `on_exit()`, which opens and appends to the log file, and only then calls `process::exit(0)`.
  - The main thread can set the flag and start `write_all` inside that window.
  - `process::exit` does run std's cleanup, but stdout's flush there only uses `try_lock`, and the entry holds `io::stdout().lock()` for the whole run (`mailbox-test-hook.rs:253`). So a partial frame can leave the process with status 0.
- Consequence today: mild. Claude Code receives truncated JSON, which is not a valid `decision:block` or `hookSpecificOutput`, so the model sees nothing. Finish never ran, so the claim expires and the message is offered again later. Nothing is marked offered and lost.
- The real problems:
  - The documented guarantee "never ends a process whose write has started" (`shell.rs:274-277`, spec §6.1) is not true.
  - Mutation M1 shows that no test notices if the shell stops setting the flag at all. The watchdog test pre-sets the flag itself (`hook_shell.rs:326`).
- Fix:
  - Turn the flag into a three-state `AtomicU8`: `Idle → Writing` set by the shell with `compare_exchange`, and `Idle → Exiting` set by the watchdog with `compare_exchange`, then `on_exit` and `exit`. If the shell's exchange fails, it must not write; it parks or returns.
  - Add one test in `hook_shell.rs` that runs `shell::run` with a writer that records the flag's value on its first `write`, and asserts it is `Writing`. That kills M1.

### M2. The live harness has no replaced-`auth.json` guard for Codex (D2/D4), unlike the recorder

- Location: `test/live/mailbox-claude.live.mjs:1129-1139`, `:1197`, `:898-903`; compare `scripts/record-mailbox-hook-fixtures.mjs:315` and `:775-777`.
- Status: CONFIRMED that the guard is missing. Token loss: PLAUSIBLE. `codex-auth-guard.mjs` itself records that nobody has observed whether Codex refreshes by writing in place or by renaming a new file over the path.
- What happens:
  - The demo links `codex-home/auth.json` to the `tetnu` account's real file and, after the run, only records `isLink` and `loggedIn` in `checks.versionPin`.
  - It never calls `setAsideReplacedAuth`, never refuses a cleanup while a set-aside file exists, and never tells the operator.
- Failure scenario:
  1. Codex refreshes during D2 or D4 by rename. The link becomes a plain file holding the only valid, just-rotated refresh token, and the account's real file keeps the stale one.
  2. The harness reports one failed check among many.
  3. The controller re-runs the scene, which requires deleting the directory because the `spawned-b.json` marker blocks a re-run, or cleans `/tmp/fgos-work`.
  4. The only valid token is deleted and the test account is logged out.
- Fix: after the run, call the same `setAsideReplacedAuth`, print the path as the run's last line with exit status 3, and make `layOutDemo` refuse while `setAsideAuthFiles(dir)` is non-empty. That is one guard, used by both callers, as `mailbox-live-cli.mjs:20-21` already promises.

### M3. The caller check does not tell a tool's `zsh` from the hook's `sh`, and no test pins the hop-shell set

- Location: `src/head.rs:99-111`; the gap is documented in spec §6.1 and §17.
- Status: CONFIRMED from the measured process chains (report L1: tool `zsh → claude`, hook `sh → claude`) and mutation M4 (dropping `zsh` breaks no test).
- Is it exploitable now? No.
  - The test entry is never installed. It appears only in temporary settings files under `/tmp/fgos-work`, and nothing is staged by `build-rust-distribution.mjs`.
  - Even live, a tool command that runs the entry can only drain mail addressed to its own session (the writer comes from that session's own `CLAUDE_CODE_SESSION_ID`, and the session file must name it). The effect is delivery into tool output instead of injected context, and the message marked offered.
  - The spec already states that a same-user process can write the snapshot anyway.
- What V5 must close, given the owner's decision to defer the discriminator to V5:
  1. A Claude-specific hop-shell set. On this machine the hook is `sh`/`dash` and the tool is the login shell; `HOP_SHELLS` is shared across CLIs and includes `zsh`/`bash` with no measurement behind them.
  2. A test that pins whichever shells are accepted.
  3. The product route must not rely on `CLAUDE_PROJECT_DIR`-style variables, which can be spoofed.

### M4. On `Direct` topology (Codex), any non-shell parent becomes the "head", including a subreaper after the CLI dies

- Location: `examples/mailbox-test-hook.rs:212-230`; `src/head.rs:104-110`.
- Status: CONFIRMED in code. Example code only, labelled a feasibility demo.
- What happens: the Codex path takes `topology.head_of(ancestry)` as the head with no session file and no check of the CLI's identity. If `codex` exits while its hook runs, the entry is re-parented to a subreaper (`systemd --user`, or a herdr pane process), which is not a shell. That process is then registered as the head of the session.
- Failure scenario: the binding's head is a process that never dies. Every later real head of that session is judged "a different record against a live head", registration is refused (the conflict row of the registration table), and the session gets no mail until the record TTL.
- Fix, for V5 and V7: the product Codex resolver must verify that the head-position process is the CLI. Compare its `comm`/`exe` with the adapter's declared binary, or use a Codex session artefact equivalent to Claude's `sessions/<pid>.json`, before registering.

### M5. `refIsHiddenFromBlind` and `resolveUnitInputs` now create `.fgos/runtime/mailbox` as a side effect of a query

- Location: `src/runner/dispatch/confinement/resources.mjs:221-227`, reached from `src/runner/execution/handoff-refs.mjs:185` and `:247`.
- Status: CONFIRMED in code.
- What happens: `resolveBlindHiddenRoots` now runs `mkdirSync` (mode 0700, recursive). It is called not only when a blind launch is built, but also from the ref check `refIsHiddenFromBlind`, which runs for every handoff ref.
- Failure scenarios:
  - On a read-only or foreign-owned `.fgos`, `mkdirSync` throws `EACCES` or `EROFS`, and a function whose name says it only answers a question now throws out of ref resolution.
  - A `runtime` that is a plain file throws `ENOTDIR`.
- On mode: Node's recursive `mkdir` applies 0700 to a newly created `runtime` too, which the Rust `check_dir` accepts. That is fine.
- Fix: create the directory only on the launch path (`resources.mjs:436`) and pass `{ create: false }` from `handoff-refs`. Or catch the `mkdir` error and treat the root as missing, which the mask then skips; on the launch path, refuse the launch instead.
- Test gap: the real-bwrap behaviour test (`dispatch-confinement-blind.test.mjs:309`) plants no mailbox body, so no test observes a blind worker failing to read `runtime/mailbox`. Masking is generic per resolved root, so the resolution test plus the generic argv test is one acceptable chain of proof. But the question "does it really mask?" is answered by inference, not by observation.

### M6. A 1 MiB stdin cap can silently skip drains and registration on large tool payloads

- Location: `src/hook/shell.rs:121-125`; `limits.v1.json` `mailbox.hook.maxReadBytes`.
- Status: PLAUSIBLE, not measured.
- What happens: a `PostToolUse` payload carries the full `tool_input` and `tool_response`, for example `Write` of a 2 MB file or a large `Read`. Above 1 MiB, the drain is quiet `Malformed`. Mail is retained, so nothing is lost, but drains and the first-hook registration are skipped exactly on heavy steps, and nothing reports it.
- Fix:
  - V5 should measure the largest `PostToolUse` payload of a normal session.
  - Do not reject a payload over the cap. Read only a bounded prefix: the fields the drain needs (`session_id`, `hook_event_name`, `agent_id`, `stop_hook_active`) come before `tool_response` in the recorded fixtures, so this is feasible.
  - Or, at minimum, count this quiet reason towards the `last_drain_at`/`status` signal.
- On the source claim: the value's source is real. `packages/terminal-control/rust/src/route.rs:23` has `MAX_STDIN = 1024*1024`. But the contract says it is "the repository's only bound on a foreign input read", which is false: `packages/observe/rust/src/metrics_cli/harness.rs:229` has `MAX_READ_BYTES = 1 MiB`. Reword the source string.

## Low

### L1. The `run` verb uses whatever example binary `check` last built

- Location: `test/live/mailbox-claude.live.mjs:131-134`, `:798-799`.
- Status: CONFIRMED.
- What happens: `run` and `demo` only check that the binary exists and never rebuild it or check its fingerprint. A live spend can run code from an older commit than the one the report names.
- Fix: write the commit and binary hash at `check`; refuse at `run` when HEAD or the hash differs. Record both in `result.json`.

### L2. Machine codes reach the model with no guidance on whether to retry

- Location: `examples/mailbox-test-hook.rs:303`, `:334`; `src/verbs.rs:38-41`.
- Status: CONFIRMED.
- What happens: a record failure (lock wait exceeded, untrusted directory) answers `send` and `inbox` with a bare code such as `lock-wait`, which is not from `frame.v1.txt`. Every other sentence a sender sees comes from the contract. A model may retry in a loop.
- Fix: add a `[refusal.record]` section, for example "Not recorded: {{code}}. Try once more later; do not loop."

### L3. The frame contract header overstates header escaping

- Location: `contracts/frame.v1.txt:16-18` against `core/src/report.rs:77-84`, `:150-158`.
- Status: CONFIRMED.
- What happens: the header says every inserted value except four goes through the header escape. `{{code}}`, `{{kind}}` and `{{state}}` are inserted unescaped. They are static literals today, so nothing is wrong yet, but the comment is wrong.
- Fix: say "every value taken from the record".

### L4. The 2.1.308 re-recording dropped evidence text from `vectors.json`'s `source`

- Location: `contracts/fixtures/hooks/claude/vectors.json:3`.
- Status: CONFIRMED.
- What happens: the new string no longer carries "its tool process saw the head's CLAUDE_CODE_SESSION_ID, so the environment does not tell a subagent apart" or "user hooks that fired: none". The adapter doc still leans on the first fact, which now lives only in git history.
- Fix: have the recorder keep the subagent and user-hook observations, or re-state them.

### L5. The dry pane mode can orphan its separate herdr server

- Location: `test/live/mailbox-claude.live.mjs:1008-1011`, `:1042-1047`.
- Status: PLAUSIBLE.
- What happens: `die()` inside `start` (an allocate failure, or a resource problem) exits before `finish()` runs, leaving the `DRY_HERDR_SESSION` server and any stub panes running. Real scenes retain panes by design; the report confirms they were later closed by hand and `inspect` read `pane: gone`.
- Fix: register `finish` in a `process.on('exit')` handler for the dry mode.

### L6. The test entry compiles the core's test support in by path

- Location: `examples/mailbox-test-hook.rs:20-23`, `:92-98`.
- Status: CONFIRMED.
- What happens: the entry loads the limits through `tests/common/support.rs` (`include_str!` of the contract). That is fine for a test entry, but V5 needs a real config loader (`registerConfigDefault` plus a runtime read) and must not copy this pattern. Same for `ancestry_of` living under `tests/common/`: the product route needs it as library or host code, and the store "reads no process table" rule will have to name where it lives.

### L7. The committed scripts name the owner's Codex and agy account alias

- Location: `test/live/mailbox-claude.live.mjs:59`; `scripts/record-mailbox-hook-fixtures.mjs:33,71,74,84,106-109`.
- Status: CONFIRMED.
- What happens: `tetnu` is committed as the default account (it was already present before V4). It is an alias, not a credential.
- Scan result: no token, key, e-mail address or credential found in any V4 file I scanned. I grepped for `sk-`, `eyJ`, `refresh_token`, `access_token`, `Bearer`, e-mail patterns and `/home/vantt` in the mailbox, script, live-test and plan diffs. The reports contain absolute paths under `/home/vantt/projects` and herdr pane ids, which is the repository's normal convention. The demo transcripts in the report are scripted role-play, not personal data.
- Fix, optional: read the default account from an environment variable or the owner's table instead of committing the alias.

## Answers to the focus questions

### 1. Fail-quiet exit 0 on every path

- These paths exit 0 with nothing printed:
  - malformed stdin;
  - oversized stdin (quiet `Malformed`);
  - stdin that never closes (the watchdog fires; proven by the entry test, about 8 s);
  - a panic (caught; there is no `panic=abort` profile; the panic hook is silenced);
  - a failed write (no finish; proven at two layers);
  - a record open error;
  - a record hold error.
- Exceptions:
  - usage errors exit 2 (H1);
  - the watchdog can cut a write that has just started (M1).
- Can a partial stdout write happen? Yes:
  - through M1;
  - through a short write followed by an error such as EPIPE (the CLI stopped reading, so nothing is lost).
- Would the CLI misread a partial write? In both cases the CLI gets invalid JSON, which is not an injection. Finish never ran, so the message is offered again. That is a duplicate or a delay, never a loss.
- One write-path concern that is not about exit status: a successful write of more than about 14 KB of `PostToolUse` context is moved to a file by Claude Code, but finish still marks every message offered. That is V5's output bound, already on its list; V5 must treat it as a blocker, not polish.

### 2. Caller check and head finder

- Pid reuse is handled: full-record comparison including start time, `procStart` checked against `/proc` start time, the session file opened with `O_NOFOLLOW|O_NONBLOCK`, regular files only, size-capped.
- `ancestry_of` reads ppid, identity and `comm` in three separate syscalls. A reused pid there cannot forge a head, because the session file must name the same pid, start time and writer key.
- `Unknown`: an unreadable stored head is never "same head" and preserves the binding (the registration table). The only way out of a stuck `Unknown` is the record TTL. V5 should make sure `status` names such a binding.
- The `zsh` gap: not exploitable now (M3).
- V5 must close: the discriminator plus a test pinning the accepted shells; head identity on `Direct` (M4); exit 0 on usage errors (H1); the watchdog race (M1).

### 3. Harness and recorder safety

- The real `~/.claude.json` is safe. Credentials refresh through the directory link, which is robust to rename-on-write.
- The real `~/.claude` is still written, both by Claude Code itself and potentially by the full-bypass model (H2).
- The env allowlist is tight: `HOME`, `USER`, `LANG`, `TERM`, `XDG_RUNTIME_DIR`, `PATH`, plus the run's own variables. `CLAUDE_CODE_*`, `ANTHROPIC_*`, `OPENAI_*` and the herdr variables are not inherited, and the identity variables are asserted absent. `cliVersion('claude', process.env)` at `:920` and `:1309` runs `--version` with the full environment, which is harmless.
- Pane launches use `env -i` with the allowlist.
- The Codex guard detects a broken link but does not preserve the token (M2).
- Temporary directories are kept for evidence. `rmSync` on re-layout removes the `.claude` symlink, not its target.
- Real panes are retained by design. The dry mode can orphan its server (L5).
- No secrets were found in committed files (L7).

### 4. Confinement

- `runtime/mailbox` is created only when `.fgos` exists. The mode is 0700, and the test asserts it.
- It is masked by the generic mask over resolved roots, which is not observed for this root under real bwrap.
- The directory is also created from query paths (M5).

### 5. Contract and texts

- `budgetMs` 8000 is sourced from the spec's measured reference ceiling.
- The `maxReadBytes` value is sourced, but its "only bound" wording is wrong (M6).
- Every sentence the model sees comes from `frame.v1.txt`, except the bare record error codes (L2).
- The contract's escaping comment is inaccurate (L3).

### 6. Quality

- One owning proof per behaviour is mostly respected. The failed-write behaviour has a shell proof and one entry wiring proof, as principle 8 allows.
- Gaps: M1 (`write_started` unproven) and M4 (hop-shell set unpinned).
- No test-only switch is in product code: `--fault panic-in-render` and `PanicOnWrite` live only in the example binary, which is never installed.
- The mailbox root path is defined in `record/paths.rs` and duplicated as the template string in `resources.mjs`, with a comment naming the owner. That is acceptable across the Rust/Node boundary, but no test ties the two together.

## Recommended actions, in order

1. H1: `hook` exits 0 on usage errors, with an entry test. This is cheap and it is a product rule.
2. H2: correct the isolation comment now. Gate V6's adversarial cells on confinement, or drop full bypass.
3. M2: wire `setAsideReplacedAuth` and `setAsideAuthFiles` into the live harness before any further Codex scene.
4. M1: three-state write flag, plus a test that kills M1.
5. M5: no `mkdir` on query paths, or a guarded `mkdir`.
6. V5 list, beyond the closing report: M3's test pinning the hop shells, M4's head identity check, M6's payload-size measurement or prefix read, L1's binary fingerprint, L2's `refusal.record` sentence, L6's real config loader and where `ancestry_of` lives.

## Verdict

**Does V4 meet its rung? Yes, with concerns.** Every V4 deliverable in the §14 row exists and is proven at the layer the spec names:

- the shell order (write, then finish);
- the head finder;
- exit 0 under panic, failed write, timeout and malformed stdin, as a process;
- the caller check;
- `send`'s delivery-report sentences;
- the output-size measurement;
- the hidden root;
- the live L1 and L2 cases plus the D1 to D4 demos.

The live evidence is recorded with honest failures (the first L1 run, D1's nonce, D4 stalling).

**What blocks it:** nothing blocks closing V4 as a test-only rung, because the entry is never installed and the found defects live in test-only code or harness code. Before more live spend, fix M2 (Codex token preservation) and the H2 comment. Do not run V6 adversarial cells on this harness until H2's confinement is in place.

**What V5 inherits, on top of the closing report's list:**

- exit 0 on every hook usage error (H1);
- the three-state watchdog flag and its test (M1);
- a pinned, CLI-specific hop-shell set as part of the discriminator (M3);
- head identity on `Direct` topology (M4);
- payload-size behaviour above `maxReadBytes` (M6);
- the `PostToolUse` output bound as a blocker (the finish-after-file-move issue);
- a refusal sentence for record errors (L2);
- a real limits loader and a home for `ancestry_of` (L6);
- query-safe hidden-root creation (M5).

## Unresolved questions

- Does Codex 0.161.0 refresh `auth.json` in place or by rename? This decides whether M2 is a real token-loss path; it could be measured with a forced refresh on the test account.
- Do interactive Claude Code sessions under a case `HOME` append to the real `~/.claude/history.jsonl`? I did not check this, to avoid touching owner state.

Status: DONE_WITH_CONCERNS
Summary: V4 meets its rung as a test-only rung. The library is sound and 9 of 11 mutations are killed. Two High and six Medium findings sit at the edges (a usage-error exit 2 that can block Stop, overstated harness isolation, a watchdog race, a missing Codex token set-aside in the live harness, and a query-path mkdir), and V5 must close them.
Concerns/Blockers: Before further live spend, fix the Codex `auth.json` set-aside in the live harness (M2) and correct the isolation claim (H2). V6's adversarial cells must not run under `--dangerously-skip-permissions` with the real `~/.claude` linked and no sandbox.
