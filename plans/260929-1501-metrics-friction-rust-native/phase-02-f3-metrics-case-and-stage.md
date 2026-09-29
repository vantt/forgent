---
phase: F3
title: "metrics case open/close/list + stage lên shim"
status: done
priority: P1
effort: "1d"
dependencies: [F1]
---

# Phase F3: `fgos metrics case` (mốc M1)

## Overview
Ghi hai thứ không tính lùi được: **danh tính và khung thời gian của case**, và **can thiệp tay kèm verdict**. Store do Observe sở hữu, và Rust là writer duy nhất. Phase kết thúc bằng việc **stage lên shim `fgos`**. Từ M1 trở đi chỉ có một đường chạy là shim (single path).
<!-- Updated: Validation Session 2 - single path -->


## Requirements
- Functional:
  ```text
  fgos metrics case open  <name> --harness fgos|cook-plan|plain [--task "<mô tả>"] [--dir <root>]
  fgos metrics case close <name> --interventions <N> --verdict usable|fixed|discarded [--note "…"] [--items tsk-a,tsk-b] [--sessions id,…]
  fgos metrics case list  [--open]
  ```
  - `open` từ chối nếu project đã có case mở (exit 5, in tên case đang mở). Tên case phải duy nhất.
  - `close` không cho close hai lần.
  - `--items` và `--sessions` là tuỳ chọn, dùng để gắn case vào subject cụ thể thay vì chỉ dựa vào khung thời gian. Case không cần work item.
  - Mỗi record lưu `project` (root tuyệt đối), `headAtOpen` và `headAtClose` (`git rev-parse HEAD`, `null` nếu không phải git repo).
- Non-functional:
  - Append-only JSONL, shard theo writer: `.fgos/observe/cases/<writerId>.jsonl` (helper `shard.rs` của F1). <!-- Red Team 2026-09-29 -->
  - Mở file ở chế độ `O_APPEND` và gọi `fsync`.
  - <!-- Red Team 2026-09-29 --> Kiểm "không có case mở" (đọc mọi shard) và append **cùng nằm trong store lock** của F1 (`store_lock.rs`).
  - Tự tạo `.fgos/observe/` nếu chưa có.

## Architecture
```json
{"v":1,"type":"case-opened","ts":"…","name":"observe-f2","project":"/home/vantt/projects/forgentX","harness":"fgos","task":"…","headAtOpen":"…"}
{"v":1,"type":"case-closed","ts":"…","name":"observe-f2","interventions":2,"verdict":"fixed","note":"…","items":[],"sessions":["…"],"headAtClose":"…"}
```
- Install gate (AGENTS.md): thêm key `OBSERVE_DIR` vào `src/state/fgos-file-registry.mjs`. Doctor check "writable" được thêm ở F8.
- `case_journal::find(name) -> CaseWindow { project, since, until: Option, harness, items, sessions, head_at_open, head_at_close }`. F4 dùng hàm này.

## Related Code Files
- Create: `packages/observe/rust/src/case_journal.rs`
- Create (làn A1): `packages/observe/rust/src/metrics_cli/case.rs` <!-- Session 4: file theo làn -->
- Modify: `src/state/fgos-file-registry.mjs`, `docs/specs/observe.md` (định dạng record)

## Implementation Steps
1. Viết `case_journal.rs` với các hàm `open`, `close`, `list`, `find`.
2. Nối vào provider.
3. Viết test trên thư mục tmp: open → open trùng thì bị từ chối → close → close lại thì bị từ chối → list; dòng cuối bị cắt dở thì bỏ qua và báo `skipped`.
4. **Stage (quy trình cài duy nhất, F6 dùng lại):**
   - Ghi lại `fgctl status`.
   - `cargo build --release -p fgos` từ `main` sạch.
   - Đọc `fgctl stage --help` và `fgctl upgrade --help` (không đoán cờ), rồi stage release và upgrade workspace forgentX.
   - Kiểm digest mới bằng `fgctl status` cộng `fgos metrics ping`.
   - Nếu hỏng: `fgctl repair` rollback về `previousArtifactDigest`.
   - Ghi quy trình này vào `docs/specs/observe.md` § Cài đặt.
5. Mở case thật đầu tiên **qua shim** cho chính việc làm F2 (mốc M1).

## Success Criteria
- [ ] Vòng đời open/close/list đúng.
- [ ] Mở case thứ hai khi đã có case mở thì bị từ chối, và báo tên case đang mở.
- [ ] `fgctl status` cho thấy digest mới; `fgos metrics ping` chạy qua shim.
- [ ] Case thật đầu tiên được mở qua shim trước khi bắt đầu F2.

## Risk Assessment
- **Stage sớm làm hỏng activation của workspace.** Có đường rollback bằng `fgctl repair`; build từ `main` sạch.
- **Quên `close`.** `metrics case list --open` và `metrics harness` cảnh báo case mở quá 24 giờ. Không tự đóng.
- **Hai terminal cùng `open`**: check và append cùng trong store lock nên không race. Test: hai process `open` cùng lúc thì đúng một cái thành công. <!-- Red Team 2026-09-29 -->
