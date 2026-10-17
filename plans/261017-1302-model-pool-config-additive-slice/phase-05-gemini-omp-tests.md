---
phase: 5
title: "Sửa 35 test vỡ khi gemini chuyển từ agy sang omp"
status: pending
effort: 3h
---

# Phase 05: test của gemini sau khi chuyển sang omp

Làm **trước** khi commit phase 01–04, để main xanh lại.

## Bối cảnh

Commit `95885e6d3` (gemini chạy qua omp, bỏ các invocation agy) làm hỏng 35
test. Ở commit ngay trước (`8d138119d`) cả ba file sau xanh; ở `95885e6d3` và
sau đó chúng hỏng:

| File | Hỏng | Vì sao |
|---|---|---|
| `test/runner/dispatch-policy-baseline-snapshot.test.mjs` | 12 | Snapshot `agy-cli`, `agy-herdr`, `fgos-coding-implement` và các fact (a), (b), (d) vẫn mô tả agy |
| `test/runner/provider-adapter.test.mjs` | 22 | Kỳ vọng invocation `agy-cli-mucdong` và args của agy; một test cho thấy args omp hiện đã có `--model gemini-4-argon-high` |
| `test/runner/herdr-provider-invocations.test.mjs` | 1 | `agy-herdr-mucdong` không còn |

Commit `95885e6d3` còn cuốn theo `maxTier: frontier` của một phiên khác; phiên
đó đã sửa ở `214e8530d`. Phase này không đụng `maxTier`.

## Việc làm

1. Đọc từng test hỏng, tách hai loại:
   - test mô tả **config đã commit** (snapshot, invocation có trong config):
     cập nhật theo gemini qua omp;
   - test dùng **fixture riêng** về agy (hành vi của adapter agy): giữ
     nguyên fixture, chỉ sửa chỗ nó đọc config đã commit.
2. Snapshot baseline: sinh lại fixture bằng chính harness của file test, rồi
   đọc diff fixture và nêu từng dòng đổi trong báo cáo phase (gemini chuyển từ
   agy sang omp; model của `fgos-coding-implement` theo ladder hay theo
   profile).
3. Truy nguồn của `--model gemini-4-argon-high` trong args omp: code nào thêm
   nó và vì sao. Kết quả quyết định bước "`--model {model}` cho gemini" của
   phase 01 còn cần hay đã có.

## Kiểm chứng

- Ba file trên xanh.
- `FGOS_FULL_SUITE_QUEUE=off npm test` (hàng đợi full-suite cần một host mới
  hơn release đang kích hoạt; biến này chỉ tắt việc xếp hàng, không bỏ test):
  số test hỏng còn lại chỉ thuộc `test/rust-host/*`,
  `test/holder-lock/fences-v1-tombstone.test.mjs` (release cũ, thiếu route
  `internal`) và `test/runner/dispatch.test.mjs` (đã hỏng từ trước hôm nay).
  Liệt kê chúng trong báo cáo phase, không sửa ở đây.

## Rủi ro

Trung bình: cập nhật snapshot có thể che một thay đổi hành vi thật. Đọc diff
fixture từng dòng là bằng chứng.
