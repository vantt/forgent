# fgOS stage-skills Task-delegation audit (tsk-29i) — locked decisions

## Feature boundary

`fgos-coding-exploring/SKILL.md` (commit `2bc193d`, corrected `8c1dab1`) gained a
hard rule forbidding ad hoc Agent/Task-tool delegation for its own
scout/reasoning steps: a live session already holding full context should
do that work itself (Bash/Grep/`rg`/Read/WebSearch), not re-derive it one
layer down through a spawned subagent — the same waste class `tsk-1ni`
found in `judgeDiscovery`'s blind cli-spawn. A step that genuinely needs a
different backend (cheaper model, cross-provider, isolation) routes
through the existing capacity-dispatch mechanism
(`.claude/skills/_shared/capacity-dispatch-fallback.md`) instead.

This item audits the other coding-domain stage-skills for the same gap and
applies the equivalent fix where it's real: `fgos-coding-planning`,
`fgos-coding-validating`, `fgos-coding-implement` (the item's own original text),
widened to also cover `fgos-coding-driving` (D2 below).

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | `fgos-coding-validating` gets a new, parallel Task-tool/capacity-dispatch hard rule of its own — it does not rely on its existing D6 "no second reader/review pass" rule to already cover this. Reason: D6 is scoped to a different concern (no multi-pass review ceremony, explicitly out of scope this slice) and says nothing about Task-tool delegation or the capacity-dispatch escape valve the other files' rule points to. User chose explicit consistency across all 3 skills over relying on the narrower existing rule. |
| D2 | Audit scope widens past the item's original text (which named only `fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`) to also cover `fgos-coding-driving`, the mechanical stage-dispatch loop those 3 skills sit under. |

## Scout evidence

- Read `fgos-coding-planning/SKILL.md` (241 lines), `fgos-coding-validating/SKILL.md`
  (207 lines), `fgos-coding-implement/SKILL.md` (181 lines),
  `fgos-coding-driving/SKILL.md` (already read earlier this session) in
  full.
- `rg capacity-dispatch-fallback ...` — only real consumer today is
  `fgos-submit-assist` (`docs/how-to/reuse-the-shared-capacity-dispatch-
  fallback-fragment.md`'s own precedent); none of the 4 audited skills
  reference it yet.
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus registered, `status: "present"`, but the repo's own hook
  reported the index stale (last indexed `251d0b5`) right after the prior
  commit — per `CLAUDE.md`'s gate this reads **degraded**, not full: a
  present-but-possibly-stale index. This item produces no code and no
  proof points, so the posture is recorded here informationally only, same
  as `fgos-coding-exploring`'s own step 1 already does — it never gates or
  reshapes the questions above.
- Per-file finding:
  - **`fgos-coding-planning`** — same gap as `fgos-coding-exploring` had: no rule at all
    governs whether its own reasoning steps (step 3 "Approach"/risk-map,
    step 4 "Shape") should be done directly vs. delegated. Needs the
    equivalent rule, worded against this skill's own actual reasoning
    surface.
  - **`fgos-coding-implement`** — same gap: no rule at all. Its own
    reasoning surface is step 2 "Implement" (and, narrower, step 4's Iron
    Law classification). Needs the equivalent rule.
  - **`fgos-coding-validating`** — has a related but narrower existing rule
    ("Do not dispatch a second reader or a review pass over this plan...
    out of scope this slice (cite D6)") — same spirit (keep judgment in
    this one session) but framed around review-pass ceremony, not
    Task-tool delegation specifically, and carries no capacity-dispatch
    escape valve. Per D1, gets its own explicit parallel rule rather than
    leaning on D6 alone.
  - **`fgos-coding-driving`** — audited, **no gap, no change**. This skill
    is a pure mechanical stage-dispatch loop with no scout/reasoning
    surface of its own to protect (its own hard rules explicitly forbid it
    from re-deriving anything a stage-skill decides — "never
    second-guesses or repeats a stage-skill's own gate"). The risk this
    audit is closing is fully covered by the invoked stage-skills' own
    rules (post-fix); adding a duplicate rule here would guard against
    work this skill never does.

## Outstanding questions deferred to planning

None — this is a doc-only prose change (mirrored hard rules across 3
skill files, in the same shape already proven on `fgos-coding-exploring`), no
implementation-only detail left for `fgos-coding-planning` to resolve.

## References

- `.claude/skills/fgos-coding-exploring/SKILL.md` — the precedent rule this item
  mirrors (post-correction, commit `8c1dab1`).
- `.claude/skills/_shared/capacity-dispatch-fallback.md` — the
  capacity-dispatch escape valve every mirrored rule points to.
- `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-
  cli-spawn.md` — Native-First Dispatch Doctrine, the rule's own governing
  reference.
- `test/skills/fgos-mirror.test.mjs` — the byte-identical
  `.claude/skills/`/`.agents/skills/` mirror test every edit here must
  keep passing.
