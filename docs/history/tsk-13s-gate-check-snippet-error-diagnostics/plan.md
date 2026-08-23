# plan.md — tsk-13s

Mode: small

No `CONTEXT.md` — discovery returned `clear` directly. Every claim traces
to `RESEARCH.md` round 1.

## Approach

Single mechanical fix: the `.catch()` `tsk-blk` added to
`fgos-coding-validating`'s gate-check snippet swallows every error
identically. Change it to log the real error to stderr before printing
`'false'` to stdout — no behavior change to the documented stdout
contract, only a debuggability improvement.

| Site | Risk | Proof point |
|---|---|---|
| `.claude/skills/fgos-coding-validating/SKILL.md` (+2 mirrors) | low | `fgos-mirror.test.mjs` + 4 subprocess tests in `gate-bypass.test.mjs` (2 updated, 2 new) |

No proof point leans on blast-radius/impact-analysis evidence — prose-only
change, no symbol touched.

## Shape

One piece, no split.

Files touched:
- `.claude/skills/fgos-coding-validating/SKILL.md` (+ `.agents/skills`,
  `plugins/fgOS/skills` mirrors) — `.catch()` now logs to stderr
- `test/state/gate-bypass.test.mjs` — updated the malformed-JSON test's
  stale "stderr must be empty" assertion, added a diagnostic-content test
  and a non-JSON-error (bad plan path) test

## Outstanding questions

None
