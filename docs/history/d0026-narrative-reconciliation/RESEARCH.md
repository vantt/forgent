# Research — tsk-17m

## Round 1 — 2026-08-26

**Asked:** Does the task's claim about work-item statuses (tsk-1ni/27y/53h/3ik
done, tsk-6db todo+deferred) still hold, and do the cited doc line numbers
and code symbols still match the live repo?

**Checked:**

- `fgos list --id <id> --json` for tsk-1ni, tsk-27y, tsk-53h, tsk-3ik,
  tsk-6db.
- `docs/specs/runner.md` around lines 1787-1868 (`rg -n "CHƯA có lớp quyết
  định|Lớp còn thiếu"`, direct read of lines 1840-1880).
- `docs/architect/dispatch-control-plane-redesign.md` (`rg -n "decide.*
  command|Problem Statement"`, and `rg -n "tsk-1ni|tsk-27y|tsk-53h|tsk-3ik|
  tsk-6db|D0026"`).
- `src/runner/dispatch/mechanism.mjs` (`rg -n "^export function
  decideDispatchMechanism|^export function decideExecutorDispatchMechanism|
  hasLiveTaskAccess"`).

**Found:**

- tsk-1ni: `status: done`, `stage: executing`. Title: "fgos discover
  overwrites a locked verify command: resolveDiscovery in
  src/intake/discovery.mjs". This reads unrelated to the doctrine at first
  glance, but `docs/specs/runner.md:1866` itself frames tsk-1ni as "gap
  `readLockedContext`/verify-overwrite, bằng chứng sống cho lớp quyết định
  còn thiếu" (living evidence for the missing decision layer) — the doc's
  own Pha-1 table row (line 1856) already labels it this way. No drift:
  the task's "Pha 1 done" claim matches the doc's own framing, not a
  literal "Pha 1 built the decision layer" claim.
- tsk-27y: `status: done`, `stage: executing`. Title: "Native-First
  Dispatch Doctrine Pha 2: caller-supplied verdict protocol...". Matches.
- tsk-53h: `status: done`, `stage: executing`. Title: "Generalize the
  cli-dispatch-for-cheap-cross-provider-tasks pattern beyond
  fgos-submit-assist to any...". Matches Pha 3's row in the plan table
  (line 1858 names it as the shared native-vs-cli/spawn detection helper).
- tsk-3ik: `status: done`, `stage: executing`. Title: "Native-First
  Dispatch Doctrine Pha 4: unify fgOS's capacities.<id> config-driven
  dispatch...". Matches.
- tsk-6db: `status: todo`, `stage: discovery`. Title: "Native-First
  Dispatch Doctrine Pha 5 (deferred, low priority, YAGNI -- no concrete
  consumer yet): ...". Matches — self-noted deferred/YAGNI, not
  abandoned/forgotten.
- **Verdict: the task's "4/5 done + 1 deferred-todo" claim holds exactly,
  live-verified 2026-08-26.**
- `docs/specs/runner.md:1787` — heading "Lớp còn thiếu — LLM đủ thông minh
  để tự nhận ra khi nào dùng nhánh nào" confirmed at this exact line.
- `docs/specs/runner.md:1789` — "Hôm nay CHƯA có lớp quyết định nào tự
  động áp quy tắc 1-4 ở trên." confirmed verbatim at this exact line — the
  stale sentence the task targets.
- `docs/specs/runner.md:1852-1868` — "Kế hoạch triển khai (5 pha...)" table
  confirmed at these exact lines, rows unchanged from the task's citation.
- `docs/architect/dispatch-control-plane-redesign.md:15` — bullet `a
  `decide` command that chooses whether a target should run native/
  in-process or out-of-process;` confirmed at this exact line, inside "##
  1. Problem Statement" (line 7).
- `docs/architect/dispatch-control-plane-redesign.md` — zero hits for
  `tsk-1ni|tsk-27y|tsk-53h|tsk-3ik|tsk-6db|D0026` (rg exit 1). Confirms no
  cross-reference exists yet, exactly as the task claims.
- `src/runner/dispatch/mechanism.mjs:42` —
  `export function decideDispatchMechanism({ hasNativeMechanism,
  hasLiveTaskAccess, forceCliSpawn } = {})`.
- `src/runner/dispatch/mechanism.mjs:82` —
  `export function decideExecutorDispatchMechanism(cfg, executorId,
  { hasLiveTaskAccess = false } = {})`. Both confirmed present, matching
  the task's evidence citation for "bản thu hẹp có chủ đích".

**Still open:** none for this round — every citation in the task
description (ids, line numbers, function names, cross-reference absence)
is confirmed against live repo state as of 2026-08-26. The actual doc-edit
work (steps 2-5 in the task's "Việc cần làm") is unresearched — that is
implementation, not a discovery-stage ambiguity, and belongs to
`fgos-coding-planning`/`fgos-coding-implement`.
