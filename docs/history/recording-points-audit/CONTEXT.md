# recording-points-audit — CONTEXT

**Item:** tsk-ma4 — audit fgOS's existing GHI-NHẬN (capture) points: scattered enough,
or still a hole — step (1) of tsk-4op, must finish before designing the
tổng-hợp-viết (synthesis) layer's batch-trigger.
**Stage at write time:** clarify → decompose
**Opened:** 2026-07-29

---

## 1. Feature boundary

This item produces exactly one artifact: a comparison report under
`plans/reports/*recording-points-audit*.md`. No code changes. The report
puts two columns side by side and reaches a verdict:

- **Column A** — what fgOS captures today, automatically, without a person,
  scattered across the item lifecycle (not batched at close).
- **Column B** — what the tổng-hợp-viết (synthesis) layer actually needs to
  write a real end-user document (per `fgos-coding-compounding` and the
  `gate-dialogue-continuity` D3 record).

The report must answer definitively: (a) is there a real gap and where,
(b) should STR70a be built before tsk-4op, or does the gap live elsewhere,
(c) if STR70a is needed, how much work is its D4 prerequisite (fold `actor`
into the gate record).

This item is narrower than its parent tsk-4op: tsk-4op sets the full
two-layer redesign (capture layer vs. batch-synthesis layer, dep-opening
signal, superseding decision `9c67c3d1`); tsk-ma4 only proves or disproves
tsk-4op's founding hypothesis (does Column A capture the WHAT but not the
WHY/tradeoffs) before any of that redesign work is scoped.

## Locked decisions

### D1 — Column A search widens beyond the six named mechanisms

The item body names six known capture points: RUL13 outcome
(`src/runner/claim-port.mjs:150-160` predicted, `src/runner/loop.mjs:712-722`
+ `bin/fgos.mjs:1448/1493` actual), RUL20 settlement (clarify-pass/answer/
close), RUL21 close-time learning (`composeLearning`,
`src/state/store.mjs:497-503`), RUL32 reason (latest-wins on
reject/gate-break), blocked friction (`src/state/store.mjs:668-676`), and
`gates[id]` (`src/state/replay.mjs:166-172`).

Acceptance clause 1 requires the list be "ĐẦY ĐỦ" (FULL). Rather than
treat the six named mechanisms as the complete set on the item author's
word, the executing session also greps `docs/specs/work-state.md` and
`src/` for any other RUL-numbered or ad-hoc capture point not already
named, so the "full" claim in the final report is proven by a real search,
not assumed from the pre-supplied list.

**Why:** acceptance clause 1's own wording ("ĐẦY ĐỦ") is the material
signal — a narrower reading would leave the report's central claim
resting on an unverified assumption.
**Cost if wrong:** a few extra minutes of grep against `work-state.md`/
`src`; worst case the wider search turns up nothing new and the six-item
list stands confirmed rather than assumed.

### D2 — bee doc-types-lifecycle report is in-scope evidence

tsk-ma4's own `refs` list two documents: the compound-cadence-merge-tiering
report (`plans/reports/from-scan-team-to-planning-260729-1614-verify-scope-compound-cadence-merge-tiering-report.md`)
and the `gate-dialogue-continuity` CONTEXT.md. It does not list the bee
precedent report that parent tsk-4op leans on as its core evidence:
`/home/vantt/projects/forgent/plans/reports/scan-260728-1233-bee-doc-types-lifecycle-report.md`
(11 bee doc types, several generated mid-lifecycle rather than at close —
`CONTEXT.md`/`decisions.jsonl` as the batch-distillation prototype tsk-4op
cites).

The executing session treats this bee report as in-scope evidence
alongside tsk-ma4's own two refs, since tsk-ma4 exists specifically to
test the hypothesis that report backs. Excluding it would weaken the
report's own central comparison with evidence the parent item already
vetted and cited directly.

**Why:** tsk-ma4's job is to prove/disprove tsk-4op's founding hypothesis;
that hypothesis's own cited evidence is the natural comparison baseline.
**Cost if wrong:** report cites one extra cross-checkout source; no
downside if the bee report turns out to add nothing beyond what
`gate-dialogue-continuity` D3 already establishes.

## 3. Pinned terms

- **Column A / Column B** — as defined in §1 above; not the item's own
  wording verbatim but the same split the item body draws (existing
  automatic capture vs. what synthesis needs).
- **"Full" (ĐẦY ĐỦ)** — per D1: proven by search, not merely the six
  pre-listed mechanisms taken on faith.

## 4. Scout evidence (this session, 2026-07-29)

- No prior `judgeDiscovery` verdict recorded for tsk-ma4 (`view.discovery`
  empty) — no earlier question to build on or reconcile.
- Live state check against the item's stated 2026-07-29 preliminary scan:
  108 work items total (item said 107), 23 with `docsRef` (item said 22),
  17 `docs/history/*/CONTEXT.md` dirs (item said 16), 3 items with
  `acceptance` (item said 2). Small same-day drift from ongoing work in
  this session (e.g. this claim itself); directionally consistent, no
  contradiction with the item's own numbers.
- `docs/backlog.md:30-33` in this repo (forgentX) already carries
  paraphrased STR69a/STR69b/STR70a/STR70b entries citing the same
  D1-D6 decisions as the `gate-dialogue-continuity` CONTEXT.md — confirms
  that doc's content is genuine, already load-bearing on this repo's own
  backlog, not a stray or broken reference.
- `gate-dialogue-continuity/CONTEXT.md` (cited by the item) lives in a
  sibling local checkout of the same repo
  (`/home/vantt/projects/forgent/repo`, same `origin` remote as this
  checkout, different branch/commit state) rather than in this
  `forgentX` worktree's own `docs/history/`. This mirrors the same
  cross-checkout citation pattern parent tsk-4op itself already uses for
  the bee report (D2 above) — an established, deliberate convention in
  this project, not a path error to fix.

## 5. Canonical references

- `docs/backlog.md:30-33` (forgentX, this repo) — STR69a/69b/70a/70b entries.
- `/home/vantt/projects/forgent/docs/history/gate-dialogue-continuity/CONTEXT.md`
  (sibling checkout) — D1-D6, especially D3 (three-part settle record:
  why/exchange-points/tradeoffs) and D4 (actor-fold prerequisite).
- `.claude/skills/fgos-coding-compounding/SKILL.md:45-51` — synthesis layer's real
  input contract (`fgos check <id>` + `docs/history/<feature>/`).
- `/home/vantt/projects/forgent/plans/reports/scan-260728-1233-bee-doc-types-lifecycle-report.md`
  (sibling checkout, per D2) — bee's 11 doc types, early-CONTEXT.md
  precedent.

## 6. Outstanding questions deferred to planning/execution

- None deferred as open product decisions — D1 and D2 above close the
  two material gray areas found. Any remaining choices (e.g. exact
  citation format, whether to recompute the item's percentages live at
  report-write time vs. cite the item's own 2026-07-29 numbers with a
  drift note) are implementer-level detail, not product decisions, and
  are left to the executing session's judgment.
