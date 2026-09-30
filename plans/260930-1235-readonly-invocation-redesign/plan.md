---
title: "Thiết kế lại read-only dispatch: xoá readOnlyRedirects đúng cách"
description: "Follow-on của tier/rigor consolidation. Phase read-only cũ (D4/D14/D16) bị red team 2026-09-30 chứng minh không chạy được; cần brainstorm thiết kế lại trước khi viết phase."
status: pending
priority: P1
effort: "TBD (sau brainstorm)"
tags: [dispatch, security, read-only, quota]
created: 2026-09-30
blockedBy: [260930-0445-tier-rigor-vocabulary-consolidation]
blocks: []
---

# Thiết kế lại read-only dispatch

## Trạng thái

**Chưa có phase.** Bước tiếp theo: `/ak:brainstorm` (liên quan bảo mật), rồi mới `/ak:plan`. Plan
[`260930-0445-tier-rigor-vocabulary-consolidation`](../260930-0445-tier-rigor-vocabulary-consolidation/plan.md)
giữ nguyên `readOnlyRedirects` và phần redirect của `placement-policy.mjs` cho tới khi plan này xong (D17 bên đó).
Bản nháp phase cũ để tham khảo: [reference-original-phase-04-draft.md](./reference-original-phase-04-draft.md). Bản nháp này **sai**, không dùng lại nguyên văn.

## Mục tiêu (giữ từ D4, owner 2026-09-30)

- Xoá `readOnlyRedirects`, và xoá hẳn `placement-policy.mjs`. Bước chỉ-đọc không được đổi executor lặng lẽ **trước** khi chạy.
- Bất biến an toàn: bước `mutation: read-only` không ghi được vào repo/host, nhưng vẫn ghi được artifact của chính run.
- Hết quota claude không được làm review nằm chờ người (ưu tiên #2 "Release con người").

## Ràng buộc đã được chứng minh (red team 2026-09-30, có file:line)

1. **Worker read-only vẫn phải ghi** `agent-result.json` + `agent-report.md` (báo cáo bắt buộc, `src/runner/dispatch/assignment.mjs:799-812`), còn herdr thì phải ghi `outbox/result-<round>.json` (`transport.mjs:765`). Chỉ bwrap `host-write-denied` có ngoại lệ ghi `run-output` (`confinement/policies.mjs:25-40`). Config đã ghi `codex-cli-readonly-fgovn` là "RETIRED FOR DISPATCH" đúng vì lý do này.
2. **`confinement` khai ở invocation chỉ là metadata** và resolve thành `unconfined`. bwrap chỉ chạy khi `capabilities.<cap>.confinement` yêu cầu (`confinement/request.mjs:338-353`, `authority.mjs:639-641`). `selectConfinedInvocationId` chỉ kiểm cấu trúc (`resolve.mjs:507-515`).
3. **Danh sách cờ cấm không đủ:** thiếu `--dangerously-bypass-approvals-and-sandbox` (đang có trong config), `accept-edits` của agy, `--tools …bash` của pi, dạng `--x=y`. Allowlist Bash có `git diff --output=`, `cargo fmt`, `npm test`, tức là vẫn ghi được. Nếu dùng cờ thì phải là allowlist dương theo từng CLI.
4. **Fallback theo quota hiện là code chết:** `attemptProviderCapacityFallback` chỉ chạy khi lease `refused`, mà lease cần `runner.providers.*.accounts`, và không config nào khai (`assignment-runner.mjs:1672-1678,1741`; `provider-capacity.mjs:634`). Hết quota lúc runtime không đi vào nhánh này.
5. **Invocation của fallback được chọn ở `assignment-runner.mjs:2318-2353`**, không phải ở khối redirect. Heuristic `primaryWasConfined` dựa trên invocation mặc định của primary, nên sẽ ra `codex-cli-bypass-fgovn`. Pin của primary đi theo sang executor mới.
6. **`review-candidate`/`red-team-candidate` đã bind openai** qua capability `code:review`. Chỗ redirect thật sự tác động là actor không bind hoặc ghim claude, ví dụ capability `review` của advisory panel (`binding.mjs:224,258-267`).
7. **Project khác:** redirect mặc định `claude → claude-reviewer` (`placement-policy.mjs:385-390`); nhiều project không có `executors.claude`. Xoá redirect mà không có doctor quét step read-only × executor sẽ làm hỏng coordination ở các project đó.
8. **Luật read-only thứ hai** ở `provider-adapter.mjs:356-369` (`applied-via-tool-gating`). `executeExecutorCli`/`runDispatchCli` (`cli.mjs:546,1261`) không đi qua `isReadOnlyAssignment`.
9. `distinctProviderFrom` chỉ được kiểm lúc bind (`binding.mjs:282-290`), không có ở `src/runner/dispatch/**`. Strength `preferred` không được biến thành `required`.

## Câu hỏi cho brainstorm

- Read-only = chỉ OS confinement (bwrap `host-write-denied`, resolve một chỗ lúc spawn, áp cho primary + fallback + resume)? Hay chấp nhận cờ CLI kèm quyền ghi giới hạn trong runDir?
- Pane herdr cho reviewer: bỏ, hay cần confinement cho herdr-spawn?
- Trigger quota: khai `runner.providers.claude.accounts`, hay classifier lỗi usage-limit lúc runtime → re-dispatch?
- Thứ tự chọn invocation read-only: `readOnlyDefault` tường minh trên executor thay cho thứ tự mảng?
