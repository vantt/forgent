# agy blind canary (2026-10-05)

**Correction (same day).** These runs were first described as run on the `tetcu72` account through new `agy-*-tetcu72` invocations. They were not: `provider-capacity-selection.json` of each run shows account `mucdong`. The capacity layer picks the account per provider from `runner.providers.gemini.accounts` and seeds the pane's private home from it, ignoring the `HOME` in the invocation name. The `tetcu72` and `tetnu` invocations were therefore removed, and both are now declared as gemini accounts in the global config; the blind and herdr results below stand, since neither depends on the account.

## Results

| Check | Invocation | Result |
|---|---|---|
| Plain read-only unit | agy-herdr (account mucdong) | pass (claim: README first heading, 137 lines). Pane started clean, herdr detected `agy`, brief taken: the confined-pane HOME fix works end to end |
| Blind unit with a `unit-run:` input | agy-herdr (account mucdong) | pass: nonce read from its own copy; the source report path gave "no such file or directory"; `ls .fgos/assignments` showed 1 entry (its own) |
| Blind unit, same probe | agy-cli-bwrap (account mucdong) | pass: same three results |

Evidence runs: unit A `unit-run-1791192696761-bcf946dd` (wrote `NONCE=agy-blind-5521`), blind units `unit-run-1791192719865-869baa90` (herdr) and `unit-run-1791192852426-b9ae79dc` (cli bwrap). `inputMap` in the blind unit's `unit.json` records the neutral copy name and the source sha256.

## Quota notes

- The account (mucdong) answered "Individual quota reached ... Resets in 5m" at 16:22 and "Resets in 2s" at 16:27, then ran normally. Quota resets fast, so a canary can need one retry.
- tetnu has only `agy-cli-tetnu` (not confined), so a read-only unit is refused with `posture-unavailable` on it: for read-only and blind units use the confined invocations, which take their account from the capacity layer.

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
