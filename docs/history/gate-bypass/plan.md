# gate-bypass — plan

Item: `tsk-6bx`. Decisions: `docs/history/gate-bypass/CONTEXT.md` (D1-D5).

## Mode (mechanical count)

Flags checked against the item:

| Flag | Applies? | Why |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| data model | no | new config file, not a schema change to work items |
| audit/security | **yes** | the feature's whole purpose is deciding when a human confirmation step gets skipped — that is an audit/security-relevant control surface even though D4 keeps a floor |
| external systems | no | — |
| public contracts | no | `.fgos/gate-bypass.json` is internal state, not a published contract |
| cross-platform | no | — |
| existing covered behavior | **yes** | rewrites the Gate step already shipped in `fgos-exploring` and `fgos-planning` (this file's own skill) |
| weak proof around the area | **yes** | skill-prose Gate behavior has exactly one existing test today (`test/skills/fgos-mirror.test.mjs`), and it only checks byte-identity between `.claude/skills/fgos/` and `.agents/skills/fgos/` — it asserts nothing about the Gate logic itself |
| multi-domain | no | single `coding` domain |

`audit/security` alone is a hard-gate flag → **mode = high-risk**, independent of the 3-flag count (which would already land `standard` on its own). A smaller mode would not honestly cover an item whose entire point is loosening a human-oversight default.

## Approach

Chosen path: two independently workable pieces, ordered infra-first so the
skill-prose piece has something real to call instead of writing against a
guessed interface.

Rejected: doing it as one item. `fgos-mirror.test.mjs`'s byte-identity
requirement means every skill-prose edit must land in two trees at once —
mixing that with new state/CLI code in one diff makes the diff harder to
review and re-tests two very different kinds of risk (state-layer
correctness vs. prose-mirror drift) in the same pass.

`fgos graph --json` was run; `tsk-6bx` has no deps and sits in its own
size-1 component, so there is no existing cross-item ordering constraint to
honor — the ordering below is purely about this item's own internal shape,
not the graph's.

### Risk map

| Component | How risky | What would prove it |
|---|---|---|
| `.fgos/gate-bypass.json` level storage + read/write | low | unit test: round-trip read/write, missing-file default (`off`), malformed-file behavior |
| tier-coverage check (`level` × item `tier` → covered?) | low | unit test: table-driven over all `(level, tier)` pairs against `TIERS` ordering |
| "zero open items" completeness scan | **medium** | unit test against a fixture `CONTEXT.md`/`plan.md` with deferred questions/assumption markers present vs. absent — false-negative here (calling an incomplete artifact "clear") is exactly the failure D2 exists to prevent |
| hard-gate floor check reuse (D4) | **medium** | unit test: an item carrying a `src/intake/risk-keywords.mjs` hard-gate hit is never skippable even at `level: heavy` — this is the floor the whole feature's safety story rests on, needs its own explicit proof, not incidental coverage |
| `fgos-exploring`/`fgos-planning` Gate section rewrite | medium | `test/skills/fgos-mirror.test.mjs` (byte-identity, already exists) + manual read-through: does the rewritten Gate section still ask exactly the two locked wordings ("Decisions locked...", "Work shape is ready...") on the non-skip path? |
| D3 audit visibility (log + "auto-approved" line) | low | unit/integration test: skipping a gate produces a `fgos decision` log entry; no test can assert the conversational line gets *said* — that's a prose instruction, proven only by following the skill, same as every other Gate wording in this repo today |

The medium entries (completeness scan, hard-gate floor reuse) are the two
that need a real proof point at `fgos-validating`, not a guess here — they
are the two ways this feature could fail in the direction that matters
(silently skipping a gate that should have fired).

## Shape (high-risk — fuller map)

### Piece 1 — gate-bypass infra (state/CLI layer)

What: `.fgos/gate-bypass.json` (level: `off`/`light`/`standard`/`heavy`,
default `off` when absent — matches D5's reuse of `TIERS`), a
`isTierCovered(tier, level)` pure helper, a `hasOpenItems(artifactPath)`
completeness scanner (D2), and reuse of the existing hard-gate
detector from `src/intake/risk-keywords.mjs` (D4) exposed as a single
`canAutoApprove(item, artifactPath)` function combining all three per D5's
two-axes-plus-floor shape.

Files likely touched: new `src/state/gate-bypass.mjs`, new
`test/state/gate-bypass.test.mjs`, `src/cli/command-registry.mjs` (a
read/status verb, mirroring `fgos-runner.json`'s pattern of a plain JSON
file with no CLI verb required to edit it by hand — a `status`-only verb is
enough, matching `TIERS`' own no-CLI-setter precedent).

Verify: `npm test -- test/state/gate-bypass.test.mjs`

Depends on: nothing (first piece).

### Piece 2 — wire the Gate steps

What: rewrite `fgos-exploring`'s and `fgos-planning`'s Gate sections to
call `canAutoApprove` before presenting their respective approval question;
on a covered+clear result, post the D3 visible line and log the D3 decision
instead of asking; otherwise present the gate exactly as today, unchanged
wording. Mirror every edit into `.agents/skills/fgos/` in the same commit
(`fgos-mirror.test.mjs`'s existing requirement, not a new one this item
invents).

Files likely touched: `.claude/skills/fgos/fgos-exploring/SKILL.md`,
`.claude/skills/fgos/fgos-planning/SKILL.md`, and their byte-identical
`.agents/skills/fgos/` counterparts.

Verify: `npm test -- test/skills/fgos-mirror.test.mjs`

Depends on: Piece 1 (`canAutoApprove` must exist to call).

### Cases worth proving against (high-risk depth)

- Artifact with an explicit "TODO"/deferred-question marker still present →
  never auto-approved, regardless of level/tier.
- Item carrying a hard-gate risk-keyword hit at `level: heavy` → still
  stops for a human (D4 floor test, the single most important case in this
  whole feature).
- `.fgos/gate-bypass.json` missing entirely → defaults to `off`, identical
  behavior to today, no regression for repos that never opt in.
- Malformed/corrupt `.fgos/gate-bypass.json` → fails closed (`off`), never
  fails open.
- A gate that gets auto-approved still produces a real decision-log entry
  (`fgos list`'s `view.decisions` shows it) — this is what makes D3's
  audit trail testable at all, not just a prose promise.

## Split

Two pieces as shaped above. Per the schema's own `parent` field semantics
(`src/state/work.mjs:195-216`) and the command registry, no CLI verb
(`add`/`edit`) accepts a `--parent` value today — `add`'s field list is
`id/title/kind/risk/verify/deps/refs/learn/tier/domain/footprint/
discovered-from/docs-ref/acceptance/goal-tier/targets`, no `parent`. Setting
`parent` appears to be the decompose auto-judge's own machine action
(`src/intake/decompose.mjs`), consistent with `fgos-routing`'s "the
engine's verb always wins" precedence rule. This plan documents the two
child titles and their verify commands as the shape for that later
machine step to act on; this session does not fabricate a `--parent` flag
that does not exist, and does not create the children by hand.

- **Child 1**: "gate-bypass config + tier-coverage + completeness check
  (state/CLI layer)" — kind: feature, risk: standard, verify:
  `npm test -- test/state/gate-bypass.test.mjs`.
- **Child 2**: "wire fgos-exploring/fgos-planning Gate steps to
  gate-bypass check, mirror to .agents" — kind: feature, risk: standard,
  verify: `npm test -- test/skills/fgos-mirror.test.mjs`. Depends on Child 1.

## Execution

Per the locked decision that Execute/verify already have a working
mechanical path (goal-check + `return`'s re-verify), this plan does not
redesign that — each piece above already names its one proof command.
