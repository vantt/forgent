---
item: tsk-19zm
stage: decompose (shaping)
date: 2026-07-30
---

# plan.md: checkpoint distillate + record chốt 3-phần lên gate (STR70a)

## Mode

Flags counted against the mechanical gate:

| Flag | Applies? | Why |
|---|---|---|
| auth | no | |
| authorization | no | |
| data model | **yes** | `gates[id]` gains 3 new fields (`askRationale`/`askAlternatives`/`askSource`, D2) |
| audit/security | **yes** | this IS the gate-dialogue capture/provenance mechanism the whole `gate-dialogue-continuity` effort exists to build |
| external systems | no | |
| public contracts | **yes** | `computeAwaitingContext`'s return shape is a real consumer surface (`bin/fgos.mjs:1048`, printed to a person); `ask`'s `--rationale`/`--alternatives`/`--source` flags already exist publicly, their storage target changes (D2) |
| cross-platform | no | |
| existing covered behavior | **yes** | `test/state/awaiting-context.test.mjs` has 13 tests, several using strict `assert.deepEqual` on the full return shape — must stay green |
| weak proof around the area | **yes** | item's own `verify` field reads "chưa xác định — P15 bổ sung" |
| multi-domain | no | single domain (coding), `src/state` + `bin` |

**5 flags → high-risk mode**, per the mechanical rule (4+ flags). Confirmed
by direct grep evidence — see Risk map for why the actual blast radius is
narrower than the flag count alone suggests.

## Approach

### Resolving CONTEXT.md's deferred CLI-flag question

CONTEXT.md's first outstanding question asked whether `ask`'s
`--rationale`/`--alternatives`/`--source` flags get renamed or keep their
name but change target. Resolved here: **keep the flag names identical**
on both `ask` and `answer` (`--rationale`, `--alternatives`, `--source`) —
symmetric UX, a person types the same flag either way. Only the **storage
target** differs: `ask`'s values land in `askRationale`/`askAlternatives`/
`askSource` (D2's checkpoint fields); `answer`'s values keep landing in
`rationale`/`alternatives`/`source` (unchanged, still authoritative).

**Confirmed safe to change `ask`'s target field**: grepped
`test/cli/fgos.test.mjs` and `test/state/replay.test.mjs` for any existing
test exercising `ask --rationale` or the `gates[id]` fold's `ask`-side
rationale — zero hits. `ask --rationale` has never had test coverage
before, so redirecting its storage target is not a regression against any
proven behavior, just a shape not yet exercised.

### Files touched, in dependency order

1. **`src/state/store.mjs`** — `putInAwaiting(dir, { id, ask, ..., rationale, alternatives, source })`: keep the parameter names as today (matches the CLI flag names, D2's symmetric-UX call above), but build the `moveWork` payload with `askRationale`/`askAlternatives`/`askSource` keys instead of `rationale`/`alternatives`/`source` — this is the one place the rename happens, invisible to both the CLI flag and the caller's argument names. `answerAwaiting` is untouched — its `rationale`/`alternatives`/`source` params already map straight through to the same-named payload keys, exactly as today.
2. **`src/state/replay.mjs`** — `case 'work.move'`: destructure `askRationale`/`askAlternatives`/`askSource` alongside the existing `rationale`/`alternatives`/`source`; fold all six into `gates[id]` with the same guarded spread-then-override idiom already used for `parentSnapshotAtAsk`/`statusAtAsk` (only stamped when present, each independently overwritten by its own next occurrence — `askX` fields overwritten by a fresh `ask`, `rationale`/`alternatives`/`source` overwritten by a fresh `answer`, never cross-contaminating).
3. **`bin/fgos.mjs`** — `ask` case: thread `rationale`/`alternatives`/`source` (already-parsed flags) into `putInAwaiting` unchanged (step 1's rename happens inside `store.mjs`, not here) — this file needs no change beyond what already exists, confirmed by re-reading the current `ask` case (`bin/fgos.mjs:969-995`): it already parses and passes these three flags through positionally; only `putInAwaiting`'s internal handling changes.
4. **`src/state/awaiting-context.mjs`** — `computeAwaitingContext`: add the same guarded-presence projection already used for `ask` (`if (gate?.ask !== undefined) result.ask = gate.ask`) for all six fields: `askRationale`/`askAlternatives`/`askSource`/`rationale`/`alternatives`/`source`. Per D1, no projection of `view.decisionsById[id]` is added here — CONTEXT.md's own outstanding question flags that as a possible fast-follow, not required by STR70a's locked CoS.

No `fgos graph`-driven reordering needed — `tsk-19zm` isn't on the critical
path or in `topUnblock`'s top ranks (checked: unblocks only `tsk-4op`,
already known). The four files above have one linear dependency chain
(storage rename before fold before projection); `bin/fgos.mjs` needs no
edit at all.

## Risk map

| Component | Risk | Proof point (→ fgos-coding-validating) |
|---|---|---|
| `putInAwaiting`'s param-to-payload rename (`rationale`→`askRationale` etc.) | low — confirmed zero existing test coverage of `ask --rationale`'s current target key | Grep confirms no test asserts `ask`'s rationale lands in `gates[id].rationale`; `answerAwaiting` (untouched) still does, confirmed by its own existing tests |
| `gates[id]` fold gains 3 new guarded fields | low — same idiom as 4 fields already there (`parentSnapshotAtAsk`/`statusAtAsk`/`rationale`/`alternatives`/`source`), no existing fixture sets `askRationale` so no accidental leak into old `deepEqual` assertions | Confirm `test/state/replay.test.mjs`'s existing decision-fold tests stay green unmodified (none touch `work.move`'s gates fold) |
| `computeAwaitingContext`'s return shape grows by up to 6 optional keys | medium — `test/state/awaiting-context.test.mjs` has multiple strict `assert.deepEqual(ctx, {...})` calls; a new key that leaks unguarded into any of those fixtures breaks them immediately | Confirm all 13 existing tests in that file stay green unmodified; add new cases for each of the 6 fields present/absent |
| `bin/fgos.mjs:1048`'s consumer of `computeAwaitingContext` | low — additive-only return shape, existing consumer reads specific keys it already expects, doesn't enumerate/deepEqual the whole object | Read the consumer call site directly to confirm it doesn't assert on the object's exact key set |

## Concrete cases to prove against

- `ask --rationale "..."` then `answer --rationale "..."` on the same item
  — `gates[id]` ends with BOTH `askRationale` (from ask) AND `rationale`
  (from answer) present simultaneously, neither overwriting the other
  (D2's core guarantee).
- A second `ask --rationale "..."` (re-ask before any answer) overwrites
  only `askRationale`, never touches `rationale`/`alternatives`/`source`
  (which don't exist yet at that point) — latest-wins on the checkpoint
  axis alone.
- `ask` with no `--rationale` flag at all — `askRationale` key absent
  from `gates[id]`, `computeAwaitingContext` omits it (guarded-presence,
  matches `ask` text's own existing omission rule).
- `computeAwaitingContext` on an item with only `askRationale` set (asked,
  not yet answered) — projects the checkpoint fields, omits the
  answer-side fields entirely (they don't exist yet).
- `computeAwaitingContext` on an item with only `rationale` set (answered,
  gate resolved, item likely no longer `awaiting-human` — function already
  returns `null` for non-`awaiting-human` items, so this case only matters
  mid-flight before the resume moves status away).

## No split

One coherent piece: the storage rename (1), the fold (2), and the
projection (3) have no independent value apart — `computeAwaitingContext`
projecting fields that never get written is pointless, and writing fields
nothing projects doesn't satisfy the item's own CoS ("`awaitingContext`
mang distillate"). Proceeds as one item.
