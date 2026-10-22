---
title: "Herdr pane launch survives shell and agent start screens"
description: "Wait for a ready shell before typing the launcher, start panes with shell update prompts off, and dismiss an agent's start banner before the brief is typed."
status: completed
priority: P1
effort: 12.5h
branch: main
tags: [terminal-control, run-supervisor, agent-protocol, herdr, reliability]
blockedBy: []
blocks: []
created: 2026-10-22
---

# Herdr pane launch survives shell and agent start screens

Backlog item `p-a178ca5c` (docs/backlog.md:63). Scout input: `reports/scout-pane-launch-prior-art.md`. Red team: `reports/red-team-*.md`, adjudicated below.

## Outcome and acceptance criteria (exactly the item's done column)

- **A.** A pane launch does not depend on the user's interactive shell state: the launcher line is typed only after the pane's shell has proved it executes commands (and only while the shell itself holds the foreground), AND panes fgOS creates start with the shell's update prompt off.
- **B.** Delivery waits for the agent's input to be ready: a known start banner is dismissed and readiness re-awaited before the brief is typed.
- **C.** Tests cover (1) a shell that prints a prompt on start and swallows a key, (2) an agent with a start banner.

Non-goals: touching the `foreground-not-agent` gate (`core.rs:465,473`, `core.rs:529`, `port.rs:151`, `route.rs:203`, port contract `:58,103`, `terminal.rs:53,474-477`); changing the user's shell, rc files or oh-my-zsh; the `activity_start` launch path; direct (non-terminal) mode; any other CLI's behaviour.

## Prior art (what existed, what was reused, what was missing)

| Question | Answer (evidence) |
|---|---|
| Did a "ready shell" wait or update-prompt suppression ever exist? | No. `git log -S` on DISABLE_AUTO_UPDATE / oh-my-zsh / wait_for_ready: none (scout). The removed Node `herdr-round.mjs` (`ec9d41c23`) also typed into a shell. |
| Reused | `AllocateRequest.env` -> `pane_split --env` / `tab create --env` (`core.rs:278,283,722`, `port.rs:97`, `driver/herdr.rs:458-474`); `Driver::read_screen` + `read.screen` (`driver/mod.rs:170`, `core.rs:483`); `identity::is_bare_shell` (`identity.rs:42`) and `process_info`; `store.has_marker` (`store.rs:109`); `pane_run` typing door; `AgentIo::send` keys + `Profile` data table + vector harness (`terminal/mod.rs:~181`, `tests/terminal_vectors.rs`); `identify_root` garble detection (`core.rs:426`); route config pattern of `launchIdentifyTimeoutMs` (`route.rs:143`, a code default, not a user setting). |
| Missing | A shell-ready proof before the launch line; a quiet-shell env default; a `Profile` field for start banners (agy fixture `vectors.json:427` records a turn "refused by the start-up announcement banner", never handled); fakes whose `pane read` shows typed-line output (`fake-herdr-pane.py:144-158`, `test/helpers/fake-herdr-pane.mjs:143-157,216-223`). |
| Verified omz facts (read-only, `~/.oh-my-zsh/tools/check_for_upgrade.sh`) | The prompt is `read -r -k 1` (`:281`); y/Y/Enter update, any other key prints a reminder (`:283-287`). Input already typed ahead when the prompt would draw skips the prompt and prints the reminder (`has_typed_input` branch, `:263`): so the incident is a timing window (the line arrives after the prompt is drawn), and a line that arrives early is not swallowed. `DISABLE_AUTO_UPDATE=true` -> mode `disabled`; `DISABLE_UPDATE_PROMPT=true` -> mode `auto` = silently UPDATES the user's install, forbidden (`:18-19`). Both vars are read only when no `zstyle ':omz:update' mode` is set (`:15`). |

<!-- Updated: Red Team 2026-10-22 -->
## Design

### Data flow

```
allocate(request) -> core adds DISABLE_AUTO_UPDATE=true (request env wins) -> herdr tab create / pane split --env
launch(key, spec):
  need(pane.run | read.screen | process.info)           // before anything is typed or recorded
  has_marker(launch-requested)? -> NotStarted, pane.run delta 0
  wait_for_shell(pane)  (deadline shell_ready_timeout_ms, default 10 s, injectable clock):
      each round: process_info -> foreground must be the pane's shell itself (is_bare_shell), else type nothing, keep waiting
                  pane gone (pane_liveness) -> Err(unknown), no spin
      type probe #n (n <= 3):   printf '%s%s\n' fgos-ok- <nonce_n>     nonce_n = fresh random hex (no y/Y in the alphabet)
      poll read_screen(recent-unwrapped, 40 lines) for the JOINED token  fgos-ok-<nonce_n>  (any probe's nonce typed by THIS launch)
      retype only if the previous probe was consumed without the token (its nonce visible in an echo or a "not found" line)
         or after backoff = timeout/3; never more than 3 probes
      timeout -> NotStarted("pane shell did not become ready in time"), no marker written
  foreground still the shell? -> publish_marker(launch-requested)   (false -> NotStarted)
  pane_run(launch_line)  (unchanged, still no `exec`) -> identify_root (unchanged, 5 s)
supervisor drive: await_ready(adapter)
  each iteration, before inspect: blocked/trust classification first; a start-banner marker (and not blocked) -> send dismiss key,
      then wait for the screen to change before any second press (max 2) and restart the settle clocks
  a ready verdict is never returned while a banner marker is on screen -> deliver_brief
```

### Decisions

1. **Ready-shell handshake (generic, shell-agnostic).** A command the shell executes correctly proves it is past any start prompt. The proof is the *output* `fgos-ok-<nonce>`, which never appears in the typed echo (`fgos-ok- <nonce>`). omz's `[Y/n]` read looks idle with the shell in the foreground, so no idle/foreground/stillness test can separate it from a prompt. The probe goes through `pane_run` inside `core.launch`; the `send` gate is not touched.
2. **Launch-side precondition, not a gate change.** Neither the probe nor the launch line is typed unless `process_info` shows the shell itself as the only foreground process (`is_bare_shell`). A child holding the foreground (sudo, ssh, a password prompt from rc) means: type nothing, keep waiting. This is the property the `foreground-not-agent` gate protects, applied to launch typing.
3. **Probe safety, stated honestly.** The probe alphabet has no `y`/`Y` (`printf`, `fgos-ok-`, hex nonce). At most 3 probes, retyped only on evidence the previous one was consumed, or after a fixed backoff. Residual risk, recorded in the spec: a line-mode `read` in the user's rc *inside the shell* takes one probe line as its answer, and an Enter on a `[Y/n]` default-yes helper counts as yes. The first-key `read -k 1` case (the incident) is safe. The proof is anti-accident, not anti-hostile-rc: a repo hook that prints a guessed token is out of scope, which is why the nonce is random per probe and only counts for probes typed by this launch.
4. **Marker after the handshake.** `launch-requested` is published after the handshake succeeds and just before the launch line (its meaning stays "the launch line may now be typed"; probes are not a launch). A timeout, a crash or a stop during the handshake therefore leaves a plain allocated slot: relaunchable, and found by the existing bare-shell scan after `allocationGraceMs` (`core.rs:~705-712`), not parked forever as "launch-requested without launched". A refused relaunch (marker exists) types nothing. The line is still never retried once the marker exists.
5. **Timing budget (numbers).** Pre-loop blind time today: `identify_root` 5 s + `HELLO_LIMIT` 15 s = 20 s with no stop poll (`terminal.rs:561-577`, `supervise.rs:170`). The heartbeat is display-only, "nothing decides from it" (`docs/platform/run-supervisor/spec.md:77`), so a gap there is not a liveness signal. The handshake adds at most `shell_ready_timeout_ms` = **10 s** (default, injectable; slow shells are served by queued probes that still prove readiness when they run late, within that window), so the pre-loop worst case is 30 s plus at most one hung herdr call (`DEFAULT_TIMEOUT_MS` 15 s, `driver/herdr.rs:23`; the loop checks the deadline between calls). A pane that vanishes ends the handshake at once (liveness check), no spin. `allocationGraceMs` margin (60 s, `GRACE_MARGIN_MS` 30 s above the ready timeout, `config.mjs:22`) still holds. Alternative (supervisor-driven handshake with stop polling) rejected, see below.
6. **Quiet env at creation.** `core.allocate` adds `DISABLE_AUTO_UPDATE=true` to the env of panes the core creates, in `env_pairs` (`core.rs:722`); request env wins. Not an fgOS config key and no file/tool is expected, so no `fgos setup`/`fgos doctor` registration (AGENTS.md gate answered: no new config default the platform must manage). Spec states: the variable reaches the pane's whole process tree (inert for anything but oh-my-zsh), and a user `zstyle` mode overrides it, where the handshake carries correctness.
7. **Start banner as data.** `Profile.start_banners: &[StartBanner { marker, dismiss_key }]`. agy: `{ marker: "meet gemini", dismiss_key: "esc" }`. The marker must be specific to the modal start banner: the footer `esc to dismiss` is printed on agy's normal ready screen too (`agy/ready.txt:14`, `draft-in-composer.txt`), `meet gemini` is in no recorded fixture and matches the backlog evidence ("Meet Gemini 4 Argon"). Other CLIs: empty list.

### Rejected options

| Option | Why rejected | Reverse when |
|---|---|---|
| Launcher as the pane's own command | herdr has no spawn-with-argv: `pane split`, `tab create`, `workspace create` take only `--cwd`/`--env`. The shell must stay the parent (`--die-with-parent`, retained panes; `launch_line` has no `exec` by design, `core_failures.rs:62,90-92`). | herdr adds a pane-command option that keeps a shell parent: pass the launcher at creation, delete the probe. |
| Env only (`DISABLE_AUTO_UPDATE`) | omz-only, ignored under a user zstyle mode, nothing for other start prompts. Kept as the cheap first half. | Never as the sole fix. |
| `DISABLE_UPDATE_PROMPT=true` | Silently updates the user's oh-my-zsh. | Never. |
| Scrub `DISABLE_AUTO_UPDATE` in `launch_line` (`env -u`) | Edits the launch line contract (`core_failures.rs:62` asserts it) and the sandbox env path for an inert variable; documented instead. | A tool in an agent tree is found to read the variable. |
| `herdr pane wait-output --match` as the primitive | `herdr pane wait-output --help`: "searched immediately, including existing output, then polled": it does not match only new output, needs a new driver method plus a declared capability, and its blocking `--timeout` coarsens cancel/gone detection. A random per-probe nonce already gives the "only new output" property with the existing `read.screen`. | herdr adds a since-now/after-cursor option: swap the poll for it. |
| Wait for prompt text / idle / foreground | Prompts are user-defined; omz's read looks idle with the shell in the foreground. | Never as proof. |
| Type launch line without Enter, read back, Ctrl-U, retry | Echo parsing breaks on wrapped lines, right-prompts, redraws. | A driver offers a line-buffer read. |
| First probe without Enter / Ctrl-C as probe | Without Enter nothing proves execution; Ctrl-C does not answer a `read -k 1`. | Never. |
| Pre-emptive `n` keystroke | Corrupts the line when no prompt exists. | Never. |
| Supervisor-driven handshake (callback or own step with stop polling) | Adds a cancel/heartbeat hook to the `launch` port for a window (10 s) smaller than the pre-loop windows the supervisor already has; heartbeat is display-only. | Measured stop latency in the handshake is judged too long, or the default is raised above ~20 s. |
| Timeout as an envelope field / registered `terminal.*` setting | Follows `launchIdentifyTimeoutMs` (code default plus optional route field); a setting would need `config.mjs`, `registrations.mjs` and doctor entries for a value nobody has needed to tune. | A real rc takes longer than 10 s: promote to a registered setting. |
| `activity_start` (herdr agent start) | Different path for known agent kinds, not our gate launcher. | The launcher becomes a herdr-known agent kind. |
| Per-CLI banner code in `await_ready` | Data field is as small and vector-testable. | n/a |

## Phases

| # | Phase | Capability | Depends on | Effort |
|---|---|---|---|---|
| 1 | [Ready-shell handshake, fakes and contracts](phase-01-ready-shell-handshake.md) | execute | none | 5h |
| 2 | [Quiet shell env at allocation](phase-02-quiet-shell-env.md) | execute | 1 (same files) | 1.5h |
| 3 | [Agent start-banner step](phase-03-agent-start-banner.md) | execute | none (independent crate; run after 2) | 3.5h |
| 4 | [Supervisor wiring proof, spec, changelog](phase-04-supervisor-proof-and-docs.md) | execute | 1, 2, 3 | 2.5h |

Every phase leaves the tree green on its own verify (phase 1 carries the fake updates that the handshake requires). Phases 1 and 2 share `core.rs`, `core_failures.rs`, the terminal-control spec: serial, in order. The conductor runs all four serially in one worktree.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Probe token never visible on real herdr (source/lines semantics, redraw, rc that clears screen) | M x H | `recent-unwrapped`, 40 lines, retype on consumed-evidence; live smoke on a real pane recorded in phase 1 (zsh+omz, bash if available): if herdr is running it is required evidence before phase 2 starts; if not available it is recorded "not run" and the risk stays open. |
| Probe typed into a non-shell foreground (sudo/ssh prompt) | M x H | Foreground precondition, zero `pane.run` test. |
| Line-mode prompt in rc consumes a probe | L x M | Max 3 probes, evidence-gated; residual risk in spec. |
| Slow rc > 10 s | L x M | Queued probe still proves readiness when it runs; timeout -> NotStarted leaves a relaunchable plain slot (no marker). Reversal in the table above. |
| Handshake window blind to stop | M x L | Fits the budget with numbers (Decision 5). |
| Fakes cannot show probe output | H x H | Phase 1 updates both fakes, all Node and Rust suites using them run in phase 1 verify. |
| Banner key hits a trust dialog or a live prompt | L x H | Banner step skipped when `classify_blocked` is set; one screen change required between presses; max 2. |
| Probe lines remain in retained panes (at most 3) | H x L | Accepted decision A. |

## Test matrix (one owning proof per behaviour)

| Behaviour | Owning proof | Layer |
|---|---|---|
| Probe typed only with shell foreground; launch line only after the joined token; swallow (omz read) -> retyped; typed-ahead branch not swallowed; line-mode read -> at most 3 probes then NotStarted; non-shell foreground -> zero `pane.run`; never ready -> NotStarted, no marker, relaunchable, scan reports the plain slot; refused relaunch -> `pane.run` delta 0; probe has no y/Y; nonce differs per probe; stale scrollback token cannot satisfy | `packages/terminal-control/rust/tests/core_failures.rs` (MemDriver scripted shells) | core |
| Quiet env added, caller env wins, attached pane none; `--env` reaches the herdr CLI | `core_failures.rs` + `herdr_driver_fake.rs` (`each_capability_runs_the_expected_command`) | core / driver |
| Banner: dismissed then ready; stuck -> 2 presses then not-ready; banner under `working`/no detector; banner with trust dialog -> blocked, no key; stale frame -> one press; ready screen with `esc to dismiss` footer -> ready, no key | `packages/agent-protocol/rust/tests/terminal_vectors.rs` + `contracts/fixtures/terminal/agy/vectors.json` | adapter |
| Handshake not-ready surfaces as `terminal-launch-not-started` receipt with steps still running (boundary mapping only, no repeat of core cases) | `packages/run-supervisor/rust/tests/supervise_terminal_fake_herdr.rs` (one test) | boundary |
| Every existing fake-pane supervisor/Node flow still launches through the handshake | existing suites, unchanged assertions (wiring by default) | boundary |

Full gates after phase 4: `cargo test --workspace --no-fail-fast` and `npm test`.

## Rollback

Each phase is one commit touching its own files; revert in reverse order, each leaves a green tree. Phase 1 revert restores direct typing and the old marker order. Phase 3 is an additive `Profile` field with an empty default. No persisted shape changes: allocation record and markers keep their format (only *when* `launch-requested` is written changes, spec and port contract updated in phase 1).

## Backwards compatibility

`internal-route` `config.shellReadyTimeoutMs` is optional and additive. Plain launch now also needs `read.screen` and `process.info` (checked before anything is typed or recorded, so a driver lacking them refuses without burning the slot); herdr declares both. A launch whose handshake fails leaves no `launch-requested` marker (before: the line was typed unconditionally). No user config key or env var is introduced.

## Decisions recorded for the owner (made by the lead within the item's scope)

- **A. Probe lines visible in retained panes (at most 3).** Accepted. Reverse when herdr offers a scrollback clear or a hidden-input door, or an owner objects to pane noise.
- **B. `DISABLE_AUTO_UPDATE=true` reaches the agent's process tree.** Accepted as inert; documented in the terminal-control spec and CHANGELOG. Reverse when a tool in an agent tree is found to read it (then scrub in the launch line and update `core_failures.rs:62`).
- **C. Banner handling for agy only, as data.** Accepted. Reverse (add entries) when a banner is observed on another CLI; reverse the agy marker when a real capture shows different wording.

## Docs impact

`docs/platform/terminal-control/spec.md` (§3 launch rule, §4 marker order, §6 capabilities, §11 failure table, env note), `packages/terminal-control/contracts/terminal-control.port.v1.json` launch block, `docs/platform/run-supervisor/spec.md` §5.3 (handshake, timing budget), `docs/platform/agent-protocol/spec.md` §5.1 Ready row, `CHANGELOG.md` `[Unreleased]`. Conductor: set backlog row `p-a178ca5c` state per the board protocol on land.

## Red Team Review

### Session — 2026-10-22
**Findings:** 25 (24 accepted, 1 rejected)
**Severity breakdown:** 2 Critical, 12 High, 11 Medium

Reports: `reports/red-team-security.md` (S), `reports/red-team-failure-modes.md` (F), `reports/red-team-assumptions.md` (A).

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| F1 / A2 | Fakes cannot show probe output; phase 1 red until phase 4; probe shifts per-command screen counters and clobbers pid/runCommand | Critical | Accept | Phase 1 (fakes, verify), Phase 4 |
| A1 | "esc to dismiss" is on agy's ready screen (`ready.txt:14`); the new marker would break agy | Critical | Accept (marker `meet gemini`, ready-footer vector) | Phase 3, plan Decision 7 |
| S1 | Probe typed into any foreground, up to ten times | High | Accept (foreground precondition, zero `pane.run` test, max 3) | Phase 1, plan Decision 2 |
| S2 / A4 / F4 | "Starts with p cannot answer yes" covers one key; retries answer further prompts | High | Accept (modified: y-free alphabet, max 3, evidence-gated retype, residual risk stated; the "no Enter on first probe" suggestion rejected, it proves nothing) | Phase 1, plan Decision 3, terminal-control spec |
| S4 | `need("read.screen")` after the one-shot marker; port contract launch block not updated | High | Accept | Phase 1 (checks first, contract in Files) |
| F2 | Up to 20 s blind time in `launch` | High | Accept (budget with numbers; heartbeat is display-only; gone-pane abort) | Phase 1, plan Decision 5, run-supervisor spec |
| F3 / A3 | Slow shell burns the slot; "nothing typed that executes" claim false | High | Accept (modified: marker moved after the handshake, claim corrected) | Phase 1, plan Decision 4 |
| F5 | Crash mid-handshake leaves launch-requested without launched, unspecified | High | Accept (marker move removes the state; both states tested; spec row) | Phase 1, terminal-control spec §11 |
| F6 | Banner step misses the paths the real loop takes; second `esc` on stale frame | High | Accept (check first each iteration, after blocked classification, screen-change between presses) | Phase 3 |
| A6 | Core claim (token readable on real herdr) gated by optional smoke | High | Accept (modified: required evidence when herdr is available; `wait-output` evaluated and rejected, reversal stated) | Phase 1, plan Rejected options |
| S3 / A7 | Time-derived nonce, scrollback/reused pane, no entropy | Medium | Accept (random hex per probe; token only from probes typed by this launch) | Phase 1 |
| S5 | Banner `esc` may hit trust dialog | Medium | Accept | Phase 3 |
| S6 / F8 / A8 | `DISABLE_AUTO_UPDATE` leaks to agent tree; "inert" unproven; gate waved away | Medium | Accept (modified: documented in spec + CHANGELOG, registration rationale stated; `env -u` scrub rejected, reversal stated) | Phase 2, Phase 4, plan Decisions 6, B |
| S7 | `CoreConfig` literal at `run-supervisor tests/support/herdr.rs:84` missing; verify did not compile it | Medium | Accept | Phase 1 |
| S8 / F7 | Weakened double-launch proof; contradictory counts; wiring proof duplicates core case; slow real-clock tests | Medium | Accept (exact before/after `pane.run` delta, tiny injected timeouts, phase 4 reduced to the boundary mapping only) | Phase 1, Phase 4 |
| A5 | omz omits the typed-ahead branch; fixtures model a phantom swallow | Medium | Accept | plan Prior art, Phase 1 fixtures |
| A9 | Criterion B is met for one CLI only; the omp incident is not covered | Medium | **Reject**: the omp "Still starting" incident had the shell cause (item text, case 1), which the handshake fixes for every CLI; the banner list is data, other CLIs get entries when a banner is observed (decision C). Verification source: backlog row `p-a178ca5c` text. | n/a |

### Whole-Plan Consistency Sweep

Decision deltas applied: foreground precondition; y-free random-nonce probes max 3; marker after handshake and `has_marker` pre-check; needs before marker; 10 s budget with numbers; fakes in phase 1; banner marker `meet gemini` with ordering rules; quiet env documented; phase 4 reduced to one boundary mapping proof.

Searched `plan.md` and all `phase-*.md` for: `15 s` / `15_000` (remaining uses are only `HELLO_LIMIT`, `DEFAULT_TIMEOUT_MS`, `UNRULED_READY_MS`, the existing facts, none the handshake timeout), `esc to dismiss` (remaining: only as the ready-screen footer evidence and the footer vector), `self.now()` nonce / epoch (removed), `nothing typed that executes` (removed; replaced by the corrected claim), `pane.run` count (all replaced by the before/after delta and last-call assertions), `Open decisions for the owner` (replaced by "Decisions recorded"), `fgos-ready-` (renamed `fgos-ok-` everywhere), `1.5 s` retry (replaced by evidence-gated retype plus timeout/3 backoff), `never retried` (kept, restated as "once the marker exists"). Effort 5 + 1.5 + 3.5 + 2.5 = 12.5 h matches frontmatter. Phase dependency table and ownership paragraph agree with phase files.

Unresolved (not contradictions): (1) the handshake timeout is a code default rather than an envelope-sourced value (follows `launchIdentifyTimeoutMs`); (2) a live herdr smoke is evidence-dependent on herdr being available when phase 1 runs.

## Validation Log

### Session 1 — 2026-10-22

Validation run by the COOK lead. The owner delegated plan approval inside the backlog item's done criteria (no owner wait), so the decision points below were answered by the lead, not by an interview. Questions to the owner: 0.

#### Verification Results
- Claims checked: 40 (10 per phase, independent read-only fact check)
- Verified: 38 | Failed: 2 | Unverified: 0
- Tier: Standard
- Failures (line drift only, corrected): `core.rs:393-424` → `core.rs:389-423` (phase 1); `terminal/mod.rs:236` → `:237` (phase 3, plan.md).
- Gap found and fixed: `docs/platform/terminal-control/spec.md` §4 (line 59, marker written "before the driver is asked to run anything") added to phase 1's spec edits, because the marker now follows the handshake.

#### Decisions (lead, inside the frame)
| # | Question | Decision | Reverse when |
|---|---|---|---|
| 1 | Marker `launch-requested` after the handshake (planner's design choice) | Accept: it still precedes the launch line, so the launcher is never typed twice; a timeout or crash mid-handshake leaves a relaunchable slot | A recovery path is found that needs to tell "probing" from "allocated" |
| 2 | Handshake timeout as code default 10 s plus optional route field | Accept (same pattern as `launchIdentifyTimeoutMs`) | A real rc takes longer than 10 s |
| 3 | Live herdr smoke in phase 1 | Required when `herdr` is running (it is on this machine: herdr 0.9.1); the final land also runs a real pane launch | n/a |
| 4 | Phase 1 kept as one slice (core + fakes + contracts) | Accept: the fakes must land with the core to keep the tree green | The slice fails review twice for size |
| 5 | Planner's three earlier open decisions (visible probe line, env in agent tree, agy-only banner data) | Accept, recorded as decisions A–C | per decision A–C |

### Whole-Plan Consistency Sweep
Searched all plan files for `393-424`, `mod.rs:236`, `§3 launch rule, marker order`: no stale hits remain. Phase file lists, plan.md docs-impact line and the verify commands agree. No unresolved contradictions; plan is ready for `fgos-cook`.
