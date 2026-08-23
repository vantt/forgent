---
item: tsk-1sj
stage: clarify
docsRef: docs/history/parallel-dispatch-demo-format-utils/
---

# CONTEXT — tsk-1sj: two independent format utilities (parallel-dispatch demo)

## Feature boundary

Add two small, mutually independent formatting utilities, each with its
own new file and its own test file, touching no file the other touches:

1. `src/util/format-duration.mjs` — humanize a millisecond count into a
   short string (e.g. `2m 30s`).
2. `src/util/format-bytes.mjs` — humanize a byte count into a short string
   (e.g. `1.5 MB`).

This item exists to empirically demonstrate `tsk-66o`'s
computed-parallel-wave-schedule (`fgos schedule`): the two functions above
are its own two candidate children, deliberately shaped with zero shared
footprint, so `fgos-coding-planning` can split them and they land in the same
wave, dispatched and implemented concurrently.

## Locked decisions

| D-ID | Summary | Rationale (short) |
|---|---|---|
| D1 | `format-bytes` uses binary base 1024 (1 MB = 1024×1024 byte); the displayed unit label stays `MB`/`GB` (not renamed to `MiB`/`GiB`) | No existing byte-formatting convention anywhere in the repo (scout `rg` over `src` for duration/humanize/bytes/MB patterns came back empty) — person picked 1024 directly when asked decimal-vs-binary with concrete numbers (1,500,000 B → "1.43 MB" under 1024, confirmed) |
| D2 | `format-duration` supports all four units — day/hour/minute/second — not just the minute/second the original example (`2m 30s`) showed | Person chose to widen scope beyond the example when asked whether hour/day support was needed |

## Pinned terms

- **binary base (1024)** — every byte-unit step (KB→MB→GB) divides by
  1024, not 1000; this is D1's whole content, stated explicitly because
  the ambiguous label "MB" alone does not disambiguate it.
- **four-unit duration** — `format-duration`'s output picks from
  day/hour/minute/second, largest non-zero unit first (exact rounding/
  truncation behavior at unit boundaries is an implementation choice,
  left to `fgos-coding-planning`/implementation, not locked here per this
  skill's own "do not research implementation" rule).

## Scout evidence

- `rg -i "duration|humaniz|bytes|MB|formatDuration|formatBytes" src --glob "*.mjs"` — no existing formatting helper of this shape anywhere in `src/`; no prior convention to follow or conflict with.
- No prior `judgeDiscovery` verdicts recorded for `tsk-1sj` (`view.discovery["tsk-1sj"]` empty) — nothing to reconcile against.
- Impact-analysis capability gate (`fgos tool query --capability impact-analysis --status present`): GitNexus `present`, checked fresh this session — Full mode per `CLAUDE.md`'s gate. Informational only here (this skill edits no code); both target files are new, so there is no existing symbol to run `impact` against yet — that check applies once `fgos-coding-planning`/`fgos-coding-implement` touch real code.

## Canonical references

- `docs/history/parallel-decomposition-footprint-avoidance/CONTEXT.md` (`tsk-66o`) — the computed-parallel-wave-schedule feature this item exists to demo end-to-end.

## Outstanding questions deferred to planning

- Exact rounding/truncation rule at each unit boundary for both functions
  (e.g. whether `format-bytes` shows one decimal place always, or trims a
  trailing `.0`) — implementation detail, `fgos-coding-planning`'s/the
  implementer's call, not a product decision.
- Behavior for zero/negative input on either function — same
  implementation-detail deferral.
