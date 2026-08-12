# plan.md — tsk-nwz

**Mode: small**

Flag count: 1 of 10 (`weak proof around the area`). Every other flag is no:
no auth, no authorization, no data model, no audit/security, no external
systems, no public contracts, no cross-platform, no multi-domain, and no
existing covered behavior — `test/skills/fgos-mirror.test.mjs` asserts the
two copies are byte-identical, which this change preserves by editing both.

Why not `tiny`: three files across two trees, with a mirror invariant a
test enforces — not "one direct task". Why not `standard`: no gray areas
survive; `discovery` returned `clear` and `## Outstanding questions` below
is `None`.

The one flag is real and shapes the proof: no shell command can assert
what an agent does when it reads a prose instruction, which is precisely
why this defect shipped. See `docs/how-to/write-verify-for-a-skill-prose-
change.md` for who owns runtime proof (a documented smoke-test and the
event log), and for the standing rebuttal if the second-pass judge asks
`verify` to prove prose comprehension.

## Problem

`fgos setup` writes `workerSlots.ceiling: null` on purpose — present but
unarmed (tsk-1oz). In that state `fgos slots --json` answers:

```json
"execution": { "occupied": 0, "items": [], "ceiling": null,
               "free": null, "hasRoom": true, "reason": "no-ceiling-configured" }
```

`hasRoom: true`, but `free: null`. `fgos-fanout` passes the `hasRoom` check
and then trims against `free` in three places:

- `.claude/skills/fgos-fanout/SKILL.md:87` — "the batch actually fired is
  `min(5, execution.free)`"
- `:173` — "batch = the first `min(batch.length, slots.execution.free)` ids"
- `:218` — Never-do: "firing more than `execution.free` Agents"

With `free: null` there is no count the skill is permitted to fire, and
`min(n, null)` reads as 0. A launcher following the prose dispatches
nothing while the engine is wide open — in the state every repo ships in.

The engine API has no such hole: `hasWorkerSlotRoom` returns
`granted: size` when no ceiling is armed (`src/state/worker-slots.mjs:156`).
But `fgos slots` never exposes `granted`, so the prose was pointed at
`free` — the one field that goes null.

## Approach

**Chosen: prose-only, in the skill that misreads the field.**

Teach `fgos-fanout` what `free: null` means, matching the wording
convention this repo already uses for exactly this defect class (see
`RESEARCH.md` round 1): `plugins/fgOS/skills/list/SKILL.md:87-89` and
`plugins/fgOS/skills/triage/SKILL.md:107-108` both close with a named
anti-pattern — "never confuse absent with priority 0". The fix mirrors
that three-part shape at each of the three sites: state what absent means,
state the correct behavior, then name the anti-pattern.

**Rejected: add `granted` (and a `--batch-size` flag) to `fgos slots`.**
It looks like the tidier fix — `granted` is already computed and is
null-safe by construction. But `fgos slots` takes no batch size, so a bare
`granted` would always be `min(1, free)` = 1, which is wrong for a batch;
making it right means a new CLI flag and a new field on a shipped contract,
for a launcher that only ever needed to know "unarmed means no limit".
That is engine surface bought to avoid one sentence of prose — the wrong
trade under YAGNI, and it would touch `bin/fgos.mjs`, tripping the Iron Law
for a defect that lives entirely in a skill file.

**Rejected: change `hasWorkerSlotRoom` to return `free: Infinity` or the
batch size when unarmed.** This reverses a deliberate, documented posture
(`worker-slots.mjs:156` returns `free: null` precisely so "no ceiling" is
distinguishable from "a ceiling with room"), and `fgos slots`'s consumers
include herdr's Rust deserializer. Changing an engine return shape to
patch a prose misreading is backwards.

### Risk map

| Component | How risky | What would prove it |
|---|---|---|
| `.claude/skills/fgos-fanout/SKILL.md` + `.agents/` mirror | Low. Prose only; no code path reads it. The one real invariant is byte-identity between the two copies. | `npm test` (`test/skills/fgos-mirror.test.mjs` selects by `fgos-` prefix, so this skill is covered with no allowlist to edit) + a POSITIVE grep on BOTH copies. |
| The three trim sites | Low, but a partial edit is the live failure mode — fixing `:173` and leaving `:218`'s Never-do intact would leave the skill self-contradicting. | A NEGATIVE grep pinning the old `min(batch.length, slots.execution.free)` phrasing gone. |
| `docs/explanation/…-labeled-before-spawning-claude.md`, `docs/how-to/read-a-critical-impact-analysis-result…md` | Low. Stale `fg:agents-N` naming after the rename to `fg:workers-N`. | A NEGATIVE `rg` scoped to `docs/explanation` + `docs/how-to` only — `docs/history/**` legitimately keeps the old name as a record of what was true then. |

`impact-analysis: degraded` — `fgos tool query --capability impact-analysis
--status present` reports one provider, gitnexus, at `status: present`, so
the capability is NOT inactive. But `present` only means installed, never
that the index is fresh (tsk-j7y), and this repo's index is behind: last
indexed `79fead3`, while this branch is at `c82cb488`. Blast radius from
that index would be stale, so it is not trusted here.

Naming the gap plainly, as the gate requires rather than silently
dropping it: no blast-radius claim in this plan rests on GitNexus. Nothing
imports a `SKILL.md`, so there is no call graph to walk — the reach of
this change is "which files name the strings being edited", which is a
text question, and every citation in the risk map and Assumptions above
was established by `rg`/`sed` against the real files, not by a graph
query. That is also the cross-check `CLAUDE.md` asks for when an
impact-analysis answer cannot be trusted.

(Corrected after `fgos-coding-validating` returned NOT READY on this row:
this plan first recorded `inactive`, which was wrong — the provider is
registered and present, it is only its index that is behind.)

## Shape

Three files, one commit, no ordering constraint between them beyond
"both skill copies in the same edit":

1. `.claude/skills/fgos-fanout/SKILL.md` — fix all three trim sites.
2. `.agents/skills/fgos-fanout/SKILL.md` — apply the identical edit.
3. The two `docs/` files — `fg:agents-N` → `fg:workers-N` where they
   describe the tab as it is now.

Cases worth proving against, at `small` depth:

- **The unarmed default** (`free: null`, `hasRoom: true`) — the case that
  is broken today: the batch must fire at `min(5, batch.length)`.
- **An armed ceiling with room** (`free: 3`) — must still trim to 3. The
  fix must not turn the trim off.
- **A full lane** (`hasRoom: false`) — must still fire nothing. Untouched
  by this change, and the NEGATIVE grep must not remove that rule.
- **Mirror drift** — editing one copy and not the other must fail.

## Proof surface

```
npm test && <POSITIVE on both copies> && <NEGATIVE on old phrasing> && <NEGATIVE on stale docs> && <scope block: no src/ touched>
```

The exact command is recorded on the item via `fgos gate-approve --verify`
and set as the item's `verify` field. Per
`docs/how-to/write-verify-for-a-skill-prose-change.md`, `verify` proves the
deliverable exists and the old pattern is gone — it is never asked to prove
the guidance reads correctly, which belongs to merge review and
`fgos-coding-validating`.

## Assumptions

- **A1.** `free: null` is the only shape the unarmed case produces (never
  absent, never `0`). Grounded, not assumed: verified by running
  `fgos slots --json` against a fresh store, and by
  `worker-slots.mjs:156`'s explicit `free: null` return.
- **A2.** No consumer other than a prose reader reads `execution.free`.
  Grounded: herdr's `SlotsExecution` deserializes `hasRoom` only
  (`herdr-plugin/src/main.rs:175-178`); the runner uses the in-process
  `granted` instead (`src/runner/loop.mjs:1398`).

## Outstanding questions

None
