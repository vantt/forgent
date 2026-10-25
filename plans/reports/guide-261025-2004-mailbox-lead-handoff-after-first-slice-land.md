---
title: "MAIL: bàn giao lead sau khi lát đầu land"
description: "Phiên lead MAIL claude-rgvd@fg-server đóng ngày 2026-10-25 sau khi lát đầu của Agent Mailbox land lên main. File này cho phiên lead mới biết lane đang ở đâu, việc còn lại, câu owner đang chờ và các luật phải giữ."
---

# MAIL: bàn giao lead sau khi lát đầu land

Người viết: phiên `claude-rgvd@fg-server` (lead MAIL cũ), 2026-10-25 20:05. Owner nói tiếng Việt, gọi owner là "anh", xưng "em".

## 1. Việc đầu tiên khi vào phiên

1. Claim vai: `fgos identity session --register --role lead:MAIL --take` (phiên cũ đã đóng; `--take` chuyển vai nếu directory còn ghi phiên cũ). Kiểm bằng `fgos identity resolve lead:MAIL`.
2. Đọc hàng MAIL trong `plans/261017-1313-fgos-platform-program-board/plan.md` (mục "Các luồng") và grep `log.md` theo `MAIL`, `lead:MAIL`, `89a29e29e`. Không đọc `log.md` cả file.
3. Ghi một dòng đầu `log.md` (ngay dưới "Bảng hiện trạng ở [plan.md](plan.md).") báo đã nhận vai, rồi hỏi owner câu ở mục 3.

## 2. Trạng thái

- **Lát đầu đã land** lên main lúc 19:15: merge `89a29e29e` (nhánh `mailbox/v1-v3` tip `7732771d3`), dòng board `626e00410`. Lát đầu là giao thư giữa các phiên **trên cùng một máy, cùng một dự án** (Claude Code, Codex, pi, omp qua hook native `fgos hook mailbox`; agy chưa).
- Cổng ở cây đã land: cargo 4 crate (config, mailbox, mailbox-core, git) 709/0; 25 file test Node chạm tới 446/0. Cổng đầy đủ ở tip trước `1994c5b1f`: cargo workspace 1987/0, `npm test` chỉ còn 17 lỗi họ fgctl có sẵn trên main. Log ở `~/projects/forgent-worktrees/mailbox-evidence/land-gates/`.
- Đã duyệt: CFG (phần config, tới `c81712ccc`), OPC (Rust `main_checkout_root` + census), reviewer độc lập (mọi finding đã sửa, L3 vào item).
- **COOK** (`forgent-76` trên fg-server) sẽ merge main sau phase 01 của nó; nếu đụng hàng mailbox (verb, route hook, registration `mailbox-hook`, dòng `mailbox.lock` ở doctor `lock-holders`, section config `mailbox`) thì nó nhắn lead MAIL soát trước khi land. Trả lời nó.
- Hàng MAIL trên board còn ghi "landed … lane đóng phần land". **Lane chưa đóng**: sửa hàng thành "lát đầu landed, lane mở" khi owner chốt mục 3.

## 3. Câu owner đang chờ trả lời (hỏi lại khi vào)

Owner hỏi "MAIL đã xong đâu, kế hoạch còn gì". Đã trình ba phần, owner chưa chọn:

- **(a) — khuyến nghị:** làm phần 1 ngay, rồi lên plan V8 (phần 2) và mang ngân sách về cho owner duyệt trước khi code.
- **(b):** chỉ làm phần 1, dừng lane; giao thư xuyên máy tách lane khác hoặc làm sau.

**Phần 1 — đưa lát đầu vào dùng thật:**
- Build, stage, activate release mới từ main trên fg-server, fg-server2, design-lap (hiện chưa máy nào chạy mã mailbox). Phối hợp khung yên tĩnh với các lane qua board như HARDEN làm 10-25 17:45. Không bao giờ activate release từ nhánh.
- Bật `mailbox.enabled` cho dự án forgent, để các lane cùng máy nhắn nhau bằng mailbox.
- Câu hỏi 22 của spec (ai làm đánh thức phiên đang nghỉ): lịch sử quyết định ghi V7f phần B đã làm nudge 10-24, nhưng mục 16 vẫn ghi "unanswered". Kiểm, sửa spec; phần thiếu thành item.
- Câu 23 (cài hook mặc định): mã land theo opt-in. Khuyến nghị giữ opt-in tới khi mọi máy chạy release có mailbox; ghi vào spec khi owner đồng ý.
- Spec mục 15.3 còn ghi pi/omp là phần sau trong khi mã đã land: sửa.

**Phần 2 — V8, giao thư xuyên máy** (nhu cầu thật: các lane ở máy khác nhau đang phải trao đổi qua board):
- Spec §15.2: thư thành event của Event Store, đi qua Git remote; độ trễ tới ~300 s (`eventStore.sync.intervalSec`). Hai điểm mở: hook không được gọi mạng nên phải tìm chỗ fetch; thân thư ở mãi trong lịch sử Git nên phải nhỏ.
- Spec §15.1 bản tối thiểu: reply tính là `acked`, quá `reply_by` thì báo người gửi. Không có nó thì nhắn xuyên máy vẫn mù như board.
- Cần WORK/`lead:ES` và OPC duyệt. Lên plan bằng ak-plan (validate + red-team) theo cách các bậc trước, đọc "Lịch sử quyết định" của spec mailbox và Event Store trước.

**Phần 3 — để yên** (chưa có consumer): §15.5 phiên bền (vai IDENT đã che phần lớn), §15.7 worker headless, §15.8 nudge gõ chữ cho agy, §15.4 thuộc lane runner.

## 4. Item còn mở của MAIL

- `tsk-sthuctszdl`: mailbox lấy mặc định chỉ từ Config standard (kèm ghi chú harness đóng băng băm `limits.v1.json`).
- `tsk-3b3vc275mo`: key config để thay câu chỉ dẫn người nhận (mặc định A = bản v3; model, CLI, đường wake chưa đo thì về v1).
- Bốn item confinement `tsk-2gsbfe4lqh`, `tsk-jhtyx5myh5`, `tsk-kqyatnkjdu`, `tsk-q5uu5odeta`: kiểm với `b267a0e75`, chỉ đóng item đã chứng minh sửa xong.
- Không thêm lại 13 item MAIL đã park (IDENT đã nhận về). Item mới thì được.

## 5. Nơi mọi thứ nằm

- Spec: `docs/platform/agent-mailbox/spec.md` (mục 15 phần sau, 16 câu hỏi, 17 lịch sử quyết định).
- Mã: `packages/mailbox/rust/core` (`fgos-mailbox-core`), `packages/mailbox/rust/store` (`fgos-mailbox`), `packages/git/rust/src/driver.rs` (`main_checkout_root`), `src/setup/agent-hooks.mjs`, `core/config-schema/mailbox.schema.yaml`, `core/config-standard/mailbox.yaml`.
- Nhánh `mailbox/v1-v3` đã merge, còn trên origin; worktree `/home/vantt/projects/forgent-mailbox` đã gỡ. Việc mới mở nhánh mới từ main trong worktree mới (đặt trên ext4, không `/tmp`).
- Bằng chứng cũ: `~/projects/forgent-worktrees/mailbox-evidence/`.

## 6. Luật phải giữ

- Không land lên main khi owner chưa duyệt. Sync nhánh bằng merge, không rebase; merge origin/main vào nhánh ở đầu và cuối mỗi phase và trước mỗi lần chạy bộ test.
- Main checkout `/home/vantt/projects/forgent` nhiều phiên dùng chung: không stash, autostash, checkout ở đó. Commit lên main qua một worktree riêng detached tại `origin/main` (`cd "$W" || exit 1` trước mọi lệnh), push `HEAD:main`.
- Mỗi lần lên main: một dòng đầu `log.md` nêu commit, thay đổi cho bên khác, lane bị ảnh hưởng; nhắn thẳng phiên bị ảnh hưởng (SendMessage), không chỉ ghi board.
- Đổi Rust thì chạy `node scripts/git-one-door-scan.mjs --write-census` và commit census.
- RAM: `cargo test --workspace` và `npm test` không chạy cùng lúc; `CARGO_BUILD_JOBS=4`, `--test-threads=4`, `--test-concurrency=4`; `free -g` ≥ 8 trước khi chạy.
- Chạy CLI thật phải trong confinement (bwrap), không đụng `~/.claude`, `~/.codex`, `~/.pi`, `~/.omp` thật của owner.
- Không in giá trị bí mật (token, key) ra hội thoại.
- Không đưa tên AI, plan id, mã finding vào commit message hay comment.
- Đường dẫn report/plan lấy từ `fgos convention path`.
- Phân tích đã chọn rõ thì quyết và báo, không hỏi lại owner. Chỉ hỏi khi phương án ngang nhau hoặc phụ thuộc ý owner, theo mẫu câu hỏi quyết định.
- Trước khi nói lane khác đã/chưa land hay chờ ai: fetch và grep board lại ngay lượt đó.
