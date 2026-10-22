# Journal: Mailbox V5, the native hook door, 2026-10-23

## What happened

- V5 was built on `mailbox/v1-v3` in nine phases: measurements, the bounded step claim and texts, the limits loader and breaker, the per-CLI caller check, the native `fgos hook mailbox` kind and `fgos mailbox` verbs in the host, the install table, and the live suite through the product door. 15 live CLI processes in all: the plan's 12 and three more the plan owner authorized.
- The live cases passed for Claude Code (L1, L2). Codex's C1 first missed only the Stop check, because the wake message arrived after Codex had already stopped; with a longer final answer its re-run passed every check.
- The hook cost inside each CLI missed the 50 ms target (p95 68.4 ms and 78.1 ms under strace). The trace showed the workspace shim spending 31–34 ms per call in `dirname`, `sed`, `head` and `tr` before the host even started. The shim now uses shell builtins only; outside the CLI its p95 fell from 51.4 ms to 3.4 ms. Re-run inside each CLI with the new shim, the p95 fell to 26.5 ms (Claude Code) and 38.1 ms (Codex), inside the target; the host itself is now the largest part.

## Lessons

- **Measure before choosing a resolver.** `resolve_workspace_root` looked like the right reuse; measured, it spawned 12 children (5 of them `git`) per fresh process, wrote a floor-probe repository when `PATH` changed, and had a 76 ms p95 alone. The disk-only main-checkout read already lived inside the Git driver; cutting it out as one public function gave one door instead of two.
- **A ladder needs a question it can answer.** The first context ladder put its sibling hook only on sizes above the threshold, so it could not tell per-hook from summed. The second ladder kept every step below the single-hook threshold and let only the sum cross it; one run per CLI settled it, and the bound rose from 4,608 to 8,192 bytes.
- **The CLI's shell is part of the topology.** Codex runs a hook command through the user's `$SHELL -c`. A guarded command keeps that shell, the same program the tools run in, at the head position; the plain command is exec'd away. The install row follows the measurement, not the style of the repository's own hooks.
- **A per-call strace tree names the cost.** Splitting each hook call into the CLI's shell, the shim and the host showed which part dominated, so owner question 3's default could be applied to one named cost instead of tuning everything.
- **A model reads the pointer line.** In T2, Codex ran `fgos mailbox inbox --claim` the first time it saw "messages too large for this channel are waiting". The harness's own check expected the message to stay unread and so reported a failure for the designed path; checks must follow the design, not only the stub.
- **Shipped scripts are product.** The fixture recorder's dry-run CLI ran hook and tool commands through a shell inside `scripts/`, which the one-door scan rightly counts as unresolved Git sites. It moved to `test/live/`.
- **Text-file-busy is a test-harness fact.** Writing an executable in one thread while another forks gives ETXTBSY on exec. Writing the file from a child process, and retrying the spawn on `ExecutableFileBusy`, kept the shim and host tests stable.
