# Iron Law evidence — tsk-5ay

## classifyIronLaw result

```json
{"required": true, "matchedFlags": ["audit"], "matchedModules": []}
```

`matchedModules` is empty — neither changed file
(`.claude/skills/fgos-coding-planning/SKILL.md`,
`.claude/skills/fgos-routing/SKILL.md`,
`.agents/skills/fgos-coding-planning/SKILL.md`,
`.agents/skills/fgos-routing/SKILL.md`) matches any Iron Law
self-modifying-capable module rule (`src/evolve/iron-law.mjs`'s
`MODULE_RULES`). `required: true` comes entirely from the item's own
`description` matching the `audit` HEAVY_KEYWORDS entry — the description
mentions "audit toàn bộ 4 skill" as the original (now-narrowed) request
context, not an actual audit/security-sensitive change. Named plainly per
D1's own "failing-test-first proof" pin (docs/history/tsk-5t3-iron-law-
evidence-contract/CONTEXT.md), applied here even though it is a keyword
false-positive on prose that happens to contain the word "audit" — same
shape as tsk-3uz's own evidence file.

## Test command (the item's own recorded `verify`)

```bash
! grep -q 'Mode gate (mechanical' .claude/skills/fgos-coding-planning/SKILL.md && grep -qE 'lane|mode.gate' .claude/skills/fgos-routing/SKILL.md && grep -qE 'truy.nguồn|trace back to|Open Question' .claude/skills/fgos-coding-planning/SKILL.md
```

## Failing before

```
$ ! grep -q 'Mode gate (mechanical' <pre-edit .claude/skills/fgos-coding-planning/SKILL.md>; echo $?
1   # the old file DID contain "Mode gate (mechanical" — this clause fails

$ grep -qE 'lane|mode.gate' <pre-edit .claude/skills/fgos-routing/SKILL.md>; echo $?
1   # no match — fgos-routing had no lane/mode-gate logic yet

$ grep -qE 'truy.nguồn|trace back to|Open Question' <pre-edit .claude/skills/fgos-coding-planning/SKILL.md>; echo $?
1   # no match — no traceability rule in the Gate step yet
```

Matches CONTEXT.md's own scout evidence: `fgos-coding-planning/SKILL.md`'s Mode
gate lived inside the skill (bước 2), and `fgos-routing/SKILL.md` had no
lane/mode-gate logic at all (grep confirmed, fresh, 2026-08-05).

## Passing after

```
$ ! grep -q 'Mode gate (mechanical' .claude/skills/fgos-coding-planning/SKILL.md && grep -qE 'lane|mode.gate' .claude/skills/fgos-routing/SKILL.md && grep -qE 'truy.nguồn|trace back to|Open Question' .claude/skills/fgos-coding-planning/SKILL.md && echo "VERIFY-PASS"
VERIFY-PASS
```

Both dual-root pairs (`.claude/skills/` and `.agents/skills/`, for both
`fgos-coding-planning` and `fgos-routing`) are byte-identical after the change
(`diff` confirms), and were already confirmed byte-identical before it —
so editing `.claude`'s copies and mirroring them onto `.agents` preserves
the dual-root sync convention without drift.

- **D1**: the Mode gate step (flag-count → tiny/small/standard/high-risk/
  spike, verbatim logic, unchanged thresholds) moved out of
  `fgos-coding-planning`'s step 2 into `fgos-routing`'s Orient section, ahead of
  where `fgos-coding-planning` gets loaded at all. `fgos-coding-planning`'s own
  Bootstrap step now reads that already-decided lane and still records it
  into `plan.md`, unchanged from before.
- **D2**: a traceability rule was added to `fgos-coding-planning`'s Gate step —
  every sentence in the gate's plain-language presentation must trace
  back to a specific passage of `plan.md`/`CONTEXT.md`, or become an Open
  Question instead of an assertion. The existing auto-approve/ask
  true/false branching logic is unchanged.
