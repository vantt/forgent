# Plan: reconcile cook's prose with gate-bypass reality

Item: `tsk-104`. Mode: **tiny** — two prose edits in one file, bringing
the top of the file in line with what its own bottom already says
correctly. No design question, no split.

## Approach

1. `plugins/fgOS/skills/cook/SKILL.md` frontmatter `description` (:6-11):
   replace "Pauses for real human approval at every dev-skill gate
   (fgos-coding-exploring/fgos-coding-planning/fgos-coding-validating) ... never
   auto-approved" with accurate language: each dev-skill gate
   auto-approves when the repo's configured gate-bypass level covers it
   (`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating`'s own
   `canAutoApprove`/`canAutoApproveValidate` checks), otherwise pauses for
   real human approval — final merge review (`fgos approve`) always stays
   a human decision regardless, unchanged.
2. Hard rules (:27-31): replace "Never auto-approve a gate" with the
   actually-intended invariant: never bypass a gate BEYOND what each
   dev-skill's own gate-bypass check already permits — cook's driver
   invokes `fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating` unchanged
   either way (already correctly stated at :118-121) and never
   second-guesses, forces, or fakes an auto-approve/human-approve record
   on its own authority.
3. Leave :118-121 and the "Stop at `awaiting-approval`, never merge" rule
   (:32-35) untouched — both already correct.

No test covers plugin-skill markdown prose directly (per `tsk-2ew`'s own
`CONTEXT.md` finding, `test/skills/fgos-mirror.test.mjs` only covers
`.claude/skills/**`). Verify is a direct read-back proof: the file's own
frontmatter and Hard rules no longer assert "always ask"/"never
auto-approve" while :118-121 does still correctly describe the real
behavior.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| Two prose edits | low — no code touched, no behavior change to any gate's own logic (which was already correct) | `grep -n "auto-approve\|Pauses for real human"` on the file before/after |
| No mirror needed | low | confirmed `find .agents -iname "*cook*"` → no results |
| Downstream passage (:118-121) already correct, left alone | low | re-read in full during investigation, cited verbatim in `CONTEXT.md` D2 |

Impact-analysis posture: `degraded` — GitNexus `present` (checked via
`fgos tool query --capability impact-analysis --status present`), index
stale. Moot regardless: this is a markdown prose file, not a code symbol
GitNexus indexes at all (same reasoning as `tsk-2ew`, `tsk-3k2`).

## Outstanding questions

None
