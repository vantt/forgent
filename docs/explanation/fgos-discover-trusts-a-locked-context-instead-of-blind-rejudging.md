# Why `fgos discover` now trusts a locked CONTEXT.md instead of blindly re-judging

`tsk-ozl` fixed a real, live-observed friction: right after a person ran
`fgos-coding-exploring` to completion and committed `CONTEXT.md`, calling `fgos
discover <id>` — as `fgos-coding-exploring`'s own "Hand off" step instructs, to
fire the stage-advance edge — could instead ask a brand-new, unrelated
question and park the item in `awaiting-human`, even though every
decision had just been locked.

## The bug

> `resolveDiscovery` (`discovery.mjs:231-273`) calls `judgeDiscovery`
> unconditionally on every invocation — both the sync `fgos discover <id>`
> verb (role `session`, called by a live session right after
> `fgos-coding-exploring` locks decisions) and the runner's RUL19 safety-net
> sweep (role `runner`, scans every `stage:clarify && status:todo` item
> each loop, specifically to catch items no live session ever touched).
>
> `buildDiscoveryPrompt` ... never reads `work.docsRef` or `CONTEXT.md` at
> all — so even when `fgos-coding-exploring` has already locked every decision
> and written them to `CONTEXT.md`, the next `fgos discover` call is blind
> to that artifact and can re-derive a fresh, possibly contradictory
> judgment, including asking a brand-new question and parking the item in
> `awaiting-human` right after a person just finished exploring it.

Confirmed live, in-session, on this very item:

> Đã xác nhận sống ngay trong phiên này (2026-07-31): fgos-coding-exploring chạy
> xong, CONTEXT.md đã khoá D1-D3 và commit lên fgw/tsk-ozl, sau đó gọi
> 'fgos discover tsk-ozl' ngay — kết quả outcome=unclear, model hỏi một
> câu MỚI không liên quan (hỏi lại đúng câu hỏi xác nhận này) và item bị
> park awaiting-human.

## Why `discover` isn't simply removed

> discover KHÔNG hoàn toàn vô dụng: RUL19 (work-state.md) dùng đúng hàm
> này làm lưới đỡ tự động, quét toàn bộ item stage:clarify+status:todo mà
> CHƯA ai explore — đây là mục đích chính đáng thật. Vấn đề là 2 tình
> huống khác hẳn nhau (a. sweep tự động cho item chưa ai đụng tới, cần
> phán đoán thật từ đầu; b. session người vừa explore xong, chỉ cần bấm
> chuyển-stage) đang dùng CHUNG một hàm không phân biệt.

## The fix: a content-based trust signal, not a role-based branch

Locked decisions (`docs/history/discover-verb-context-blind-clarify-judge/CONTEXT.md`):

> D2: The trust signal that lets `resolveDiscovery` skip re-judging and
> just advance the stage is content-based: `work.docsRef` is set AND
> `<docsRef>/CONTEXT.md` exists on disk and is non-empty. No new
> approval-logging is required — this reuses `decompose.mjs`'s existing
> `readLockedContext` read pattern rather than inventing a second one.

> D3: The skip-and-advance behavior applies to BOTH callers of
> `resolveDiscovery` — the sync `fgos discover` verb (role `session`) and
> the runner's RUL19 sweep (role `runner`) — keyed on the D2 content
> signal, not on role. A sweep that finds a real committed `CONTEXT.md`
> on an item nobody is actively working also trusts it and advances,
> which also helps the crashed-mid-explore-session case RUL19 exists to
> catch.

## Why the sibling `decompose` stage never had this bug

Scouted and confirmed already context-aware — `resolveDecompose` already
reads `docsRef`/`CONTEXT.md`+`plan.md` (`decompose.mjs:36-50`,
`readLockedContext`) and already consults prior gate answers
(`decompose.mjs:96-99`), a pattern this item's fix ports to the sibling
`clarify` stage rather than inventing a new one. That decompose-side fix
itself traces to a named prior bug (`tsk-3w8` follow-up,
`str87-decompose-gate-consult`) — the same shape of blind-re-judge bug
this item closes for `clarify`.

## A residual gap this item accepted, not closed

> The gap named in scout evidence (a human "yes" leaves no separate
> durable trace beyond the committed `CONTEXT.md` file itself) is
> accepted as-is for this item; not closed here.

## A found-and-fixed verify command bug, along the way

The item's own stored `verify` from its live `clear` verdict pointed at
the wrong thing:

> `npm test src/intake/discovery.test.mjs` points at the wrong path AND
> the wrong invocation — the real test file is
> `test/intake/discovery.test.mjs`, and `npm test <path>` does not scope
> the suite: the `test` script hardcodes `node --test
> 'test/**/*.test.mjs'`, so npm appends the path as an *additional*
> target rather than filtering to it — confirmed by actually running it
> during `fgos-coding-validating` (ran the full 1919-test, 111.8s suite instead
> of the intended file). `node --test <path>` directly is the real scoped
> command.
