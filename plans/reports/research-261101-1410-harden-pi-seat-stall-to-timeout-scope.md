---
title: "R12 scope: why a pi seat on a 402 or a stall runs to the 2100 s timeout"
description: "Read-only scope of the pi seat launch, the existing idle and provider-stop doors, and two fix shapes."
---

# R12 scope: pi seat 402 / stall runs to the executor timeout

Read-only. Nothing started, no provider credit spent. Repo state read: working tree of main at HEAD ba81b2f23.

## Answer in one paragraph

A pi seat is a **terminal-mode** seat (herdr pane, `TERMINAL_CLIS` includes `pi`). Two existing doors should end it early, and pi misses both for different reasons:

1. **Idle stop** (supervisor stops an agent whose screen stopped changing). It is configured off in practice: this repo's `runner.idleTimeoutMs` is 5400000 ms, longer than `runner.timeoutMs` 2100000 ms, so the soft deadline always wins. The 300000 ms terminal default only applies when config sets nothing.
2. **Provider-stop screen detection** (`detect_completed` turns a quota/login screen into `Blocked`, which settles as `provider-limit`). Its wording list has no OpenRouter 402 text, so a pi pane sitting on a 402 is never recognised.

Even if idle fired today, it would settle as `resource` / `execution-timeout`, not `provider-limit`, because the screen scan after an idle stop is not applied (see section 2).

## 1. Launch, parse, timeout, provider-limit (file:line)

- Executor family and adapter: `src/runner/dispatch/provider-adapter.mjs:575` (`PiProviderAdapter`, only effort/tool-gating flags), registry `:600`.
- Terminal CLI set: `src/runner/dispatch/assignment-runner.mjs:569` (`TERMINAL_CLIS` has claude, codex, agy, pi, omp).
- Envelope build for the attempt: `assignment-runner.mjs:2035-2055`; timeouts go in as `timeoutMs` and `idleTimeoutMs: terminalMode ? (cfg.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS) : cfg.idleTimeoutMs` (`:2048`). `DEFAULT_IDLE_TIMEOUT_MS = 300000` at `src/runner/dispatch/herdr-round.mjs:58`.
- Pane launch and brief delivery: Rust supervisor `packages/run-supervisor/rust/src/supervise/terminal.rs`; pi profile `packages/agent-protocol/rust/src/terminal/pi.rs:7` (Ctrl-D exit, brief through the prompt door).
- Output parsing: pi usage only (token counts) in `src/runner/dispatch/usage-parsers.mjs:80`; no provider-error parsing for pi there. Direct (headless) adapter for pi: `packages/agent-protocol/rust/src/direct/mod.rs:26`.
- Timeout: executor `timeoutMs` 2100000 in `.fgos/config.yaml:195`; the supervisor `soft-deadline` stop and `idle` stop are both in `packages/run-supervisor/rust/src/supervise/terminal.rs:405-412` (terminal) and `supervise.rs:505-512` (direct). A stop with cause `soft-deadline` or `idle` maps to receipt outcome `timeout` (`supervise.rs:67`), then to `isTimeout: true` in `src/run-supervisor/steps/settle-attempt.mjs` `rawResultOf` (case `'timeout'`), which is the `execution-timeout` the evidence shows.
- Where `provider-limit` is produced today:
  - Terminal seats: `packages/agent-protocol/rust/src/terminal/mod.rs:619-638` `detect_completed` returns `Blocked(UsageLimit)` when herdr state is not `working` and `quota_on(screen)`; `settle-attempt.mjs:100-130` `terminalAdapterOutcome` turns a `terminal:blocked` receipt plus `screenSaysProviderStop` into `provider-limit` (also uses `matchQuotaLimitLine`/`matchAuthFailureLine`).
  - Headless exits: `src/runner/dispatch/settlement.mjs:633-650` (`exitedOnQuota`/`exitedOnDeadCredential` from the stderr tail), classification and quarantine in `provider-capacity.mjs:964` and `classifyProviderCapacityFault`.
  - Walk to the next candidate: `assignment-runner.mjs:2221`.

## 2. Existing mechanisms for "no progress" or provider error

| Mechanism | file:line | Is pi wired? |
|---|---|---|
| Idle timer on screen-hash change (terminal) / capture-delta (direct) | `supervise/terminal.rs:395-412,439-447`; `supervise.rs:252,510`; envelope field `deadlines.idleMs` (`packages/run-supervisor/contracts/envelope.v3.json:77`) | Yes, generic for all CLIs, but never fires here (idle 5400000 > timeout 2100000). Also unknown: pi may redraw a spinner or clock every second, which counts as "changed" and keeps resetting it. |
| Screen provider-stop detector (`quota_on`, `screen_login`) | `terminal/mod.rs:256,619`; wordings `direct/mod.rs:151` `is_quota_limit` | Wired for pi, but wording list covers only codex-style sentences ("you've hit your usage limit", "usage limit has been reached", "individual quota reached"). Login: "no api key found for X" is covered. No 402 / "requires more credits" wording. |
| Same wordings on the Node side | `src/runner/dispatch/provider-auth-failure.mjs:50` `QUOTA_LIMIT_PATTERNS`, `:57` | Same gap. |
| Node post-stop screen scan | `settle-attempt.mjs:127` `screenSaysProviderStop` has extra loose patterns (rate limit, too many requests) | Applied only when the receipt reason matches `terminal:(blocked\|needs-human\|delivery-unknown)`; an `idle` or `soft-deadline` timeout is not scanned. |
| Headless idle timeout | `src/runner/dispatch/transport.mjs:517-532` | Not used for pi seats (terminal mode). |
| Visibility heartbeat | `visibility-session.mjs:61`, `recovery-planner.mjs:55` | Driver liveness, not agent progress. |

Why idle was set that long: commit `e643192bd` (2026-10-16) "give silent headless workers 90 minutes before the idle kill". It was meant for headless workers, but the same key now governs terminal seats (`assignment-runner.mjs:2048`), where it overrides the 5-minute default. `docs/specs/runner.md:3190` still documents "default idle 5 minutes if config sets no `idleTimeoutMs`".

Note on the evidence: the 402 seats (rows 1 and 2) ended by COOK closing the pane (`carrier-lost`, `gate-lost`), and the two flash stalls ended on `execution-timeout`. "Counters frozen" came from the status line; the supervisor hashes the whole visible screen, so one animated element is enough to defeat idle.

## 3. What pi prints on a 402

No verbatim text exists in the repo or the evidence report. The report records only a paraphrase: 402 "requires more credits ... can only afford ~10-24k of 384000 max_tokens", repeated many times as `previous_errors`, then the pane sat idle. The 402 hits found under `.fgos/assignments` are codex usage-limit lines, not pi. `stderr.log` of a pi terminal seat holds only `carrier-lost`/`gate-lost`, and `stdout.log` falls back to the screen tail (`settle-attempt.mjs`, `readTail(capture.stdout) || screenText`).

Minimal capture (no spend needed once a 402 recurs): copy the visible pane text before closing it. Persisted already per seat: `herdr-diagnosis.json` (has `detectionScreen`) and `visibility.json` in `.fgos/assignments/<unitRunId>/<role>/<n>/runs/<nn>/`. A cheaper offline route: put a stub OpenRouter endpoint returning HTTP 402 behind pi's base URL in a throwaway HOME and read pi's own screen; that needs pi config (key names only) and is the lead's call.

## 4. Fix shapes

### Shape A (recommended): teach the existing detectors pi's 402 wording and let idle fire

Doors extended, none added: the quota wording list (Rust `is_quota_limit` and Node `QUOTA_LIMIT_PATTERNS`, already kept as two copies) and the `terminalAdapterOutcome` reason test.

Files:
- `packages/agent-protocol/rust/src/direct/mod.rs` (`is_quota_limit`: add the OpenRouter 402 sentence, anchored at line start like the others).
- `src/runner/dispatch/provider-auth-failure.mjs` (`QUOTA_LIMIT_PATTERNS`: same sentence).
- `src/run-supervisor/steps/settle-attempt.mjs` (`terminalAdapterOutcome`: also read the screen when the stop reason is `idle`, so an idle stop on a provider screen settles `provider-limit`; today only blocked/needs-human/delivery-unknown do).
- `docs/specs/runner.md` (one fact: pi 402 wording and the idle rule), `CHANGELOG.md` `[Unreleased]`.

Needs the verbatim 402 line first (section 3); without it the pattern is a guess and the paraphrase "requires more credits" is the only anchor.

Net size: about +10 lines production, +2 vectors. Owning tests: `packages/agent-protocol/contracts/fixtures/terminal/pi/vectors.json` and `.../direct/pi/vectors.json` (run by `packages/agent-protocol/rust/tests/terminal_vectors.rs` / `direct_vectors.rs`) for the wording; the existing settle-attempt test file for the idle-reads-screen branch.

Risk: low. A false match ends a healthy seat, so keep the line-start anchor and the "state is not working" guard already in `detect_completed`. Does not fix a stall with no provider text (the flash stalls): those still need idle (Shape B).

### Shape B: make idle fire for terminal seats (config and clamp)

Door extended: `idleTimeoutMs` at `assignment-runner.mjs:2048` plus the existing config validation `config.mjs:2016`.

Files: `src/runner/dispatch/assignment-runner.mjs` (terminal seats use `min(cfg.idleTimeoutMs, DEFAULT_IDLE_TIMEOUT_MS)` or a separate terminal key), or only `.fgos/config.yaml` (set `idleTimeoutMs` back to 300000-600000 and let headless take it too). The config-only variant is zero code but also shortens headless workers, which `e643192bd` deliberately lengthened.

Net size: 1 to 3 lines of code, or 1 config line. Owning test: `packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs` already owns idle behaviour (`talive`, idle cases at 217-257); the envelope-building choice is proved in the assignment-runner test that asserts `idleTimeoutMs` (extend that).

Risk: medium. Unknown whether pi's screen animates (spinner, elapsed clock). If it does, idle never fires and this shape does nothing for the flash stalls, so first confirm with one captured pane sampled twice a minute apart (read `visible` twice, compare). Also a legitimately long silent pi turn (large review) would be killed at the new limit; the stall evidence (counters frozen 13 min) suggests 10 minutes is safe but that is an owner choice on a threshold.

### Recommendation

Do **A first, then B only if the screen-animation check shows idle can fire**. A resolves the named 402 case through the door that already makes `provider-limit` and quarantines the account, and the walk then moves to the next candidate (what the lead wants). B is the only thing that reaches the no-text stalls, but its effect cannot be predicted until pi's idle screen is sampled. Ship A and the capture request together so the 402 text anchors the pattern.

## Unresolved questions

1. What exact sentence does pi show on an OpenRouter 402? (Needed to write the pattern; COOK has promised a verbatim copy.)
2. Does pi's idle screen change on its own (spinner or clock), defeating the screen-hash idle timer? One two-sample read of a stalled pane answers it.
3. Owner choice: may terminal seats have a shorter idle limit than headless workers (the 90-minute value was set for headless on 2026-10-16)?
