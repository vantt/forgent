# agy blind canary (2026-10-05)

Account: `~/.agy-homes/tetcu72` (always-proceed, forgentX trusted). Invocations added to `.fgos/config.json` under executor `gemini`: `agy-herdr-tetcu72` (herdr-spawn, bwrap) and `agy-cli-bwrap-tetcu72` (cli-spawn, bwrap), copied from the mucdong ones with only the home changed.

## Results

| Check | Invocation | Result |
|---|---|---|
| Plain read-only unit | agy-herdr-tetcu72 | pass (claim: README first heading, 137 lines). Pane started clean, herdr detected `agy`, brief taken: the confined-pane HOME fix works end to end |
| Blind unit with a `unit-run:` input | agy-herdr-tetcu72 | pass: nonce read from its own copy; the source report path gave "no such file or directory"; `ls .fgos/assignments` showed 1 entry (its own) |
| Blind unit, same probe | agy-cli-bwrap-tetcu72 | pass: same three results |

Evidence runs: unit A `unit-run-1791192696761-bcf946dd` (wrote `NONCE=agy-blind-5521`), blind units `unit-run-1791192719865-869baa90` (herdr) and `unit-run-1791192852426-b9ae79dc` (cli bwrap). `inputMap` in the blind unit's `unit.json` records the neutral copy name and the source sha256.

## Quota notes

- mucdong still answered "Individual quota reached ... Resets in 5m" at 16:22; tetcu72 answered the same once ("Resets in 2s") and then ran normally. Quota resets fast, so a canary can need one retry.
- tetnu has only `agy-cli-tetnu` (not confined), so a read-only unit is refused with `posture-unavailable` on it.

## Changes made from this canary

- `BLIND_PROVEN_PAIRS` gains `gemini/herdr` and `gemini/cli` (bwrap).
- `blind: true` on `shape-proposals` (architecture-advisory) and `explore-perspectives` (business-discussion): both pools were non-blind only because agy was unproven.
- The doctor check test uses an unmeasured family (mistral) as its unproven example.

## Addendum: claude/cli and xai/cli (same day)

The blind check (`blind-steps-use-proven-pools`) found two more pairs reachable from the pools of `architecture-advisory` and `business-discussion` that no canary had covered. The same unit B (blind, one `unit-run:` input, probe of the source path and of `.fgos/assignments`) ran on both.

| Pair | Invocation | Result |
|---|---|---|
| claude / cli | claude-cli-bwrap | pass: nonce read from the copy; source path "File does not exist". The `ls .fgos/assignments` probe needed an approval the headless run could not give, so the entry count is unknown; blindness rests on the ENOENT and on the copy |
| xai / cli | pi-cli-bwrap-vantt | pass: nonce from `inputs/1-producer-r1.md`; source path ENOENT; 1 entry visible in `.fgos/assignments` |

Both pairs were added to `BLIND_PROVEN_PAIRS`. After that, with the six discussion capabilities given the same five-family pool as `architecture:shape` and the `tetnu` agy account given confined invocations, the check passes with 6 blind units.
