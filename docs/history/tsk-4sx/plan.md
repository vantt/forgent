# Plan: fgos-coding-planning must set docsRef for clear-discovery items (tsk-4sx)

Mode: **standard** (2-3 flags: existing covered behavior — modifies core
workflow prose other stage-skills and the heavy-tier `delivered` gate
depend on; weak proof around the area — a prose change can only be
grep/`npm test`-verified, real semantic correctness only shows up in
later live dispatches per `docs/how-to/write-verify-for-a-skill-prose-
change.md`; public-contract-adjacent — changes what `assertPlanEvidence`
can find. No hard-gate flag: this fix ADDS a check, it does not remove
one). No lane was handed off (entered via `/fgOS:pick` → `fgos-coding-
driving`, not through `fgos-routing`'s Orient), so this lane was decided
directly per `fgos-routing`'s own Mode-gate subsection.

## No `CONTEXT.md` — description + research is the source of truth

Discovery returned `clear` (no product decision left open — see
`RESEARCH.md` round 1: option (b), auto-registering `docsRef`, wins on
real evidence over option (a), forcing feature-dir naming to the item id).
`exploring` was skipped, so there is no `CONTEXT.md`. Every decision below
cites the item's own description or `RESEARCH.md` round 1 instead of a
D-ID.

## Impact-analysis capability posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
registered and `present`, but `gitnexus://repo/forgent/context` reports
`"⚠️ Index is 347 commits behind HEAD"` — stale. Posture: **degraded**.
Not load-bearing here regardless: the change is a single-file prose edit
to `.agents/skills/fgos-coding-planning/SKILL.md`, a file GitNexus's
JS-symbol index would not meaningfully cover anyway (it is not executable
code). Blast radius is bounded by direct inspection (grep + `npm test`'s
existing skill-prose invariant tests), not blast-radius tooling.

## Approach

Single piece, no split candidates — one prose addition to one file.
`fgos graph --json`'s `topUnblock`/`criticalPath` do not surface tsk-4sx
(fresh standalone item, no deps/children), so there is no multi-piece
ordering decision.

### Risk map

| Component | How risky | What proves it |
|---|---|---|
| `.agents/skills/fgos-coding-planning/SKILL.md` Bootstrap step (step 1) | medium — every future heavy-risk item that reaches `planning` via a clear-discovery verdict routes through this prose; a wrong instruction here silently breaks the SAME class of item this bug was found on | `npm test` (skill-prose invariant tests, e.g. `no registry description names a judge* function that no longer exists`-style guards) stays green; grep confirms the new instruction text exists; manual trace of the instruction against `assertPlanEvidence`'s own two candidate paths (`src/state/store.mjs:499-518`) to confirm the `--docs-ref` value this step writes actually matches one of those two candidates |
| Scope containment (this item must not touch `src/`) | low — a prose-only fix that accidentally touches executable code would be scope creep beyond what was researched/approved | `! git diff --name-only main...HEAD \| grep -q '^src/'` (verify's own NEGATIVE clause) |

## Shape

Add one instruction to `fgos-coding-planning/SKILL.md`'s Bootstrap step
(step 1, the same step that currently only *reads* `docsRef`): immediately
after this session creates a NEW `docs/history/<feature>/` directory (the
direct-entry-fallback branch, i.e. no existing `docsRef` was found),
before writing `plan.md` into it, call:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/bin/fgos.mjs" edit "<item-id>" --docs-ref "docs/history/<feature>/" --dir "$root"
```

Skip this call when `docsRef` is already set (the existing feature dir
was found, not created fresh) — never overwrite a value already pointing
somewhere real. This mirrors the exact shape `tsk-61j` independently
proposed for `fgos-coding-exploring`'s own CONTEXT.md-creation step
(`RESEARCH.md` round 1, finding 2) — same trigger condition (`docsRef`
empty after creating a new feature dir), same call shape, kept consistent
between the two sibling skills rather than solved two different ways.

Concrete cases to prove against:
- An item whose discovery verdict was `clear` (no `CONTEXT.md`, no prior
  `docsRef`) reaching `planning` and creating a fresh feature dir — the
  new instruction fires, `docsRef` ends up set to that dir.
- An item that already has `docsRef` (came through `exploring`, or a
  second planning round re-entering the same feature dir) — the new
  instruction is a no-op, `docsRef` is left untouched (never overwritten).
- The value written matches one of `assertPlanEvidence`'s own two
  candidate paths (`work.docsRef + '/plan.md'`), so a heavy-risk item
  landing later via `fgos approve` finds its `plan.md` without a
  `git mv` workaround (the exact failure `tsk-bc7` hit).

## Verify

```
npm test && grep -q "docs-ref" .agents/skills/fgos-coding-planning/SKILL.md && grep -q "docsRef" .agents/skills/fgos-coding-planning/SKILL.md && ! git diff --name-only main...HEAD | grep -q '^src/'
```

Already set as the item's real verify at discovery time (research round
1's proposal, per `docs/how-to/write-verify-for-a-skill-prose-change.md`'s
own POSITIVE+NEGATIVE+`npm test` shape). No sync edit needed.

## Outstanding questions

None
