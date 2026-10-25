---
phase: 8
title: "Live through the real entry, and the hook cost in each CLI"
status: pending
priority: P1
effort: "6h"
dependencies: [7]
---

# Phase 8: Live through the real entry

## Goal

Re-run V4's live suite through the product door, `fgos hook mailbox` and `fgos mailbox …` behind a shim, on Claude Code, and run one Codex case. Then measure the no-mail hook p95 inside each CLI's real hook environment against `mailbox.hook.p95TargetMs` (50 ms).

## Context

- Plan sections "Never activate a release from the branch", "Live-call rule" and "Benign content only".
- The harness is `test/live/mailbox-claude.live.mjs`, with its guards in `scripts/lib/mailbox-live-cli.mjs` and `scripts/lib/codex-auth-guard.mjs`. Its V4 fix-step changes are M2 (auth set-aside) and H2 (the corrected comment).
- V4 cases and facts (`plans/reports/research-261022-1825-mailbox-v4-live-suite.md`):
  - L1: registration, mid-step, stop gate, `send`, `inbox`;
  - L2: the wrong-shape detector;
  - the waits use `until [ -f go.txt ]; do sleep 2; done`;
  - every run has an isolated `HOME` linking `~/.claude`.
- Report: `fgos convention path --kind report --type research --slug mailbox-v5-live-suite-and-hook-cost`.

## Harness changes (dry-run proven before any real spend)

1. **New mode `product`** (the default for V5 cases). Per case, the harness:
   - builds the host once per phase with `CARGO_BUILD_JOBS=4 cargo build --locked --release -p fgos` (`CARGO_TARGET_DIR` as in the worktree), and records the binary's sha256 and the branch commit in `result.json` (review L1: `run` refuses when HEAD or the hash changed since `check`);
   - lays out `<case>/project/` as a fresh `git init` repo with `.fgos/`;
   - writes `<case>/project/.fgos/installation/bin/fgos` as a byte copy of `/home/vantt/projects/forgent/.fgos/installation/bin/fgos`, read-only, never modified, with its sha256 recorded;
   - writes `<case>/project/.fgos/installation/activation.json` with `{"status":"ready","releasePath":"<case>/release"}` and only the fields the shim reads;
   - copies the built host to `<case>/release/bin/fgos`. No legacy-node payload is staged. The mailbox kind and the `mailbox` verbs never need it, and a case that reaches legacy fails loudly, which is the intended check;
   - installs the hook rows **with the product installer**: it calls `installClaudeHook(<case>/project)` / `installCodexHook(<case>/project)` from `src/setup/agent-hooks.mjs` in the harness process, so the live run also proves the installed shape;
   - puts `<case>/project/.fgos/installation/bin` first on the CLI's `PATH`, so the model's `fgos mailbox send …` reaches the same shim (the owner's zsh `fgos` function is avoided by the V4 `ZDOTDIR`/`HOME` isolation);
   - records `git -C <case>/project rev-parse --show-toplevel`. The case runs from the project root, so `fgos_git::main_checkout_root` sees a main checkout.

   **The deviation from spec §14 V5 ("through the shim")** goes into the report verbatim: same shim bytes, private activation, never the shared one.
2. **Trace for T1/T2.** The CLI is started under:

   ```bash
   strace -f --seccomp-bpf -qq -ttt -e trace=execve,exit_group -o <case>/trace/t
   ```

   The parser reads the trace to find each hook process: the `execve` of `/bin/sh` with our command line (Claude) or of the shim (Codex), plus its subtree. Per hook call it reports the wall time from that `execve` to the `exit_group` of the outermost hook process. A dry-run against the stub CLI proves the parser on a trace with known sleeps.
3. **Clean-up (review H2 item 3).** After each Claude case, list and then remove `~/.claude/projects/<encoded case project dir>`, and name it in `result.json`. After each Codex case, run the auth set-aside check, and refuse further Codex cases while a set-aside file exists.

## Cases (each once; benign content only; dry-run first)

| Case | What it proves | Pass condition |
|---|---|---|
| **L1** Claude | the first hook registers the head under the real entry; a message sent during a tool reaches the next `PostToolUse` inline (not moved to a file: the transcript's `hook_additional_context` holds the whole frame); a `wake` message after the last tool is taken at `Stop` and the next Stop passes; the model's `fgos mailbox send` gets the `turn` sentence; `fgos mailbox inbox` lists without change; then the harness sends one more message and the prompt's last step runs `fgos mailbox inbox --claim`, whose output holds the frame and leaves it `offered` | every check as in V4 L1, plus inline delivery and the claim |
| **L2** Claude | the wrong-shape `Stop` row is detected by the installer's `check` (`checkClaudeHook` reports it) and by the transcript; mail stays `recorded` | as V4 L2 |
| **C1** Codex (`codex exec`, `--dangerously-bypass-hook-trust`) | registration from the payload's `session_id` with the head at the Codex executable; mid-step delivery inline; a `wake` message taken at `Stop`; the model's `fgos mailbox send` (from its tool, whose `CODEX_THREAD_ID` is the sender) is recorded | each step observed in the rollout and the snapshot |
| **T1** Claude | (a) about 120 trivial tool calls (`echo`, asked as one long numbered list), no mail; (b) then the harness sends one `wake:false` message larger than the step bound, so it is held back, and the model makes 20 more calls; one Stop; the trace gives per-call hook time | **N ≥ 80 steady-state no-mail `PostToolUse` calls**, the first (registering) call excluded and reported apart; held-back calls reported apart (`last_drain_at` writes the snapshot there; RT17). **Pass: steady-state p95 ≤ 50 ms.** A run with fewer than 80 steady calls is a harness failure, reported and not re-run without the controller |
| **T2** Codex | the same for Codex | as T1 |

## Out-of-CLI comparison (no model, no spend)

The same shim and host, the recorded `post-tool-use.json` fixture as stdin, and the same environment allowlist, run 200 times from a `sh -c` parent in the case project. Report p50 and p95. Split the time into the shim (`sh` + `sed` + `exec`), the resolver, and the hold, using one `strace -c` run. This tells phase 9 and owner question 3 where the time goes. It is labelled "outside the CLI", and it is never the number checked against the target.

## Steps

1. Sync. `free -g` ≥ 8. No other heavy gate is running.
2. Harness changes, each with its dry-run on the stub CLI (`node test/live/mailbox-claude.live.mjs check …`). Commit.
3. Run L1, L2, C1, T1 and T2, one at a time, with an observable exit:

   ```bash
   timeout 1800 node test/live/mailbox-claude.live.mjs run <case> > .fgos/runtime/tmp/mailbox-v5/p8-<case>.log 2>&1
   echo "exit=$?"
   tail -n 40 .fgos/runtime/tmp/mailbox-v5/p8-<case>.log
   ```

   Redirect, never pipe: after `| tee`, `$?` is `tee`'s status (RT18). The harness also writes its own exit reason into `result.json`.

   Never two cases at once. A failed case is reported, not re-run, unless the controller authorizes it.
4. Run the out-of-CLI comparison.
5. Write the report:
   - per case, the evidence (transcript or rollout lines, snapshot states, `result.json`);
   - the p95 table with N;
   - the deviation line;
   - the clean-up list;
   - the spawn markers (expected 5);
   - **the V6 precondition**, verbatim: "V6 must not run adversarial or untrusted peer content until the live harness runs the CLI confined (bwrap with the case directory writable and `~/.claude` limited to what the CLI needs) or without permission bypass, and cleans `~/.claude/projects/<case>` after each case (review H2)."

   Then run `fgos convention check --dir . -- <report>`.
6. If T1's or T2's in-CLI p95 exceeds 50 ms: mark the result in the report, name the dominant cost from step 4, and hand the controller owner question 3 (plan.md) with the numbers filled in. Do not tune anything inside this phase.
7. Commit, sync, push.

## Verification

- `node test/live/mailbox-claude.live.mjs check L1 L2 C1 T1 T2` (dry) passes before any real run.
- The report holds the five cases, the p95 table and the V6 precondition.
- The live count is 5, plus any controller-authorized re-run, labelled as such.

## Risks

- **One run per CLI is a small sample.** N ≥ 80 bounds the p95 from one session, not across sessions or machines. The report says so, and the out-of-CLI split covers variance from cold caches.
- **`strace` slows the CLI and its children.** The seccomp-bpf filter limits stops to `execve` and `exit_group`, but fork events are still traced. The report says the in-CLI numbers include strace's own cost, and gives the out-of-CLI numbers beside them. A p95 that passes under strace passes without it; a miss under strace is then re-checked only through the out-of-CLI split, never by a second paid run unless the controller asks.
- **Codex skips an untrusted hook silently.** The controlled `CODEX_HOME` plus `--dangerously-bypass-hook-trust` is what the V3/V4 recordings used. C1 fails visibly (no registration) if the hook did not run.
- **Interactive Codex ending its turn early (V4 D4)** does not apply: C1, T2 and every Codex case here use `codex exec`.

## Todo

- [x] `product` mode, binary fingerprint, private shim and activation, installer-written rows
- [x] Trace parser with a dry proof
- [x] Clean-up and the auth set-aside per case
- [x] Dry-run every case
- [x] L1, L2, C1, T1, T2 (5 real invocations), redirected, with the exit read right after
- [x] Out-of-CLI split
- [x] Report with the V6 precondition; convention check; commit; sync; push

## Notes

- Commits:
  - `83e9f04c1` the live suite through the product door (private shim, release and activation; installer-written rows; strace trace parser; `cost` and `stub` subcommands; V4 cases and demos retired);
  - `20f2c93aa` the version envelope vector lists `mailbox` (missed in phase 6);
  - `dc8e92240` and `72042d720` the workspace shim reads its activation with shell builtins only (owner question 3 default (a)), for DIST review;
  - `ed6fa1cb9` C1's long final answer, after the run;
  - the report commit below.
- Live runs: L1, L2, C1, T1, T2, once each, after their dry runs; 12 in total with phase 2's 7, the plan's ceiling. Spawn markers and evidence: the report.
- Results: L1 and L2 passed every check. C1 passed registration, the inline mid-step frame and the model's own send; its Stop check was not observed (the wake message arrived after Codex's Stop). Steady no-mail PostToolUse p95 under strace: Claude Code 68.4 ms (N = 99), Codex 78.1 ms (N = 99), both over 50 ms.
- Deviation from step 6 ("Do not tune anything inside this phase"): the controller ruled that owner question 3's default (a) applies when one cost clearly dominates. The shim did (p50 31–34 ms of 52–63 ms per call), so the shim was rewritten through its owner. Outside the CLI its p95 fell from 51.4 ms to 3.4 ms. The in-CLI re-measure needs two more live runs beyond the ceiling and waits for the controller.
- Deviation: the five runs used a byte copy of the main checkout's shim; since `dc8e92240` the suite lays out this branch's generated shim.
- Deviation: the installer's `PreToolUse` rows were removed in each case (they need the legacy-node payload, which the private release does not stage).
- Report: `plans/reports/research-261023-0345-mailbox-v5-live-suite-and-hook-cost.md`.
- Authorization (plan owner (agent), 2026-10-23, after the report): three more live runs, T1 and T2 with the builtins-only shim and C1 with the fixed harness. The V5 ceiling is now 15 (12 + 3). Same rules: dry run first, benign content only, every guard on, no retries, memory and quiet-window check before each. If a CLI's p95 stays above 50 ms, the remaining dominant cost is named and that CLI closes DONE_WITH_CONCERNS; no further optimisation without asking.
- Re-runs (2026-10-23, host `5d664f0ff`, after `check C1 T1 T2` passed): C1 21:00:10Z every check passed, the Stop gate included; T1 21:00:46Z steady p95 26.5 ms (N = 99); T2 21:03:10Z steady p95 38.1 ms (N = 99), its "held back" check reads failed because the model claimed the message through `inbox --claim`, as in the first T2. Both CLIs now meet the 50 ms target under strace. V5 live total: 15.
