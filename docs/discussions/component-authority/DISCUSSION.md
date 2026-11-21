discussion: open

# Component authority: one ledger of authority, boundary and contract for the whole system

## 1. Trạng thái hiện tại

2026-11-21 17:05: Mở từ discussion `orchestration-skeleton` (§3 row 11, round 14). Chủ dự án chọn mở discussion riêng (phương án A) vì authority, boundary và contract là yếu tố hạng nhất của **toàn hệ thống**, không riêng skeleton. Stub này do shaper `orchestration-skeleton` viết; chưa có shaper riêng. Đã gửi mailbox cho secretary Miu (17:05) xin tạo backlog row và mở shaper `component-authority`; lúc 17:27 Miu chưa lấy tin (2 tin chờ, chưa drain lần nào), **chưa có backlog row và chưa có shaper**.

- Bước đầu tiên (§7 T0): điều tra backlog `p-7nja6ilwkr`, tìm nguyên nhân thật vì sao code thừa (cửa thứ hai, bản sao, twin Rust/Node) vẫn cứ sinh ra, trước khi thiết kế sổ authority.
- Chưa có câu hỏi nào đang mở với chủ dự án.

## 2. Mục tiêu & đề bài

Chủ dự án (2026-11-21): "component authority/boundary và contracts là rất quan trọng. anh không rõ sao mình vẫn cứ bị sinh thêm code thừa, nên cần quản lý chắc cho anh", và "authority/boundary và contract là yếu tố hạng nhất của cả system". Nguyên tắc đã có sẵn trong văn xuôi: design principle 1 "One door" và 7 "One authority, one source of truth" (`core/instructions/design-principles.md`), L10 add-through-not-alongside, RUL11 gom tùm lum. Chỗ hổng là việc ép thi hành. Mục tiêu: mỗi thành phần của hệ thống có đúng một authority (loại quyết định nó sở hữu), boundary rõ (sở hữu gì, không sở hữu gì) và contract tường minh, ghi ở **một** sổ duy nhất mà máy kiểm được, và code thừa bị chặn trước khi được viết thay vì bị dọn sau khi đã land. Discussion `orchestration-skeleton` phụ thuộc vào kết quả của discussion này: các thành phần của skeleton tuân sổ authority như mọi thành phần khác.

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Bằng chứng | Trạng thái |
|---|---|---|---|
| 1 | Authority đang nằm ở ba nơi không đồng bộ: `docs/platform/component-boundary.md` (canonical, văn xuôi, vài status lạc hậu), `docs/platform/proposals/component-authority-boundary-map.md` (nháp 714 dòng, `Canonical: No`, review cuối 2026-09-02, chưa promote), `docs/architecture-manifest.json` (máy đọc: tier, luật import, 78 row `doors`; test `test/architecture.test.mjs` `checkDoors`) | `orchestration-skeleton` §3 4f | **Rõ (hiện trạng)** |
| 2 | Code thừa đã thấy: write-scope hai bản (Rust + Node); worktree hai module (`src/git/worktree.mjs`, `src/runner/worktree.mjs`); portfolio hai chủ (Supervision, `packages/portfolio`); handoff ba đường; ba ngôn ngữ khung; hai vòng lặp thực thi (watcher, `fgos-runner --watch`); `POST /v1/runner/tick` đi vòng cửa `fgos run`; mặc định `maxLeads` gán cứng ngoài `core/config-standard` | Lượt dò tier 0-9, `orchestration-skeleton` §3 4b, 4c | **Rõ (hiện trạng)** |
| 3 | Nguyên nhân thật vì sao code thừa sinh ra. Bảy giả thuyết: (1) guard `doors` khớp theo tên job đã biết, bản sao tên mới lọt; (2) kiểm quá muộn (test/land), lúc plan không hỏi "ai sở hữu quyết định này"; (3) thiếu spec hoặc contract nên không thấy cửa, xây cửa mới; (4) spec lạc hậu nên không ai tin; (5) override tier từng file che vi phạm; (6) agent song song tự quyết ngầm; (7) xóa đường cũ chưa bị ép, twin vào `allowed` rồi ở lại | `orchestration-skeleton` §3 4f; backlog `p-7nja6ilwkr` (từ 2026-11-01: 132 commit census, 37 commit one-door) | **Chưa rõ: cần điều tra (§7 T0)** |
| 4 | Hình dạng sổ authority: gom ba nơi về một (không thêm nơi thứ tư); phần máy đọc mở rộng trong `docs/architecture-manifest.json`; `component-boundary.md` thành bản đọc cho người, sinh ra hoặc kiểm từ manifest; proposal map promote phần còn đúng rồi retire. Mỗi row: loại quyết định -> một thành phần chủ -> cửa (contract) -> spec | Đề xuất của shaper, `orchestration-skeleton` §3 4f | **Đề xuất, chưa bàn với chủ dự án** |
| 5 | Kiểm ở đâu: lúc plan (plan khai báo authority nó chạm; chạm quyết định chưa có chủ thì hỏi trước khi viết code), lúc land (guard `doors` + kiểm twin và đường cũ còn sót), trong nhịp rà soát định kỳ của LLM (`orchestration-skeleton` OS-D5 ý 6) | Đề xuất của shaper | **Đề xuất, chưa bàn** |
| 6 | Lỗ hổng spec/contract theo tier (danh sách lấp): không spec hoặc contract cho goal-check, durable-file, canonical-json (chỉ vectors), rigor, capability-config, operation-capability, parse-args, host-runtime, `src/runner/paths.mjs`, write-scope (không contract), portfolio, intake, evolve, gateway; spec lạc hậu: supervision ("Spec only"), questions, mailbox, work-state (số status), `component-boundary.md` status | `orchestration-skeleton` §3 4b (kết quả agent haiku, chưa xác minh hết) | **Rõ một phần: cần xác minh** |

## 4. Quyết định đã chốt

| D-ID | Quyết định | Ngày | Nguồn |
|---|---|---|---|
| CA-D1 | Authority, boundary và contract là yếu tố hạng nhất của toàn hệ thống; topic này có discussion riêng, bắt đầu bằng điều tra `p-7nja6ilwkr`; `orchestration-skeleton` phụ thuộc vào nó | 2026-11-21 | Chủ dự án, rounds 12-14 của `orchestration-skeleton` ("chọn A, mở discussion riêng đi em") |

## 5. Q&A log

- 2026-11-21 17:05 round 0: Mở từ `orchestration-skeleton` §3 row 11. Mang sang: lời chủ dự án round 12 và 13, bảng ba nơi chứa authority, bằng chứng code thừa từ lượt dò tier 0-9, bảy giả thuyết nguyên nhân, đề xuất sổ authority và ba điểm kiểm. Friction: `fgos convention path --kind discussion --slug <x>` refuse mọi slug (`invalid-slug: slug is empty after normalization`), và rule `discussion` trong `packages/convention/contracts/convention.rules.v1.json` trỏ `plans/discussions/` trong khi mọi discussion nằm ở `docs/discussions/<slug>/` (rule `doc-discussion-scratchpad-1`); dùng `docs/discussions/component-authority/` theo rule thứ hai.

## 6. Thiết kế đã chốt {#design}

Chưa có thiết kế chốt. Hướng đang đề xuất ở §3 row 4 và 5.

## 7. Danh mục hạng mục / task {#tasks}

### T0 Điều tra vì sao code thừa sinh ra {#task-surplus-code-investigation}
- Goal: kiểm bảy giả thuyết ở §3 row 3 bằng bằng chứng: đọc 37 commit one-door và các commit census từ 2026-11-01, phân loại nguyên nhân của từng bản sao hoặc cửa thứ hai, đo nó bị bắt ở đâu (plan, test, land, sau land) và sau bao lâu.
- Ref: backlog `p-7nja6ilwkr`.
- Draft verify: báo cáo có bảng commit -> nguyên nhân -> điểm bắt, mỗi dòng dẫn SHA.
