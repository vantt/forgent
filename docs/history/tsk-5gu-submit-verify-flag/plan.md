# Plan: tsk-5gu — add an optional `--verify` override to `fgos submit`

Mode: **small** (no `fgos-routing` Orient hand-off existed — driven
directly via `fgos-coding-driving` from `/fgOS:cook`, direct-entry
fallback applies). Flags: only "existing covered behavior" applies
(`submit`/`submitWork` are covered by existing tests) — 0-1 flags → tiny
or small. A few files touched (CLI parsing, `submitWork`, a test, the
help/param-table doc reference), no gray areas — **small**, not tiny.

No `CONTEXT.md` exists — discovery verdict came back `clear` (D2 skips
`exploring`). Evidence base is `RESEARCH.md`.

## Approach

**Confirmed still accurate (RESEARCH.md Round 1).** `submit`'s CLI case
(`bin/fgos.mjs:1284-1329`) has no `--verify` flag; `submitWork`
(`bin/fgos.mjs:943`) hardcodes `verify: SUBMIT_VERIFY_SENTINEL`
unconditionally — the one field in that object literal with no
`opts.X ?? default` fallback, unlike every textually-adjacent field
(`tier`/`kind`/`risk`, `refs`, `docsRef`, `parent`/`footprint`/
`goalTier`/`targets`/`urgent`), each of which was added later under the
explicit "same field-parity flags `add` already exposes" precedent
(`str51-llm-assist-classify` D2/D5, `tsk-5fs` D1).

**Fix: extend the same precedent to `verify`.** Add `--verify` to
`submit`'s CLI param parsing, optional, using the same
`optionalField(flags.tier, ...)` shape the neighboring `--tier`/`--kind`/
`--risk` flags already use (`bin/fgos.mjs:1308-1310`) — never `add`'s own
required, unwrapped `verify: flags.verify` shape (`bin/fgos.mjs:1163`),
since submit's own fields are optional overrides of a mechanical default
by design (D5: "a free-text submission has no verification plan yet").
In `submitWork`, change `verify: SUBMIT_VERIFY_SENTINEL` (line 943) to
`verify: opts.verify ?? SUBMIT_VERIFY_SENTINEL` — a flagless call stays
byte-identical to today's behavior, matching every prior field-parity
addition's own stated contract.

**Impact-analysis posture: full** — `gitnexus` registered and `present`
(`fgos tool query --capability impact-analysis --status present`).
`impact({target: "submitWork", direction: "upstream"})` required before
editing it at Implement (CLAUDE.md's MUST rule) — deferred to that step
per this skill's own "leave execution alone" boundary; this plan only
records the posture.

**Smaller path considered and rejected:** none smaller exists — this is
already the minimal diff (one optional flag, one fallback expression);
there is no split-worthy sub-piece.

## Shape

One piece, pass-through (no split). Files touched:

- `bin/fgos.mjs` — add `--verify` to `submit`'s CLI param table
  (mirroring `--tier`'s `optionalField` shape) and thread it into
  `submitWork`'s `verify` field.
- `test/` — extend `submit`'s existing CLI test coverage (wherever
  `--tier`/`--kind`/`--risk` are currently tested for `submit`, add the
  symmetric case for `--verify`: present → used verbatim; omitted →
  `SUBMIT_VERIFY_SENTINEL` unchanged).

### Cases this needs to hold for

- `fgos submit "<text>" --verify "npm test"` — the item's own `verify`
  field is set to `npm test` verbatim, not the sentinel.
- `fgos submit "<text>"` (no `--verify`) — unchanged: item's own `verify`
  is `SUBMIT_VERIFY_SENTINEL`, byte-identical to today.
- `fgos submit "<text>" --verify ""` — `optionalField`'s own existing
  contract (same as `--tier`/`--kind`/`--risk`) rejects a blank/empty
  flag value rather than silently treating it as omitted; no new
  behavior to design here, this skill inherits `optionalField`'s existing
  validation unchanged.
- `/fgOS:submit` and `fgos-submit-assist` — untouched by this item's own
  scope (the item's own "hướng đề xuất" section says these should learn
  to pass the flag "khi người nộp đã nêu rõ" verify, but that is a
  separate, later integration step for those two callers, not part of
  this CLI-layer fix; flagging as an Outstanding question below rather
  than silently expanding scope).

## Verify

```bash
npm test
```

Regression floor — the new test case added under Shape above is part of
the suite `npm test` already runs, so a passing `npm test` after the test
is added is direct proof of both the new behavior and the unchanged
default path. No skill-prose file touched, so
`docs/how-to/write-verify-for-a-skill-prose-change.md` does not apply.

## Assumptions

Not material to this item's own scope (pinned here rather than asked as a
gate question): whether `/fgOS:submit` and `fgos-submit-assist` should be
updated to actually PASS `--verify` through when a submitter states one
in free text — the item's own description names this as future work for
those two callers, not this CLI-layer item. This item only builds the
door; wiring a caller through it is out of scope here.

## Outstanding questions

None
