---
phase: 5
title: "Sửa 35 test vỡ khi gemini chuyển từ agy sang omp"
status: done
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

## Kết quả (2026-10-17)

**Nguồn của `--model gemini-4-argon-high`.** Không phải đường spawn thật. Adapter
shadow (`renderProviderInvocation`, `src/runner/dispatch/provider-adapter.mjs:438`)
tự nối `--model <model>` khi template thiếu `{model}`; còn `transport.mjs:202`
chỉ dùng adapter cho họ claude, mọi họ khác spawn bằng args legacy. Vì vậy từ
`95885e6d3` gemini qua omp **không nhận model**: tier nào cũng chạy model mặc
định của profile `gemini-tetcu72` (`google-antigravity/gemini-3.8-flash`).
Test equivalence shadow-vs-legacy đỏ chính là báo lỗi này.

**Sửa lỗi thật.** Thêm `--model {model}` đầu `args` của `omp-gemini-tetcu72` và
`omp-cli-bwrap-gemini-tetcu72`, như ba invocation omp của xai. Chạy thật trên
profile `gemini-tetcu72` (một lượt "Reply with the single word ok" mỗi id):

| Id trong ladder | omp chạy |
|---|---|
| `gemini-3.8-flash-low`, `gemini-3.8-flash-medium` | `gemini-3.8-flash` (không lệch sang `flash-lite`) |
| `gemini-4-argon-high` | `gemini-4-argon` |

omp khớp mờ và bỏ hậu tố mức suy nghĩ; mức suy nghĩ vẫn do `--thinking medium`
trong `args`. Ladder `modelPolicies.gemini` giữ nguyên. Hậu tố `-low`/`-high`
vì vậy không có tác dụng với omp; đổi ladder sang id omp và đưa mức suy nghĩ
theo tier là việc riêng, không thuộc đợt A.

**Test.** Phân loại theo bước 1:

| File | Loại | Sửa |
|---|---|---|
| `dispatch-policy-baseline-snapshot.test.mjs` | config đã commit | Nhãn `agy-cli`/`agy-herdr` đổi thành `gemini-cli`/`gemini-herdr`, trỏ `omp-cli-bwrap-gemini-tetcu72`/`omp-gemini-tetcu72`; 9 dòng fixture sinh lại bằng `resolveSnapshotRowByLabel`; fact (a) kiểm thêm `--model` có trong argv; (b), (d) đổi id |
| `provider-adapter.test.mjs` | 21 test dùng chung fixture trên; 1 test về renderer agy | Test renderer agy dùng template agy viết thẳng trong test thay vì đọc config |
| `herdr-provider-invocations.test.mjs` | config đã commit | Mục gemini trỏ `omp-gemini-tetcu72` (`PI_CODING_AGENT_DIR`, kind `omp`) |
| `dispatch.test.mjs` (test "consolidated gemini executor") | config đã commit | Cũng hỏng từ `95885e6d3`, trước đây xếp nhầm vào "hỏng từ trước"; viết lại cho omp, kiểm mọi invocation chạy `omp`, có `--model {model}`, bị confine |

Diff fixture từng dòng: lệnh `agy` thành `omp`; model ở mọi tier không đổi;
home riêng `HOME` thành `PI_CODING_AGENT_DIR`; dòng headless đổi confinement từ
`none` sang `bwrap` (invocation headless mới là bản bwrap); `fgos-coding-implement`
vẫn chọn pane gemini qua `capability.prefer`.

Kiểm ngược: bỏ riêng thay đổi config thì 10 test snapshot đỏ.

**Các lỗi còn lại của `dispatch.test.mjs` trong worktree** (32 test
`holder-lock lock-driver-unavailable`) là do worktree không có
`.fgos/installation/activation.json`; đặt `FGOS_HOST_BIN` trỏ host của release
đang kích hoạt thì cả file xanh trừ test đọc `HEAD`, test đó xanh sau commit.

## Rủi ro

Trung bình: cập nhật snapshot có thể che một thay đổi hành vi thật. Đọc diff
fixture từng dòng là bằng chứng.
