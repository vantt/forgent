---
authoritative_for: FGOS_NOISE_ONLY_PATHS missing events-jsonl.truncation-guard.json, fgos return re-verify false failure after tsk-3ve sharding, test-harness .gitignore fixture drift
---

# A new noise file from Tầng A's own migration wasn't on the noise-exemption list yet

`tsk-vim` fixed a small but repo-wide-impact gap: `FGOS_NOISE_ONLY_PATHS`
(`bin/fgos.mjs`) didn't recognize `.fgos/events-jsonl.truncation-guard.json`
as a noise-only path — a file [Tầng A's own event-log sharding migration](eventlog-tier-a-multifile-content-hash-redesign.md)
introduced.

## Confirmed unrelated to any specific item — a repo-wide regression

Discovered while driving `tsk-67o`, but confirmed via direct reproduction
that it wasn't specific to that item's own diff: `fgos return`'s
re-verify of `test/cli/fgos-return.test.mjs` failed 2-3 pre-existing
assertions (the `tsk-x5r` self-exempt test, the "ONLY `.fgos/` is dirty"
test, a sha-mismatch test) identically on the main checkout and on
multiple unrelated branches — every item's return path was affected the
same way, not just the one being driven when it was noticed.

## The fix

`FGOS_NOISE_ONLY_PATHS` extended with one more alternative,
`events-jsonl\.truncation-guard\.json`, the same way the existing
`entropy-history.jsonl` alternative already worked — plus a mirrored
regression test.

## A second, related drift fixed in the same commit

`test/cli/helpers/fgos-cli-harness.mjs`'s own test-fixture `.gitignore`
had drifted out of sync with the repo's real root `.gitignore`, which
already excluded this same path (per `tsk-cgg`). Synced in the same
commit so the fixture matches the real repo's exclusion rules again.

## A small procedural note

The item's own history records a "gate resolution for hard-gate keyword
false positive" — a validating-stage keyword gate flagged something in
this item's own text as a false positive, resolved and recorded directly
rather than blocking progress.
