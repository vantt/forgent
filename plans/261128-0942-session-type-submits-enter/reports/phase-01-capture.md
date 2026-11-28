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
  frames cannot stay as proofs: their banner makes the predicate return `unknown`. The existing
  `version-bump-yields-unknown` vector owns the older-version case, so the duplicate
  `frame-from-an-older-claude-version-is-unknown` vector is dropped. The real 2.1.332 frames give two
  `empty` vectors and one working (`unknown`) vector; `busy-working` is dropped (tagged 2.1.332 but its
  frame showed a v2.1.302 banner). The synthesized vectors moved to 2.1.332 (banner text updated) and
  cover the short half-typed draft, placeholder and chip cases; a new synthesized vector (prompt glyph,
  U+00A0, `fix the broken test`) proves the no-break space after the prompt reads `not-empty`.
- pi: `composer_state` reads the composer between the last two rules (or detector `promptText`). A rule is
  a line starting with two box-drawing horizontals, so the status rule (`── ⠹ Working`) counts. The bottom
  rule must lie within the last 3 non-blank lines (only the cwd and token footer may follow it), otherwise
  `Unknown`, so two adjacent transcript rules (markdown rule, table border) never yield `Empty`. Text
  between the rules is `NotEmpty`, a blank box `Empty`, fewer than two rules `Unknown`; working frames stay
  `Unknown` through the shared gate. `has_paste_chip` is no longer used (a chip is non-blank text anyway).
  A new synthesized pi vector proves two adjacent transcript rules with no composer at the bottom is `unknown`.
- `adapters.v1.json` typedNudges claude version and `nudge_typed.rs` literal moved to 2.1.332.

## Gaps (not invented, pins not moved)

- claude: no 2.1.332 vector proves a long multi-line draft whose detector `promptText` is cut off with `...`; that needs a real frame. Synthesized vectors do not own that case.
- agy, omp and codex frames are parked on owner question q-ahyrg44uwh.
- codex: version unreadable and no frames; pin and `composer_state` unchanged.
- agy: installed 1.5.10, no frames; pin unchanged.
- omp: installed 18.11.2 differs from pin 18.12.1, no frames; pin and `Unknown` composer_state unchanged, so omp has no Empty/NotEmpty vectors (the Verify clause "pi and omp have at least one Empty and one NotEmpty" is unmet for omp).
- None of the captured frames carry `.insp.json` detector fields (`fgos session read` returns text only), so the new fixtures have no `.insp.json`; the predicates ran on screen text.
- The pi idle-empty frame was captured after a provider error, so its screen shows an error line above the composer.

## Verify

`cargo test -p fgos-agent-protocol --test terminal_vectors`: 13 passed.
`cargo test -p fgos-mailbox --test nudge_typed`: 2 passed.
