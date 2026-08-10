# plan.md — tsk-3cs: merge-list tree view + bottleneck-priority merge order

Mode: **standard**

Lane decided directly (no `fgos-routing` Orient step ran for this item —
it entered via `/fgOS:submit` → `fgos-clarifying` → `fgos-coding-shaping`
→ `fgos-exploring`, never through Orient — so per this skill's
direct-entry fallback, the Mode-gate table is applied here). Flags
counted (`fgos-routing/SKILL.md`'s Mode-gate list):

- **public contracts** — `fgos merge list --json`'s output shape is read
  by `merge-next`/`merge-loop` (real automation) and now also by
  herdr-plugin's Rust parser; D4/D1 of `CONTEXT.md` exist specifically to
  protect this contract.
- **existing covered behavior** — `mergeReadiness` (`src/state/
  graph-harness.mjs`) already has real tests and real callers; must not
  regress.
- **weak proof around the area** — impact-analysis is `degraded`
  (GitNexus registered/`present`, but this session's own hook flagged the
  index stale, last indexed `4ce7a96`, behind current HEAD).

3 flags, no hard-gate flag (auth/data-loss/audit/external-provider/
validation-removal) — **standard**, not high-risk.

## Approach

Ran `fgos graph --json`: tsk-3cs appears in neither `criticalPath` nor
`topUnblock` (it's a fresh item, nothing else in the backlog depends on
it yet) — ordering between the two pieces below is NOT driven by a
backlog-wide signal, it's driven by the JSON-contract dependency §7 of
`DISCUSSION.md` already identified: the Rust side cannot be built or
tested against a JSON shape that doesn't exist yet.

**Chosen path:** two sequential pieces, split now (Task list below) —
Task 1 (JS state layer) before Task 2 (herdr-plugin Rust), matching
`CONTEXT.md`'s D4 (JS engine owns the logic, Rust only renders) and the
real build dependency (Task 2's Rust struct/parser needs Task 1's field
shape decided first). A single unsplit item was considered and rejected:
the two pieces are different languages/toolchains with genuinely
independent verify commands (`node --test`/`npm test` vs. `cargo
test`/`npm test`) and a real one-way dependency — splitting makes that
dependency explicit instead of leaving it implicit inside one large diff.

**Files likely touched:**

- Task 1: `src/state/graph-harness.mjs` (new `mergeTree` function),
  `bin/fgos.mjs` (wire the new field into `case 'merge': ... sub ===
  'list'`), `test/state/graph-harness.test.mjs` (new tests).
- Task 2: `herdr-plugin/src/fgos.rs` (parser/struct for the new field),
  `herdr-plugin/src/app.rs` (tree rendering, replacing the 3 flat lists).

**Risk map:**

| Component | Risk | Proof point (for `fgos-validating`) |
|---|---|---|
| `mergeReadiness`'s existing return shape | Medium — `merge next`/`merge-loop` read it directly; a silent shape change would misroute real automation | Regression test asserting the existing fields (`ready`/`waiting`/`conflicts`/`mergeSets`/`blockedOnSync`/`mergeTier`/`supersededOut`/`stageByItem`) are unchanged before/after adding the new field (D4, D1) |
| New `mergeTree` grouping/sort logic | Medium — recursive per-level sort could be wrong, or an item whose `parent` id is missing from `view.work` could be silently dropped | Unit tests: multi-level nesting sorts correctly at every depth (D3), an orphaned-parent id still surfaces at top level rather than disappearing (consistent with D2's "show all", never silently hide) |
| `blockedOnSync` drift-detail wiring (D7) | Low-medium — new data threaded from `driftStatus`, not previously exposed on this bucket | Unit test asserting the specific drift fields (root, branch, aheadOfTarget/behindTarget or equivalent) are attached correctly |
| herdr-plugin Rust parser (`fgos.rs`) | Low — `serde` already ignores unknown fields; risk is a required field mismatch causing a hard parse failure | Fixture-based parse test, same pattern as the existing `fetch_merge_list_mirrors_fgos_merge_list_json` test |
| Tree rendering (`app.rs`) | Low — cosmetic/UX | Extend existing `render_smoke.rs` pattern |

Impact-analysis posture: **degraded** (GitNexus `present` but stale index
per this session's own hook warnings). `fgos-validating` should treat any
blast-radius claim about `mergeReadiness`'s real callers as unconfirmed
until `gitnexus analyze` is re-run, and cross-check with a plain `rg` for
`mergeReadiness(` callers instead of trusting a GitNexus zero-result
blind, per this repo's own capability-gate guidance in `CLAUDE.md`.

## Split

Two independently workable pieces, each with `parent: tsk-3cs`:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)

node "$root/bin/fgos.mjs" add \
  --title "mergeTree: nhóm mergeReadiness theo parent, sort đệ quy bằng blocks, gồm mọi bucket" \
  --kind feature --risk standard \
  --verify "node --test test/state/graph-harness.test.mjs && npm test" \
  --description "Thêm hàm mergeTree(view, opts) vào src/state/graph-harness.mjs (hoặc module liền kề), dùng lại mergeReadiness's ready/waiting/blockedOnSync/mergeSets/supersededOut (D2: gồm mọi bucket) + rankImpact's blocks (D6) để nhóm theo item.parent thành cây, sort đệ quy mỗi cấp (D3). blockedOnSync cần thêm wiring drift detail (D7) thay vì chỉ bare id như hôm nay (graph-harness.mjs:117-126). KHÔNG đổi shape trả về cũ của mergeReadiness (D1/D4) — chỉ thêm field mới (vd. tree), phơi ra qua bin/fgos.mjs's case 'merge' sub 'list'. Tham chiếu đầy đủ: docs/history/merge-list-tree-bottleneck-priority/CONTEXT.md D1-D7, DISCUSSION.md#task-merge-tree-engine." \
  --parent tsk-3cs --footprint "src/state/graph-harness.mjs,bin/fgos.mjs,test/state/graph-harness.test.mjs" \
  --stage decompose --dir "$root"

node "$root/bin/fgos.mjs" add \
  --title "herdr-plugin MERGE LIST box: render cây thay vì 3 danh sách phẳng, badge lý do kẹt" \
  --kind feature --risk light \
  --verify "cargo test --manifest-path herdr-plugin/Cargo.toml merge_list && cargo build --release --manifest-path herdr-plugin/Cargo.toml && npm test" \
  --description "Đổi MergeListSummary/parser (herdr-plugin/src/fgos.rs) để đọc field cây mới (từ task 'mergeTree'), đổi app.rs's merge_list rendering từ 3 danh sách phẳng sang vẽ cây thật (thụt lề theo độ sâu, badge trạng thái mỗi node: ready/waiting/blocked-sync/conflicted/superseded, hiển thị lý do cụ thể + item đối tác theo D7). Rust KHÔNG tự sort hay tự tính lại thứ tự (D4) -- chỉ đọc và vẽ lại đúng những gì JS engine đã tính. Phụ thuộc trực tiếp vào field JSON mà task 'mergeTree' định nghĩa -- không tự build/test được cho tới khi task đó xong. Tham chiếu đầy đủ: docs/history/merge-list-tree-bottleneck-priority/CONTEXT.md D1-D7, DISCUSSION.md#task-merge-tree-render." \
  --parent tsk-3cs --footprint "herdr-plugin/src/fgos.rs,herdr-plugin/src/app.rs" \
  --stage decompose --dir "$root"
```

## Assumptions (implementation-level, not material to `CONTEXT.md`)

- New JSON field name (`tree`) is the implementer's own naming call —
  any clear, non-colliding name is acceptable, not locked in `CONTEXT.md`.
- Exact node status label strings (`ready`/`waiting`/`blocked-sync`/
  `conflicted`/`superseded`) are implementation detail — must be
  distinguishable from each other, exact spelling not locked.
- An item whose `parent` id is missing from `view.work` (orphaned/stale
  reference) surfaces at the top level rather than being silently
  dropped — consistent with D2 ("show all"), never a new product
  decision, just the same "never hide" principle applied to an edge case.

## Outstanding questions

None
