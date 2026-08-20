# plan.md — tsk-1uf: background-execution guidance for fgos return / fgos approve verify runs

Mode: tiny

## What gap this closes

`fgos return`/`fgos approve` both re-run an item's own full `verify`
command (typically `npm test && ...`), confirmed live at 224-386 seconds
(tsk-vuj, 2026-08-20) — well past the Bash tool's own 120-second default
foreground timeout. Neither
`.agents/skills/fgos-coding-implement/references/return-mechanics.md`'s
`fgos return <id>` bash block nor `plugins/fgOS/skills/approve/SKILL.md`'s
step 6 `fgos approve`/`sync-root` bash block tells a calling session to
start these commands backgrounded proactively — a caller today only
discovers this by hitting the Bash tool's own auto-background-on-timeout
fallback, the identical undocumented-timeout shape
`fgos-fanout`'s `wave-dispatch-mechanics.md` already got fixed for
(tsk-vuj, landed 2026-08-20) after it caused a real exit-143 failure
there (see RESEARCH.md Round 1).

## Approach

Mirror the exact execution-rule/waiting-rule callout
`wave-dispatch-mechanics.md:51-55` already carries (quoted verbatim in
RESEARCH.md Round 1) into two locations, each a self-contained,
independent doc edit:

1. `.agents/skills/fgos-coding-implement/references/return-mechanics.md`
   — add the callout immediately above the existing ` ```\nfgos return
   <id>\n``` ` block (line 5-7), adapted to name `fgos return` instead of
   `fanout-batch`.
2. `plugins/fgOS/skills/approve/SKILL.md` — add the same callout
   immediately above Step 6's command block (line 130-137), adapted to
   name `fgos approve`/`sync-root`.

No code path is touched (`src/**` untouched) — this is prose-only,
consistent with `docs/how-to/write-verify-for-a-skill-prose-change.md`'s
scope for `SKILL.md`/skill-reference prose. `fgos graph --json`'s
`criticalPath`/`topUnblock` were not consulted: neither file blocks or is
blocked by other work (RESEARCH.md confirms the two target files share no
cross-reference or code path), so there is no meaningful ordering
question between them — either can be edited first.

**Risk map:** light. Purely additive prose guidance already proven
correct in production by `wave-dispatch-mechanics.md`'s own landed fix —
no new mechanism, no behavior change to the engine, no reachable failure
mode this callout could introduce. No proof point beyond the verify
below is needed; impact-analysis gate not consulted since no blast-radius
claim is being made.

## Verify

```
npm test && grep -q 'run_in_background: true' .agents/skills/fgos-coding-implement/references/return-mechanics.md && grep -q 'run_in_background: true' plugins/fgOS/skills/approve/SKILL.md && ! git diff --name-only main...HEAD | grep -q '^src/'
```

POSITIVE (both `grep -q` clauses): proves the new guidance text actually
landed in both target files — pinned on the distinctive
`run_in_background: true` phrase from the pattern being mirrored, not a
single weak word. NEGATIVE/scope-guard (the trailing `! git diff` clause):
proves the diff stayed doc-only, per `write-verify-for-a-skill-prose-
change.md`'s own self-illustration of this shape for a purely additive
change (no old string to retire, so the negative vế is a scope guard
instead of an absence check).

## Outstanding questions

None
