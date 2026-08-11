# submit-assist-classify wired through agent-executor capacities — plan

Item: `tsk-5l2`. Decisions: `docs/history/agent-executor-submit-assist-classify/CONTEXT.md`
(D1-D8, all locked and approved).

## Mode gate

Flags counted against the item:

| Flag | Applies? | Why |
|---|---|---|
| auth | no | — |
| authorization | no | — |
| data model | no | reuses tsk-62v's existing `capacities` schema; adds a config entry, not a new schema |
| audit/security | **yes** | D7 — first capacity routing prompt content to a third-party model; governance metadata decision made this session |
| external systems | **yes** | dispatches to an external CLI process (agy/codex/etc, picked at build time) |
| public contracts | no | new `dispatch.mjs resolve <capacityId>` entry point is additive/internal; no existing consumer's contract changes |
| cross-platform | no | — |
| existing covered behavior | **yes** | `fgos-submit-assist`'s classify step is live, uncovered-by-code behavior; acceptance requires a byte-identical regression pin for the not-configured path |
| weak proof around the area | partial | `dispatch.mjs`'s capacity resolution (tsk-62v) has strong test coverage (`test/runner/dispatch.test.mjs`); the *skill* side has none — prose skills aren't executable by the test suite, so only the mechanical seams (config validation, the new resolve CLI, tool registration) are provable at all |
| multi-domain | **yes** | touches config (`.fgos-runner.json`), the tool registry (`fgos tool register`), runner code (`dispatch.mjs`), and a skill's instructions (`SKILL.md`, mirrored in two trees) |

4 flags apply, and two of them are hard-gate flags on their own
(**external systems/provider**, **audit/security**) — either alone forces
**high-risk** per the mode-gate rule, independent of the count.

A smaller mode would not honestly cover this: this is explicitly the first
proof-of-concept sending content outside the Claude family, and the
governance/escalation decisions locked this session (D7/D8) exist precisely
because that crossing has real, if currently low, stakes.

## Approach

Chosen path: implement exactly the 6 scope points in the item's own
description, using the D7/D8 answers from `CONTEXT.md` to close the two
named gaps. No alternative approach was seriously considered — the item's
own description already names the concrete mechanism (reuse tsk-62v's
`resolveExecutorConfig`/`resolveExecutorCommand`, no second argv-builder),
and `CONTEXT.md` D1-D6 already ratified that mechanism from the upstream
design docs. The only real choices left for this plan were D7/D8
(resolved) and ordering/proof (below).

### Impact-analysis gate posture

`fgos tool query --capability impact-analysis --status present` → one
provider, `gitnexus`, `status: "present"` → **full**. Every proof point
below that touches `resolveExecutorConfig`/`resolveExecutorCommand`/
`spawnWorker` needs `impact()` run against it at `fgos-coding-implement`, blast
radius reported, before editing (AGENTS.md gate, unchanged from
`CONTEXT.md`'s own note).

### fgos graph ordering signal

`fgos graph tsk-5l2 --json`: `tsk-5l2` is not on the repo's current
`criticalPath`; `topUnblock` shows it unblocking 1 item today
(`newlyUnblocks: 2`) — low leverage, no external pressure to reorder around
it. Internal ordering (below) is therefore driven by dependency shape
alone, not by graph leverage.

### Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| `.fgos-runner.json` capacities entry (D1, D7) | low — additive, shape-validated by existing `validateCapacityShape` (confirmed this session it doesn't reject unknown keys, so `sensitiveData` needs no schema change) | existing `dispatch.test.mjs` capacities-shape tests stay green; one new test asserts `sensitiveData` round-trips through `loadRunnerConfig` untouched |
| `fgos tool register` step (D3) | low — mechanical CLI call, `checkToolRegistryConfigured` already generic | `fgos doctor` (or the equivalent setup-checks test) picks up the new registration without a new check being written |
| `dispatch.mjs resolve <capacityId>` CLI helper (D4) | medium — new code path, first CLI entry point `dispatch.mjs` has ever had | new unit tests: prints `{command,args,provider,model}` JSON for a resolvable capacity; exits non-zero with the existing `RunnerConfigError` message for an unregistered or not-present capacity (reusing `resolveExecutorConfig`'s existing errors, D6 from tsk-62v — no new error path invented) |
| `fgos-submit-assist/SKILL.md` classify branch (D5, D8) | medium — prose, not code; the actual branch decision is made by whichever agent reads the skill at runtime, so no test can execute it directly | (a) byte-identical regression: with no `submit-assist-classify` capacity configured, `dispatch.mjs resolve submit-assist-classify` errors exactly as it does today (nothing in the skill's prose changes what gets called) — proven at the CLI-helper layer, not the skill layer; (b) manual/documented walkthrough: with a real registered+present CLI, invoking the skill actually shells out and prints the announce line (D6) — this is the "first real end-to-end proof it works" the item's title asks for, and is inherently a run-it-and-look proof, not a unit test, same as `/research`'s existing Gemini-toggle precedent cited in the design doc |
| Announce line format (D6) | low | literal string match test, if the announce is emitted by code (the CLI helper can print it); if emitted by the skill's own Bash step instead, this is a prose-review check, not a code test |
| Cross-provider content exposure (D7) | low today, explicitly flagged, not eliminated | no code enforces `sensitiveData` yet (by design, D7) — proof point is documentary: `CONTEXT.md` D7 exists and is cited, not a code assertion |
| Malformed-output fallback (D8) | medium — "malformed" has no precise definition yet (`CONTEXT.md`'s Pinned terms flags this as deferred) | at minimum one test simulating a CLI that returns non-JSON/empty output and asserting the skill's documented behavior (fall back) is what the SKILL.md prose actually instructs — again a prose-review proof, not executable, unless the fallback logic is pulled into a small testable helper (see Files touched) |

### Files touched, in order

1. `.fgos-runner.json` — add `capacities.submit-assist-classify` (`kind:
   "cli"`, `adapter: "cli-spawn"`, `tier: "light"`, `sensitiveData: false`
   per D1/D7). First, since every later step depends on this entry
   existing.
2. `src/runner/dispatch.mjs` — add the `resolve <capacityId>` CLI entry
   point (D4), reusing `resolveExecutorConfig`/`resolveExecutorCommand`
   unchanged. Second, since it's the one new piece of real code and has
   the only mechanically-testable surface in this item.
3. `test/runner/dispatch.test.mjs` (or a new sibling file if the CLI-entry
   tests don't fit the existing structure) — tests for step 2, plus the
   `sensitiveData` round-trip test from the risk map. Immediately after
   step 2, before touching the skill.
4. Register the real installed CLI (D2/D3): `fgos tool register --kind cli
   --capability submit-assist-classify --command <whatever's actually on
   this machine> ...` — an operational step (writes to `.fgos/` state, not
   a repo file), run once steps 1-3 prove the resolve mechanism works.
5. `.claude/skills/fgos-submit-assist/SKILL.md` **and**
   `.agents/skills/fgos-submit-assist/SKILL.md` — both, byte-identical,
   per the existing mirror invariant `test/skills/fgos-mirror.test.mjs`
   already enforces (confirmed this session — not previously named in the
   item's own description, but a real repo constraint that fails CI if
   only one copy is edited). Update step 2's classify branch (D5) and the
   announce line (D6). Last, since it depends on 1-4 all actually working.

No split: this is one honest, bounded piece of work — the item's own
acceptance criteria (byte-identical when absent, real dispatch when
present, clean fallback when missing, D7/D8 addressed) only make sense
proven together as one end-to-end path, not as independently shippable
fragments.

## Execution

Verify command: `npm test` (matches the engine's own `discover` verdict:
`{"clear": true, "verify": "npm test", "impactScore": 68}`). No re-plan of
Execute/verify mechanics needed — `fgos-coding-implement`'s existing goal-check and
`return`'s re-verify already cover it.

## Assumptions

- The exact real CLI command for step 4 (D2) is picked at
  `fgos-coding-implement` time, not here — confirmed available today: `agy`,
  `codex`; confirmed absent: `gemini`. Not material to this plan's shape,
  since the mechanism is generic over whichever one gets registered.
- "Malformed output" (D8) is left at the definition already pinned in
  `CONTEXT.md`'s Pinned terms (unparseable / wrong shape / outside known
  vocab) — exact detection code is an implementation-only detail, not
  re-litigated here.
- Updating `docs/specs/runner.md` with the `capacities` schema is treated
  as out of this item's scope, consistent with `tsk-62v` (its own upstream
  item) not having done so either — not this item's gap to fill.
