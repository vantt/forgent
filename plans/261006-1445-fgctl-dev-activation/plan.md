---
title: "fgctl dev activation: Rust fgos chạy payload Node trực tiếp từ checkout"
description: "Draft cho phương án C của D1: thêm kiểu kích hoạt dev-source vào distribution để `fgos` trơn thấy code Node đang sửa, kèm guard, doctor và xoá cửa tạm của Plan A."
status: pending
priority: P3
effort: 16h
branch: main
tags: [distribution, fgctl, activation, doctor, dogfood, draft]
created: 2026-10-06
---

# fgctl dev activation

```txt
Plan status: Draft — not authorized for execution; not scheduled
Source: plans/261006-1415-fgos-single-door-mechanisms/phase-03-canonical-door-research-decision.md (D1, phương án C);
        plans/reports/harness-investigation-261006-synthesis.md §7 H1(c), §8 ("C là plan draft riêng")
Quan hệ Plan A: Plan A (261006-1415-fgos-single-door-mechanisms) dùng phương án B. Plan C chỉ chạy SAU KHI Plan A Phase 04 và 06 đã vào main.
Out of scope: AgentKit/ClaudeKit/rtk (ak-*/ck-* skills, .claude/hooks/*, .claude/rules/*, ~/.claude/*, rtk)
```

## Mục tiêu

Ở checkout nguồn fgOS, sau một lệnh kích hoạt dev tường minh: `fgos` trơn (shim `.fgos/installation/bin/fgos`, cửa Rust chuẩn) chạy payload Node **từ working tree**, không phải bản sao `libexec/legacy-node` của release dán digest. Sửa `bin/`/`src/` có hiệu lực ngay; verb Rust vẫn cần build lại. Thoát dev mode = quay về đúng release trước đó.

## Phát hiện trước Phase 00 (đọc code 2026-10-06, chưa phải kết luận)

1. **Prior art có, code không có.** `docs/architect/packaging-distribution/runtime-identity-and-activation.md:73,895-920` (commit `6733de7cf`, 2026-09-06) ghi "Source checkouts support explicit `dev:<rev>` activation ... Settled for V1": `artifactDigest: dev:<rev>`, `activationKind: dev-source`, `activeReleasePath: <checkout>`, `distributable: false`, bỏ bảo đảm digest file. Track R1 (`archive/plans/260910-1700-rust-host-r1-kernel/phase-12-...md:98`) chỉ làm nhãn `host: "dev-source"` khi **chưa** kích hoạt (`packages/distribution/rust/src/lib.rs:91-106`). Bản promote (`docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md`) và contract frozen `contracts/activation-binding.md` **bỏ mất** mục này, không có commit nào ghi lý do. `git log -S'activationKind'`/`-S'dev activation'` chỉ ra `6733de7cf`; 0 hit trong `src/ scripts/ apps/ packages/ test/ bin/`.
2. **Ledger nói quá:** `docs/platform/host-invocation-routing/intent-preservation-ledger.md:81` (HI-I027) ghi "`dev:<rev>` and staged release use same mechanism" là `implemented preview`; thực tế đường dev duy nhất là env + `target/dev-manifest.json` (`scripts/run-rust-dev-host.mjs:28-100`), không qua activation.
3. **Năm chỗ code hiện tại chặn dev activation** (chi tiết ở Phase 00): shim exec `$releasePath/bin/fgos` nhưng checkout không có `bin/fgos`; `verify_legacy_node` buộc `legacyNode.root` nằm trong release root; `resolve_payload_path` băm lại `files[]` mỗi lần gọi; `verify_workspace`/`repair_workspace` tìm release theo digest trong store, bỏ qua `releasePath` (dev activation sẽ bị đánh `quarantined`); `publish_and_tail` ghi `.fgos/distribution.json` — file này **được git track** ở repo này.

## Phases

| # | Phase | Depends on | Effort | Status |
|---|---|---|---|---|
| 00 | [Research + spec (không code)](phase-00-research-and-spec.md) | Anh cho phép lên lịch (trigger ở "Why Draft") | 3h | pending |
| 01 | [Activation contract + schema](phase-01-activation-contract-and-schema.md) | 00 + spec duyệt (DP1) | 2h | pending |
| 02 | [fgctl writer, guard, lifecycle verbs](phase-02-fgctl-writer-guard-lifecycle.md) | 01 | 4h | pending |
| 03 | [Host resolution: shim, legacy exec, readers](phase-03-host-resolution-shim-and-readers.md) | 02 | 4h | pending |
| 04 | [Doctor registration](phase-04-doctor-registration.md) | 03; Plan A Phase 04 đã merge | 1.5h | pending |
| 05 | [Docs, CHANGELOG, xoá cửa tạm của Plan A](phase-05-docs-changelog-and-deletions.md) | 04; Plan A Phase 06 đã merge; Plan B đã xong lượt sửa `AGENTS.md` | 1.5h | pending |

Dependency graph: `Plan A 04 → C04`, `Plan A 06 → C05`, `00 → (DP1) → 01 → 02 → 03 → 04 → 05`. Tuần tự hết: 01/02/03 cùng sửa `packages/distribution/rust/src/init.rs`; 04/05 cùng sửa `src/setup/registrations.mjs`, `docs/specs/distribution.md`, `CHANGELOG.md` mà Plan A cũng sửa.

## Decision points (chi tiết + khuyến nghị ở Phase 00)

| Id | Câu hỏi | Khuyến nghị của em |
|---|---|---|
| DP0 | Có lên lịch Plan C không | Chưa; chờ trigger ở "Why Draft" |
| DP1 | Duyệt spec Phase 00 (cổng cho mọi phase code) | — |
| DP2 | Dev mode chỉ payload Node, hay cả binary Rust từ `target/` | Cả hai, binary lấy từ `target/{debug,release}/fgos` đã build sẵn; shim không tự `cargo build` |
| DP3 | Kiểm toàn vẹn khi tree sống | Bỏ băm `files[]` cho `dev-source` (đúng thiết kế V1 cũ), giữ kiểm containment/symlink/`..` |
| DP4 | Ai được dùng | Chỉ checkout nguồn fgOS (guard cứng); mở cho tác giả extension Node khi có người thật |
| DP5 | Đổi contract frozen V1 thế nào | Trường tuỳ chọn mới trong `schemaVersion: 1` nếu Phase 00 chứng minh mọi reader cũ fail-closed; không thì `schemaVersion: 2` |
| DP6 | Worktree: dev mode chạy code của main checkout hay của worktree | Main checkout (khớp `docs/specs/distribution.md:285-288`), ghi rõ giới hạn |

## Acceptance criteria (đo được)

1. Test e2e mới (fixture checkout có marker): sau lệnh kích hoạt dev, sửa một file Node → gọi shim → output đổi theo, **0** lần `fgctl`/build giữa hai lần gọi; exit 0. Đỏ trên tree hiện tại, xanh sau Phase 03.
2. Guard: kích hoạt dev trong repo **không** có marker → exit ≠ 0, `activation.json` và `.fgos/distribution.json` byte-identical trước/sau. Đỏ trước Phase 02, xanh sau.
3. Kích hoạt dev và thoát dev đều để `.fgos/distribution.json` byte-identical (`git diff --exit-code .fgos/distribution.json` = 0).
4. `fgctl verify` và `fgctl repair` trên dev activation: không rename/xoá file nào dưới checkout, không ghi `status: "quarantined"`; `repair` đưa `artifactDigest` về đúng `previousArtifactDigest` (digest `sha256:` của release trước), shim chạy lại `releasePath/bin/fgos` của release đó.
5. `fgos version --runtime-json` trong dev mode báo `artifactDigest` dạng `dev:*` và kiểu kích hoạt dev; `fgos doctor` có đúng 1 dòng báo dev mode; check `active-release-matches-checkout` (Plan A) pass-skip.
6. Project khác không đổi: `test/rust-host/fgctl-init.test.mjs`, `fgctl-upgrade.test.mjs`, `fgctl-stage.test.mjs`, golden `activation-binding-full.json`/`-minimal.json` không đổi byte; `cargo test -p fgos-distribution -p fgos -p fgctl` xanh.
7. Deletions (Phase 05): số chỗ còn nhắc cửa tạm của Plan A trong `package.json`, `AGENTS.md`, how-to = **0** (grep cụ thể ở Phase 05).
8. `env -u CLAUDE_CODE_SESSION_ID npm test` xanh; job Windows CI xanh hoặc case dev bị skip có lý do ghi trong test (theo DP Q7).

## Quyết định đã nhận (2026-10-06)

- Plan C là một draft riêng; D1 của Plan A tạm là B, nên Plan A không phụ thuộc Plan C. Anh đã xác nhận.
- Anh đồng ý khuyến nghị cho DP2-DP6 ở bảng trên và việc để Windows ngoài phạm vi. Đây là định hướng, chưa phải spec: Phase 00 vẫn phải xác nhận từng điểm bằng bằng chứng.
- DP0: chưa lên lịch. Điều kiện (a) của "Why Draft", tức là đã có tác giả extension Node thật, **chưa thoả** (anh xác nhận chưa có).
- Đã trả lời: việc mục "Dev / Source Activation" biến mất khỏi `docs/platform/` là **không cố ý** (anh xác nhận 2026-10-06). Hệ quả: Plan C không đảo quyết định nào của anh; nó thực hiện lại một mục đã "Settled for V1" (`runtime-identity-and-activation.md:73`) bị rơi khi promote tài liệu. Claim này phải được bảng bảo toàn của plan `260925-documentation-authority-unification` tính là claim bị rơi (kho kiểm kê của branch đã ghi nhận nó), không phải phạm vi mới. Lý do rơi chưa tìm ra (UNPROVEN): chỉ biết nó xảy ra trước plan 260925, trong đợt promote ngày 2026-09-14.

## Why Draft

- **Giá trị:** bỏ hẳn một lớp lệch (M42: `fgos` chạy bản sao cũ sau khi sửa code) cho người tự-host fgOS; một cửa `fgos` thay vì hai (release + dev script). Phục vụ mission #3 (dogfood), **không** trực tiếp phục vụ mission #1/#2 (D-ADR0035, `AGENTS.md:27-33`), trừ khi có tác giả extension Node cần chạy payload sửa tay trong project của họ.
- **Chi phí:** sửa contract frozen V1, 6+ reader của activation, nới bảo đảm tái lập/rollback (dev activation không có digest cố định, `fgctl verify` mất nghĩa), thêm bề mặt guard; khoảng 16h, đụng `init.rs` (1831 dòng) và `legacy_exec.rs`.
- **B của Plan A đã che phần lớn nhu cầu** với chi phí gần 0, và check `active-release-matches-checkout` làm lệch thấy được.
- **Trigger để lên lịch (một trong):** (a) có ít nhất một tác giả extension Node ngoài repo này cần chạy payload sửa tay qua Rust host; (b) sau 2 tuần dùng B, đếm được ≥ 3 ca agent/người chạy `fgos` trơn thấy code cũ dù check doctor đã có, hoặc B bị bỏ qua (chạy `node bin/fgos.mjs` thay vì cửa Rust); (c) anh quyết retire kênh `node bin/fgos.mjs` (tier 1) trước khi Node core được thay.

## Rollback

Mỗi phase một commit. Phase 01-03 revert được độc lập theo thứ tự ngược; nếu đã có workspace ở dev mode, chạy `fgctl repair` (về release trước) **trước** khi revert code (code cũ không đọc được dev activation → shim exit 3, fail-closed). Phase 05 revert trả lại cửa tạm của Plan A.

## Component boundary

Không đổi ownership: activation thuộc packaging-distribution, shim/legacy exec thuộc host. Phase 01 và 05 đối chiếu `docs/platform/component-boundary.md` và ghi "No component-boundary change" hoặc cập nhật nếu Phase 00 thấy khác.
