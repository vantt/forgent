# Smoke test: architecture-advisory-panel-standard-v1

Fake-executor end-to-end run through the real public door
(`fgos coordination pack run`), proving:

- The explanation re-gate works: `explain-recommendation` dispatches
  directly off `post-synthesis-open` with no `post-redteam-open` window
  and no red-team dispatch anywhere in the chain.
- Quorum/close works: 5 separate CLI calls (park/resume across each),
  session reaches `closed: true` only once `close-dialogue` settles.
- Required actors at close: ["lead-advisor-actor","context-investigator-actor","system-shaper-actor","alternative-shaper-actor","constraint-advocate-actor","architecture-critic-actor","synthesizer-actor"] (7, no red-team-actor).

Coordination id: `smoke_standard_variant_v1`
Temp cwd: `/tmp/fgos-cli-f1sjXX`

Result: PASS. See smoke-test-standard-variant.log for the full raw CLI
transcript (every request/response pair).
