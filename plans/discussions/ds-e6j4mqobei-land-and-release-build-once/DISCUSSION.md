---
id: ds-e6j4mqobei
title: "Land and release: build once, not again on every machine"
status: open
source:
  - p-vyzy7isj3z
  - p-7ww4jlg745
created: 2026-11-24
---

# Land và release: build một lần, không build lại trên mọi máy

discussion: open
source: [p-vyzy7isj3z, p-7ww4jlg745]
domain: coding (hạ tầng build, land, release của chính fgOS)
authority: chưa tra; sẽ chạy `fgos authority locate` khi bàn tới component cụ thể (git land door, distribution, run-tests)

## 1. Trạng thái hiện tại

Vòng 1 (2026-11-24): đã đo hiện trạng trên design-lap, chia vấn đề thành 7 mảng, liệt kê các hướng. Owner định nghĩa
"rẻ" theo hai chiều: build không quá lâu, và không ăn đĩa nhanh. Owner đồng ý thước đo (hàng T của §3). Vòng 2: đã
so các hướng với thước đo (§6). Vòng 3 (14:00): owner chọn sửa cổng land trước; D1 và D2 đã chốt, hạng mục ở §7.
Bước kế tiếp: giao planner viết plan cho A rồi B + G.

## 2. Mục tiêu & đề bài

Build đã thành phần chậm và nặng nhất của việc ship (owner, 2026-11-24). Mỗi lần land biên dịch lại từ đầu trong một
candidate worktree mới; cache biên dịch dùng chung của máy (sccache) vừa làm treo hai build cùng lúc; sau mỗi lần land
release lại được build tại máy, và mỗi máy khác muốn chạy main mới cũng build lại đúng chừng đó; CI đáng lẽ là nơi build
một lần thì đang đỏ toàn bộ. Đề bài: một lần land trên máy nào cũng rẻ và không hỏng giữa chừng, và một máy chuyển sang
main mới bằng cách tải release đã build sẵn chứ không build. Giới hạn: không đổi công cụ của người khác (ak, ck, rtk),
không đổi cấu hình máy dùng chung khi chưa có đồng ý; fgOS phục vụ cả project khác (mission 1/2), nên lời giải không được
chỉ tiện cho repo này.

## 3. Vấn đề rõ / chưa rõ

| # | Mảng | Đã đo (2026-11-24, design-lap) | Chưa rõ |
|---|---|---|---|
| T | Thước đo (owner đồng ý 2026-11-24 09:33; chờ thêm một vòng mới đánh D-ID) | Thời gian: land không đổi Rust < 2 phút, có đổi Rust < 5 phút. Ghi đĩa mỗi lần land: < 0,5 GB không đổi Rust, < 1,5 GB có đổi (nay 4,6 GB). Cache build cả máy tối đa khoảng 25 GB, tự dọn, không bao giờ dọn tay (nay khoảng 60 GB). Không máy nào build release; chuyển main mới bằng tải về. Không lần land nào hỏng vì cache hay timeout khi load < 8 | — |
| V1 | Cổng land biên dịch lại từ đầu | Candidate là worktree mới dưới `.fgos/runtime/git-candidates/`; `scripts/run-tests.mjs` build addon vào `target/` của candidate (`CARGO_TARGET_DIR` mặc định `target`). Log land: 260-290 crate được biên dịch mỗi lần có build; ngay bước sinh lại census đã biên dịch `proc-macro2`, `serde`... 9 lần land gần nhất: 38 s đến 568 s (lần treo 1.589 s). Ổ đĩa: target của mỗi worktree 3-8 GB, main 41 GB, còn trống 57 GB | Log không ghi thời gian từng cổng. Đo thêm 09:35: riêng bước sinh lại (`export-command-selectors` rồi `git-one-door-scan --write-census`) đã có hai lần biên dịch dev, 1-1,5 phút và 4,8-5,7 phút, trước mọi cổng test (log land 888955 và 2463623). Mỗi lần thử lại khi main nhích lên "bắt đầu lại từ một lần fetch mới": candidate mới, sinh lại, chạy lại toàn bộ cổng (`packages/supervision/rust/src/land.rs`, `land_branch`/`branch_attempt`, `MAX_RETRIES = 3`), nên khi main đông, một lần land có thể biên dịch lại tới 4 lần |
| V2 | sccache dùng chung treo | `~/.cargo/config.toml` đặt `rustc-wrapper` cho cả máy (cache 8 GiB tại `~/.cache/sccache`, chỉ cache crate phụ thuộc). Hai build treo cùng lúc 08:15: 754 yêu cầu, 509 thực thi, 0 trúng; chạy được khi để trống wrapper | Nguyên nhân treo (server, khoá, TMPDIR); chưa ai chứng minh |
| V3 | Release build tại máy sau mỗi land | forgentx-38 build `cargo build --release --workspace` sau mỗi land rồi kích hoạt; máy khác muốn main mới cũng phải build. `release.yml` (theo tag) build trên CI và publish kèm `SHA256SUMS`; `fgctl upgrade` tải và kiểm checksum. Release gắn tag gần nhất `v0.2.0-rc.12` (2026-11-18) | Thời gian một lần build release cục bộ (cần forgentx-38 cho số) |
| V4 | CI đỏ | `ci.yml` xanh lần cuối 2026-11-19 12:53 (run 44468232376); `release-assets-check.yml` 2026-11-23 06:56. Nguyên nhân (agent đọc log 2026-11-24, không có lỗi nào là flaky): (1) job audit của `release-assets.yml` thiếu bước `pkm-build-env`, không tải được pkm riêng tư (lỗi của plan locate, sửa ở `58275b870`, chưa land); (2) clippy `-D warnings` gặp dead code `src/wiring/migrate.rs` qua test `migrate_portfolio`; (3) `herdr-dashboard/Cargo.lock` cũ; (4) ba test Node lệch hành vi: `guide-schema`, `terminal-groups`, `domain-registry-compiled` (thiếu `src/native/door.mjs` trong bộ file chép); (5) `mailbox-live-confined` hết hạn 5 s trên runner chậm; (6) Windows focused tests chạm trần 45 phút. Run bị cancel là run xếp hàng bị push mới thay (concurrency group), không phải lỗi. Đường găng: build asset Windows 22-34 phút; mỗi shard test build lại workspace release | Ai sửa (2)-(6): thuộc khu khác, cần chủ của từng khu |
| V5 | Land hỏng ở bước cuối vì git-timeout | Ba lần land 2026-11-24 hỏng ở `fast-forward main: git-timeout` khi load 10-15; hạn 30 s cố định (p-7ww4jlg745) | Bước nào thật sự chờ |
| V7 | Đĩa | Mỗi lần land ghi khoảng 4,6 GB vào `target/` của candidate rồi xoá (đo trên candidate đang chạy); ổ của design-lap là QLC, ghi lớn làm bão hoà IO. Phần nằm lại: `target/` của main 41 GB, mỗi worktree 3-8 GB, sccache 8,1 GB (chạm trần 8 GiB), dev-host 623 MB; còn trống 57 GB | Bao nhiêu GB một máy có thể dành cho cache build mà không phải dọn tay |
| V6 | Công cụ phụ cũng build cả workspace | `plan-contract-check.mjs` trong một worktree mới biên dịch cả workspace (4,1 GB) chỉ để kiểm một file plan | Còn script nào như vậy |

## 4. Quyết định đã chốt

| D-ID | Quyết định | Ngày |
|---|---|---|
| D1 | Thước đo "rẻ" là hàng T của §3: land không đổi Rust < 2 phút và ghi < 0,5 GB; có đổi Rust < 5 phút và < 1,5 GB; cache build cả máy tối đa khoảng 25 GB, tự dọn; không máy nào build release; không lần land nào hỏng vì cache hay timeout khi load < 8 (owner đồng ý 09:33, giữ qua vòng 2 và vòng 3) | 2026-11-24 |
| D2 | Thứ tự: sửa cổng land trước. A (ghi thời gian từng bước), rồi B cùng G (không biên dịch khi đầu vào Rust không đổi; thử lại không làm lại mọi thứ, dùng chung một băm đầu vào), rồi C và D (một target cố định theo máy; cổng land không dùng sccache). E (CI build release) đi sau, các lỗi CI do chủ từng khu sửa; F theo p-7ww4jlg745 (owner chọn 14:00 sau khi lần land 10:55 hỏng `land-retries-exhausted`) | 2026-11-24 |

## 5. Q&A log

- 2026-11-24 09:02, owner: đồng ý tạo item, "build có vẻ bắt đầu tốn kém và nặng rồi, việc này giúp đẩy nhanh, nhưng
  cần phải brainstorm kỹ".
- 2026-11-24 09:10, lead: vòng 1, số đo ở §3; các hướng ở §6 (nháp).
- 2026-11-24 09:12, lead hỏi thước đo "đủ rẻ" (đề xuất: land không đổi Rust < 2 phút, có đổi Rust < 5 phút, không hỏng vì cache hay timeout khi load < 8, không máy nào build release).
- 2026-11-24 09:14, owner: "rẻ là không bị build quá lâu và không làm tốn đĩa nhanh". Lead đo thêm đĩa (V7).
- 2026-11-24 09:20, lead đề xuất con số cho hai chiều (hàng T của §3).
- 2026-11-24 09:33, owner: "ok".
- 2026-11-24 09:40, lead: đo thêm V1 (bước sinh lại biên dịch 6-7 phút; mỗi lần thử lại làm lại tất cả). Giao một agent đọc nguyên nhân CI đỏ (V4).
- 2026-11-24 09:50, lead: kết quả CI (V4); sửa lỗi của chính plan locate trong job audit (`58275b870`); vòng 2 so hướng với thước đo (§6).
- 2026-11-24 10:55, lead: số đo N2 thực tế. Lần land phase 6 của plan locate (load 3,3, không sccache) hỏng
  `land-retries-exhausted`: "the remote moved on every one of 4 attempts". origin/main nhận 50 commit trong 2 giờ
  trước đó (khoảng 2,4 phút một commit), ngắn hơn thời gian một lần thử (sinh lại 6-7 phút cộng cổng), nên khi main
  đông một nhánh có đổi Rust gần như không thể land. Đây là hỏng vì thiết kế thử lại, không phải vì cache hay timeout.
- 2026-11-24 11:54, lead: lần land kế tiếp thành công sau 35 phút (`efb1f5af3`); release `648d59dc` của forgentx-38
  gặp git-timeout ở bước distribution khi load 13, thử lại thì chạy được.
- 2026-11-24 14:00, owner: chọn thứ tự (1), sửa cổng land trước (D2). Thước đo giữ nguyên qua ba vòng (D1).

## 6. Thiết kế đã chốt {#design}

Chưa chốt. So từng hướng với thước đo (hàng T của §3), vòng 2, 2026-11-24 09:50.

Nguyên nhân gốc, xếp theo cỡ:

- **N1. Bước sinh lại biên dịch hai công cụ Rust từ đầu** trong mỗi candidate: 6-7 phút và khoảng 4,6 GB mỗi lần,
  trước mọi cổng test.
- **N2. Mỗi lần thử lại làm lại tất cả**: khi main đông, một lần land có thể biên dịch tới 4 lần.
- **N3. Target mới cho mỗi candidate**: không dùng lại được crate phụ thuộc, trừ khi sccache trúng.
- **N4. sccache dùng chung không tin được**: treo hai build một lúc, cache 8 GB nằm trong ngân sách 25 GB.
- **N5. Release build tại máy**; CI, nơi đáng ra build một lần, đỏ vì 6 nguyên nhân ở V4.
- **N6. Chưa biết thời gian từng cổng**: land không biên dịch gì vẫn mất 3-9 phút (log không ghi thời gian).

| Hướng | Giải | Đạt thước đo nào | Giá và rủi ro |
|---|---|---|---|
| **A. Đo từng bước của land** (log ghi thời gian mỗi lệnh sinh lại và mỗi cổng) | N6 | điều kiện để biết đã đạt chưa | nhỏ; chỉ ghi thêm |
| **B. Land không biên dịch khi không đổi Rust** (H2): công cụ sinh lại và cổng dùng addon và host của release đang kích hoạt khi băm đầu vào Rust của candidate bằng băm của release đó | N1, N3 cho land không đổi Rust | < 2 phút, < 0,5 GB cho phần lớn lần land (docs, plan, Node) | trung bình; cần một băm đầu vào tin được; sai băm là chạy công cụ cũ trên mã mới, nên băm phải phủ mọi crate addon và host dùng |
| **C. Một target cố định theo máy cho mọi candidate** (H1) | N2, N3 cho land có đổi Rust | < 5 phút, < 1,5 GB (chỉ crate workspace bị đổi được biên dịch); target nằm lại khoảng 5-8 GB | trung bình; hai lần land trên một máy chờ nhau qua khoá của cargo; binary phải được stage bằng rename như `run-tests.mjs` đã làm; dọn theo ngân sách |
| **D. Cổng land không dùng sccache** sau khi có C | N4 cho land | không hỏng vì cache | nhỏ; cấu hình máy dùng chung không đổi, chỉ đặt `RUSTC_WRAPPER=` trong môi trường cổng |
| **E. CI build release, máy tải về** (H4) | N5 | không máy nào build release | lớn và nhiều chủ: 5 nguyên nhân CI đỏ thuộc khu khác; Windows chạm trần 45 phút; gắn tag tự động; luồng release của forgentx-38 đổi sang `fgctl upgrade` |
| **F. git-timeout dưới tải** (H6, p-7ww4jlg745) | V5 | không hỏng vì timeout | chẩn đoán trước |
| **G. Thử lại không làm lại mọi thứ** (thêm 10:55, sau lần hỏng `land-retries-exhausted`): khi main nhích lên trong lúc chạy cổng, lần thử sau chỉ chạy lại phần cổng mà commit mới của main có thể ảnh hưởng (ví dụ main mới không đổi đầu vào Rust thì không sinh lại, không biên dịch lại) | N2 | land được cả khi main nhận một commit mỗi 2-3 phút | trung bình; cần quy tắc "commit mới chạm gì thì cổng nào chạy lại" đủ chặt để không bỏ sót; dùng chung băm đầu vào với B |
| H5. Cache dùng chung từ xa | — | — | chưa cần nếu B và C đủ |

Hướng lead đề xuất (chưa chốt): A trước (nhỏ, để có số thật), rồi B và C cho land, D đi kèm C; E chạy song song
nhưng do chủ các khu sửa CI, lead chỉ sửa phần của plan locate (đã làm (1)); F theo p-7ww4jlg745.
## 7. Danh mục hạng mục / task {#tasks}

Thứ tự theo D2. Chưa có D-ID cho cách làm chi tiết của B, C và G; phần đó do planner đề xuất rồi đưa lại owner.

1. **A. Đo từng bước của land** {#task-land-step-timing}: log land ghi thời gian mỗi lệnh sinh lại và mỗi cổng.
   Nhỏ, làm trước để có số thật cho B, G và C.
2. **B + G. Không biên dịch lại khi không cần** {#task-land-skip-rebuild}: một băm đầu vào Rust tin được; land
   không đổi Rust dùng addon và host của release đang kích hoạt; lần thử lại chỉ chạy lại phần commit mới của main
   có thể ảnh hưởng.
3. **C + D. Một target theo máy, cổng không dùng sccache** {#task-land-shared-target}: một target cố định cho mọi
   candidate, dọn theo ngân sách của D1; cổng đặt `RUSTC_WRAPPER=` trong môi trường của chính nó.
4. **E. CI build release** {#task-ci-builds-release}: sau 1-3; chủ từng khu sửa lỗi CI ở V4.
