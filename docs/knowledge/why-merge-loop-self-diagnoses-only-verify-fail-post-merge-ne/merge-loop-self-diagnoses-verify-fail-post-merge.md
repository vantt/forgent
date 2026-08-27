---
type: explanation
title: Why merge-loop self-diagnoses only verify-fail-post-merge, never anything else, before counting a block
tags: []
timestamp: 2026-07-30T00:23:34.715Z
source_capture_ids: [tsk-3mv-2]
framework: diataxis
mode: explanation
---
# Why merge-loop self-diagnoses only verify-fail-post-merge, never anything else, before counting a block

`/fgOS:merge-loop`'s stop rule used to be flat: any blocked pick, of any
reason, counted the same toward "same id blocked twice in a row -> stop."
That treated a real, already-documented recovery playbook
(`docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md`) the
same as a block nobody has ever written a recipe for — the loop stopped and
asked a person even when the person's own answer, if they'd been watching,
would have been "read the log, it's unrelated flake, retry."

## The request this traces to

The originating item's own words (`tsk-3mv`, untranslated):

> "khi trong session pick task để làm và nó tự merge về main thì agent có
> thể thông minh tự xử lý các vấn đề merge của nó. nhưng khi skill
> '/fgOS:merge-loop' thực hiện việc merge thì nó quá cứng nhắc, tự fail, tự
> dùng và không biết tự xử lý vấn đề."

A session working an item by hand already does this kind of diagnosis —
`tsk-2z3`'s real two-block recovery (quoted in full in the diagnose how-to)
is exactly a person reading `approve`'s output, ruling out their own diff,
isolating the failing test, and retrying. The gap was that `merge-loop`,
running unattended, never did the same thing — it just watched the JSON
envelope and counted.

## Why only ONE block reason, not "smarter" in general

Locked at clarify (`docs/history/tsk-3mv-merge-loop-self-resolve/CONTEXT.md`
D1): self-resolution only ever covers two block reasons, split by whether
the diagnosis is mechanical or judgment-based —

- a **decision-ID collision** merge-conflict (content-agnostic, structurally
  recognizable — handled in code, `src/runner/merge.mjs`, a sibling item's
  own scope);
- **`verify-fail-post-merge`** (this item's scope) — genuinely needs reading
  free-text test output and judging whether a failure is related or noise,
  something a pure function can't safely do.

Every *other* block reason — a real content conflict, `fgos-write-rejected`,
plain `verify-fail` from `return`, `integration-drift` — was deliberately
left untouched. Extending self-resolve to "any block" would have meant
guessing at recovery for shapes nobody has a proven playbook for yet; this
item only wires in the one playbook that already exists and has already
been run for real (`tsk-2z3`).

## Why Iron Law stays completely out of this

The plan surfaced a real tension during clarify: `docs/specs/runner.md`
(RUL34/RUL37, lines 530-531 and 598-603) requires a real human operator to
run `--acknowledge-iron-law` — the spec's own words are "approve từ chối
cho tới khi người vận hành xác nhận." The locked decision (CONTEXT.md D2)
is that this item never touches that boundary, under any condition — an
Iron Law block still always stops the loop and reports, exactly like
before. A separate item (`tsk-44f`, depending on `tsk-5t3`) was filed to
even ask the question of whether/how that could ever change; this item's
own `SKILL.md` change reaffirms the boundary explicitly rather than leaving
it implicit:

> "an Iron Law block always needs a real human operator (RUL34/RUL37,
> `docs/specs/runner.md`), with no exception this skill is ever allowed to
> apply."

## Why the retry is bounded to exactly one attempt

CONTEXT.md D3 (confirmed at `fgos-coding-validating`'s gate, not just asserted):
the stop condition isn't a numeric attempt cap, it's a progress signal —
attempt the one matching playbook once, retry once, and if the same id
blocks again for *any* reason afterward, stop immediately. The shipped
`SKILL.md` text:

> "Record `<id>` as \"self-resolve already attempted\" before retrying,
> regardless of outcome — this playbook runs **at most once per id per
> loop run**... Blocked again, for any reason (identical
> `verify-fail-post-merge` with no progress, or now a different reason) —
> this **is** the tsk-3mv D3 \"no progress\" stop condition."

This is a narrower rule than "keep trying while things seem to be
improving" — it never lets the loop convince itself a second attempt is
warranted. One diagnosis, one retry, then it behaves exactly like the old
flat rule again.

## The real outcome this synthesis traces to

> `{"id":"tsk-3mv-2","predicted":{"tier":"standard","deps":0,"priorVisits":0,"role":"session","branchHeadAtTake":"8e2afb2867477816e03d698b005b303b4626b0df"},"actual":{"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":1}}`
> — real `work.outcome` capture, id `tsk-3mv-2`

`return`'s own re-verify (`node --test test/runner/merge.test.mjs` was not
this item's own scope — its real verify command was
`test -f plugins/fgOS/skills/merge-loop/SKILL.md && grep -qi
'verify-fail-post-merge' ... && grep -qi 'no progress' ... && grep -qi
'iron-law' ... && npm test`) passed on the first attempt, against the full
1706-test suite, with no error class recorded.

## Related

- `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md` — the
  exact playbook this item wires into `merge-loop`, unmodified.
- `docs/history/tsk-3mv-merge-loop-self-resolve/CONTEXT.md` and `plan.md` —
  the full locked-decision and shaping record this item executed against.
- `tsk-3mv-1` — the sibling item covering the other, mechanical half of D1
  (decision-ID collision auto-resolve in `src/runner/merge.mjs`).
- `tsk-44f` (depends on `tsk-5t3`) — the separate, still-open question of
  whether Iron Law's human-operator requirement should ever change; this
  item's own boundary is deliberately unaffected by that question.
