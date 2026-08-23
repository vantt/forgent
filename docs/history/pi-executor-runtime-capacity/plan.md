# plan.md — tsk-47r: register `pi` as a runtime capacity + D4 proof-test

Mode: **high-risk**

Flag count: 4 (audit/security — new cross-provider executor + capability
allowlist; external systems — new npm package this repo shells out to;
public contracts — the D4 test exercises tsk-2uf-2's worker contract, a
shared contract with one other real consumer; weak proof around the
area — the item's own stated purpose is proving/disproving an unverified
"provider-neutral" claim). `work.risk` already reads `heavy` on the item
itself (discovery-stage classification, unchanged) — high-risk lane
matches.

No `CONTEXT.md` exists for this feature: the discovery-stage verdict was
`clear` (see `docs/history/pi-executor-runtime-capacity/RESEARCH.md`
Round 1), which skips `exploring` entirely — expected per
`fgos-coding-planning`'s own Bootstrap note (tsk-4sx), not a gap. The
item's own locked-at-submit description (`fgos show tsk-47r`) is the
scope source of truth here instead of a `CONTEXT.md` decisions table.

## Approach

Three sequential pieces, in this order (each gates the next — this is why
the item stays ONE piece, not a split, see "Split" below):

1. **Live-verify `pi` first, before any config** (item's own locked
   ordering — "KHÔNG khai config trước khi thấy nó chạy"). Install
   `@earendil-works/pi-coding-agent` globally via npm (pre-authorized by
   the item's own scope). Run it once with `--tools read,grep,find,ls
   --mode json -p "<throwaway prompt>"` and read the real
   `AgentSessionEvent` JSONL stream it emits. This is the mechanism smoke
   test — proves `--tools` allowlist and `--mode json` work as
   `docs/distillery/sources/pi.md`'s `built-in-tool-set`/`json-event-
   stream-mode` entries describe, on THIS machine, not just on paper.

2. **D4 proof-test**: dispatch `pi` against `.agents/skills/_shared/
   coding-worker-contract.md` for real, using a genuinely disposable fgOS
   work item (`kind: chore`, `verify: "true"`) so the test costs nothing
   to discard. Build the same shape of dispatch prompt `dispatch/
   prepare.mjs`'s `buildPrompt` would construct for a worker (points the
   executor at the contract file + the item's own goal/footprint), run it
   through `pi --tools read,write,edit,bash,grep,find,ls --mode json
   --approve -p "<contract-shaped prompt>"` inside that item's own
   worktree, and read the result from real evidence: the JSON event
   stream plus `.fgos/events.jsonl`/the worktree's own git log — never
   from pi's own self-report alone (same "verify never proves runtime
   behavior on its own, real evidence does" discipline
   `docs/how-to/write-verify-for-a-skill-prose-change.md` already pins
   for skill-prose changes, applied here to a contract-prose change).
   Outcome is GREEN (contract followed, real edit + commit + `[DONE]`) or
   RED (contract assumption pi cannot satisfy, named precisely) — both are
   valid, documented results per the item's own framing. `wontfix` the
   throwaway item immediately after (never left dangling in the backlog).

3. **Config registration**, only after step 1/2 produced real evidence of
   what `pi`'s own `invocations[].args` needs to look like:
   - Extend the SINGLE existing `registerConfigDefault({id:'runner',
     key:'runner', shape: {...}})` call at `src/setup/
     registrations.mjs:1082` (confirmed by `RESEARCH.md` Round 1 — a
     second `key:'runner'` registration would silently overwrite this one
     under `assembleRegistryDefaults`'s flat-per-key composition, never
     merge with it) — add an `executors: { pi: {...} }` key alongside the
     existing `...DEFAULT_RUNNER_CONFIG, capabilities:
     DEFAULT_CAPABILITY_SLOTS`.
   - `mergeConfigDefaults`'s fill-missing-only recursion (`config-
     merge.mjs`, traced in `RESEARCH.md`) adds `runner.executors.pi` on
     the next real `fgos setup` run without touching the live
     `runner.executors.agy` entry — verified by hand-tracing `mergeInto`,
     confirmed live against the actual `.fgos/config.json` when `fgos
     setup` is run for real at execute time (not simulated here).
   - No new doctor check: `checkToolRegistryConfigured` only probes
     `kind:'tool'` executors (`tool-registry.mjs:103`, confirmed in
     `RESEARCH.md`); `agy` — the direct precedent for an `agent`-kind
     executor — has no dedicated binary-presence check either. Adding one
     only for `pi` would be an inconsistent, unrequested addition, not a
     gap this item needs to close.
   - Update the two ripple tests tsk-2uf-3 already established as
     precedent for this exact `shape` object (`test/setup/
     registrations.test.mjs:173/176`, `test/setup/checks-setup-
     config.test.mjs:72`) to assert the new `executors.pi` key too.
   - Document `pi` as the reference runtime for the worker contract:
     append a short section to `.agents/skills/_shared/coding-worker-
     contract.md`'s existing "Return-channel note (upstream `pi`, …)"
     section (already references `pi`'s `--mode json`/`--mode rpc`) with
     the real GREEN/RED finding from step 2, and note the config
     registration in `docs/distillery/porting-log.md` (existing per-source
     porting-decision log this repo already keeps for distillery sources).

Impact-analysis capability gate (`CLAUDE.md`): **full** — GitNexus
(`forgent`) is `present`. Ran `impact({target: "registerConfigDefault",
direction: "upstream"})` before planning the edit above: `risk: LOW`,
3 upstream-impacted symbols (1 direct), `epistemic: exact`. This is a
shape-argument edit to an existing call site, not a signature or behavior
change to `registerConfigDefault` itself, so the real blast radius is even
narrower than that report — recorded as the required proof point for a
`standard`+ risk map entry per Approach step 2's own instruction.

## Risk map

| Component | Risk | What proves it |
| --- | --- | --- |
| `pi` binary actually runs `--tools`/`--mode json` on this machine | Medium (unverified until run) | Step 1's real event-stream output, captured to `RESEARCH.md` Round 2 |
| D4 claim (worker contract is provider-neutral) | Medium — this IS the open question the item exists to answer | Step 2's real GREEN/RED evidence from `.fgos/events.jsonl` + the throwaway item's own worktree git log |
| `registrations.mjs`'s `runner` configDefault shape edit | Low (confirmed by GitNexus impact) | `npm test -- test/setup/registrations.test.mjs test/setup/checks-setup-config.test.mjs`, both before (red, missing `executors.pi` in the deepEqual) and after (green) |
| `mergeConfigDefaults` leaving the live `agy` entry untouched | Low (traced mechanically in RESEARCH.md) | Live `fgos setup` run at execute time — diff `.fgos/config.json` before/after, confirm `executors.agy` byte-identical and `executors.pi` newly present |
| Node `readline` U+2028/U+2029 trap (item's own scope item 4) | Low — no JSON parser is being written by THIS item; step 1/2 above consume `--mode json` output via a one-off script, not a permanent parser | Not applicable this round — flagged as a real constraint for whichever item later wires a permanent `--mode json`/`--mode rpc` consumer into dispatch machinery (out of this item's footprint, see Absolute constraints) |

## Files likely touched

- `src/setup/registrations.mjs` — extend the `runner` configDefault shape (step 3)
- `test/setup/registrations.test.mjs`, `test/setup/checks-setup-config.test.mjs` — ripple assertions (step 3)
- `.agents/skills/_shared/coding-worker-contract.md` — append the real D4 finding (step 3)
- `docs/distillery/porting-log.md` — record the porting decision (step 3)
- `docs/history/pi-executor-runtime-capacity/RESEARCH.md` — Round 2 (live pi run evidence), Round 3 (D4 test evidence) — accumulate, never overwrite
- `docs/history/tsk-47r/iron-law-evidence.md` — real before/after verify output (Iron Law gate at approve, `risk:heavy`, matches `docs/history/tsk-4wv/iron-law-evidence.md`'s shape)
- NOT touched: `src/runner/dispatch.mjs`, `src/runner/dispatch/*.mjs`, `.agents/skills/fgos-coding-implement/`'s driver/worker boundary, `.fgos/config.json`'s `agy` entry (absolute constraints, honored throughout Approach above)

## Order

1. Step 1 (live smoke test) — nothing else can proceed without it (item's own locked ordering).
2. Step 2 (D4 proof test) — depends on step 1's confirmed `--tools`/`--mode json` mechanism.
3. Step 3 (config registration + docs) — depends on step 1's real `args` shape and step 2's real finding (GREEN informs the allowlist recorded; RED informs what NOT to claim in the docs).

`fgos graph --json` was run (see Approach's impact-gate note) — this item
has no children/parents beyond its existing `deps: [tsk-2uf-2]` (already
satisfied, merged to `main`), so `criticalPath`/`topUnblock` carry no
additional ordering signal beyond the sequential dependency already named
above.

## Split

**No split — one honest piece.** The three steps above are strictly
sequential and mutually dependent (step 3's exact config shape is
UNKNOWN until step 1/2 produce real evidence) — splitting them into
separate work items would not unlock any real parallelism, only add
claim/worktree/merge overhead around three pieces that must land as one
coherent commit anyway (a config entry with no verified evidence behind
it, or evidence with no config to show for it, are both incomplete on
their own). `fgos-coding-validating` reads this as the `pass-through`
verdict.

## Verify

Pass-through item — syncing the item's own `verify` field now that a real
proof-surface command is designed (discovery-stage `verify` was already
real, not a placeholder — see `RESEARCH.md` Round 1 — so no
`FALLBACK_VERIFY`/`RETIRED_P14_PLACEHOLDER` sync is needed; recorded here
for clarity):

```bash
npm test -- test/setup/registrations.test.mjs test/setup/checks-setup-config.test.mjs
```

This proves step 3 (the only piece with an automatable, deterministic
proof). Steps 1/2 are one-time live evidence (an LLM agent run cannot be
asserted by a CI-style command) — their proof lives in
`docs/history/pi-executor-runtime-capacity/RESEARCH.md` Rounds 2/3 and
`docs/history/tsk-47r/iron-law-evidence.md`, read by the human approver
at `awaiting-approval`, not re-run by `npm test`.

## Outstanding questions

None
