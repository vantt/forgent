# RESEARCH: tsk-3i6 — D3 goal-check rationale trace

## Round 1 — 2026-08-24 (stage discovery)

**Asked:** does `docs/routing-handoff-contract.md`'s D3 citation still point at
a deleted file, is the only surviving rationale the beehive upstream pattern,
and do the two fgOS-specific evidence sources (agy cwd bug, fanout worktree
race) the item cites actually exist and support the claim?

**Checked — `docs/routing-handoff-contract.md`:**
- Line 13, 22, 25, 66 all cite `D3` inline for four separate claims (4-part
  prompt shape, goal-check re-run, runner-single-writer, `verify` runs as a
  real shell command).
- Line 81 (`## Tham chiếu`): `` `docs/history/phase-2-routing/CONTEXT.md` D3/D4. ``
  — the sole named source for all of the above.
- The document has no `## Lịch sử quyết định` section of its own; line 81 is
  the only citation trail it carries.

**Checked — `docs/history/phase-2-routing/CONTEXT.md` existence:**
- `git ls-files | grep -i phase-2-routing` → no match (not tracked in HEAD).
- `ls docs/history/phase-2-routing/` → `No such file or directory`.
- `git log --oneline -- docs/history/phase-2-routing/CONTEXT.md` → 2 commits:
  `49e5a42d docs(phase-2-routing): CONTEXT locked — D1-D7 + pinned
  assumptions, Gate 1 approved` (creation) then
  `e9999863 chore: untrack workshop tree from product repo` (removal from the
  product repo's tracked tree). Confirmed: the file existed, then was
  deliberately untracked — not a rename or a path drift.

**Checked — `docs/distillery/sources/beehive.md`, entry
`goal-check-every-done-yourself` (lines 493-499):**
- What: "The orchestrator never trusts a worker's self-reported `[DONE]`: it
  re-runs the recorded verify command fresh and runs a frozen-judge check…"
- Notable: "Framed against a specific failure mode — 'moved not passed' —
  where a check is altered to make a stale assumption look re-verified
  instead of actually re-verifying."
- Confirmed: this framing is about an **adversarial/self-reporting swarm
  worker** gaming its own check, not fgOS's own threat model.

**Checked — `docs/history/agy-cwd-fidelity/RESEARCH.md`:** exists. Round 1
(2026-08-17) traces a real, verified incident: `agy` (an executor CLI) was
spawned with the correct `cwd` (confirmed via `dispatch.mjs`'s
`cliSpawnAdapter`/`spawnWorker`, cwd threaded through faithfully to
`child_process.spawn`), yet the agent itself operated on and committed to a
DIFFERENT item's worktree (`fgw/tsk-1lv`), exiting successfully with
completely wrong content. This is unintentional worker drift, not an
adversarial actor — a threat model report-worker-self-report alone cannot
catch, because the worker's own exit code and self-report were both green.

**Checked — `.agents/skills/fgos-fanout/SKILL.md` lines 159-166:** confirmed
present. "Known hazard: concurrent worktree-entering dispatch requires
skill-layer self-recovery" — "Real incidents have found that this harness's
own worktree-isolation state is held at **session** level, not per-agent:
concurrent worktree-entry calls from sibling dispatched Agents clobber the
same shared flag, so Edit, Write, or Bash calls get refused pointing at a
sibling's worktree… and the coordinating session's own working directory can
drift into a sibling's worktree mid-run." Also a real, previously-recorded
incident, not a hypothetical.

**Checked — "always a human reviews before merge" premise:** the skill
roster (`/fgOS:merge-loop`, `/fgOS:cleanup-loop`, `/fgOS:discover-loop`,
`/fgOS:plan-loop`) confirms unattended batch auto-approve/auto-merge runs
exist and are the intended direction, matching `AGENTS.md`'s product
priority #2 ("Release con người" — hệ thống tự vận hành ở mức cao nhất có
thể, chỉ hỏi người khi thật sự cần). A re-verify-independently gate that
assumes a human always looks first does not hold under that operating mode.

**Checked — which area spec owns D3's narrative, per `AGENTS.md`'s
"narrative lives in docs/specs/<area>.md's own 'Lịch sử quyết định'
sections" convention:** `docs/specs/runner.md` already carries a
`## Lịch sử quyết định retired từ docs/decisions/` section (line 1117) with
an `### 0005 — Runner & cô lập worker` entry whose "Quyết định" already
states "`verify` của item do RUNNER tự chạy làm goal-check độc lập — không
tin lời worker tự khai" — this is D3's substance, already homed in the
correct spec, just without the fgOS-specific evidence citations the item
wants added. `docs/routing-handoff-contract.md` itself is not a
`docs/specs/*.md` area spec (no `## Lịch sử quyết định` section of its own),
consistent with the routing convention.

**What remains open:** none — every sub-question resolved with a direct
repo citation. The single edit surface for the eventual `planning` stage is
`docs/specs/runner.md`'s ADR `0005` section (add the two fgOS-specific
evidence citations + the "unattended batch, not always-reviewed" correction
to its Hệ quả), and `docs/routing-handoff-contract.md:81`'s dead citation
line should point at the ADR-0005 entry in `runner.md` instead of the
deleted `CONTEXT.md` path.

**Verdict:** clear.
