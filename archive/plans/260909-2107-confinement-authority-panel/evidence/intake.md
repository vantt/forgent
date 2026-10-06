# Intake — Confinement Authority for fgOS dispatch

**Coordination id:** `aap-260909-fgos-confinement-authority`
**Protocol:** `core.coordination-protocol.architecture-advisory-panel-v1` (1.0.0)
**Driver:** coordinator-driver (this session)
**PROJECT_ROOT:** `/home/vantt/projects/forgentX` (this repo — self-referential: fgOS advising on its own architecture)
**Date:** 2026-09-09

## Raw ask, verbatim (no interpretation applied)

> "Cho tôi một architecture panel để thiết kế Confinement Authority cho fgOS
> dispatch. Hãy xác định component boundary, component parent, canonical
> contracts, backend abstraction, default implementation đơn giản và lộ
> trình mở rộng. Ghi toàn bộ discussion và quyết định cuối vào một file."

Six explicit sub-asks named by the person:
1. Component boundary — what Confinement Authority owns vs. does not own.
2. Component parent — where it sits in the tree, who calls it, what it calls.
3. Canonical contracts — input/output shape, verbs/API surface.
4. Backend abstraction — interface separable from a concrete implementation.
5. Default implementation — simplest thing that runs now (KISS/YAGNI).
6. Expansion roadmap — order of adding backends/capabilities later, not all at once.

Deliverable requirement stated by the person: record the full discussion
(the panel's actual debate) and the final decision in **one file**.

## Roster resolved (Phase 1, coordinator-only)

Per the skill's own Executor Roster table — three provider families for
real diversity (Claude / GPT via codex / Gemini via agy), all three
proven-registered live in `.fgos/config.json` (confirmed via `dispatch.mjs
decide --has-live-task-access`, all three returned
`{"mechanism":"out-of-process","configured":true}`):

| Role | Executor | Tier |
|---|---|---|
| lead-advisor | claude-bwrap | critical |
| context-investigator | codex-readonly | standard |
| system-shaper | claude-bwrap | analytical |
| alternative-shaper | agy-bwrap | analytical |
| constraint-advocate | codex-readonly | analytical |
| architecture-critic | codex-readonly (fresh assignment) | analytical |
| synthesizer | claude-bwrap | critical |
| red-team | agy-bwrap | critical |

## Phase 4 (Ask Reluctantly) — no Decision Request sent

Applying the three-test discipline before any question would reach the
person:
- The six sub-asks are already concrete and repository-grounded, not
  vague ("EOD/intraday" style ambiguity does not apply here).
- Nothing here is user-exclusive that the repo cannot answer (no pricing,
  no compliance boundary, no contractual fact).
- Real prior art already exists to scout: `.fgos/config.json`'s
  `claude-bwrap`/`agy-bwrap`/`codex-readonly` executor definitions already
  describe an ad-hoc, config-comment-level confinement scheme (bwrap
  mounts, writable exceptions) — whether "Confinement Authority" means
  formalizing that into a real named component is exactly what
  `investigate-context` + the shapers should determine from evidence, not
  something to ask the person up front.

**Decision: zero Decision Requests at intake.** Proceed straight to
Phase 1 dispatch (`interpret-request`, `investigate-context`).
