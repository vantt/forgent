# Scenario: expr-eval-chain

Reusable replay scenario for MVP2 parity testing (`docs/decisions/0018-moc-mvp2-fgos.md`,
backlog `p-52601a01`). Sized to reliably push `fgos-runner`'s decompose sweep
into a real multi-child split with a `deps` chain, small enough to finish
fast, unambiguous enough to skip the `awaiting-human` clarify gate, low risk
enough to skip the need-human decompose gate (see `docs/specs/work-state.md`
"Giai đoạn Chia-việc").

## Precondition

`dogfood-fixture/` is at baseline — no `src/expr/`, no `test/expr/`. If a
prior replay left files behind, run the reset script first:

```sh
cd dogfood-fixture
npm run reset:expr-eval-chain
```

## Canonical submit text

Copy-paste verbatim as the `/fgOS:submit` argument (or `fgos submit "..."`):

```
Thêm khả năng đánh giá biểu thức số học đơn giản vào dogfood-fixture, chia 3
phần có thứ tự: (1) tokenize(exprString) trong file mới src/expr/tokenize.mjs
— tách chuỗi như "3 + 4 * 2" thành mảng token số/toán tử; (2)
evaluate(tokens) trong src/expr/evaluate.mjs, phụ thuộc tokenize — tính giá
trị đúng thứ tự ưu tiên (*/  trước +/-), CHỈ hỗ trợ 4 toán tử này, không dấu
ngoặc; (3) evaluateExpr(exprString) trong src/expr/index.mjs, phụ thuộc
evaluate — gọi tokenize rồi evaluate, trả về số kết quả. Có unit test cho cả
3 hàm bằng node --test, đặt tại test/expr/*.test.mjs.
```

## Expected shape

- Root item splits into children carrying `parent` back to root and a `deps`
  chain: `evaluate` depends on `tokenize`, `evaluateExpr` depends on
  `evaluate`. The judge is a real model call (not mechanical) — it may split
  into 2 children instead of 3, or occasionally pass-through / land on
  need-human despite this design intent. That outcome is real MVP2 signal to
  record (decision 0018), not a broken fixture.
- Each child carries its own real `verify` and reaches `done` independently,
  in dependency order.
- Root stays blocked from the ready frontier until every descendant is
  `done`, then dispatches its own `verify` (attached when it left `clarify`)
  as the final integration check — expect `node --test 'test/expr/**/*.test.mjs'`
  or equivalent.

## Invocation — Case A (interactive pick)

```sh
/fgOS:submit <canonical text above>
/fgOS:pick <id-returned>
```

Run in a session NOT already nested in another worktree — `EnterWorktree`
refuses to chain (STR83 validation-slice-2).

## Invocation — Case B (headless runner)

```sh
/fgOS:submit <canonical text above>
fgos-runner --once
```

Repeat `fgos-runner --once` if the first pass only clears the clarify/decompose
sweep and the children aren't dispatched yet in the same run.

## Pass criteria (mirrors decision 0018 point 2)

Both cases: verify green, one real commit on the item's own branch
(`fgw/<id>`), worktree cleaned up after. A difference between the two cases
is a real gap — file it as a new `proposed` row in `docs/backlog.md`, don't
silently absorb it.

## Cleanup after a replay

Successful runs are expected to already clean up their own worktrees/branches
(pass criterion above). If a run gets stuck `blocked` or crashes mid-way and
leaves a stray worktree/branch:

```sh
git worktree list
git worktree remove <path>
git branch -D fgw/<id>
```

Then reset the fixture's generated files before the next replay:

```sh
cd dogfood-fixture
npm run reset:expr-eval-chain
```
