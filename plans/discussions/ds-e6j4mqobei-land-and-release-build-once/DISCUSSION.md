# Land và release: build một lần, không build lại trên mọi máy

discussion: open
source: [p-vyzy7isj3z, p-7ww4jlg745]
domain: coding (hạ tầng build, land, release của chính fgOS)
authority: chưa tra; sẽ chạy `fgos authority locate` khi bàn tới component cụ thể (git land door, distribution, run-tests)

## 1. Trạng thái hiện tại

Vòng 1 (2026-11-24): đã đo hiện trạng trên design-lap, chia vấn đề thành 7 mảng, liệt kê các hướng. Owner định nghĩa
"rẻ" theo hai chiều: build không quá lâu, và không ăn đĩa nhanh. Owner đồng ý thước đo (hàng T của §3). Đang làm: so
từng hướng ở §6 với thước đo, có số đo hoặc mã nguồn làm chứng.

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
| V4 | CI đỏ | 40 lần chạy `ci.yml` gần nhất: 0 thành công (22 failure, 18 cancelled); mỗi lần 24-56 phút; lần đỏ gần nhất: test shard 1, 2, 5, `cargo (workspace)`, herdr-dashboard, audit locked dependencies | Lỗi nào thật, lỗi nào do môi trường CI; ai sở hữu |
| V5 | Land hỏng ở bước cuối vì git-timeout | Ba lần land 2026-11-24 hỏng ở `fast-forward main: git-timeout` khi load 10-15; hạn 30 s cố định (p-7ww4jlg745) | Bước nào thật sự chờ |
| V7 | Đĩa | Mỗi lần land ghi khoảng 4,6 GB vào `target/` của candidate rồi xoá (đo trên candidate đang chạy); ổ của design-lap là QLC, ghi lớn làm bão hoà IO. Phần nằm lại: `target/` của main 41 GB, mỗi worktree 3-8 GB, sccache 8,1 GB (chạm trần 8 GiB), dev-host 623 MB; còn trống 57 GB | Bao nhiêu GB một máy có thể dành cho cache build mà không phải dọn tay |
| V6 | Công cụ phụ cũng build cả workspace | `plan-contract-check.mjs` trong một worktree mới biên dịch cả workspace (4,1 GB) chỉ để kiểm một file plan | Còn script nào như vậy |

## 4. Quyết định đã chốt

| D-ID | Quyết định | Ngày |
|---|---|---|

(chưa có)

## 5. Q&A log

- 2026-11-24 09:02, owner: đồng ý tạo item, "build có vẻ bắt đầu tốn kém và nặng rồi, việc này giúp đẩy nhanh, nhưng
  cần phải brainstorm kỹ".
- 2026-11-24 09:10, lead: vòng 1, số đo ở §3; các hướng ở §6 (nháp).
- 2026-11-24 09:12, lead hỏi thước đo "đủ rẻ" (đề xuất: land không đổi Rust < 2 phút, có đổi Rust < 5 phút, không hỏng vì cache hay timeout khi load < 8, không máy nào build release).
- 2026-11-24 09:14, owner: "rẻ là không bị build quá lâu và không làm tốn đĩa nhanh". Lead đo thêm đĩa (V7).
- 2026-11-24 09:20, lead đề xuất con số cho hai chiều (hàng T của §3).
- 2026-11-24 09:33, owner: "ok".
- 2026-11-24 09:40, lead: đo thêm V1 (bước sinh lại biên dịch 6-7 phút; mỗi lần thử lại làm lại tất cả). Giao một agent đọc nguyên nhân CI đỏ (V4).

## 6. Thiết kế đã chốt {#design}

Chưa chốt. Các hướng đang có trên bàn, để so ở vòng sau:

- **H1. Target cố định theo máy cho cổng land.** Cổng land dùng một `CARGO_TARGET_DIR` cố định của máy thay cho
  `target/` mới mỗi candidate. Crate phụ thuộc dùng lại; crate workspace build lại vì cargo băm theo đường dẫn. Rủi ro:
  hai lần land cùng máy ghi đè binary của nhau trong `target/release/`; `run-tests.mjs` đã có bước stage bằng rename
  nguyên tử, cần kiểm nó có đủ không.
- **H2. Cache theo nội dung cho addon và host.** Băm đầu vào (Cargo.lock và nguồn các crate liên quan); candidate có
  cùng băm với release đang chạy thì dùng luôn binary đó, không build. Lần land chỉ đổi docs hay Node không biên dịch gì.
- **H3. Sửa hoặc bỏ sccache.** Tìm nguyên nhân treo; hoặc thay bằng H1 (dùng lại crate phụ thuộc mà không cần server
  dùng chung).
- **H4. CI là nơi build duy nhất.** Làm CI xanh, gắn tag tự động (mỗi land có Rust, hoặc gom theo đợt), máy chạy
  `fgctl upgrade --from <tag>`. Cần CI xanh trước; mỗi lần CI chạy 24-56 phút nên thời gian từ land tới release dài hơn.
- **H5. Cache dùng chung giữa các máy và CI** (sccache với kho từ xa, hoặc cache của GitHub Actions). Thêm hạ tầng và bí
  mật; chỉ đáng khi H1/H2 chưa đủ.
- **H6. Land không chờ git dưới tải** (p-7ww4jlg745): chẩn đoán trước, rồi mới sửa.

## 7. Danh mục hạng mục / task {#tasks}

Chưa tách.
