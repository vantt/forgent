# Prompt: làm xanh `npm test` trên main — phân loại rồi mới sửa

Dán phần dưới dòng `---` cho agent thực thi. Working directory: `/home/vantt/projects/forgentX`.

**Vì sao cần:** track request-to-run (P1 trở đi) lấy "full `npm test` xanh" làm bằng chứng done. Suite đỏ sẵn trên main thì không phân biệt được lỗi mới do P1 gây ra với lỗi cũ. Việc này tách khỏi việc sửa test rò fixture (đã đóng: `c7ed77120`, `751fbabb0`); không gộp ngược vào đó.

---

## Nhiệm vụ

Đưa `npm test` trên `main` về xanh **hoặc** về một danh sách đỏ đã biết, mỗi dòng có nguyên nhân và chủ. **Phân loại trước, sửa sau.**

## Đã xong, đừng làm lại

- Data Dictionary #7 thiếu 3 check Observe: đã thêm vào `docs/specs/distribution.md` (`97a9052bb`). `test/setup/registrations.test.mjs` và `checks.test.mjs` xanh (171/171).

## Cách làm

1. **Worktree riêng** từ `main` (`git worktree add ../forgentX-test-baseline -b fix/test-baseline main`). Symlink `node_modules` **và** `target` ngay sau khi tạo worktree.
2. Chạy mọi lệnh test với `env -u CLAUDE_CODE_SESSION_ID` (biến này làm hỏng các test dùng seq khi chạy trong session agent). Không dùng `| tail` khi cần mã thoát thật.
3. Chạy full suite một lần để lấy danh sách fail. Sau đó **chạy lại từng file fail riêng lẻ**, để tách lỗi do test chạy chung làm bẩn nhau (pass khi chạy riêng, fail khi chạy chung) khỏi lỗi thật.
4. Xếp mỗi file fail vào một nhóm. Các nhóm dự kiến (theo feedback lần trước, cần tự kiểm lại):
   - CLI registry/help contracts
   - Assignment/RunResult v2↔v3 contracts
   - runner-loop/friction contracts
   - release-tree / host-resolution (phụ thuộc môi trường máy)
   - đường dẫn fixture plan/skill-wrapper đã cũ
   - decision-citation drift
5. Gán mỗi file một **nguyên nhân** và một **cách xử lý**, theo bảng dưới:

| Nguyên nhân | Được tự sửa? | Cách sửa |
|---|---|---|
| Danh sách exact (registry/spec) lệch với cái đã đăng ký | Có | Cập nhật bên kỳ vọng (test hoặc spec) cho khớp đăng ký thật, trong cùng change |
| Fixture mất vì plan/skill đã retire | Có | Cập nhật test trỏ fixture còn sống, hoặc tạo fixture tối thiểu trong test (`mkdtemp`); không trỏ vào `plans/` thật đang thay đổi |
| Test chạy chung làm bẩn nhau | Có | Cô lập setup của test (`mkdtemp`, `--dir`/`cwd` tường minh, dọn dẹp) |
| Test giả định máy hiện tại (đường dẫn host, binary release) | Có | Làm test hermetic: tự dựng cây release giả hoặc skip có điều kiện, kèm lý do; không hardcode máy này |
| Hành vi CLI/RunResult khác với test (contract drift) | **Không** | Ghi vào báo cáo với `file:line` cả hai phía, đề xuất bên nào đúng; **không đổi implementation, không đổi test** |
| Thuộc việc đang dở của nhánh khác (vd plan tier T) | **Không** | Ghi tên chủ (nhánh/plan) |

6. Sửa theo từng nhóm. Sau mỗi nhóm: chạy lại các file của nhóm đó, rồi full suite, rồi commit (stage đúng path, conventional commit, không nhắc AI/plan ID).
7. Merge vào `main` (`git merge --no-ff` từ worktree của nhánh main, **không checkout nhánh trong checkout chính**). Merge sớm từng nhóm khi xanh, để giảm xung đột với plan T.

## Ràng buộc

- **Không đụng** `src/runner/dispatch/**`, `src/runner/execution/**`, cùng các file test dispatch mà plan T đang sửa (`git diff --name-only main plan/260930-tier-rigor-consolidation` và worktree `~/projects/forgentX-tier-rigor-p02`). Fail nằm trong vùng đó thì ghi "chủ: plan T", không sửa.
- Không chạy `fgos submit/pick/move/approve`.
- Không xoá test để làm xanh. Muốn skip thì phải có lý do ghi trong code và trong báo cáo.

## Bàn giao

Viết `plans/reports/test-baseline-261001-<HHMM>-main-red-suite.md`:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Summary: 1–2 câu
Trước/sau: tổng test, pass, fail (full suite, env unset)
Bảng: file test → nhóm → nguyên nhân → xử lý (đã sửa + commit | contract drift chờ quyết | chủ khác)
Contract drift cần owner quyết: mỗi dòng có file:line hai phía + đề xuất
Commits trên main
```
