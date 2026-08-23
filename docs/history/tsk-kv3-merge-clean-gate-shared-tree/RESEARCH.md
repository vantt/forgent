# RESEARCH — tsk-kv3: cổng cây-sạch của `approve`/`sync-root`

Tích luỹ theo vòng. Không bao giờ đè vòng cũ.

## Vòng 1 — 2026-08-12 (stage `discovery`)

### Hỏi gì

1. `isWorkingTreeClean` hôm nay kiểm cái gì, và "tiền lệ scope subtree"
   mà mô tả item nhắc tới có thật không?
2. Đường merge nào còn đòi **cây chung** sạch, khi leaf-to-root đã chạy
   trong ephemeral worktree detached rồi?
3. Ở điểm kiểm đó có sẵn dữ liệu footprint nào để thu hẹp?
4. Có tách được khỏi `tsk-4ax` (verify-at-inbound-gate) không?
5. Verify thật của item là gì (mô tả ghi "chưa xác định")?

### Kiểm ở đâu

- `src/runner/merge.mjs:170-231` — `isFgosOnlyStatusLine`,
  `buildOwnFileSet`, `isWorkingTreeClean`
- `src/runner/merge.mjs:362-376` — `changedFiles`
- `bin/fgos.mjs:124-135` — `return`'s subtree-scoped wrapper
- `bin/fgos.mjs:3002-3016` — `runnerOwnDiff`
- `bin/fgos.mjs:3085-3093` — cổng của `approve` (đường local merge)
- `bin/fgos.mjs:3103-3150` — nhánh leaf-to-root, `withMergeEphemeralWorktree`
- `bin/fgos.mjs:3587-3602` — cổng của `sync-root` (nhánh no-parent)
- `bin/fgos.mjs:4405-4427` — `main-checkout-reset` (cổng duy nhất còn
  gọi không kèm `ownFileSet`; không nằm trên đường merge)
- `test/state/working-tree-clean-unified.test.mjs`,
  `src/runner/merge.test.mjs:237-305` — test đã phủ hai tham số
- `git show 763f65bc` (2026-08-10), `git log -S buildOwnFileSet`
- `fgos show tsk-598` — item đã ship phần thu hẹp, `done`
- Probe thực nghiệm dựng repo git thật, gọi thẳng `isWorkingTreeClean`
  với `ownFileSet` do `buildOwnFileSet` sinh (kết quả bên dưới)

### Tìm được gì

**F1 — Cơ chế thu hẹp ĐÃ TỒN TẠI và đã được nối vào cả hai cổng.**
`isWorkingTreeClean(repoRoot, ownFileSet, { scope })` nhận hai núm độc
lập: `ownFileSet` (tsk-598, ship 2026-07-29 tại `1527461f`) và `scope:
'subtree'|'whole-repo'`. `approve` (`bin/fgos.mjs:3090-3091`) và
`sync-root` (`:3598-3599`) **đều đã truyền** `buildOwnFileSet(
runnerOwnDiff, item.footprint)`. Nên "thu hẹp phép kiểm sạch xuống đúng
footprint của item" — phương án 2 trong mô tả item — về cơ bản đã ship.

**F2 — Thu hẹp đó THẬT SỰ hoạt động cho ba hình dạng bẩn mà sự cố mô tả.**
Probe trên repo git thật, `ownFileSet = {src/mine.mjs}`:

| Hình dạng cây bẩn | `isWorkingTreeClean` |
|---|---|
| File tracked KHÔNG liên quan bị sửa (`AGENTS.md`) | `true` — không chặn |
| File untracked KHÔNG liên quan ở gốc repo | `true` — không chặn |
| Cả THƯ MỤC untracked không liên quan | `true` — không chặn |
| File CỦA CHÍNH item bị bẩn (`src/mine.mjs`) | `false` — vẫn chặn |

Chặn chỉ xảy ra khi đường dẫn bẩn **nằm trong** tập của chính item — đúng
hợp đồng tsk-598 D2 (xung đột ghi thật).

**F3 — Nhưng với item ROOT, "tập của chính item" là hợp của cả cây con.**
`runnerOwnDiff = changedFiles(repoRoot, item, {})`
(`bin/fgos.mjs:3010-3016`) và `changedFiles` chạy `git diff --name-only
${trunk}...${branch}` (`merge.mjs:371`). Với một root, `trunk` là main,
nên tập đó là diff của **toàn bộ cây 13 con** so với main. Probe xác nhận
hệ quả: cùng một `AGENTS.md` bẩn, tập cỡ-leaf ⇒ `clean=true`; tập cỡ-root
(có `AGENTS.md` trong đó) ⇒ `clean=false`.

Đây là lời giải khớp cho lần chặn thứ hai của sự cố: `AGENTS.md`/
`CLAUDE.md` bẩn vì GitNexus sinh lại dòng thống kê, mà hai file đó nằm
trong diff của cây 13 con (lịch sử thật: `0a999bb9`, `7b6e4994` — cả hai
2026-08-12, đều chạm đúng `AGENTS.md` + `CLAUDE.md`). Cổng đọc đó là xung
đột cùng-đường-dẫn thật và chặn — đúng luật D2, nhưng với root thì luật
đó gần như không thu hẹp gì.

**F4 — Trên đường leaf-to-root, cổng kiểm một cây mà merge không hề chạm.**
`bin/fgos.mjs:3091` kiểm `repoRoot` (main checkout). Ngay sau đó
`:3145` gọi `withMergeEphemeralWorktree(repoRoot, rootId, ...)` dựng một
checkout **detached** riêng, chạy `mergeRunnerItem(ephemeral.path, ...)`
ở đó, rồi land bằng `git branch -f` (comment `:3110-3117`: "never the
human's own main checkout"). Main checkout không bị merge ghi vào trên
đường này — nhưng độ sạch của nó vẫn là điều kiện tiên quyết.

**F5 — Cổng của `sync-root` là cổng MỚI, thêm 2 ngày trước sự cố.**
`763f65bc` (2026-08-10, tsk-66t) thêm cổng ở nhánh no-parent, soi gương
đúng cổng của `approve`. Trước đó nhánh này không có tiền điều kiện sạch.

**F6 — Lần chặn thứ nhất của sự cố CHƯA giải thích được từ mã nguồn.**
Tám file chưa commit của đợt orchestrator-worker-slots thuộc về `tsk-2sj`
(`git log -- docs/history/orchestrator-worker-slots/`: `a581b797`,
`b55ca519`, `0ec857b0`, `c67d7f9c`, đều 2026-08-12). Theo F2 những đường
dẫn đó chỉ chặn nếu chúng nằm trong tập của chính root đang merge. Trạng
thái cây lúc đó đã mất, không dựng lại được — chưa xác nhận được cơ chế.
Không mở rộng suy đoán ở đây.

**F7 — Chỗ sửa thật KHÔNG phải `merge.mjs`.** `plan.md` của tsk-51m giả
định tsk-kv3 sửa `isWorkingTreeClean` (`merge.mjs:109-124`). Bằng chứng
trên nói ngược lại: hàm đó đã mang sẵn cả hai núm và đã có test phủ
(`test/state/working-tree-clean-unified.test.mjs`,
`merge.test.mjs:237-305`). Chỗ còn hở là **điểm gọi** trong
`bin/fgos.mjs` (`:3090-3091`, `:3598-3599`) và nguồn của `runnerOwnDiff`
(`:3010-3016`). Việc này làm giả định "tách được khỏi tsk-4ax vì khác
file" yếu đi: cả tsk-kv3, tsk-4ax và tsk-xyr cùng khai `bin/fgos.mjs`.
Tách theo **khối lệnh** thì vẫn rời (cổng sạch ≠ đường gọi verify ≠ khoá
theo ref đích), nhưng không còn rời theo file.

**F8 — Verify thật.** `npm test` (bộ state + cli + runner + e2e). Ba file
test đã phủ vùng này và sẽ là chỗ thêm case: `merge.test.mjs`,
`test/state/working-tree-clean-unified.test.mjs`, `test/cli/fgos.test.mjs`
(`763f65bc` đã thêm 57 dòng test cho cổng sync-root ở đây).

### Còn mở

Sự thật đã đủ; **quyết định phạm vi thì chưa** — cần một người:

- **Q1** — Trên đường leaf-to-root, có bỏ hẳn cổng cây-sạch main checkout
  không (F4: merge chạy trong ephemeral worktree, không chạm cây đó), hay
  giữ vì một lý do khác chưa ghi ở đâu?
- **Q2** — Với root-to-main, `ownFileSet` là hợp diff của cả cây con nên
  cổng gần như trở lại whole-tree (F3). Chặn ở đó là **đúng thiết kế**
  (tsk-598 D2: xung đột cùng đường dẫn thật) hay chính là lỗi cần sửa?
  Nếu là lỗi, thu hẹp theo cái gì — chỉ diff của phần chưa land, hay bỏ
  qua file untracked ngoài footprint như mô tả item gợi ý?
- **Q3** — Phạm vi item có bao gồm F7 (đụng `bin/fgos.mjs` chứ không phải
  `merge.mjs`) và rủi ro giẫm chân với tsk-xyr/tsk-4ax không?

### Verdict

`{ clear: false, question: Q1+Q2+Q3 }` — dữ kiện đã khoá bằng bằng chứng
thật, nhưng phương án 2 trong mô tả item đã ship rồi, nên phạm vi còn lại
là một quyết định sản phẩm, không phải một khoảng trống nghiên cứu.
