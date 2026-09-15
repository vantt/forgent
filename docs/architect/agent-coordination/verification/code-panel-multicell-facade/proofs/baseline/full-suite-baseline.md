# code-panel-multicell-facade — full-suite baseline

Captured by the Lead (mandatory plan-loop step 0), on a clean `TRACK_BRANCH`
before P00 opened.

- **Date:** 2026-09-15
- **BASE_REF:** `45569ac3379445e93436524c1226159b3869265c` (main HEAD after
  `tsk-1bh` landed)
- **Command:** `env -u CLAUDE_CODE_ENTRYPOINT -u CLAUDECODE -u CLAUDE_CODE_SSE_PORT npm test`
  (resolves to `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'`)
- **Environment fingerprint:** node v24.18.0, npm 11.16.0, Linux x86_64,
  `package-lock.json` sha256:`b097ecd850ca73e265a2dcbf94c63aa48c118069db53d42b00996fecd83fe2fc`
- **Result:** tests 6528, pass 6467, fail 52, skipped 9, cancelled 0, todo 0
  (6467 + 52 + 9 = 6528 — closes).
- **Duration:** 379572.97ms (~6m20s)

## Deduplication methodology

Node's test runner double-reports each failure (once inline during the run,
once in the final `failing tests:` recap). The recap section (after the line
`✖ failing tests:`) prefixes each failure with its own `test at <file>:<line>:<col>`
header, giving reliable per-failure file attribution. Counted via:

```sh
python3 -c "
import re
lines = open('<log>').readlines()
recap_start = next(i for i,l in enumerate(lines) if l.strip() == '✖ failing tests:')
recap = lines[recap_start:]
current_file = None
fails = []
for line in recap:
    m = re.match(r'^test at (\S+):\d+:\d+', line)
    if m: current_file = m.group(1); continue
    if line.startswith('✖ ') and 'failing tests:' not in line:
        fails.append((current_file, line.strip()))
print(len(fails))
"
```

52 unique (file, title) pairs, matching node's own `fail 52` tally exactly.

## 51 `test/rust-host/*` failures (pre-existing, unrelated to this track)

All fail identically with `Compiled Rust binary not found at
.../target/release/fgos` or `fgctl binary must exist at
.../target/release/fgctl` — no compiled Rust binary exists in this worktree.
Confirmed the same class as the `tsk-1bh` commit's own note ("51
failures... confined to test/rust-host/*"); count matches exactly.

1. Item 1 (HIGH): activation.lock orphaned by a killed process (dead pid) is reclaimed, not held forever
2. Item 1: A live-pid, within-ttl activation.lock is genuinely held, not reclaimed
3. Item 1: Concurrent fgctl init invocations against pre-staged pinned workspace observe activation-lock refusal (exactly one winner)
4. Item 2: Pinned workspace reconciles with matching --from source when unstaged, and refuses mismatching --from without overriding pin
5. Item 3: Idempotent re-run skips stage_release entirely (does not contend for install.lock)
6. Item 4: Live-PID lock whose ts is older than DEFAULT_TTL_MS is treated as free
7. Item 5 (widened): a tampered staged release is refused on the pin+matching --from NoOp arm too, not just the pin-only arm
8. Item 5: Staged release whose manifest.json digest mismatches pin is refused
9. Item 6: Stale activation.json.tmp.* files left from crash are cleaned up on fgctl init
10. L1: ./bin/fgos and bin/fgos are treated as a collision, not two different digests
11. P6 HIGH regression: staging a candidate with an in-root directory symlink triggers quarantine and puts nothing in releases/
12. P6 HIGH regression: staging a candidate with an unlisted payload symlink triggers quarantine and puts nothing in releases/
13. P7 (red-team HIGH): a hostile candidate that passes every static preflight check is never executed before publish and cannot write outside its release tree
14. P7: Atomic activation publish ensures valid activation.json without partial tmp artifacts
15. P7: Candidate preflight failure refuses init before publishing activation and writes no host-visible projections or activation.json
16. P7: Local runtime tail failure leaves workspace in diagnosable state with ready-degraded transaction record
17. P7: Repair failure when no runtime is active refuses with clear message
18. P7: Repair failure when rollback previous release is missing refuses with clear message
19. P7: Repair local tail failure leaves workspace in diagnosable state with ready-degraded transaction
20. P7: Upgrade candidate local tail failure leaves workspace in diagnosable state with ready-degraded transaction
21. P7: Upgrade candidate preflight failure refuses upgrade and leaves existing activation untouched
22. P7: Upgrade failure when no runtime is active refuses with clear message
23. Proof gap closure: staging a candidate with mismatched components.legacyNode.digest triggers quarantine and puts nothing in releases/
24. R1 & R11: Non-git directory refuses init with clear error and no .fgos/installation created
25. R1 & R2: Release tree builder stages release tree and produces canonical manifest with reproducible artifactDigest
26. R1, R2, R3, R6: A -> B upgrade then repair round-trips reported digest with zero work-state changes
27. R1, R6: Upgrade candidate whose stateSchemas.read omits workspace current schema is refused before publish
28. R1, R6: Upgrade candidate whose stateSchemas.write omits workspace current schema is refused before publish
29. R10: version --runtime-json outside activated workspace reports host: "dev-source" and null fields
30. R11 & R1-R8, R10: fgctl init in a fresh git project publishes shims, root.json, activation.json, and passes preflight/tail
31. R1: CLI recognizes valid subcommands; refuses unrecognized subcommands
32. R3: Repair when previousArtifactDigest is null re-verifies active release and heals broken capsule
33. R3: Staged release tree runs P02 harness from outside checkout with cleaned PATH/NODE_PATH
34. R4, R5, R6: Corrupting one byte in active release triggers quarantine and status reflects quarantined: true
35. R5 & R11: Hand-written live .fgos/main-checkout.lock refuses init writing nothing
36. R5 & R11: Live string-identity lock within DEFAULT_TTL_MS refuses init writing nothing
37. R5 drift guard: DEFAULT_TTL_MS in src/runner/main-checkout-lock.mjs:110 is 3 * 60 * 1000 ms
38. R5: Ambiguous (unparseable) main-checkout.lock refuses init writing nothing
39. R6 & R9: Concurrent stage invocations observe lock refusal (exactly one winner)
40. R6 & R9: Corrupting one byte before staging triggers quarantine and puts nothing in releases/
41. R6 & R9: Re-staging an already-staged digest is a no-op (manifest mtime unchanged)
42. R6 & R9: Staging a valid release tree verifies digests and creates releases/<digest>
43. R7: A .tar.gz with a path-traversing member alongside a valid release is refused, nothing published, no leftover temp dir
44. R7: A .tar.gz with a symlink member alongside a valid release is refused, nothing published
45. R7: Staging from a .tar.gz archive extracts with pure Rust and stages successfully
46. R8: status --json on empty store reports empty array, not an error
47. Red-team LOW: same-digest upgrade is idempotent (no new activationId, no self-referential previousArtifactDigest)
48. Red-team MEDIUM: a "falsely ready" binding (release moved but status never updated) self-heals via init --from
49. Red-team MEDIUM: repair of a tampered active release (no previousArtifactDigest) quarantines it, not just refuses
50. Reviewer M1: a quarantined workspace recovers via fgctl init --from (documented door), status returns to ready
51. Reviewer M2: upgrading away from a quarantined activation chains previousArtifactDigest past it, not to the moved digest

## 1 non-rust-host failure (pre-existing, unrelated to this track)

`test/cli/fgos-intake-4.test.mjs:318` — "ask/answer round-trip on a
genuinely legacy durable-doing item (no claim): answer clamps to todo —
awaiting-human -> doing no longer exists"

```
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  actual:   { id: 'gated-legacy-doing-item', from: 'doing', to: 'awaiting-human', seq: 3 }
  expected: { id: 'gated-legacy-doing-item', from: 'doing', to: 'awaiting-human', seq: 2 }
```

**Correction (Lead, after P00 fix-round-2 red-team finding N2/reviewer R2-02):**
this is an **in-session environment artifact, not a pre-existing deterministic
bug**. `seq` is derived per-writer-log
(`src/util/events.mjs:443-453`/session-identity.mjs:66) from
`CLAUDE_CODE_SESSION_ID` — every CLI spawned inside one Claude session shares
a single log, inflating `seq`. The BASELINE command above unsets
`CLAUDE_CODE_ENTRYPOINT`/`CLAUDECODE`/`CLAUDE_CODE_SSE_PORT` but **not**
`CLAUDE_CODE_SESSION_ID`, and both the original capture and the "isolated
re-run" that first called this "confirmed deterministic" ran inside the same
Claude session. Lead directly re-ran with the var also unset:

```sh
env -u CLAUDE_CODE_ENTRYPOINT -u CLAUDECODE -u CLAUDE_CODE_SSE_PORT \
  -u CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID \
  node --test test/cli/fgos-intake-4.test.mjs
# -> 15 pass / 0 fail (was 14 pass / 1 fail with CLAUDE_CODE_SESSION_ID set)
```

**The true, environment-independent baseline is 51 failures (all
`test/rust-host/*`), not 52.** The "52" figure recorded throughout this
track so far (this file, P00's own docs, P04's full-suite gate result below)
reflects a CONSISTENT in-session artifact applied uniformly to every run
captured inside this same Claude session — so every *relative* comparison
already made in this track (baseline vs P04, "zero regressions") remains
valid, since both sides carried the identical +1 artifact. Only the
*absolute* count and this failure's classification were wrong.
**Going forward, any FULL_TEST run for this track (including P05's final
gate) must also unset `CLAUDE_CODE_SESSION_ID` and `FGOS_SESSION_ID`** — the
corrected, canonical `FULL_TEST` command is:

```sh
env -u CLAUDE_CODE_ENTRYPOINT -u CLAUDECODE -u CLAUDE_CODE_SSE_PORT \
  -u CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID npm test
```

A gate run with this corrected command should show 51 known baseline
failures, not 52; a gate that still shows the fgos-intake-4 failure was run
without unsetting `CLAUDE_CODE_SESSION_ID`/`FGOS_SESSION_ID` and is not
itself a regression.

## Invariant

This list of **51** (`test/rust-host/*` only, per the correction above) may
only **shrink**, never grow, at any later full-suite gate in this track run
with the corrected `FULL_TEST` command (P05's final gate). A new failure not
on this list at a later gate is a real regression from this track's own
diff, not baseline noise — it must be fixed or explicitly triaged as a
distinct, non-baseline finding before that gate can close. (P04's own gate,
recorded below, was captured before this correction and shows the
uncorrected 52-count for internal comparison purposes only — see that
section's own note.)

## P04 full-suite gate result (first confirmation of this invariant)

Run 2026-09-15 against `testedSha` `b16dd524621cbf97690663e9764f9ede286583be`
(P04's own worktree, same environment fingerprint): tests 6530, pass 6469,
fail 52. The 2 extra tests are the new regression tests P04 added, both
passing. The 52 failing titles are byte-identical to the list above (empty
diff) — zero regressions, zero incidental fixes. **Captured before the
CLAUDE_CODE_SESSION_ID correction above** — like the original baseline, this
run did not unset that variable, so it also carries the same +1
(fgos-intake-4) artifact. The *comparison itself* (baseline vs P04, no new
failures) stays valid regardless, since both runs shared the identical
artifact; a future re-run of this exact gate with the corrected command
would show 51/6469 (or 6470, since the artifact-affected test would then
pass), not 52/6469.
