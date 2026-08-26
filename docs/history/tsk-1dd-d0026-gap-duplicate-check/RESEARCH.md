# RESEARCH.md — tsk-1dd

## Round 1 (2026-08-26, discovery stage)

**Asked:** Do the item's 4 evidence citations still hold — is D0026's
"missing automatic judgment layer" gap still undocumented/unresolved in
`docs/specs/runner.md`, `docs/how-to/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md`,
`src/runner/dispatch/mechanism.mjs`, and `docs/architect/dispatch-control-plane-redesign.md`?

**Checked:**
- `docs/specs/runner.md` around the "Lớp còn thiếu" section (~line 1811-1868,
  the item's cited line 1787 falls inside rule 2's prose, not the gap
  sentence itself, which sits a few paragraphs later): read live.
- `docs/architect/dispatch-control-plane-redesign.md` line 15 and a full
  `grep -n "0026|has-live-task-access|judgment layer|Native-First|LLM"`
  sweep of the file: read live.
- `src/runner/dispatch/mechanism.mjs` lines 1-90 (`decideDispatchMechanism`,
  `decideExecutorDispatchMechanism`): read live.
- `docs/how-to/wire-a-skill-through-the-native-vs-cli-spawn-dispatch-decision.md`
  lines 20-45: read live.
- `git log -1 -S "Lớp còn thiếu — LLM đủ thông minh"` and
  `-S "concrete result of D0026's 4 done phases"` on both doc files: git
  history.
- `git merge-base --is-ancestor <commit> HEAD` for the reconciliation
  commit against the current worktree's branch base.
- `fgos show tsk-17m --json`: work-item state.
- `docs/history/d0026-narrative-reconciliation/plan.md` (tsk-17m's own
  plan): read live.

**Found:**
- `docs/specs/runner.md`'s "Lớp còn thiếu" section ALREADY reads: "Hiện nay
  4 trong 5 pha triển khai doctrine (`tsk-1ni`, `tsk-27y`, `tsk-53h`,
  `tsk-3ik`) đã HOÀN THÀNH, và Pha 5 (`tsk-6db`, mở rộng native detection
  sang `agy`) được hoãn lại có chủ đích (deferred/YAGNI, chưa có consumer
  thật) — không phải gap chưa được giải quyết." — plus a full paragraph
  naming the deliberate narrowing (4-factor LLM vision -> 3 factors
  resolved mechanically at config-time + 1 runtime factor collapsed into
  caller-declared `--has-live-task-access`), citing
  `src/runner/dispatch/mechanism.mjs:42`/`:82`, and a 5-phase status table
  marking Pha 1-4 "Done" and Pha 5 "Hoãn / Deferred (YAGNI)". The stale
  phrase `CHƯA có lớp quyết định` no longer exists anywhere in the doc
  (`rg` for it returns zero hits repo-wide).
- `docs/architect/dispatch-control-plane-redesign.md` line 15 ALREADY
  cross-references this exact narrative: "...this command is the concrete
  result of D0026's 4 done phases, with phase 5 extending native detection
  to agy deliberately deferred per `docs/specs/runner.md`'s 'Lớp còn thiếu
  — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào' section".
- `src/runner/dispatch/mechanism.mjs` docblocks (lines 20-24, 60-64)
  explicitly state `hasLiveTaskAccess` is "Never inferred here (no
  environment probing, no heuristic) — the caller self-declares this" —
  confirms dispatch core stays deterministic/mechanical over a
  caller-supplied boolean, matching the docs.
- `docs/how-to/...dispatch-decision.md` line 36-37 already states:
  "This is a self-declaration by the caller, never an environment probe." —
  matches acceptance criterion "docs distinguish caller judgment from
  dispatch-core mechanism selection."
- No file anywhere in `docs/architect|specs|how-to` or `src/runner/dispatch`
  claims DispatchPlan auto-detects live soul/provider (checked via `rg` for
  "tự động phát hiện|auto-detect|tự nhận biết|tự dò").
- **Root cause of the mismatch:** all of the above was landed by commit
  `7120a3ed` — "docs: reconcile D0026 native dispatch doctrine narrative
  (tsk-17m)" (2026-08-26 14:56:20 +0700) — on branch `fgw/tsk-17m`, work
  item `tsk-17m` (title: "Cập nhật narrative 'Lớp còn thiếu' của D0026
  trong docs/specs/runner.md sau khi 4/5 pha đã…", status: `delivered`).
  `git merge-base --is-ancestor 7120a3ed HEAD` confirms this commit is
  already an ancestor of the current worktree's base — it landed on `main`
  roughly 90 minutes BEFORE `tsk-1dd` was submitted (16:18). tsk-17m's own
  `plan.md` describes an IDENTICAL scope: same 2 files
  (`docs/specs/runner.md` + `docs/architect/dispatch-control-plane-
  redesign.md`), same cite points (`mechanism.mjs:42`/`:82`), same
  resolution direction (supersede/clarify: 4/5 phases done, Pha 5
  deferred/YAGNI), and even the exact same `verify` string now recorded on
  `tsk-17m`'s own work record as `tsk-1dd`'s submitted text proposed.
- `tsk-1dd`'s own required-decision framing ("choose supersede/clarify vs
  deferred") is answered by this evidence: **direction 1 (supersede/
  clarify)** is what actually shipped and is already live in every cited
  doc.

**Remaining open:** none on the factual question. `tsk-1dd` is a duplicate
of already-delivered `tsk-17m` — every acceptance criterion in `tsk-1dd`'s
own description is already satisfied by content currently on `main`. This
is a downstream (planning-stage) scoping/closure judgment, not a discovery
ambiguity — flagged here for `fgos-coding-planning` to act on.
