# plan.md — tsk-2tk

Mode: small

No `CONTEXT.md` exists for this feature — discovery (stage `discovery`,
`RESEARCH.md` round 1) returned `clear` directly, skipping `exploring`
entirely, per `fgos-coding-planning`'s own direct-entry fallback. Every
claim below traces to `RESEARCH.md` round 1 or to the item's own
description (grounded there in `grep`/`read` output, quoted verbatim).

## Approach

Single mechanical concern: `tsk-224` collapsed `planApprove` +
`validateApprove` into one gate and deleted `canAutoApproveValidate`, but
8 prose/comment sites across the repo still describe the old 3-gate
architecture or cite the deleted function. None of the 8 sites carry
executable logic — every edit is a string/comment change, verified by
`RESEARCH.md` round 1's full-repo grep (8 confirmed, 6 candidates checked
and ruled out as legitimate historical narration or still-accurate
backward-compat description — see RESEARCH.md Q1).

Risk map:

| Site | Risk | Proof point |
|---|---|---|
| `plugins/fgOS/skills/cook/SKILL.md` (single copy — confirmed via `ls .claude/skills`/`.agents/skills`: `cook` is a launcher skill, not mirrored, only `fgos-*` dev-skills are) | low | none needed beyond `npm test` staying green — no mirror test covers launcher skills |
| `.claude/skills/fgos-coding-planning/SKILL.md` (+ 2 mirrors, `.agents/skills` and `plugins/fgOS/skills`) | low | `fgos-mirror.test.mjs` (byte-identical across 3 roots) |
| `src/cli/command-registry.mjs:386,391` | low | `command-registry.test.mjs`'s existing drift guards must still pass (they don't cover gate names, but must not regress on function/stage names) |
| `docs/reference/gate-bypass-config.md` | none (docs-only, no test) | manual read-back against current `fgos-coding-validating/SKILL.md` merged-gate prose |
| `src/intake/plan.mjs:531-538` comment | none (comment-only) | `npm test` must stay green (no behavior touched) |
| 3× `docs/explanation/*.md` | none (docs-only) | manual read-back, past-tense per user decision |

No proof point here leans on blast-radius/impact-analysis evidence — no
symbol is renamed, added, or removed, so the `CLAUDE.md` impact-analysis
capability gate does not apply to this item.

Order: skill-file edits first (highest-traffic, live-read files), then
`command-registry.mjs`, then the remaining docs — no dependency between
them, order is just "most load-bearing first" per the parent cook
session's own risk ranking.

## Shape

One piece, no split — all 8 edits are the same mechanical fix (retire
references to a deleted gate/function), reversible as a single commit,
too small and too interdependent (same root cause) to honestly divide
into independently workable pieces.

Concrete edits:

1. `plugins/fgOS/skills/cook/SKILL.md:7-9,29-32` (single copy, confirmed —
   `cook` is a launcher skill under `plugins/fgOS/skills` only, not mirrored
   to `.claude/skills`/`.agents/skills`) — replace "3 gate" /
   `canAutoApprove`/`canAutoApproveValidate` wording with the current
   2-gate (`fgos-coding-exploring`'s `contextApprove` +
   `fgos-coding-validating`'s merged gate) description.
2. `.claude/skills/fgos-coding-planning/SKILL.md:190-193` (+ 2 mirrors) —
   remove the "at this skill's own Gate below" claim; point instead at
   `fgos-coding-validating`'s gate (matches line 326's own "This skill has
   no gate").
3. `src/cli/command-registry.mjs:386,391` — rewrite the `gate-approve`
   verb's description to name 2 gates, and correct the `planApprove`
   value's attribution (legacy-only value, kept for backward-compat replay
   of historical records per `GATE_APPROVE_GATES`, not a live write target
   any skill still uses).
4. `docs/reference/gate-bypass-config.md:9,83-86,99` — update the "Gate-step
   wiring" section to describe the current single merged gate at
   `fgos-coding-validating`, not the old 2-independent-gates wiring.
5. `src/intake/plan.mjs:531-538` — fix the comment so it no longer claims
   `fgos-coding-planning` currently writes `gates[id].planApprove.verify`;
   describe it as a legacy-record fallback instead.
6. `docs/explanation/gate-bypass-design.md:173-178` — shift present-tense
   framing of `canAutoApproveValidate` to past tense (it existed, was later
   deleted by `tsk-224`).
7. `docs/explanation/why-cooks-never-auto-approve-prose-lost-to-gate-bypass.md:13-14,20-21,52`
   — same past-tense correction.
8. `docs/explanation/why-heavy-keywords-matching-moved-to-word-boundaries.md:81-82`
   — same past-tense correction.

## Outstanding questions

None
