# plan.md — tsk-51m: Merge Conductor (throughput + giải phóng người)

Mode: **high-risk** — 3 cờ thường (public contracts, existing covered
behavior, weak proof around the area) cộng **2 cờ hard-gate**: *data loss*
(đổi phạm vi khoá merge và đường `git branch -f`; tiền lệ tsk-46a/tsk-2cd nằm
đúng chỗ này) và *removing a validation* (D3 rút verify khỏi cửa ra trên
đường nóng). Lane nhỏ hơn không thật thà: `standard` sẽ bỏ qua yêu cầu chứng
minh cho hai cờ hard-gate, mà đó lại chính là hai chỗ hỏng thì mất việc thật.

Quyết định khoá: `CONTEXT.md` (D1–D7). Thiết kế đầy đủ: `DISCUSSION.md` §6.
Hạng mục kèm acceptance/footprint: `DISCUSSION.md` §7.

`impact-analysis: full` — `fgos tool query --capability impact-analysis
--status present` trả `gitnexus`/`present`; index reindex trong phiên
(2026-08-12, 14.761 nodes tại `79fead3`), commit sau đó chỉ là docs.

## Tín hiệu đồ thị

`fgos graph --json` chạy 2026-08-12: `criticalPath.depth` 10 nhưng path
(`tsk-4vo → … → tsk-19y-1`) **không đi qua tsk-51m**; `topUnblock` rỗng;
`componentCount` 342. Kết luận thật thà: đồ thị **không cho tín hiệu thứ tự**
cho item này — thứ tự dưới đây rút từ ràng buộc nội tại D3/D5, không phải từ
metric.

## Approach

**Đường chọn**: khoá merge theo **ref đích** đặt trong `approve` (D7), rồi
mới đảo verify về cửa vào (D3). Hai bước này nối đuôi bắt buộc: D3 dựa vào
bất biến "ref đích không nhích giữa catchup-verify và land", mà chỉ hàng đợi
theo ref mới tạo ra bất biến đó.

**Vì sao ref đích là khoá đúng**: thứ hai merge tranh nhau không phải thư mục
mà là **con trỏ nhánh**. `bin/fgos.mjs:3145` dựng worktree detached riêng cho
mỗi leaf-to-root rồi land bằng `git branch -f` — hai leaf **cùng** root cùng
đọc tip C0, tạo C1/C2, ai ghi sau thì công của người kia mồ côi (tsk-46a's
CAS guard nay biến mất-âm-thầm thành fail-to-tiếng, chưa phải ngăn). Hai leaf
**khác** root ghi hai con trỏ khác nhau, không có gì để tranh — nhưng
`:3150` vẫn truyền `lockRoot: repoRoot` nên chúng xếp hàng trên một lock
không liên quan.

**Phương án đã loại**:
- *Trần số merge đồng thời* — loại. Độ song song đúng đắn tự nổi lên bằng số
  ref đích đang có việc; một con số cố định vừa siết nhầm vừa không siết đúng.
- *Đặt hàng đợi ở `merge next`* — loại. tsk-3cs D1: `approve` là execution
  path duy nhất; đặt ở picker thì đường người gõ tay lách được, mà đó đúng là
  nguyên nhân giẫm chân tsk-3cs D5 đo được.
- *Rebase nhánh để refresh* — loại bởi D2 (worktree sống + rewrite lịch sử).
- *Bỏ verify ở catchup cho đỡ tốn* — loại. Verify của catchup chính là thứ
  cấp `branchHeadAtReturn` cho `mergedTreeAlreadyVerified` tiêu thụ; bỏ đi thì
  verify rơi ngược vào trong lock.
- *Tự động catchup mọi leaf sau khi root sync* — loại bởi D4 (root 13 con ⇒
  ~78 lượt verify, phần lớn vô ích).

## Risk map

| Thành phần | Mức | Cái gì chứng minh được |
|---|---|---|
| Đổi khoá từ main-checkout sang ref đích (`main-checkout-lock.mjs`, điểm gọi `merge.mjs:711`) | **cao — hard-gate data loss** | Test đua: hai merge cùng ref đích chạy chồng ⇒ bên thua chờ, không bên nào mất commit; hai merge khác ref đích ⇒ chạy đồng thời thật, không tuần tự hoá. Cộng chứng minh CAS guard tsk-46a vẫn bắt được ca cũ |
| Rút verify khỏi cửa ra (D3) | **cao — hard-gate removing a validation** | Test: (a) đi qua catchup ⇒ `skipRedundantChecks` bật, chứng minh bằng assert chứ không bằng đo giờ; (b) target đã nhích mà không catchup ⇒ verify đầy đủ vẫn chạy; (c) item không có `branchHeadAtReturn` ⇒ verify đầy đủ vẫn chạy |
| Picker bỏ qua item không tiến được (hấp thụ tsk-1zd) | trung bình | Test: item vướng Iron Law không được trả về lượt kế; các item ready khác tới lượt; "hết việc" và "kẹt mãi" là hai tín hiệu phân biệt được |
| Refresh base lúc pick | trung bình | Test: nhánh trắng ⇒ đứng trên tip hiện tại; nhánh đã có commit riêng ⇒ KHÔNG bị đụng, chỉ báo lệch |
| Điểm phát hiện sau land (D4) | thấp | Test: không giao path ⇒ không sinh việc gì và **không verify nào chạy** trong đường này |
| Playbook escalation | thấp | Test theo `docs/how-to/write-verify-for-a-skill-prose-change.md` (`npm test && POSITIVE && NEGATIVE`) |

Mọi dòng "cao" ở trên là proof point bắt buộc cho `fgos-coding-validating`,
không được thay bằng suy đoán.

## Ca cụ thể cần chứng minh

- **Biên**: ref đích chưa tồn tại (`createDetachedMergeWorktree` từng crash —
  tsk-6ch); item không có `branchHeadAtReturn`; hàng đợi rỗng.
- **Không được hồi quy**: đường root-to-main vẫn phải giữ main checkout độc
  quyền; cổng Iron Law vẫn chặn; D1 (root chưa gom đủ con) vẫn escalate.
- **Đồng thời**: hai leaf cùng root; hai leaf khác root; một leaf + một
  root-to-main; phiên giữ slot bị chết giữa chừng (TTL/liveness thu hồi).
- **Hỏng một phần**: catchup xanh rồi ref đích nhích trước khi land (bằng
  chứng vỡ ⇒ phải catchup lại, không được land mù); land xong nhưng ghi state
  thất bại (tiền lệ tsk-480).

## Giả định

- `withMergeEphemeralWorktree`'s CAS guard (tsk-46a) là điểm chống mất-cập-nhật
  cuối cùng và vẫn đúng sau khi đổi khoá — **chưa chứng minh**, đưa vào proof
  point hàng 1.
- `catchup` hôm nay chỉ chạy khi item đã `blocked` vì 1 trong 6
  `CATCHUP_REASONS` (`bin/fgos.mjs:3814`); biến nó thành bước thường của
  đường land cần mở điều kiện đó — **chưa chứng minh** rằng không có tác dụng
  phụ lên các đường gọi cũ.
- `catchup` không giữ main-checkout lock và tự chép lại logic merge/verify/
  commit thay vì gọi `mergeRunnerItem`. Khi D3 đưa catchup lên đường nóng, lỗ
  này chuyển từ hẹp sang nóng — giả định là phải gộp vào hạng mục
  verify-at-inbound-gate, `fgos-coding-validating` xác nhận.
- tsk-kv3 (thu cổng cây-sạch) chồng lấn khái niệm với verify-at-inbound-gate;
  giả định hai cái vẫn tách được vì tsk-kv3 sửa `isWorkingTreeClean`
  (`merge.mjs:109-124`) còn hạng mục kia sửa đường gọi verify.

## Thứ tự và file đụng

**Làn 1 (tuần tự)** — `task-merge-queue` → `task-verify-at-inbound-gate`.
File: `bin/fgos.mjs`, `src/runner/main-checkout-lock.mjs`,
`src/runner/merge.mjs`.

**Làn 2 (song song)** — `task-refresh-at-pick`
(`src/runner/worktree.mjs`), `task-post-sync-detection`
(`src/runner/merge.mjs` + mô-đun mới), `task-escalation-playbooks`
(`plugins/fgOS/skills/**`). Cộng hai item đã tồn tại: tsk-kv3, tsk-60h.

Ghi chú: `task-post-sync-detection` khai `merge.mjs` trong footprint nên
`mergeReadiness` sẽ tự serialize nó với làn 1 nếu cả hai cùng ready — đó là
hành vi mong muốn, không phải lỗi.

## Split — năm con của tsk-51m

| id | Hạng mục | Lane | Verify | Footprint |
|---|---|---|---|---|
| `tsk-xyr` | Khoá merge theo ref đích trong `approve` (gồm picker bỏ qua item kẹt, hấp thụ tsk-1zd) | heavy | `npm test` | `bin/fgos.mjs`, `src/runner/main-checkout-lock.mjs`, `src/runner/merge.mjs` |
| `tsk-4ax` | Đưa verify về cửa vào, cửa ra chỉ fast-forward | heavy | `npm test` | `src/runner/merge.mjs`, `bin/fgos.mjs` |
| `tsk-55p` | Refresh base lúc `pick` cho nhánh chưa có commit riêng | standard | `npm test` | `src/runner/worktree.mjs` |
| `tsk-2ypd` | Phát hiện lệch sau land bằng giao đường dẫn thật | standard | `npm test` | `src/runner/merge.mjs`, `src/state/graph-harness.mjs` |
| `tsk-4xq` | Playbook cho ba block reason còn lại + thu stop rule | light | `npm test && <POSITIVE ×3> && <NEGATIVE>` | `plugins/fgOS/skills/merge-loop/SKILL.md`, `.../merge-next/SKILL.md` |

`tsk-4ax` mang `deps: [tsk-xyr]` — ràng buộc thứ tự duy nhất trong bộ. Bốn con
còn lại không có deps, chạy song song được.

Hai item đã tồn tại, KHÔNG tạo lại: **tsk-kv3** (thu cổng cây-sạch về footprint
item đang merge) và **tsk-60h** (lát `merge-conflict` của §H). **tsk-1zd** đã
hấp thụ vào `tsk-xyr` (D6) — đánh dấu `supersededBy` là việc của bước sau,
không làm ở đây.

Tiến độ tổng: `fgos rollup tsk-51m`.

## Ràng buộc Iron Law (phát hiện ở validating — áp cho mọi con)

`src/evolve/iron-law.mjs:20-39` `MODULE_RULES` gác `{prefix: 'src/runner/'}`
và `{equals: 'bin/fgos.mjs'}`; `:93` quyết định
`required = matchedModules.length > 0 || matchedFlags.length > 0` — **chạm
module là đủ bật, không cần từ khoá nào trong description**.

Hệ quả cho bộ này:

| Con | Chạm module gác? | Iron Law |
|---|---|---|
| `tsk-xyr` | `bin/fgos.mjs`, `src/runner/*` | **required** |
| `tsk-4ax` | `src/runner/merge.mjs`, `bin/fgos.mjs` | **required** |
| `tsk-55p` | `src/runner/worktree.mjs` | **required** |
| `tsk-2ypd` | `src/runner/merge.mjs` | **required** |
| `tsk-4xq` | chỉ `plugins/fgOS/skills/**` | không |
| `tsk-51m` (root→main) | gộp diff của mọi con | **required** |

Iron Law là stop **cần người** theo thiết kế (§H.3 và luật đã chốt) — bộ này
**không thể tự merge trọn vẹn không người**. Mỗi con chạm module gác phải
viết `iron-law-evidence.md` trên nhánh của mình (khuôn đã có tiền lệ:
`docs/history/tsk-3bn-merge-conductor-harness-v2/iron-law-evidence.md`) để
người duyệt xác nhận nhanh thay vì phải tự đi dựng lại bằng chứng.

## Đính chính trích dẫn (validating)

- `mergeReadiness` ở `src/state/graph-harness.mjs:**109**`, không phải `:94`
  (bản nháp shaping ghi nhầm; mô tả của `tsk-xyr` còn giữ số cũ).
- "Phiên đang sống" cho `tsk-2ypd` lấy từ `listSessions`
  (`src/runner/session.mjs:485`, đọc `.fgos/sessions.json`), **không phải**
  `src/runner/claim-liveness.mjs` — file đó chỉ export `lastActivityAt` và
  `isReclaimEligible` (ngưỡng stale), không phải danh sách phiên sống. Mô tả
  của `tsk-2ypd` còn trỏ sai chỗ này.

## Việc chưa gán chủ

`worktree.mjs:652` `git branch -f` không khoá (gốc chung tsk-46a + tsk-2cd);
`provisionDependencies` chạy `npm ci` mới trên mỗi ephemeral merge worktree;
`driftStatus` tính lại 2 lần trong một `merge next` khi sync-root nổ.
`fgos-coding-validating` quyết gộp hay tách item mới.

## Outstanding questions

None
