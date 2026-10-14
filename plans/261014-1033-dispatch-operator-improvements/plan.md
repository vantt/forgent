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

- A: đang chạy — herdr agent lane-a, pane wS:p4X2 (tab dispatch-lanes), nhánh feat/dispatch-log-result
- B: đang chạy — lane-b, pane wS:p4X4, nhánh feat/dispatch-effort-model
- C: đang chạy — lane-c, pane wS:p4X3, nhánh feat/dispatch-usage-limit (council trước)
- D: đang chạy — lane-d, pane wS:p4X5, nhánh feat/dispatch-write-boundary (council trước; code đề xuất 6 chờ fix/dispatch-followups merge)

## Cổng một-cửa (thêm 2026-10-14 10:45, anh vantt duyệt)

Nghi vấn gốc: dispatch có nhiều cửa (execute --for thô, execute --contract, workflow unit, herdr round, fgos run) với contract output/log/confinement khác nhau; nhiều đề xuất là triệu chứng của việc đó (vd. `finalMessage` = `summary` mà cửa thô không có).
1. Quét: door-scout → reports/scout-261014-1045-dispatch-door-map.md.
2. Hội đồng: `fgos-architecture-panel` trên báo cáo quét → kết luận cửa chuẩn + lộ trình hợp nhất.
3. Trong lúc chờ: lane A, C, D và Việc 2/3 của fix/dispatch-followups chỉ đọc/chứng minh/test đỏ, không sửa code production. Lane B làm tiếp, logic đặt ở tầng dùng chung cho mọi cửa. Việc 1/4/5 của fix/dispatch-followups làm tiếp.
4. Sau kết luận: chỉnh lại brief từng lane (bỏ đề xuất nào tự biến mất khi hợp nhất).

## Kết luận hội đồng (2026-10-14 12:40)

Bản ghi: [reports/council-261014-1231-dispatch-one-door-conclusion.md](reports/council-261014-1231-dispatch-one-door-conclusion.md). Hợp nhất cửa hợp đồng (Assignment), giữ hai tầng cài đặt; cửa thô hạ xuống compat, chưa xoá. Lane A/B/C/D gỡ lệnh chờ theo mục "Cập nhật sau hội đồng" trong từng brief; lane C thu hẹp theo RUL65b; lane D làm bước 1 (confinement null) + bước 2 (#8 → warning), #6 chờ owner. Bước 0 còn af132275b chờ owner; bước 3 (doctrine) Lead làm sau bước 0; bước 4–6 owner quyết.
