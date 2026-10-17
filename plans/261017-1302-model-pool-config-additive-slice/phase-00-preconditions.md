---
phase: 0
title: "Tiền đề: commit thay đổi config của anh, chụp baseline"
status: done
effort: 1h
---

# Phase 00: tiền đề

## Bối cảnh

`.fgos/config.json` đang có thay đổi chưa commit của anh: gemini chuyển từ
agy sang omp (`omp-gemini-tetcu72`, `omp-cli-bwrap-gemini-tetcu72`), ba
capability đổi ghim sang `omp-gemini-tetcu72`, và một capability kiến trúc
đổi `rigor` từ `high` sang `critical`. Phase 01 sửa cùng file, nên thay đổi đó
phải vào lịch sử trước.

## Việc làm

1. Anh commit thay đổi `.fgos/config.json` của mình, hoặc cho phép commit nó
   như một commit riêng mang tên anh muốn. Không gộp vào commit của plan này.
2. Chụp baseline trên config đã commit: với mỗi capability trong
   `runner.capabilities` và mỗi rigor (`low`, `standard`, `high`, `critical`),
   ghi `mechanism`, `executorId`, invocation, tier và model mà `bind()` trả về,
   cả trong herdr và ngoài herdr. Lưu vào
   `.fgos/runtime/tmp/model-pool-baseline.json` (ngoài lịch sử git).
3. Liệt kê mọi binding hôm nay ra model `default` hoặc
   `executor-entry-model`. Danh sách này quyết định phase 02 có thể đổi "thiếu
   ô thì từ chối" mà không vỡ capability nào.

## Kiểm chứng

- `git status --short .fgos/config.json` rỗng.
- File baseline tồn tại, có một dòng cho mỗi cặp capability × rigor × môi
  trường.

## Rủi ro

Thấp. Không sửa code.

## Kết quả (2026-10-17, HEAD `95885e6d3`)

- Thay đổi config của anh đã commit thành `95885e6d3`.
- Baseline: `.fgos/runtime/tmp/model-pool-baseline.json`, 608 dòng (38
  capability × 4 rigor × có/không `writes` × headless/herdr), sinh bằng
  `.fgos/runtime/tmp/model-pool-baseline.mjs` qua `loadRunnerConfigFromDir` và
  `bind()`.
- **Không binding nào ra model `default` hay `executor-entry-model`.** Phase 02
  được bật luật "thiếu ô thì từ chối".
- 48 dòng bị từ chối, đều đã có trước thay đổi này:
  - `impact-analysis`: `posture-unavailable`;
  - `pane-labeling` và `review`: `headless-no-executor` (headless) hoặc
    `no-candidate` (herdr).
- **Sửa một khẳng định của plan.** 26 capability trỏ `claude-herdr` **không bị
  từ chối khi headless**. Hôm nay `bind()` bỏ qua `claude-herdr` (chỉ có
  invocation herdr) và chuyển sang mục kế tiếp trong `prefer`: 192 dòng sang
  `openai/codex-cli-bwrap`, 8 dòng sang `xai`, 8 dòng sang `gemini`. Trong
  herdr, cả 184 dòng chạy `claude-herdr-bwrap`. Nếu gộp vào `claude` mà không
  ghim, khi headless các capability này sẽ chuyển từ openai sang claude.
- 21 capability có `glm` trong `prefer` chưa bao giờ chạy glm, vì `glm` đứng
  cuối danh sách; đây không phải lỗi.
