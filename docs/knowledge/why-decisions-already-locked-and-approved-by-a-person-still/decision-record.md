---
type: explanation
source_capture_ids: [tsk-52g]
framework: diataxis
mode: explanation
---

# Why decisions already locked and approved by a person still had to be restated to the engine's own clarify judge

## The real capture

`tsk-52g`'s `discovery` log records the engine's own machine judgment
(`judgeDiscovery`) firing *after* `fgos-coding-exploring`'s decisions (D1–D6) were
already written to `docs/history/work-item-title-contract/CONTEXT.md` and
explicitly approved by a person at that skill's own gate:

```json
{"clear": false, "question": "Title tối thiểu/tối đa bao nhiêu ký tự (hoặc từ) mới coi là đủ rõ, và chuẩn nào để đánh giá title \"thể hiện cốt lõi\" (vd: phải chứa verb+object cụ thể, không được là câu mơ hồ)?", "intentScore": 15}
```

The question is one `CONTEXT.md` had already answered in full (D1: object +
action + scope; D2: a ~100-char ceiling with no floor). It fired anyway.
The item was parked to `awaiting-human`. What resolved it was not a new
decision — it was restating the same already-locked answer directly to the
item via `fgos answer`, at which point the same judge re-ran and returned:

```json
{"clear": true, "verify": "npm test -- --grep 'title'", "intentScore": 55}
```

## Why the same answer had to be given twice

`judgeDiscovery` (`src/intake/discovery.mjs`) builds its prompt from the
work item's own fields and its own `gates`/`discovery` event history — not
from `docs/history/<feature>/CONTEXT.md`. A person approving CONTEXT.md at
`fgos-coding-exploring`'s gate is a decision made *in conversation*, visible to
whoever is in that session, but invisible to the judge unless it is also
recorded on the item itself through `fgos answer`. The two are different
audiences for the same decision: CONTEXT.md is the durable, git-versioned
record for a future person or session reading the feature's history; the
item's own `discovery`/`gates` log is the only input the mechanical judge
reads before it will unblock the `clarify` → `decompose` edge.

This is not redundant paperwork — it is the actual mechanism that keeps a
locked decision from silently diverging: the judge does not trust that
"someone approved this in a chat," it only trusts what is written where it
looks. A session that skips restating an already-locked answer to the
item itself leaves the judge asking the same question again, indefinitely.

## What this means for the next clarify round

Locking a decision at `fgos-coding-exploring`'s own gate is necessary but not
sufficient to unblock the engine's own `clarify` → `decompose` judgment.
When `fgos discover` reports `clear: false` on an item whose `CONTEXT.md`
already has the answer, the fix is not a new decision — it is `fgos answer
<id> --text "..."` with the already-locked answer's content, so the
judge's own read of the item's history contains what a person already
decided.
