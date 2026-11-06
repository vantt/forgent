# Handoff: DOCOS — spec cho Knowledge and Documentation Engine (H2)

Ngày: 2026-11-06. Từ: Lead `forgentx-5f` (lead:DOC, đã đóng). Sang: một agent mới, lead:DOCOS.

## Prompt cho chat mới

Dán nguyên khối dưới đây vào chat mới (mở ở `/home/vantt/projects/forgentX`):

```text
Em là lead DOCOS của forgentX: chặng tiếp theo của hệ thống tài liệu sau khi H1 (gom thẩm quyền tài liệu về docs/platform) đã xong. Báo cáo anh bằng tiếng Việt, xưng anh/em. Tự quyết khi phân tích đã chọn rõ, chỉ hỏi khi các phương án thật sự ngang nhau hoặc phụ thuộc ý định của anh (theo mẫu core/skills/_shared/decision-question.md, gom câu hỏi thành bộ).

Việc của em: viết SPEC cho H2 (Knowledge and Documentation Engine) để anh duyệt. Chưa viết code, chưa lập plan thực thi trước khi spec được duyệt.

Đọc trước, theo thứ tự:
1. Handoff đầy đủ: plans/reports/handoff-261106-1248-docos-h2-knowledge-documentation-engine-spec.md
2. AGENTS.md, docs/reading-map.md, docs/platform/governance.md.
3. Proposal gốc: docs/platform/proposals/documentation-system-unification.md — mục tiêu A1–A6, B1–B6 (anh chốt 21/10), §0.2 luật thứ tự, §0.3 luật không loại trừ, §4.3–§4.6, §9.2 (H2), §10 (chuẩn nghiệm thu).
4. docs/platform/intent-preservation-ledger.md hàng PF-I024 (ba kiểm tra giao cho DOCOS), PF-I010 (gom tài liệu người dùng), PF-I007 (H3).
5. plans/260925-documentation-authority-unification/phase-10-post-cutover-maintenance-mvp.md (quyết định "không thêm verb fgos doc") và plans/reports/scout-261104-1016-doc-maintenance-facts.md.

Các bước:
A. Scout read-only (báo cáo qua `fgos convention path`): Knowledge Registry hiện có (fgos doc-registry, fgos docs-index, các verb fgos doc đang có, src liên quan, code từ tsk-28x), Convention (packages/convention: placement rules, classify với cờ canonical/metadataExempt/generated), scripts/doc-health.mjs, state.decisions và fgos decision-index. Bảng "đang có → H2 cần gì" (B1: không job nào hai chủ). Prior art: git log -S trên các symbol và tên verb cũ.
B. Spec H2 lát đầu: cửa viết tài liệu (A4, §10 mục 1–7) làm bằng cách MỞ RỘNG Convention + registry + doc-health, không dựng cửa thứ hai bên cạnh (L10, PF-I024). Hoà giải mâu thuẫn: proposal §4.5 muốn mở rộng namespace `fgos doc`; Phase 10 đã quyết không thêm verb mới. Trả lời hai câu hỏi mở của proposal (phạm vi "luật"; thứ tự ưu tiên khi mục tiêu kéo nhau). Ghi rõ phần nào hoãn theo §0.3 vào intent ledger.
C. Đưa anh duyệt spec. Sau khi duyệt mới lập plan (plans/<timestamp>-<slug>/ theo fgos convention).

Luật repo: không đọc .fgos/secrets.local.env, không in giá trị bí mật; không commit .fgos/config.json, .fgos/events*, .claude/settings.json; không đổi nhánh ở main checkout; trước mỗi commit kiểm tra pwd + nhánh và commit bằng pathspec (`git commit -- <paths>`); commit conventional, không mã plan/phase, không nhắc AI; test chạy `env -u CLAUDE_CODE_SESSION_ID`; không `npm test` trong linked worktree; IO nặng chạy dưới `flock /home/vantt/projects/.doc-work/doc-heavy.lock`; chạy `fgos dispatch decide` trước khi gọi Agent; đường dẫn báo cáo lấy từ `fgos convention path`; tác giả không sửa công cụ nghiệm thu của chính mình; xoá gì cần anh duyệt. Đường dẫn trong backtick ở docs phải được git track (doc-health đọc đĩa, thư mục chưa track làm main đỏ ở máy khác). Mở/kết thúc lane: cập nhật hàng DOCOS ở plans/261017-1313-fgos-platform-program-board/plan.md và thêm một dòng đầu log.md (không đọc log.md toàn bộ).
```

## Trạng thái lúc giao

**H1 đã đóng (2026-11-06):**
- Cutover `97dd62aa7` (11-03), Phase 10 bảo trì `97cc4b432` (11-04), gỡ lease `ad72e3a46`, release đang kích hoạt `47e1016d` mang các guard.
- Đợt hoàn tất 11-06: dọn retired-engine `e0d208e38`; luật `unplaced-docs` chặn đường dẫn lạ trong `docs/` `2adf060b6` (chưa có trong release đang kích hoạt; LAND ra bản sau); sửa đường dẫn chết `b1ef08a8f`; xoá file làm việc plan `377a4da45`; đợt sửa tàn dư cuối (reading map, switchboard và migration-authoring-rules chuyển vào history, decision-citation-drift, decision-index, skill, ledger, board) — xem `plans/reports/implement-261106-1246-h1-documentation-finish-sweep.md`.
- Kiểm tra: `plans/reports/audit-261106-1230-h1-documentation-unification-completion.md`; kiểm kê dọn dẹp: `plans/reports/scout-261106-1230-h1-documentation-cleanup-inventory.md`.

**Lưu trữ (chỉ máy design-lap, trừ tag citations):**
- Tag `archive/doc-260925-lineage` (bằng chứng plan, ~1,1 GB, không push được vì blob > 100 MB), `archive/doc-260925-plan-record` (56 commit cuối của nhánh plan), `archive/doc-260925-land-boundary-names`, `archive/doc-260925-land-suite-fixes`.
- Tag `archive/doc-260925-citations` đã push lên origin: giữ 21 commit mà docs/platform ghim làm provenance.
- Tar `/home/vantt/projects/.doc-work/plan-260925-evidence-84bbfa7b8.tar.zst` (576 MB).

**Còn mở, không thuộc DOCOS:**
- LAND: ra release mang `2adf060b6` để hook chặn `unplaced-docs` thật sự.
- COOK: `docs/backlog.md:75` nhắc file đã xoá.
- Test đỏ có sẵn: `test/convention/convention-client.test.mjs` (linked caller tree) và 4 test `test/setup/convention-doctor-check.test.mjs` — dò git root trả `null` qua `createGitInspect`; không do file luật.

**Thuộc H2 nhưng chưa làm (đầu vào cho spec):**
- Gom tài liệu người dùng (`docs/{tutorials,how-to,reference,explanation}`, `docs/knowledge`) theo một profile (§9.2 bước 3, PF-I010); `docs/user/README.md` ghi hướng chuyển dự kiến.
- Ba kiểm tra PF-I024: cửa viết, kiểm tra chủ sở hữu ở mức claim (không khoá bằng chữ `Canonical for` vì một chuỗi dùng cho 60 tài liệu), kiểm tra skill/lệnh được nhắc có tồn tại (cần registry tên, không regex).
- doc-health chỉ chạy trong `npm test`, không ở pre-commit hay doctor; pre-commit convention check mở khi host lỗi.
