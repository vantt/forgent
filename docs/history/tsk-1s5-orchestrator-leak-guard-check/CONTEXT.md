# CONTEXT — tsk-1s5

## Feature boundary

tsk-1s5 reports that the pinned term "orchestrator" leaked back into
`docs/history/fgos-coding-driving-item-display/CONTEXT.md`, tripping
`test/docs/launcher-vocabulary-guard.test.mjs`'s NEGATIVE guard, and that
this was confirmed pre-existing at commit `725c292a` (before tsk-107
started), unrelated to `merge.mjs`. This item's own scope is exactly that
one guard-test failure — nothing wider.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The leak this item reports is real and was real at `725c292a`, exactly as described — but it was already fixed by commit `10c0bed5` ("fix: pin \"launcher\" not \"orchestrator\", resync .agents/skills mirror", 2026-08-11 13:07:18 +0700), a 2-line diff touching exactly `docs/history/fgos-coding-driving-item-display/CONTEXT.md` and `.agents/skills/fgos-coding-driving/SKILL.md`. `git merge-base --is-ancestor 10c0bed5 HEAD` on this item's own worktree branch (`fgw/tsk-1s5`, based on main `6210aa1f`) returns true — the fix already sits in this item's own base. `node --test test/docs/launcher-vocabulary-guard.test.mjs` already passes 10/10 on this worktree right now, unmodified. This item's scope is therefore verify-only confirmation, not a code change — see `docs/history/tsk-1s5-orchestrator-leak-guard-check/RESEARCH.md` Round 1 for the full evidence trail. |

No product ambiguity remains to ask a person about: D1 is a factual
determination from git history and a passing test run, not a preference or
judgment call.

## Pinned terms

None new — this item does not touch vocabulary itself, only confirms a
prior vocabulary-guard fix already landed.

## Scout evidence

- `git grep -in orchestrator docs/history/fgos-coding-driving-item-display/CONTEXT.md`
  → one hit at line 133, the citation of decision 0026's own frozen
  filename — already matches the guard's frozen-filename strip today.
- `git log --oneline -- docs/history/fgos-coding-driving-item-display/CONTEXT.md`
  → most recent commit is `10c0bed5`, the fix.
- `node --test test/docs/launcher-vocabulary-guard.test.mjs` → 10/10 pass
  on this worktree.
- Related established pattern for "pre-existing failure surfaced during an
  unrelated merge, already fixed by another session": `docs/how-to/fix-
  fgos-write-rejected-merge-block.md`, `docs/how-to/produce-failing-test-
  first-proof-for-an-iron-law-gated-diff.md`.
- Impact-analysis capability gate (`fgos tool query --capability
  impact-analysis --status present`): `gitnexus`, status `present` — full
  posture. Not load-bearing here since this item requires no code edit
  (verify-only closure per D1).

## Canonical references

- `docs/history/tsk-1s5-orchestrator-leak-guard-check/RESEARCH.md` (Round 1
  evidence)
- `test/docs/launcher-vocabulary-guard.test.mjs`
- `docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`

## Outstanding questions

None
