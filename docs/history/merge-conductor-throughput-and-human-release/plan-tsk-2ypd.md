# plan-tsk-2ypd.md — Phát hiện lệch sau khi land bằng giao đường dẫn thật

Mode: **standard** — 2 cờ thường (chạm `src/runner/merge.mjs`, một public
contract có sẵn; và existing covered behavior trong `test/merge.test.mjs`).
Không cờ hard-gate: bước này **không** ghi state, **không** đụng nhánh nào,
**không** chạy verify — nó chỉ đọc và trả về báo cáo. Lane nhỏ hơn (`small`)
không thật thà vì acceptance đòi bốn chứng minh đánh số, trong đó có một
chứng minh phủ định ("không verify nào chạy") cần test thật.

Quyết định khoá: `CONTEXT.md` D4 (điểm phát hiện, không phải điểm catchup) và
D2 (không tự đụng nhánh đang có commit riêng). Kế hoạch cha: `plan.md`. Hạng
mục gốc: `DISCUSSION.md#task-post-sync-detection`.

`impact-analysis: **degraded**` — `fgos tool query --capability
impact-analysis --status present` trả `gitnexus`/`present`, nhưng
`impact({target:'mergeRunnerItem', direction:'upstream'})` trả
`impactedCount: 0`, mà `grep -rn mergeRunnerItem bin src` chỉ ra **ba** điểm
gọi thật (`bin/fgos.mjs:3150` approve leaf→root, `:3284` approve root→main,
`:3515` sync-root). Index đứng sau HEAD hiện tại. Blast radius dưới đây lấy
từ grep, không từ đồ thị — bằng chứng yếu hơn, ghi rõ ở đây thay vì giấu.

## Tín hiệu đồ thị

`fgos graph --json` (2026-08-12, đọc ở phiên cha): `criticalPath` không đi
qua `tsk-51m`, `topUnblock` rỗng. Đồ thị **không cho tín hiệu thứ tự** cho
item này. Item không có deps, chạy song song với bốn con còn lại. Không có
thứ tự nội bộ nào cần chốt: đây là một mảnh việc duy nhất, không split.

## Approach

**Đường chọn**: tách đôi theo đúng ranh giới độ tinh khiết mà footprint đã
khai — một hàm **thuần** trong `src/state/graph-harness.mjs` (module tự khai
"PURE: no fs, no Date.now(), no event append, no mutation") làm việc phân
loại, và một hàm **có I/O** trong `src/runner/merge.mjs` gom `changedFiles`
thật cùng danh sách phiên sống rồi gọi hàm thuần đó.

- `src/state/graph-harness.mjs`
  - `openLeavesSharingTarget(view, landedId)` — trả id các item còn mở cùng
    **ref đích** với item vừa land. Ref đích của một item = `fgw/<parent>`
    nếu có `parent`, ngược lại là trunk; hai item cùng ref đích khi cùng
    `parent` (kể cả cùng không có parent). Loại `isResolvedStatus`
    (`frontier.mjs`, đã import sẵn) và loại luôn status chưa-claim (giá trị
    đầu vòng đời trong `status-fsm.mjs`'s `TRANSITIONS`, đứng trước `doing`):
    nhánh `fgw/<id>` của một item chưa-claim được tạo từ lúc decompose và
    **chưa có commit riêng nào**,
    nên `changedFiles` của nó rỗng, không thể giao với ai — chạy `git diff`
    cho nó là trả tiền lấy một tập rỗng. Khoảng trống decompose→pick là việc
    của `tsk-55p` (refresh lúc pick), không phải của điểm phát hiện này.
  - `classifyPostLandDrift({landedFiles, leaves})` — nhận
    `leaves: [{id, files, sessionIds}]`, trả `{notify, stale}` theo đúng ba
    nhánh D4: giao rỗng ⇒ không vào bucket nào; có giao + `sessionIds` không
    rỗng ⇒ `notify`; có giao + `sessionIds` rỗng ⇒ `stale`.
- `src/runner/merge.mjs`
  - `detectPostLandDrift(repoRoot, landedItem, {fgosDir, trunk})` — gọi
    `openLeavesSharingTarget`, chạy `changedFiles` (`:362`, `git diff
    --name-only <target>...<branch>`) cho item vừa land và cho từng leaf, đọc
    `listSessions` (`src/runner/session.mjs:485`) để map `itemId → sessionId`,
    rồi gọi hàm thuần. Trả `{landed, target, examined, notify, stale}`.
  - Điểm gọi: trong `mergeRunnerItem`, **sau** khối `try/finally` đã
    `lock.release()` — tức ngoài main-checkout lock — và chỉ khi
    `outcome === 'merged'`. Kết quả gắn thêm khoá `postLand` vào object trả
    về. Ba điểm gọi hiện có chỉ đọc `result.outcome`/`result.check`, nên thêm
    một khoá là thuần cộng thêm, không điểm gọi nào vỡ.

**Vì sao "phiên đang sống" đọc `listSessions`, không đọc `claim-liveness.mjs`**:
`claim-liveness.mjs` chỉ export `lastActivityAt`/`isReclaimEligible` — ngưỡng
"claim đã ngồi im quá lâu", không phải danh sách phiên. Danh sách phiên thật
là `.fgos/sessions.json`, đọc qua `listSessions`. Bản mô tả của item còn trỏ
sai chỗ này; `plan.md` cha đã đính chính (§ Đính chính trích dẫn).

**Vì sao không lọc thêm bằng pid**: `session.mjs`'s
`reclaimOrphanedSessions` tự ghi rõ `entry.pid` là pid của tiến trình
`fgos session start` một-nhát, thoát ngay sau khi in kết quả — nên `pidDead`
đúng với gần như mọi phiên chỉ vài giây sau khi tạo, bất kể worktree còn đang
được sửa hay không. Lấy pid làm tín hiệu sống sẽ phân loại nhầm gần như mọi
phiên thật thành "không phiên". Tư cách thành viên trong registry mới là tín
hiệu; việc dọn entry mồ côi đã có `reclaimOrphanedSessions` lo.

**Phương án đã loại**:
- *Dùng `footprintOverlapAmong` (`graph-metrics.mjs:598`)* — loại bởi D4.
  Nó so footprint **khai báo**, trường do item tự khai và có thể thiếu/lệch.
  Ở đây git đã cho sự thật mặt đất nên không cần tới proxy.
- *Đặt điểm gọi ở `bin/fgos.mjs`* — loại. File đó là footprint của làn 1
  (`tsk-xyr` + `tsk-4ax`), và làn 1 đang viết lại chính đường land này (D3
  đưa verify về cửa vào). Wiring vào một đường gọi đang bị thay thế vừa gây
  xung đột merge thật vừa viết code cho một hình dạng sắp biến mất.
  `mergeRunnerItem` là **cái land** và nằm trong footprint đã khai, nên điểm
  gọi đặt ngay ở đó là đủ sống mà không đụng file của ai.
- *Ghi mark stale vào event log* — loại. `merge.mjs` tự khai ở đầu file:
  "This module never writes to `.fgos/` — every state transition stays in
  `bin/fgos.mjs`, the sole write door". Mark là một mục trong báo cáo trả về,
  không phải một event.
- *Đặt điểm gọi bên trong `mergeRunnerItemLocked`* — loại. Nằm trong lock thì
  kéo dài vùng găng, đúng thứ cả feature này đang co lại.

## Risk map

| Thành phần | Mức | Cái gì chứng minh được |
|---|---|---|
| `detectPostLandDrift` gọi nhầm catchup/verify | **cao (đây là lý do item tồn tại)** | Test dùng item có `verify` ghi ra một file sentinel; sau khi chạy detection, sentinel **không** tồn tại. Cộng chứng minh tĩnh: hàm không import/gọi `runGoalCheck`, `catchup`, hay bất kỳ lệnh git ghi nào |
| Thêm `postLand` vào giá trị trả của `mergeRunnerItem` | thấp | Grep đã xác nhận cả ba điểm gọi chỉ đọc `outcome`/`check`/`selfResolved`; test hiện có trong `test/merge.test.mjs` vẫn xanh |
| Chi phí O(số leaf mở) | trung bình | `examined` trong báo cáo liệt kê đúng tập leaf đã xét; test chứng minh item chưa-claim/đã resolved không nằm trong đó |
| Nhánh leaf bị đụng | **cao — D2** | Test đọc SHA tip của nhánh leaf trước/sau detection, khẳng định bằng nhau |
| Nhánh leaf đã bị xoá giữa chừng | thấp | `branchExists` guard trước khi gọi `changedFiles`; leaf không có nhánh bị bỏ qua, không ném lỗi làm hỏng một merge đã thành công |

Hai dòng "cao" là proof point bắt buộc cho `fgos-coding-validating`.

## Ca cụ thể cần chứng minh

- **Biên**: không leaf nào mở ⇒ `notify`/`stale` đều rỗng, `examined` rỗng;
  item vừa land không có nhánh (`pull`/`legacy` source) ⇒ `changedFiles` trả
  `[]` nên không giao với ai, không sinh việc gì.
- **Không được hồi quy**: `mergeRunnerItem` với `outcome !== 'merged'` không
  chạy detection; ba điểm gọi hiện có vẫn đọc được `outcome` như cũ.
- **Đồng thời**: một leaf có nhiều entry phiên trong registry ⇒ báo cho tất
  cả các phiên đó, không chỉ cái đầu tiên.
- **Hỏng một phần**: `.fgos/sessions.json` chưa tồn tại ⇒ đọc ra registry
  rỗng (`readRegistry`'s hành vi sẵn có), mọi leaf có giao rơi vào `stale`,
  không ném lỗi.

## Giả định

- Ba điểm gọi `mergeRunnerItem` không spread giá trị trả về vào một chỗ có
  schema đóng — **đã chứng minh** bằng grep ở trên (mỗi chỗ chỉ đọc trường có
  tên).
- `listSessions` gọi được từ `mergeRunnerItem` với `lockRoot` (repo root
  thật, không phải ephemeral worktree) — **chưa chứng minh**, proof point ở
  `fgos-coding-validating`: ephemeral merge worktree không mang `.fgos/`
  (ADR0020), nên phải là `lockRoot` chứ không phải `repoRoot`.

## Iron Law

Chạm `src/runner/merge.mjs` ⇒ `src/evolve/iron-law.mjs`'s `MODULE_RULES`
`{prefix: 'src/runner/'}` khớp ⇒ **required**, không cần từ khoá nào trong
description (`:93`: `required = matchedModules.length > 0 || ...`). Bằng
chứng failing-test-first ghi vào
`docs/history/merge-conductor-throughput-and-human-release/iron-law-evidence-tsk-2ypd.md`
theo khuôn `docs/history/tsk-3bn-merge-conductor-harness-v2/iron-law-evidence.md`.
Phiên này **không** tự acknowledge cổng — đó là phán đoán cần người.

## Split

Không split. Một mảnh việc duy nhất: hai hàm mới cộng một điểm gọi, cùng một
bộ test.

## Verify

`npm test`

## Outstanding questions

None
