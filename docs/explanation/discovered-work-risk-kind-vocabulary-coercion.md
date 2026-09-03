---
authoritative_for: discovered-work fenced-block risk/kind out-of-vocabulary silent drop, captureDiscoveredWork coercion, worker prompt template risk/kind enum
---

# A real discovered-work item silently vanished from an out-of-vocabulary `risk` value

`tsk-2ck` closed a real, confirmed-live data-loss bug: the
`fgos-discovered` fenced-block schema every worker prompt template
teaches gave the worker zero guidance on what values `risk` could
actually take — no enum, no example. A worker following ordinary
English (e.g. `"medium"`) produced a value outside the coding domain's
own real vocabulary (`light`/`standard`/`heavy`).

## Confirmed live, and the exact silent-drop mechanism

On `tsk-5dnt` (2026-08-20), the `agy`/`gemini` worker's real discovered-
work report used `risk: "medium"`. In the real automated runner
(`captureDiscoveredWork`, `src/runner/loop.mjs`), the block's raw `risk`
value was passed straight into `addWork` with no validation or coercion.
`addWork`'s own `validateWorkShape` then threw (`work.risk must be one
of ["light","standard","heavy"] for domain "coding"`) — and the *outer*
try/catch silently swallowed this as "discovery-report create skipped,"
per its own doc comment ("FAIL-SAFE by construction... a bad block is
logged and skipped, never altering the dispatch outcome"). **Net effect:
a legitimate, real discovered-work item the worker correctly identified
and reported was silently thrown away with only a log line** — no error
surfaced to the driving session, no retry, no fallback value. Manually
reproduced the identical failure: `fgos add --risk medium ...` → exit 4,
same validation error.

## What shipped — both suggested fix directions, together

1. **Prompt templates corrected** (`worker-prompt-default.txt`,
   `worker-prompt-discovery.txt`, `worker-prompt-skill-pointer.txt`) to
   name the real domain-specific vocabulary instead of leaving `risk`
   unconstrained.
2. **`captureDiscoveredWork` now defensively coerces an out-of-
   vocabulary value instead of losing the whole item.** It reads the
   domain's real controlled vocabulary via `classificationVocabulary`
   (`workflow-stage-graphs.mjs`) for both `kind` and `risk`, checks the
   worker's reported value against it, and falls back to the already-
   `derived` classification value when the reported one isn't valid —
   the same fail-safe spirit the surrounding code already claimed for
   this whole code path, now actually delivered for this one field
   rather than losing the item outright on any mismatch.

## A false-positive citation-gate finding along the way

Landed with an explicit human gate-approval record for a schema-keyword
false positive this repo's own citation-drift check raised during the
fix — approved past rather than worked around, per this repo's own
review-decision discipline.
