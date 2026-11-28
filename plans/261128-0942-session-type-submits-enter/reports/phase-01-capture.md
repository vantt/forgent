# Phase 1 capture report

## Installed versions (live-check machine)

| CLI | installed | pin before | pin now | frames recorded |
|---|---|---|---|---|
| claude | 2.1.332 | 2.1.302 | 2.1.332 | idle-empty x2, working |
| pi | 1.3.0 | 1.3.0 | 1.3.0 | idle-empty, half-typed, working |
| omp | 18.11.2 | 18.12.1 | 18.12.1 (unchanged) | none |
| agy | 1.5.10 | unchanged | unchanged | none |
| codex | unreadable | unchanged | unchanged | none |

The other machine's versions are not known.

## Changes

- claude: pin moved to 2.1.332. The vector harness holds one version per vector, so the old 2.1.302 real
  frames cannot stay as proofs: their banner makes the predicate return `unknown`. One of them
  (`half-typed`) stays as a vector that proves a frame from an older version is `unknown`. The real
  2.1.332 frames give two `empty` vectors and one working (`unknown`) vector. The synthesized vectors
  moved to 2.1.332 (banner text updated); they own the half-typed, draft, placeholder and chip cases.
- pi: `composer_state` now reads the composer between the last two `────` rules (or detector
  `promptText`); text there is `NotEmpty`, a blank box `Empty`, fewer than two rules `Unknown`;
  working frames stay `Unknown` through the shared gate. No second prompt parser: it uses the shared
  `has_paste_chip` and the shared working/blocked gate; `draft_still_in_composer` was not used because it needs the
  sent message, which a composer-state read does not have.
- `adapters.v1.json` typedNudges claude version and `nudge_typed.rs` literal moved to 2.1.332.

## Gaps (not invented, pins not moved)

- claude: no real half-typed or multi-line draft frame at 2.1.332. Those cases are proven by synthesized vectors only.
- codex: version unreadable and no frames; pin and `composer_state` unchanged.
- agy: installed 1.5.10, no frames; pin unchanged.
- omp: installed 18.11.2 differs from pin 18.12.1, no frames; pin and `Unknown` composer_state unchanged, so omp has no Empty/NotEmpty vectors (the Verify clause "pi and omp have at least one Empty and one NotEmpty" is unmet for omp).
- None of the captured frames carry `.insp.json` detector fields (`fgos session read` returns text only), so the new fixtures have no `.insp.json`; the predicates ran on screen text.
- The pi idle-empty frame was captured after a provider error, so its screen shows an error line above the composer.

## Verify

`cargo test -p fgos-agent-protocol --test terminal_vectors`: 13 passed.
`cargo test -p fgos-mailbox --test nudge_typed`: 2 passed.
