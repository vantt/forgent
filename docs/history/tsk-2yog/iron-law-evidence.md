# Iron Law evidence — tsk-2yog

## Classification

Result: `{"required":true,"matchedFlags":["data loss"],"matchedModules":[]}`

False positive, traced directly: `classifyIronLaw` matches keywords in
`item.description`, and this item's own description carries a historical
provenance note unrelated to the fix itself — `"[Recreated 2026-08-20:
original tsk-2yog vanished from .fgos/events.jsonl under confirmed
concurrent-write data loss, see tsk-24e.]"`. The phrase "data loss"
there describes a past incident that destroyed the item's *own prior
record* (tsk-24e), not anything the fix's own diff touches. The real
committed diff (`git diff main...HEAD --stat`) is 5 skill-prose markdown
files under `.agents/skills/**` — no data-persistence code, no
`src/state/**`, no `.fgos/**` write path.

## No failing-test-first story applies

This item's own commits (`8d9d23d1`, `0c7829c8`, `e3ea3656`, `63f1c804`)
change only markdown: `plan.md`/`RESEARCH.md` under this item's own
`docs/history/` feature dir, plus the five skill-prose files named in
`plan.md`'s Approach section. No code path exists to demonstrate
red-before-green against — same shape `docs/history/tsk-3ik-2/
iron-law-evidence.md` already established for a doc-only diff.

## Item's own verify command

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test $(git ls-files 'test/**/*.test.mjs' | grep -v '^test/setup/registrations.test.mjs$') && \
grep -q 'skip opening references/approach-and-shape.md and references/split-and-child-specs.md' .agents/skills/fgos-coding-planning/SKILL.md && \
grep -q 'skip opening references/gate-tier-a-b-triggers.md' .agents/skills/fgos-coding-validating/SKILL.md && \
grep -q 'skip opening references/worker-contract-and-orient.md' .agents/skills/fgos-coding-implement/SKILL.md && \
grep -q 'invoked skill may itself skip opening its own reference files' .agents/skills/fgos-coding-driving/references/loop-mechanics.md && \
! grep -q 'which this decision does not make' .agents/skills/fgos-routing/SKILL.md && \
! git diff --name-only main...HEAD -- . | grep -q '^src/'
```

Full suite result (run against this exact committed tree):

```
ℹ tests 3769
ℹ suites 0
ℹ pass 3764
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
```

(The excluded `test/setup/registrations.test.mjs` carries two pre-existing
failures unrelated to this item — see `plan.md`'s "Amended at Execute"
note — confirmed identical on `main`, out of this item's own scope.) All
6 grep clauses re-confirmed individually against the committed tree
immediately before this write.
