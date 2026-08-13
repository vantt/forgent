# plan.md — tsk-blk

Mode: small

No `CONTEXT.md` — discovery returned `clear` directly, skipping
`exploring`, per `fgos-coding-planning`'s direct-entry fallback. Every
claim traces to `RESEARCH.md` round 1.

## Approach

Two independent, already-implemented pieces (implementation done during
discovery/research, since both are small, evidence-grounded test
additions with a already-verified real fix underneath):

1. **Gate-name drift guard** (`test/cli/command-registry.test.mjs`) —
   generalizes the existing `judge*` declared-symbol guard pattern to
   `canAutoApprove[A-Za-z0-9_]*`. Risk: low — test-only, additive, follows
   an established pattern in the same file. Proof point: the new test
   itself (`no registry description names a canAutoApprove* function that
   no longer exists in src/`), which passes vacuously today (no current
   drift) and will fire on the next such regression.

2. **childSpecs JSON.parse safety** — a one-line `.catch(() =>
   console.log('false'))` added to the documented `node -e` snippet in
   `fgos-coding-validating/SKILL.md` (all 3 mirrors), plus two subprocess
   tests in `test/state/gate-bypass.test.mjs` that extract and run the
   real snippet against a fixture `.fgos` dir. Risk: low — behaviorally
   identical from the caller's point of view (empty stdout and `'false'`
   stdout were already both treated as "fail closed" per the skill's own
   documented contract); only the raw-crash path is now a clean, explicit
   `'false'`. Proof point: verified live by temporarily reverting the
   `.catch()` and confirming the new malformed-JSON test fails exactly as
   expected (empty stdout, real `SyntaxError` stack trace) — see
   `RESEARCH.md`'s "Decision" section.

No proof point here leans on blast-radius/impact-analysis evidence — no
symbol is renamed or removed, only additive test code and one `.catch()`.

## Shape

One piece, no split — both changes are small, share the same root cause
(tsk-224's own gate-redesign left these two coverage gaps), and are
independently too small to honestly split further.

Files touched:
- `test/cli/command-registry.test.mjs` — new guard test
- `test/state/gate-bypass.test.mjs` — 2 new subprocess tests
- `.claude/skills/fgos-coding-validating/SKILL.md` (+ `.agents/skills`,
  `plugins/fgOS/skills` mirrors) — `.catch()` fix

## Outstanding questions

None
