---
type: how-to
title: Submit a work item with a known verify command
source_capture_ids: [tsk-5gu]
---
# Submit a work item with a known verify command

Use this when you already know the real, runnable verify command for a
new work item at submit time — you don't have to wait for
context-discovery to propose one, and you don't have to round-trip
through a separate `fgos edit --verify` call afterward.

## Before `tsk-5gu`

`fgos submit` had no way to carry a verify override at all, even when
the submitter stated one directly in the free-text description (e.g.
ending with "Verify: npm test"). `submitWork` always assigned the
placeholder sentinel (`SUBMIT_VERIFY_SENTINEL`, `"chưa xác định — P15 bổ
sung"`) regardless of what the text said — a deliberate design choice
(context-discovery, not the classifier, is meant to derive the real
verify), but asymmetric with `fgos add`, which *requires* `--verify`.
The only way to attach a known verify was a follow-up `fgos edit
--verify` call, or waiting for `fgos discover` to (re-)infer it from the
same text you already gave.

## The fix

`--verify` is now a submit flag, following the exact same
`optionalField` shape already used by `--tier`/`--kind`/`--risk`:

```bash
fgos submit "Fix the flaky retry test" --verify "npm test"
```

- **Passed** — the item is created with that exact verify string, no
  placeholder sentinel and no later `fgos edit --verify` round-trip
  needed.
- **Omitted** — behavior is byte-identical to before: the item still
  gets the placeholder sentinel, and `fgos discover`/P15 still derive a
  real verify from context the same way they always did. Nothing about
  the no-flag path changed.

## What this does not change

Context-discovery (`fgos discover`) still exists for the normal case —
a submitter who doesn't already know a real verify command. This flag
only closes the gap for the submitter who *does* know it, mirroring the
override precedent every other classify-derived field (`tier`/`kind`/
`risk`) already had. It's an addition to the existing write door
(`fgos submit`'s own param table), not a second, parallel way to create
an item.
