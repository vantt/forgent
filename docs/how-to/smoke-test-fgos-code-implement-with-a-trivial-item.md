---
type: how-to
title: How to smoke-test fgos-coding-implement with a trivial verify=true item
tags: []
timestamp: 2026-07-29T00:00:00.000Z
source_capture_ids: [str89-case-study-executing]
---
# How to smoke-test fgos-coding-implement with a trivial verify=true item

Use this when you want to confirm `fgos-coding-implement`'s own claim-to-proposed
path still works end to end, without risking a real feature's scope —
add a throwaway chore item whose `verify` is the literal string `"true"`
(a no-op that always passes) and run it through the normal claim flow.

## Steps

1. Add a `chore`-kind item with `verify` set to the no-op string:

   ```
   fgos add <id> --title "<case-study title>" --kind chore --risk low --verify true
   ```

   The real item this doc is grounded in was added this way — title
   `"STR89 case study: exercise fgos-coding-implement"`, `kind: "chore"`,
   `risk: "low"`, `verify: "true"`, no `description` field at all:

   > `{"type":"work.add","payload":{"id":"str89-case-study-executing","title":"STR89 case study: exercise fgos-coding-implement","kind":"chore","status":"todo","deps":[],"risk":"low","refs":[],"verify":"true","tier":"standard"}}`
   > — real `work.add` capture, id `str89-case-study-executing`, `.fgos/events.jsonl:97`

2. Claim/pick it and let `fgos-coding-implement` run. With `verify: "true"` there
   is no real implementation to write — the skill's own verify step passes
   trivially. The real run's predicted-outcome capture at claim time:

   > `{"predicted":{"tier":"standard","deps":0,"priorVisits":0,"actor":"session","headAtTake":"de941511dd770d216ec71e529f0b5ab3cb6621f7"}}`
   > — real `work.outcome` capture, id `str89-case-study-executing`, `.fgos/events.jsonl:99`

3. Return the item. Expect it to land on `proposed` in a single attempt,
   with no error class recorded:

   > `{"actual":{"outcome":"proposed","passed":true,"attempts":1,"errorClass":null,"aheadCount":1}}`
   > — real `work.outcome` capture, id `str89-case-study-executing`, `.fgos/events.jsonl:101`

   In the real run, the whole claim-to-proposed pass (`work.move` `todo`→`doing`
   to `work.move` `doing`→`proposed`) took under three minutes:
   `2026-07-24T04:05:22.907Z` to `2026-07-24T04:08:04.080Z`
   (`.fgos/events.jsonl:98,100`).

## What a clean smoke-test run confirms

`attempts: 1` and `errorClass: null` together mean the claim went through
`fgos-coding-implement` without the skill needing a retry or hitting a verify
failure — a single-pass happy path. `aheadCount: 1` confirms the return
carried exactly one real commit forward, so the no-op `verify` did not
mask a claim that made no commit at all.

## Note: `proposed` is not `done` on its own

A `chore` item like this still has to clear the normal `compound-learn`
gate (RUL50: `src/state/store.mjs`) before it can move `proposed` → `done` —
landing on `proposed` only proves the claim-to-return path works, not that
the item is finished. See `fgos-coding-compounding`'s own skill doc for that step.

## Related

- `fgos check <id>` — full predicted/actual/friction/settlement history for
  an item, including the entries quoted above.
- `fgos-coding-implement` skill — the skill this smoke test exercises.

## Document history (compound-learn capture linkage)

This doc's path
(`docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md`) is linked
to one real compound-learn capture, gathered via `fgos doc-sources
docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md`:

> ```json
> {
>   "id": "str89-case-study-executing",
>   "predicted": {"tier":"standard","deps":0,"priorVisits":0,"actor":"session","headAtTake":"de941511dd770d216ec71e529f0b5ab3cb6621f7"},
>   "actual": {"outcome":"proposed","passed":true,"attempts":1,"errorClass":null,"aheadCount":1},
>   "docType": "how-to",
>   "docPath": "docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md"
> }
> ```
> — real `work.outcome` capture, id `str89-case-study-executing`

No `friction`, `settlement`, or `learning` were recorded against this item
(`fgos check str89-case-study-executing`) — the run was clean, so this doc
stays thin rather than inventing trouble that never happened. If a later
capture links to this same `docPath`, the export skill accumulates it here
too, additively, without losing this section or anything above it.
