# Phase 1 capture report

## Installed versions (live-check machine)

| CLI | installed | pin before | pin now | frames recorded |
|---|---|---|---|---|
| claude | 2.1.332 | 2.1.302 | 2.1.332 | idle-empty x2, half-typed, working |
| pi | 1.3.0 | 1.3.0 | 1.3.0 | idle-empty, half-typed, working |
| omp | 18.11.2 | 18.12.1 | 18.11.2 | idle-empty, half-typed, idle turn-finished (empty composer) |
| agy | 1.5.18 | 1.4.2 | 1.5.18 | idle-empty, half-typed, quota-reached-idle |
| codex | 0.166.0 | 0.163.0 | 0.166.0 | idle-empty, half-typed, working |

The other machine's versions are not known.

## Changes

- review fixes: the agy `start-banner` vector now uses a banner-rewritten 1.5.18 copy, so `unknown` comes from
  the start-banner rule, not a version mismatch; every `*-banner-updated.txt` copy carries its original's
  `.insp.json`. omp `composer_state` is `unknown` unless the status line directly above `╰─` starts with `π`,
  and `empty` only for a blank line or exactly the known thinking-effort hint (no gap heuristic); new vectors:
  working frame, chip, spinner-led status, text after a wide gap. The `nudge_typed` table now carries an
  explicit untested-version flag asserted on every row.
- claude: pin moved to 2.1.332. The vector harness holds one version per vector, so the old 2.1.302 real
  frames cannot stay as proofs: their banner makes the predicate return `unknown`. The existing
  `version-bump-yields-unknown` vector owns the older-version case, so the duplicate
  `frame-from-an-older-claude-version-is-unknown` vector is dropped. The real 2.1.332 frames give two
  `empty` vectors, one working (`unknown`) vector and, new, a real half-typed (`not-empty`) vector;
  `busy-working` is dropped (tagged 2.1.332 but its frame showed a v2.1.302 banner). The synthesized vectors
  moved to 2.1.332 (banner text updated) and cover the short half-typed draft, placeholder and chip cases; a
  synthesized vector (prompt glyph, U+00A0, `fix the broken test`) proves the no-break space after the prompt
  reads `not-empty`.
- pi: `composer_state` reads the composer between the last two rules (or detector `promptText`). A rule is
  a line starting with two box-drawing horizontals, so the status rule (`── ⠹ Working`) counts. The bottom
  rule must lie within the last 3 non-blank lines (only the cwd and token footer may follow it), otherwise
  `Unknown`, so two adjacent transcript rules (markdown rule, table border) never yield `Empty`. Text
  between the rules is `NotEmpty`, a blank box `Empty`, fewer than two rules `Unknown`; working frames stay
  `Unknown` through the shared gate. A synthesized pi vector proves two adjacent transcript rules with no
  composer at the bottom is `unknown`.
- codex: pin moved to 0.166.0; predicate unchanged. New real frames: idle-empty (placeholder composer,
  `empty`), half-typed (`not-empty`), working (`unknown` through the shared working gate). The old 0.163.0
  real frames cannot prove a composer at the new pin (banner mismatch gives `unknown`), so the old
  `ready` and `half-typed` composer vectors are replaced by the new real frames; the turn-finished, draft and
  expanded-draft frames have no 0.166.0 capture, so their composer vectors use copies of the real screens with
  only the banner line rewritten to 0.166.0 (`*-banner-updated.txt`, named in each vector's `source`). The
  synthesized, dialog, hooks-review and busy-working vectors are re-tagged 0.166.0. The existing
  `version-bump-yields-unknown` vector (0.999.0) keeps the mismatch proof.
- agy: pin moved to 1.5.18; predicate unchanged. New real frames: idle-empty (`empty`), half-typed
  (`not-empty`), and quota-reached-idle (an `Individual quota reached` error with the composer empty below it,
  `empty`; no turn ran, so it is not a working frame). The account email and error id in these screens are
  replaced by placeholders. The 1.4.2 `ready`/`half-typed` composer vectors are replaced; the draft frame has
  no 1.5.18 capture and goes through a banner-rewritten copy as for codex. The 1.9.999 mismatch vector stays.
- omp: pin moved to 18.11.2. `composer_state` is a real predicate: the composer is the `╰─` line within the
  last 3 non-blank lines of the screen (detector `promptText`, when present, is `NotEmpty`). Text after the
  mark is the draft; a right-aligned hint set off by a run of 8 or more spaces
  (`⇧⇥ to change thinking effort`) is ignored; nothing left is `Empty`; no `╰─` line in the tail is `Unknown`.
  Vectors: real idle-empty and real just-after-reply (idle turn-finished, empty composer; it was captured as
  a working attempt but shows the finished reply) are `empty`; the real half-typed frame (with an
  autocomplete suggestion) is `not-empty`; synthesized vectors prove a draft before the hint is `not-empty`
  and a `╰─` line higher in the transcript is `unknown`. omp has no screen version marker, so no
  version-mismatch vector exists for it (as for pi).
- `adapters.v1.json` typedNudges: claude 2.1.332, codex 0.166.0, agy 1.5.18; `nudge_typed.rs` literals follow.
  codex 0.166.0 is also a version the queue push was measured on, so at that version the channel order is
  `[CodexQueue, Typed]` and the typed wake is the fallback when the queue refuses. The test's send cases now
  refuse the queue and the typed channel separately, and keep the "untested version" report clause proof on
  codex 0.163.0 (neither channel measured there), because the typed-only path no longer exists for codex.
- `typed_wake.rs`: omp joins the per-profile loop with an empty-composer frame, so all five CLIs are covered.

## Gaps (not invented)

- No real working frame exists for omp (the "working" capture came just after the reply) or for agy (the
  attempt hit the quota, no turn ran). Their working state is covered only by older recorded frames and the
  shared working gate.
- claude: no vector proves a long multi-line draft whose detector `promptText` is cut off with `...`; that
  needs a real frame. The new real half-typed frame is a short draft.
- codex turn-finished, draft-in-composer and expanded-draft, and agy draft-in-composer, have no capture at the
  new pins; their vectors use banner-rewritten copies of the older real screens.
- None of the captured frames carry `.insp.json` detector fields (`fgos session read` returns text only), so
  the new fixtures have no `.insp.json`; the predicates ran on screen text.
- The pi idle-empty frame was captured after a provider error, so its screen shows an error line above the
  composer.

## Verify

`cargo test -p fgos-agent-protocol --test terminal_vectors`: 13 passed.
`cargo test -p fgos-mailbox --test nudge_typed`: 2 passed.
`cargo test -p fgos-session-host --test typed_wake`: 6 passed.
`cargo fmt --check` on the three crates: clean.
