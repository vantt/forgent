# Phase 7: Core domain-free shaper and unsure domain verdict

## Inputs (read first)
- SM-D3, SM-D8, SM-D9, SM-D12 in `docs/history/secretary-miu/DISCUSSION.md`.
- `domains/coding/skills/fgos-coding-shaping/SKILL.md` (no-item path at ~l.16-49, seven-section DISCUSSION.md shape
  ~l.102, `discussion:` marker `settled|paused` ~l.243-303, exits to `fgos-coding-exploring`/`fgos-coding-planning`).
- `core/skills/fgos-clarifying/SKILL.md` l.80-90 and l.125-130 (defaults to `coding`).
- `domains/*/AGENTS.md` (doctrine files the core shaper reads), `src/setup/skill-wrappers.mjs` (`discoverCanonicalSkills`).

## Files this phase may write
`core/skills/fgos-shaping/**` (new), `core/skills/fgos-clarifying/**`, `domains/coding/skills/fgos-coding-shaping/**`,
`plugins/fgOS/skills/**`, `.agents/skills/**`, `.claude/skills/**` (renders).

## Steps
1. Create `core/skills/fgos-shaping/SKILL.md`: the domain-free no-item shaping path lifted from the coding skill
   (DISCUSSION.md shape, the `discussion:` marker, resumable rounds, decision table, hand-off block), with the domain
   doctrine read from `domains/<d>/AGENTS.md` and the discussion path from `fgos convention path --kind discussion`.
   Add the `QUESTIONS.md` format (SM-D9): one row per open owner question in the five-part form with `status: open|answered`,
   an id, and the answer once given; the shaper writes it and moves an answered question into the decision log.
2. Reduce `fgos-coding-shaping` to a coding overlay: it keeps only coding-specific parts (item path, `fgos pick`,
   branch rules, coding exits) and points to `fgos-shaping` for the shared shape. Nothing generic stays duplicated.
3. `fgos-clarifying`: replace the `coding` default with an explicit unsure verdict (`domain: null`, `domainUnsure: true`,
   plus a one-line question naming the candidate domains); say callers ask the person one line and never assume `coding`.
4. `npm run build:skills`; commit sources and renders together.

## Verify
- `npm run build:skills` leaves no diff after the commit (`git status --short` clean).
- `node --test` on the render/wrapper tests (`rg -l "renderSkillSurfaces|discoverCanonicalSkills" test`) passes.
- `rg -n "return \`coding\`|defaulting to \`coding\`" core/skills/fgos-clarifying` finds nothing.

## Rollback
`git revert` the phase commit; rebuild renders.
