# Mailbox V6: preparation (2.1.309 recording, phases 1-3)

Date: 2026-10-23, Asia/Saigon, machine `fg-server`. Branch `mailbox/v1-v3`. Plan: `plans/261023-0049-mailbox-v6-behaviour-through-real-hook/` (phases 1-3; stage A not started).

## Live CLI invocations: 6 (outside the 1,082 ceiling's cells)

| # | Run | CLI | Exit |
|---|---|---|---|
| 1-4 | 2.1.309 recording: `dump`, `accept` (+ `check`), `subagent`, `dump --agent-head` | `claude -p` haiku, recorder's isolated-HOME guards | 0 each, version 2.1.309 before and after |
| 5 | Phase 1 benign smoke, confined | `claude -p` haiku 2.1.309 | 0 |
| 6 | Phase 1 benign smoke, confined | `codex exec -m gpt-6-luna` 0.161.0 | 0 |

The two smokes count against the ceiling, not toward any cell.

## Claude Code 2.1.309 against 2.1.308

Same structure: only `duration_ms` (three PostToolUse fixtures) and the recording source differ; `env.json`, both accepted shapes and every vector are unchanged; injection record types are the same (`attachment:hook_additional_context`, Stop `attachment:hook_blocking_error`). 2.1.309 is added to `testedAgainst`. `hookFacts.claude.measuredOn` stays 2.1.308 (no probe or ladder ran). The recorder now keeps naming every recording an earlier re-recording replaced (2.1.307 had dropped out of the source, which the contract test needs).

## Waits on V5 (checked by command)

| | Result |
|---|---|
| W1 | yes: a private shim over a release built from the branch answers `fgos hook mailbox` (exit 0) and `fgos mailbox inbox` / `send` (`send --help` routes to the legacy payload, which the private release does not stage) |
| W2, W3, W4 | yes: `cargo test -p fgos-mailbox -p fgos-mailbox-core` green (hook payloads 20, limits loader 7, verbs 8, and the rest) |
| W8 | **no**: the snapshot keeps `recorded_at` and `offered.at` only; the claim start (`InFlight`) is gone once a claim finishes. Outcome 3 (in-flight timeout) is not claimed; recorded-to-offered latency is recorded per run. |

## Phase 1: the safety gate (G-SAFE)

Step 0 answered yes to every question without a change under `src/runner/**/confinement`: the resolver gives the run directory as a writable workspace grant and a private home inside it (`tempRoot` = base), the driver copies the nested `.claude/.credentials.json` (mode 0600, own inode), and a context outside any `.fgos` tree passes the attestation check.

Tests, `test/scripts/mailbox-live-confined.test.mjs`, real bwrap 0.11.1 (9 of 9 green):

| # | Test | Falsifies |
|---|---|---|
| 1 | a confined run writes its own run directory and nothing else | a write to a sibling run, the base, the repository, a planted host file or the real `~/.claude` (all EROFS; planted hash unchanged); mutants without the masks' read-only remount or without the base bound back fail it |
| 2 | a confined run cannot read a real login store or a listed secret, and reads its own login copy | reading `~/.claude/.credentials.json` and the Codex account's `auth.json` (ENOENT), `~/.claude.json` and a planted `secrets.local.env` (empty); the masked `~/.codex` still runs the pinned Codex binary; the mutant without masks fails it |
| 3 | the falsifier: the same probes without the confined launch write the planted host file and read the planted secret | tests 1 and 2 being vacuous |
| 4 | a confined run holds a copy of its login, never a link | a link, a mode other than 0600, other bytes, the same inode |
| 5 | a send from outside reaches a head registered inside the sandbox; a send before registration is refused as an unknown name | cross-namespace resolution (the head record carries `pid 1` and its namespace), the registering hook claiming nothing, the frame not reaching the head |
| 6 | ending a confined run leaves no process, whether it ignores SIGTERM or forked a setsid child | a process left after the end |
| 7 | the orphan sweep kills a run the harness did not finish, even one whose launch facts were never written, and records it as an error before a new run starts | a sandbox outliving a SIGKILLed harness; the mutant without the run-directory scan fails it |
| 8 | two heads in two sandboxes share one record, and each receives the other's frame | the gate for phase 6 |
| 9 | a changed login copy is set aside, never deleted, keeps its run directory and stops the batch | deletion or a removable run directory; the mutant that always removes the copy fails it |

Plus `codex-auth-guard.test.mjs` 6 of 6 and `provider-credential-renewal.test.mjs` 107 of 107. Mutants run: 9, killed 7; the 2 survivors were equivalent (pid 1's death already ends the namespace) and test 7 was extended until the scan was needed.

Smokes (results under `/tmp/fgos-work/mailbox-v6-live/results/`): both logged in, registered as the sandbox's pid 1 (Claude Code's session file `1.json` names pid 1 and `procStart` 8088249, equal to the sandbox's pid 1 read from outside), message `offered`, frame in the model input (Claude Code `attachment:hook_additional_context`; Codex `response_item:message:developer`), no process left, login copy unchanged, source login unchanged. Peak memory (tree RSS): Claude Code 298 MB, Codex 235 MB.

Masks (this machine): tmpfs, read-only, over `~/.claude`, `~/.codex`, `~/.fgos`, `~/.ssh`, `~/.config/gh`, `~/.agy-homes`, `~/.gemini`, `~/.codex-tetnu`, `~/.codex-fgovn`, `~/.codex-tetcu72`; the Codex 0.161.0 release bound back read-only; an empty file over `~/.claude.json`; no `secrets.local.env` found under `~/projects` (depth 4). Argv of one run: `bwrap --ro-bind / / --dev /dev --proc /proc --tmpfs /tmp --unshare-pid --as-pid-1 <masks> --ro-bind <base> <base> --bind <run> <run> --bind <run>/home <run>/home --ro-bind <run>/ws/.fgos/installation <same> -- bash -c <fd closer> bwrap-launch <cli> …`.

## Phase 2: pre-registration

`test/scripts/mailbox-behaviour-score.test.mjs` 8 of 8; mutants 10, killed 9 (z = 1.96 against 1.959964 is equivalent at the published precision).

Frozen: `test/live/mailbox-behaviour/preregistration.json`, sha256 `484eb1c0a5a8781cc637380f6b0b84010c1676d33a5314419b8c8a19313cfb16`; seed `46d87578bfd51454`; versions Claude Code 2.1.309, Codex 0.161.0; models `haiku`, `gpt-6-luna`; 21 files, among them:

| File | sha256 |
|---|---|
| `receiver-instruction.txt` (owner Q3 A, verbatim) | `9f45682cb3bab9f9ef62a1606e0aedee26d09a64c830f6e5f16988404bd55212` |
| `task.txt` | `1a5ebaa6271152eda8429ddc33f1be668b67c948ebd288986605882d320e6aa0` |
| `scripts/lib/mailbox-behaviour-score.mjs` | `84dc8fb0e49fb2da8e331ab6302f6a6055ec7abf1eb3993746502aecf1afe36e` |
| `frame.v1.txt` | `68f30947ce8388c7048d23ea271abef2a8f8254f427e366324c4488fbaef4f22` |
| `limits.v1.json` | `d43abc99d4ea01b004e3b858367e89df33933355d2a111ecb2fb7cef43960f5a` |

Codex flags confirmed from `codex exec --help` (`-m`, `-o`, `--json`, `-c`) and the 0.161.0 binary's strings (`developer_instructions`), no session.

## Phase 3: the suite

`test/scripts/mailbox-behaviour-run.test.mjs` 6 of 6; mutants 8, killed 8. `node test/live/mailbox-behaviour.live.mjs check` exit 0: per CLI, PT and ST acted, not-acted, not-reached (twice), ST channel-mismatch, error and Q0, and one loop run per pair (CC, CX), all against stubs under the confined launch through the real shim.

## Deviations and decisions (inside the frame)

1. The frame labels a sender with no head `unregistered_` plus the first 8 characters of its id, so the senders are `planner1` (trusted, label `unregistered_planner1`) and `outsider`; the trusted list names the label. In the smoke, Claude Code called the message one "from an unregistered agent".
2. C's verbatim S0 body asks for `CANARY-B`; every canary oracle reads the name from the body. MX asks for `CANARY-MX`.
3. ST trigger for Claude Code: a quiet hook leaves no transcript record, so the send waits for the first `api-request` record after the step 4 tool result (Codex: the call's output record).
4. A PT message has no wake and the Stop gate never takes it, so a PT run can be not-reached but never channel-mismatch.
5. S4's texts are re-authored (S0's prompt files are gone); every scenario starts with one sentence naming the send command; the side work writes `side-N.txt` in the project, not under `./work`.
6. Loop test names: a head's name exists only once it registers, so `bb` starts first, `aa` starts once `bb` has registered, is told `bb`'s name and trusts it; `bb` trusts nobody, and S4-bb's peer reads "the agent that messages you".
7. Masked also `~/.agy-homes` and `~/.gemini` (agy logins); the base, under `/tmp`, is bound back read-only over the driver's private `/tmp`; the Codex last message is written in the private home.
8. `readCredentialExpiry` learned Claude Code's login file (read only, not a renewable layout); a change in `src/runner/dispatch/provider-credential-renewal.mjs`, outside `confinement/`.
9. Main's new single test door for config refused the V5 setup tests and `test/live/mailbox-claude.live.mjs`; their config writes go through the helper now (one line each in the V4 suite file).

## Pin

`node test/live/mailbox-behaviour.live.mjs pin`: detached worktree `/home/vantt/projects/forgent-worktrees/mailbox-v6-pinned` at `7dd06c7dcb692c9b07fff0d3253e6d9f03ed30da`, host built in its own target, sha256 `ac2e5e59a8c2512d620dd34d772b9445fdfcd00dba88acc6f0bcd7c4fbced610` (the same bytes the smokes ran), shim `c398aa258509dd886ac1d079ac6eeedcb8a524f79778f39b46c9eaf22a25194c`, Claude Code 2.1.309 and Codex 0.161.0 by their versioned paths, pre-registration `484eb1c0…`. `check` run from the pinned worktree reports `pin: holds`; the worktree is clean.

## Before stage A

- Owner or controller: the loop test's name rule (deviation 6) decides phase 6, not stage A.
- Outcome 3 is out (W8 no) unless V5's entry later keeps the claim start.
- Stage A runs from the pinned worktree: `cd /home/vantt/projects/forgent-worktrees/mailbox-v6-pinned && node test/live/mailbox-behaviour.live.mjs run-stage A`.
