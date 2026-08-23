# Why `keywordRiskGate` now skips the heavy-risk ask when a verdict cites a locked decision

`tsk-wve` narrowed `resolveDecompose`'s heavy-risk floor
(`src/intake/decompose.mjs:660`) after real usage (`tsk-49e`) showed the
ask it produces always gets approved once a Feasibility matrix with a
Recommended option already exists, with no remaining lever for a human to
pull at that point.

## The friction, in the reporter's own words

> risksGate (HEAVY_RISK / blast-radius gate) trong resolveDecompose
> (src/intake/decompose.mjs:660-682) nên ngừng hỏi xác nhận mặc định mỗi
> khi risk=heavy, vì kinh nghiệm thực tế câu hỏi này luôn được approve khi
> đã có Feasibility matrix kèm option Recommended -- không còn thông tin
> hay cách nào hiệu quả để người điều chỉnh tại điểm này. ... decompose đã
> trình Feasibility matrix đầy đủ bằng chứng ... kèm option 'Confirm
> pass-through (Recommended)', nhưng risksGate vẫn bắt buộc dừng lại chờ
> người xác nhận dù không còn gì để người thêm vào quyết định.

## Why the floor existed, and why narrowing it is a reversal, not a bug fix

`keywordRiskGate` was a deliberate, already-decided design
(`decompose.mjs:106-109`, comment: "risk-heavy root always routes through
the human gate regardless of what the verdict said"), from the original
`resolveDecompose` build. Its whole point was independence from verdict
content — a safety net against a confident-but-wrong verdict on a risky
item, back when `judgeDiscovery`/`judgeDecompose` (an independent
model/subprocess judge) generated that verdict.

What changed since then, per `CONTEXT.md` D1's own reasoning:

> `judgeDecompose` — the independent model/subprocess judge that used to
> generate verdicts — is now retired (tsk-1x3). Every live verdict
> `resolveDecompose` sees today comes from an explicit `--verdict` supplied
> by the SAME live session that then hits the gate ... So
> `keywordRiskGate` today is not "a second opinion on a model's proposal"
> — it is "always double-check a live session's own proposal on
> heavy-risk items, never trust that session alone." D1 accepts narrowing
> that specifically because there is no longer a meaningfully DIFFERENT
> second opinion to fall back on if the floor were removed outright — a
> mechanical evidence-check on the verdict's own content is the compromise
> locked here, not full removal (declined) and not the status quo
> (declined).

## The fix: reuse the existing D-ID-citation machinery, don't invent a new one

`plan.md`'s chosen approach adds a mechanical "cites real evidence"
exception, reusing `extractLockedDecisionIds`/`D_ID_PATTERN` — machinery
`decompose.mjs` already trusts for the identical purpose elsewhere
(requiring a `decompose`-kind child's own `action` field to cite a real
D-ID from the item's locked `CONTEXT.md`, in `normalizeChild`). The
landed diff (`src/intake/decompose.mjs`, commit `b29bff95`):

```js
const lockedDecisionIds = extractLockedDecisionIds(lockedContext);
const citesRealEvidence =
  lockedDecisionIds.size > 0 && (verdict.reason?.match(D_ID_PATTERN) ?? []).some((cited) => lockedDecisionIds.has(cited));
const keywordRiskGate = work.risk === HEAVY_RISK && !heavyRiskAlreadyConfirmed && !citesRealEvidence;
```

The gate still fires exactly as before whenever `lockedDecisionIds.size
=== 0` (no `CONTEXT.md`, or none with a `## Locked decisions` table) — an
item that never went through `fgos-exploring` gets no exception, the same
graceful-degrade `normalizeChild` already applies for its own citation
check.

## Why this, and not full removal

`--verdict need-human` already IS the session's own "I think this is
genuinely unstable" channel, independent of `keywordRiskGate` and
untouched by this change. What narrows is the OTHER case: the session is
confident (`pass-through`/`decompose`) but risk is heavy. The mechanical
proxy chosen for "this confident verdict is grounded, not off-the-cuff" is
citing a real, already-locked decision — never a semantic/LLM read of the
reason text, matching `docs/history/gate-bypass/CONTEXT.md` D2's own
discipline: "mechanical completeness... never the session's own
confidence/vibe read."

Full removal (`CONTEXT.md` D1's declined option (a)) was rejected because
no second reviewer exists anymore to fall back on. No change (declined
option (c)) was rejected because it leaves the exact friction the item
exists to fix.

## Known limitation, accepted rather than closed

> This is a citation-presence check, not a citation-relevance check — a
> reason could cite a real D-ID without that D-ID actually being on-topic.
> This is the SAME weakness `normalizeChild`'s existing child-action check
> already accepts as "good enough" for the identical citation pattern —
> not a new, lower bar introduced by this item.

## What stayed out of scope

`blastRadiusGate`/`BLAST_RADIUS_GATE_THRESHOLD` was confirmed structurally
dead code (`verdict.blastRadius` was only ever populated by the now-retired
`judgeDecompose`; the live `fgos decompose --verdict ...` CLI has no
`--blast-radius` flag) and stays untouched — cleanup, if wanted, is a
separate item (`CONTEXT.md` D2). The mechanical-bypass config in
`docs/history/gate-bypass/CONTEXT.md` (D1-D8) also stays untouched: that
feature's own D4 treats `keywordRiskGate` as a non-negotiable floor for
its OWN purposes, and this item revisits `keywordRiskGate`'s earlier,
separate D3(b) design directly rather than reopening that config.

Landed clean: single-attempt, verify passed (`npm test --
test/intake/decompose.test.mjs`), no friction recorded.
