# Phase 05: spec, CHANGELOG

## Context

`docs/specs/confinement-authority.md` §6.5 (`:766-773`), §13.1 (`:1355-1363`), §14 (`:1398`), đoạn
`resourceBindings` trong định nghĩa request (`:582`, `:770`, `:1080`); `docs/specs/runner.md` RUL80 (`:1109`),
đoạn `runner.llmAccounts` (`:1132`); `CHANGELOG.md` `## [Unreleased]`.

## Bước

1. `confinement-authority.md`:
   - §6.5 và định nghĩa request: `invocation.credentialStore {use, homeEnv, files?}` thay `resourceBindings`;
     driver gắn `homeEnv` vào private home; ví dụ dùng `CODEX_HOME`.
   - §13.1 công thức: bước 1 là `credentialStore`; bước 2 thêm luật chép "file có mặt, không file nào thì từ
     chối", ghi rõ thay luật "thiếu một file thì từ chối" (quyết định owner 2026-10-17, mục 5.2 số 6); chỉ chép
     khi invocation khai store. Thêm dòng lịch sử: commit B2.
   - §14: pointer config.
2. `runner.md`: thêm RUL mới (số kế tiếp, ngày 2026-10-19) "invocation khai store nó đọc": `use` chọn store
   (thay basename lệnh của RUL80), `homeEnv`, `files`; nhánh suy từ field cũ chỉ cho global config và project
   khác, xoá ở đợt C; field cũ cùng invocation thì store mới thắng; `credentialStore` chỉ trên invocation
   confined. Sửa RUL80 trỏ sang RUL mới cho phần "khoá là basename". Đoạn `llmAccounts`: khoá store của account
   khớp `use`.
3. `CHANGELOG.md` `[Unreleased]`: một dòng cho người dùng: invocation khai `credentialStore`; luật chép mới;
   doctor `confined-pane-accounts` phủ mọi invocation có store.
4. `docs/specs/reading-map.md`: chỉ sửa nếu có path mới (test mới không cần).
5. Kiểm link và trích dẫn khớp code sau phase 01-04.

## File

Ba file docs trên, commit riêng mỗi file (file chung trên bảng). `docs/decisions/` là bản sinh: chạy
`fgos decision-index` nếu RUL mới cần xuất hiện ở đó.

## Rủi ro / rollback

Thấp. Revert commit.
