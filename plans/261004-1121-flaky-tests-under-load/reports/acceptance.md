# Nghiệm thu

Nhánh `fix/flaky-tests-under-load` trên đỉnh `main` `d4ca40ad0`. Nguyên nhân và cách sửa từng test: xem `repro.md`.

## Điều kiện máy

16 lõi, 15.7 GB RAM, available khoảng 3.4 GB (khoảng 11.9 GB do tiến trình khác giữ), swap đầy. Không có `node --test` nào khác chạy trước mỗi lần. Chạy bằng `env -u CLAUDE_CODE_SESSION_ID npm test`, không pipe.

## Full suite

| Lần | Điều kiện | tests | pass | fail | thời gian | File bị per-file timeout kill |
|---|---|---|---|---|---|---|
| 1 | rảnh | 6603 | 6529 | 1 | 5:59 (duration 349s) | không |
| 2 | 2 vòng CPU `node` chạy song song | 6603 | 6530 | 0 | 5:25 (duration 320s) | không |

Lần 1 đỏ một test: `test/runner/herdr-reconciliation.test.mjs:1067` ("live Herdr gateway executes confined launch end-to-end"), `confinement-mismatch` trên pane. Test này thật sự điều khiển herdr gateway sống trên máy. Chạy riêng nó pass trên cả base (28.9s) lẫn nhánh sửa (26.4s), và lần 2 trên nhánh sửa pass. Không nằm trong file nào nhánh này chạm; ghi nhận là chập chờn riêng của test dùng herdr sống khi cạnh tranh trong full suite, ngoài phạm vi plan này, chưa điều tra nguyên nhân.

## Chạy lặp 3 file dưới tải

Xem `repro.md`: 5/5 pass trước và sau; tải nhẹ không tái hiện lỗi trên base.

## Chưa chứng minh được

- Không tái hiện số liệu "đỏ/treo trước sửa" (xem `repro.md`).
- Chưa thử tải nặng kèm thiếu RAM, vì bị cấm cấp phát RAM.
