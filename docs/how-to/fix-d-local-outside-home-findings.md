---
authoritative_for: fixing a d-local-outside-home finding, check-decision-citation-drift.mjs D-local id fix contract
---

# Fix a `d-local-outside-home` finding

`check-decision-citation-drift.mjs` flags a `d-local-outside-home`
finding when a `D<n>` id (local to one `CONTEXT.md`) is cited anywhere
outside its own home file. Per decision 0017, a D-local id is **never**
cited outside its home, gloss or not — this is a different, heavier fix
than `bare-citation` (see `docs/how-to/fix-bare-citation-findings.md`),
which only needs a gloss added. `tsk-2sp-1`/`tsk-2sp-2`/`tsk-2sp-5` fixed
1019 of these across `docs/specs/*.md` and `docs/backlog.md`.

## The fix, mechanically

Delete the `D<n>`/`per D<n>` token itself. What replaces it depends on
whether the surrounding text already carries enough meaning on its own:

- **If the citing line already has a self-sufficient gloss right next to
  the D-id** (often true after a prior `bare-citation` pass already added
  one for an adjacent `RUL<n>`/`ADR<n>` on the same line), simply drop the
  `D<n>`/`per D<n> ` prefix — the remaining text already stands alone:

  ```diff
  - (per D2/D3 str61-chat-context-continuity — xem RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm))
  + (per str61-chat-context-continuity — xem RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm))
  ```

  ```diff
  - `wontfix` — TERMINAL thứ hai (per fsm-wontfix-terminal-status D1), cho item bị đóng...
  + `wontfix` — TERMINAL thứ hai (per fsm-wontfix-terminal-status), cho item bị đóng...
  ```

- **If the D-id was carrying real, load-bearing content the reader needs**
  (not just a citation), inline that content in prose at the citing
  location instead of just deleting the reference — per decision 0017's
  own instruction, this is the "only correct fix" for that case. This
  needs a real read of what the D-id's home `CONTEXT.md` actually said;
  it is not a blind delete.

Both shapes end the same way: the `D<n>` token is gone from every
location outside its home file, and no meaning is lost — either because
the surrounding text already carried it, or because it was inlined.

## Why this is heavier than `bare-citation`

`bare-citation` is a pure addition (append a gloss). `d-local-outside-home`
requires judgment at every occurrence: is the surrounding context already
sufficient once the id is dropped, or does real content need to move? A
mechanical find-and-delete of every `D<n>` token without checking which
case applies risks silently losing meaning the reader needed. This is why
`tsk-2yu`'s own calibration slice deliberately kept `bare-citation` and
`d-local-outside-home` fixes in separate items — see
`docs/explanation/citation-baseline-cleanup-calibration-slice.md`.

## Regenerating the baseline afterward

Same as the `bare-citation` fix — run `check-decision-citation-drift.mjs
--write-baseline` after the edits; the baseline is keyed by full line
content, so fixed lines drop out automatically.
