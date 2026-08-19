# Prompt điều phối — bộ việc dispatch redesign

Dán nguyên phần trong khung vào một phiên mới. Prompt tự chứa: không cần
lịch sử chat.

Bối cảnh đã hạ cánh trước khi prompt này chạy: `tsk-2uf` (thiết kế, 7 D-ID)
**đã merge vào `main`** ngày 2026-08-18 — `docs/history/dispatch-activation-and-handoff-redesign/`
mang `DISCUSSION.md` / `CONTEXT.md` / `plan.md`. Ba doc đó là nguồn sự thật
cho mọi item dưới đây, và chúng đã nằm trên trunk nên mọi nhánh mới seed từ
trunk đều có sẵn.

## Đồ thị phụ thuộc (đã khai bằng `deps`, không phải quy ước)

```
tsk-2uf ✅ delivered (docs đã trên main)
   │
   ├── tsk-2uf-1  heavy   gom dispatch.mjs + prepareDispatch      ← READY
   │      ├── tsk-2uf-2  heavy   hợp đồng worker (driver/worker)
   │      │      └── tsk-47r  heavy   pi = phép thử D4
   │      └── tsk-3wl5  standard  khảo sát mảng còn tùm lum
   │
   └── tsk-2uf-3  standard  capability slot advise/execute        ← READY

tsk-1xm  light   ranh giới ép bằng capability   (độc lập, stage discovery)
   └── tsk-492  heavy  deriveEconomics

tsk-7u7  standard  RUL11 + anchor + test        (độc lập, stage discovery)
```

## Prompt

```text
Làm bộ việc dispatch redesign. Nguồn sự thật:
docs/history/dispatch-activation-and-handoff-redesign/ trên main —
CONTEXT.md (D1–D7) là hợp đồng, plan.md là hình dạng thi công,
DISCUSSION.md#design là diễn giải đầy đủ kèm sơ đồ. Đọc CONTEXT.md
trước khi làm bất cứ item nào; mọi `action` của item đều trích D-ID
từ đó.

Thứ tự: chạy `fgos ready` để biết cái nào mở khoá. Deps đã khai đầy
đủ nên đừng tự suy thứ tự — cái nào ready thì làm được.

Với MỖI item: `/fgOS:pick <id>` và để nó chạy hết vòng cho tới khi
dừng tự nhiên.

Nguyên tắc dẫn đường, trích RUL11 (docs/specs/platform-foundations.md
sau khi tsk-7u7 xong; hiện đang là quyết định D7 của item này):
khong phai no nang ma no tum lum — thấy tùm lum thì gom lại, gom tới
khi hết; đích luôn là ranh giới rõ, contract tường minh, đổi và biến
hình dễ, không chắp vá. Đừng "additive" cho an toàn: thêm một cửa nữa
vào một đống cửa rời rạc là làm phân mảnh nặng thêm, không phải sửa.

Ba ràng buộc tuyệt đối, đã khoá ở CONTEXT.md:
 - KHÔNG quyết định lại cơ chế dispatch (tsk-5tm-3 D5 cấm; `decide`
   đã quyết ở Step A). prepareDispatch chỉ kiểm tính hợp lệ của lời gọi.
 - KHÔNG đổi D-ADR0033 (config thắng hasLiveTaskAccess cho executor
   cli-spawn-shaped).
 - tsk-2uf-1 KHÔNG đổi hành vi — nó là gom + đặt tên; mọi named export
   giữ nguyên qua barrel. Bất kỳ thay đổi hành vi nào lọt vào là ngoài
   phạm vi.

MỌI item giờ là root (parent đã gỡ có chủ ý), nên mỗi cái merge THẲNG
vào main khi xong, không gom cuối đợt. Merge sớm là mục tiêu: mỗi lần
tsk-2uf-1 hạ cánh là mọi dispatch sau đó trong repo hưởng luôn.

TRƯỚC MỖI LẦN MERGE, BẮT BUỘC: chạy một vòng review ĐỘC LẬP trên diff
của item đó — không phải tự đọc lại việc mình vừa viết. Dùng
`/code-review` (hoặc agent code-reviewer) trên nhánh `fgw/<id>`, đọc
kết quả, xử lý mọi finding thật, rồi mới `fgos approve <id>`. Verify
xanh KHÔNG thay thế được review: verify chứng minh code chạy, review
chứng minh nó đúng hình dạng đã chốt. Với tsk-2uf-1 (gom 2204 dòng)
và tsk-2uf-2 (sửa skill mọi phiên đều nạp) thì đây là bắt buộc tuyệt
đối, không có ngoại lệ.

Dừng lại hỏi người khi: cổng-người của engine nổ (awaiting-human), item
vào blocked, hoặc review độc lập ra finding chạm vào một D-ID đã khoá.
Không tự trả lời cổng, không tự nới spec để lách một refusal.
```

## Ghi chú cho người điều phối

**Vì sao mọi item là root, không phải con của `tsk-2uf`.** Ba sự thật cơ
học buộc phải đổi hình:

| Sự thật | Nguồn |
|---|---|
| Leaf merge vào `fgw/<rootId>`, chỉ root mới ra trunk | `src/verbs/merge/approve.mjs:404-410` |
| Root có child mở thì bị từ chối merge (partial land) | hợp đồng `/fgOS:approve` |
| Item `risk: heavy` đòi `plan.md` **trên nhánh của chính nó** | `src/state/store.mjs:520-532` (`assertPlanEvidence`) |

Giữ hình cha-con thì **không gì ra main cho tới khi cả ba xong**, và tệ hơn:
`tsk-2uf-1`/`-2` (đều heavy) sẽ **bị từ chối approve** vì nhánh của chúng
seed từ trunk mà trunk chưa có `plan.md`. Gỡ `parent` + merge docs trước là
thứ mở khoá cả hai vấn đề cùng lúc.

**Quan hệ giữa các item không mất khi gỡ `parent`** — nó sống ở `docsRef`
và `refs` (cả ba child đều trỏ về cùng feature dir) cộng `deps`. Đây cũng
là khuôn `tsk-4lc` đã dùng: một root theo dõi các milestone bằng cách nêu
id trong `verify`, không bằng parent-child.

**Song song được:** `tsk-2uf-1` ∥ `tsk-2uf-3` ∥ `tsk-1xm` ∥ `tsk-7u7` —
bốn item không giao footprint. `tsk-2uf-2` phải chờ `-1` (cùng đụng
`src/runner/dispatch/prepare.mjs`).
