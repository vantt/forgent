# Handoff: Plan C — fgctl dev activation (Draft)

Ngày 2026-10-06. Chỉ đọc + viết plan; không sửa code/docs/rules.

## Nội dung

- [plan.md](../261006-1445-fgctl-dev-activation/plan.md) — status `Plan status: Draft — not authorized for execution; not scheduled`; 6 phase, 16h; DP0-DP7; acceptance 8 mục đo được; "Why Draft" có trigger.
- [phase-00](../261006-1445-fgctl-dev-activation/phase-00-research-and-spec.md) research + spec, Q1-Q9 đều UNPROVEN kèm bước kiểm; bảng prior art.
- [phase-01](../261006-1445-fgctl-dev-activation/phase-01-activation-contract-and-schema.md) contract + schema; [phase-02](../261006-1445-fgctl-dev-activation/phase-02-fgctl-writer-guard-lifecycle.md) writer/guard/verify-repair-upgrade; [phase-03](../261006-1445-fgctl-dev-activation/phase-03-host-resolution-shim-and-readers.md) shim + legacy exec + 8 reader; [phase-04](../261006-1445-fgctl-dev-activation/phase-04-doctor-registration.md) doctor; [phase-05](../261006-1445-fgctl-dev-activation/phase-05-docs-changelog-and-deletions.md) docs, CHANGELOG, bảng xoá phụ thuộc Plan A.

## Phát hiện chính (em kiểm lại hôm nay)

1. Dev activation **đã được thiết kế và "Settled for V1"** ở `docs/architect/packaging-distribution/runtime-identity-and-activation.md:73,895-920` (`6733de7cf`), nhưng không có dòng code nào; bản promote sang `docs/platform/` và contract frozen bỏ sót, không có lý do ghi lại. Ledger HI-I027 (`intent-preservation-ledger.md:81`) ghi "implemented preview" là nói quá.
2. Năm chỗ code chặn: shim exec `$releasePath/bin/fgos` (checkout không có file này, và `bin/` nằm trong `package.json` `files`); `verify_legacy_node` buộc payload nằm dưới release root; `resolve_payload_path` băm `files[]` mỗi lần gọi; `verify_workspace`/`repair_workspace` tìm release theo digest trong store nên sẽ quarantine dev activation; `publish_and_tail` ghi `.fgos/distribution.json` (git-tracked).
3. Workspace root luôn là main checkout (git-common-dir) → dev mode chạy code main checkout, không phải worktree (DP6).

## Evidence: kiểm lại vs kế thừa

- Kiểm lại (đọc file/lệnh hôm nay): `apps/fgctl/src/main.rs`, `init.rs` (struct, shim, publish, tail, verify, repair), `verify.rs`, `manifest.rs`, `lib.rs`, `store.rs:250`, `legacy_exec.rs:69-154`, `run-rust-dev-host.mjs`, `fgos-shell-integration.sh`, `bin-discovery.mjs`, `host-bin.mjs`, `registrations.mjs:4509-4579`, `activation.json`/`root.json`/shim đang cài, `git ls-files .fgos/distribution.json`, CI matrix, `git log -S` 7 chuỗi, spec/contract/architecture docs.
- Kế thừa, chưa kiểm lại: số dòng trong how-to `install-fgos...md:180-189` (bảng check) và nội dung §5 `measure-a-real-case.md` (chỉ kiểm tiêu đề :100); danh sách test đọc `AGENTS.md` (lấy từ Plan A Phase 06); `upgrade_workspace` :1193-1335 chưa đọc hết; `extract.rs`, `canonical.rs`, `lock.rs`, `workspace.rs` chỉ đọc chữ ký → để Phase 00.
- Không chạy GitNexus `impact` (plan-only); mỗi phase code có bước impact + grep cross-check.

## Rủi ro

- `fgctl verify` trên dev activation hôm nay sẽ ghi `quarantined` → shim exit 3 (High nếu Phase 02 làm thiếu nhánh).
- Nới kiểm digest rò sang release path (Low×High).
- Plan A chưa có phase nào sở hữu việc thêm npm script cho phương án B → danh sách xoá ở Phase 05 có thể rỗng phần đó; Phase 05 lập danh sách từ git log thật.
- Conflict `registrations.mjs`/row #7/`AGENTS.md` với Plan A và Plan B → Plan C chạy sau cả hai.

## Câu hỏi chưa giải quyết

1. Anh xác nhận Plan C là draft riêng (synthesis §8 ghi "chờ anh xác nhận").
2. Plan A phương án B có thêm npm script (`fgos:dev`) không, phase nào sở hữu? (Plan A Phase 03 chỉ nêu ví dụ.)
3. Việc bỏ mục "Dev / Source Activation" khi promote docs có cố ý không — cần anh hoặc người viết `3835596e2` trả lời.
4. DP2-DP7 (ở Phase 00).
5. Tác giả extension Node: đã có ai ngoài repo này chưa? Quyết trigger (a).

Status: DONE_WITH_CONCERNS
Summary: Plan C draft gồm plan.md + 6 phase đã viết; Phase 00 liệt kê Q1-Q9 UNPROVEN, phát hiện thiết kế dev activation V1 cũ chưa từng được cài và 5 chỗ code chặn.
Concerns/Blockers: Plan A chưa giao phase nào thêm npm script cho phương án B, nên danh sách xoá ở Phase 05 phải lập lại từ git log khi tới lúc; ledger HI-I027 đang nói quá trạng thái thực.
