# Handoff: every human-gate answer door must tell consent from clarification

Written 2026-10-08 by the lead of the decision-question-template session. Self-contained: a new chat with no history can start here. Priority: second of the two follow-ups.

## Background

Root-cause discussion (`plans/reports/prompt-261008-bloat-root-cause-discussion.md`): an owner's blind answer ("ok em làm tiếp") was recorded as authorization to expand scope. Branch `plan/261008-decision-question-template` fixed the CLI work-item path: `fgos answer <id> --approve` sets `approved: true`; heavy-risk and blast-radius split gates in `src/intake/plan.mjs` release only when `gate.approved === true` **and** the stored ask equals the exact proposal (`formatProposalAsk(verdict, reason, id)`); a plain answer re-parks. Replay fold: `src/state/replay.mjs` (approved cleared by a new ask or a plain answer).

## Problem (verified)

1. Gateway REST `post_work_answer` (`apps/fgos-gateway/src/gateway.rs` ~946-955) and MCP `answer_work` (`apps/fgos-gateway/src/mcp.rs` ~283-288) build `answer <id> --text ... --json` with no approve flag. A heavy-risk gate answered from the dashboard or MCP re-parks forever. `fgos move --answer` (`src/verbs/state/move.mjs` ~55) has no approve either.
2. Workflow human gates: `recordGateAnswer` (`src/workflow/runner.mjs` ~825-851) records any answer, the step becomes `answered`, and the runner advances (`runner.mjs` ~266). "chưa hiểu, giải thích lại" releases the gate. Usage so far: 8 workflow gate answers across all projects.

## Base and isolation

- Base the worktree on branch `plan/261008-decision-question-template` (head `cff70a5f4` or later); if merged, base on main. It owns `--approve`.
- Work only in a new worktree under `/home/vantt/projects/forgentX-worktrees/`. Never switch the shared main checkout's branch. Make `node_modules` a real directory (`cp -al /home/vantt/projects/forgentX/node_modules node_modules`).
- Start the gateway only through `fgos gateway start` if a live check needs it.

## What to do in the new chat

1. Run `ak-plan` (then `ak-plan red-team` and `ak-plan validate`). Read `AGENTS.md`, `docs/specs/reading-map.md`, `docs/specs/runner.md` (Workflow gates), the gateway spec, and `docs/routing-handoff-contract.md`.
2. One consent signal for every door: REST/MCP `approve: bool` → `--approve`; `fgos workflow answer --approve`; decide what a non-approve answer does to a Workflow gate (stay parked with the clarification as a note, mirroring the work-item path). Reuse the existing `approved` field and semantics; do not add a second consent mechanism.
3. Open point to put to the owner (template form): should every Workflow human gate require approval, or only gates that authorize work/scope?

## Rules from the decision-question session (binding)

- Plan header carries an approved frame: `paths:` and `budget:` (src lines added — deletions are free — test lines, days). Leaving the frame is a decision question.
- Every question to the owner uses `core/skills/_shared/decision-question.md`: what is happening, cause, options with cost, recommendation, scope of the answer.
- Agents never pass `--approve` on the owner's behalf unless the owner typed it or explicitly said to approve.
- Owner is addressed as "anh", you are "em"; owner writes Vietnamese.

## Not in scope

Hook installation outside the fgOS repo: `plans/reports/prompt-261008-1644-hook-install-outside-fgos-repo.md`.
