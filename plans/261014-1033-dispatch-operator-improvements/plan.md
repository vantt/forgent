# Cải tiến cửa dispatch cho người điều phối

Status: in-progress (2026-10-14). Lead: phiên e9e8fb82 (pane wS:p4T5).

## Nguồn

Tám đề xuất của người điều phối (pane "Lead handoff 261013", wS:p4VX), anh vantt giao lại 2026-10-14 10:31.
Nối tiếp nhánh `fix/dispatch-followups` (5 việc follow-up đang chạy ở agent nền của phiên này).

## Chia việc theo pane (theo vùng file, tránh đè nhau)

| Lane | Đề xuất | Vùng file chính | Cần council trước? |
|---|---|---|---|
| A — log & kết quả | 1 tự ghi log / `log --plan`, 2 help nói rõ log, 3 trường `finalMessage` | `src/runner/dispatch/cli.mjs` (execute/log/help), `run-result.mjs` | Không — thiết kế nhỏ, tự quyết, ghi lý do |
| B — cờ gọi provider | 4 cờ `--effort`, 5 cảnh báo model lệch/không hỗ trợ | `provider-adapter.mjs`, `config.mjs`, phần parse cờ trong `cli.mjs` | Không — nhưng phải xem prior art về effort |
| C — hết hạn mức | 7 nhận diện usage limit, trạng thái riêng + giờ thử lại, tự hẹn chạy lại | `provider-capacity.mjs`, `usage-parsers.mjs`, `run-result.mjs` | **Có** — trạng thái mới + tự hẹn lại đụng contract kết quả và "Release con người" |
| D — ranh giới ghi | 6 confined cho lượt chỉ sửa docs/plans, 8 báo nhầm "ghi ra ngoài workspace" | `evidence-attribution.mjs`, `confinement/`, `cli.mjs` | **Có** — đụng confinement (RUL76/RUL77) và chồng với Việc 2 của `fix/dispatch-followups` |

Lane C, D: chạy council/panel thiết kế (`fgos-architecture-panel` hoặc `fgos-advise`) → viết plan riêng (path từ `fgos convention path --kind plan`) → làm.
Lane D chỉ được sửa code sau khi `fix/dispatch-followups` đã merge vào main (Việc 2 cùng vùng confinement); thiết kế thì làm ngay.

## Ràng buộc chung

- Mỗi lane một worktree + nhánh riêng từ main (`feat/dispatch-<lane>`), `target/` symlink, `node_modules` `cp -al`.
- Không đụng `src/setup/registrations.mjs`, `src/runner/dispatch/provider-credential-renewal.mjs` khi nhánh `fix/credential-phase-02-doctor-scan` chưa merge vào main.
- Prior art trước thiết kế; test đỏ trước; mỗi đề xuất một commit `git commit -- <paths>`; test `env -u CLAUDE_CODE_SESSION_ID`.
- Không tạo work item (chưa có quyết định gom thành item — pane wS:p4VX có lệnh "gom 8 đề xuất thành work item" đang chờ, trùng việc).
- CHANGELOG `## [Unreleased]`, spec `docs/specs/runner.md` khi hành vi đổi.
- Không merge, không push: lane báo Lead; Lead báo anh vantt rồi ff-only merge trong main checkout, lần lượt từng lane.

## Acceptance

- Mỗi đề xuất: nguyên nhân/động cơ có bằng chứng, test khoá hành vi, `npm test` xanh trên nhánh lane.
- Lane C/D: báo cáo council + plan riêng được link ở đây trước khi có commit code.
- Báo cáo mỗi lane ở `plans/261014-1033-dispatch-operator-improvements/reports/` (path từ `fgos convention path --kind report --plan 261014-1033-dispatch-operator-improvements`).

## Trạng thái lane

- A: chưa giao
- B: chưa giao
- C: chưa giao
- D: chưa giao
