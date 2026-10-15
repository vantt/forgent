# Added in candidate: Runner Open Gaps


```txt
Document type: Specification
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve frozen-map runner content for independent conservation review
Design status: Candidate
Implementation: Carriage only; implementation truth not certified
Provenance: docs/specs/runner.md at 63fa6f15266f45c881f610235e0be8d61ff07120; blob ddfa78cc7183cf1f7db8ee64d2339653a0aa0023
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing runner carriage, placement and conservation
Do not use this for: Canonical behavior, source retirement or current truth proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/runner.md
Supersedes: None; legacy authority retained
Superseded by: None
```

> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F3: trunk detection already exists (src/runner/merge.mjs:38-40; src/runner/merge.mjs:267; src/runner/worktree.mjs:255-290); R9-5: remove decisions-placement boilerplate from non-decision carrier.

## Open Gaps

- Cầu dao (breaker, Data Dictionary #5) trơ trong `--once`: `maxRetries` mặc định 2 luôn nhỏ hơn trần cầu dao 3, nên một việc không bao giờ tự kéo cầu dao trong một lượt `--once` đơn — chỉ đỗ qua đường trần thử-lại thường. Cần một cầu dao dùng chung xuyên lượt (hoặc hạ trần) mới làm cầu dao có tác dụng thật ở chế độ này; ghi nhận là biết-nhưng-chưa-sửa (review-debt-runner-2, không đổi hành vi).
- Nhiều lượt `check` chạy đồng thời trên cùng một kho chưa có cơ chế khóa/chống-tranh-chấp cho dòng lịch sử xu hướng (khác với nhật ký sự kiện chính, vốn đã có CAS) — cùng tinh thần ngưỡng-chưa-tới của RUL10 (diễn tập không chạm log thật) (work-state), mở lại khi ghi đồng thời thành tải chính.
- Tên nhánh trục của cổng duyệt được phát hiện bằng `detectTrunk(repoRoot)` (origin/HEAD, rồi local `main`/`master`); không còn hardcode literal `"main"`.
- Chưa có escalation tự động khi một việc trải qua NHIỀU vòng người liên tiếp mà vẫn chưa hội tụ (vd item nổi lên "cần bàn sâu" sau N vòng người) — RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc) chỉ mở lại ngân sách theo can thiệp người, không giới hạn tổng số vòng người; escalation dạng đó cần intent-scoring và deferred có chủ đích (human-rounds, xem `docs/backlog.md` STR8).
- Nhiều tiến trình/máy ghi trạng thái thật cùng lúc (đa-writer, đa-máy) chưa được dựng — quyền-sở-hữu-gốc hôm nay chỉ sống trong bộ nhớ của MỘT lượt chạy, không bền qua tiến trình/máy khác; một lượt chạy thứ hai trên máy khác không biết gì về chủ của lượt thứ nhất (deferred, backlog STR27).
- Nạp mẻ mới hôm nay là chờ-mẻ-trước-xong-rồi-đọc-lại (poll khi một việc trong mẻ hoàn tất), không phải phản ứng tức thời theo tín hiệu bên ngoài; và vòng chạy vẫn kết thúc khi hết việc (không sống liên tục chờ việc mới) — cả hai là ranh giới có chủ đích với một cơ chế phản ứng-theo-tín-hiệu-liên-tục rộng hơn (deferred, backlog STR8).
- Chưa có ưu tiên nhập khi nhiều gốc cùng cạnh tranh cây chính — một gốc thua một lần đồng bộ-lại rồi thua lại lần sau (do gốc khác vào trước liên tục) không có cơ chế được ưu tiên hơn ở lần thử kế tiếp (deferred, backlog STR7).
- Khi đồng bộ-lại gặp xung đột thật, không có agent nào tự giải xung đột rồi đưa người duyệt lại — người luôn phải tự đọc và sửa tay (deferred lên một tầng cao hơn, backlog STR19).
- Chưa dự đoán trước những việc con nào của cùng một gốc khả năng chạm cùng chỗ để xếp chúng chạy nối tiếp thay vì song song — hai con cùng gốc chạm cùng chỗ vẫn ĐÚNG (một con catch-up/làm-lại), chỉ không phải TỐI ƯU (giảm việc-song-song-phí là một cải tiến hiệu năng hoãn lại, không phải một lưới đúng-sai, deferred, backlog STR16).
- Một cây nhiều hơn hai tầng (gốc-của-gốc, cháu) hôm nay chưa từng được tạo ra bởi hệ thống (phán chia-việc chỉ sinh con ở đúng một tầng dưới gốc) — cơ chế cây nhánh tích hợp phân giải MỌI con về nhánh của ĐỈNH cây (không phải nhánh của cha trực tiếp), điều này chỉ tương đương với "con nhập vào nhánh cha" khi cây đúng hai tầng; một cây sâu hơn hai tầng, nếu tương lai sinh ra được, sẽ cần xác nhận lại điều này còn đúng hay không — chưa kiểm chứng vì chưa có dữ liệu thật để thử.
- Cổng duyệt PR nội bộ do người gọi tay không có khóa chống hai lần gọi cùng lúc trên cùng một gốc (vd người duyệt hai việc con cùng gốc gần như đồng thời, hoặc người duyệt trong khi chính vòng tự hành đang dispatch gốc đó) — rủi ro thấp dưới một người vận hành, một cửa ghi tuần tự chỉ bảo vệ phần ghi trạng thái chứ không khóa riêng thao tác nhập của cổng duyệt tay; chưa xảy ra thật, ghi nhận như một giả định chưa kiểm.
- Danh sách module của phép thử Iron Law (Data Dictionary #10) vẫn là danh sách MINH HỌA, không đóng khung — có thể còn module năng-lực-liên-quan khác (vd các module domain/kernel khác trong `src/state/`, `src/runner/`) chưa được liệt kê mà lẽ ra đủ tư cách theo phép thử năng lực gốc; mở lại khi vận hành thật (wiring đã live, RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)) cho thấy một trường hợp bỏ sót thật.
- Merge qua GitHub (`approve --github`) không dọn nhánh sau khi xong — nhánh cục bộ `fgw/<id>` VÀ bản đã đẩy lên remote gốc đều còn nguyên, khác với merge cục bộ (tự dọn cả hai, xem RUL21 (merge sạch → done tự động; gãy → hủy sạch merge dở + blocked có lý do)) — không có cơ chế dọn nhánh đã merge phía-server hôm nay; chấp nhận biết-nhưng-chưa-sửa cho slice này (github-adapter S3).
- `approve --github` chưa phân biệt được lý do gãy "PR chưa đủ lượt duyệt trên GitHub" (một trạng thái BÌNH THƯỜNG, đang chờ người, không phải lỗi) khỏi mọi lý do gãy KHÁC (xác thực, mạng, xung đột thật) — hôm nay cả hai đều đi cùng một đường `blocked`+friction; tách riêng cần bằng chứng thật từ một PR bị chặn duyệt thật (chưa có), không đoán (github-adapter S3, cùng kỷ luật "không đoán giá trị enum chưa chứng minh" như S2's quyết định bỏ outcome `conflict` riêng).
- Một đề xuất CON (có việc cha) gọi `review --github` chỉ đẩy nhánh của CHÍNH NÓ lên remote gốc, không đẩy nhánh của GỐC nó — nên `gh pr create` thật trên GitHub sẽ gãy vì nhánh đích (`base`) không tồn tại trên remote cho một đề xuất con; vận chuyển GitHub hôm nay chỉ dùng được thật cho đề xuất gốc/độc lập, ngữ nghĩa GitHub cho con cần một slice riêng (github-adapter S3, giới hạn đã biết trước khi build).
- Lời gọi phán-đoán bên dưới engine (quyết đủ-rõ/chưa-đủ-rõ) có thể trả về văn bản không máy-đọc-được thay vì phán quyết đúng khuôn khi được gọi TỪ BÊN TRONG một phiên trợ lý khác đang chạy (lồng phiên) — engine fail-safe đúng thiết kế (đậu cổng chờ-người, không bao giờ coi không chắc là pass). **Nguyên nhân gốc xác nhận 2026-07-22 (`claude -p` thật, không đoán):** không phải lỗi định dạng — model con ĐÔI KHI từ chối một prompt-chỉ-đòi-JSON vì đọc như prompt-injection (exit code vẫn 0), tính chất XÁC SUẤT chứ không tất định. Thử thêm một câu mào đầu "hợp thức hoá" lời gọi — PHẢN TÁC DỤNG, model đọc chính khung đó như dấu hiệu injection rõ hơn (bằng chứng thật, gỡ bỏ). Giải pháp còn lại: tăng số lần thử lại từ 1 lên 2 (3 lượt tổng) — giảm xác suất gặp phải, KHÔNG loại trừ hoàn toàn (`docs/backlog.md` STR68, đóng lại 2026-07-22).

- Khóa hoạt động cây chính (STR65) suy danh tính từ một tiến trình tổ tiên gần khi
  không có biến môi trường phiên trợ lý — suy đoán tốt-nhất cho terminal người gõ
  tay, KHÔNG tuyệt đối: hai terminal người khác nhau chia sẻ cùng một tiến trình cha
  đủ gần (vd cùng phiên tmux/sshd) vẫn có thể đọc ra cùng một danh tính và không bị
  chặn dù đang thực sự đồng thời hoạt động. Cả 3 sự cố STR65 có SHA cụ thể trước đây
  đều là phiên trợ lý (có biến môi trường riêng, không rơi vào giới hạn này) — giới
  hạn chỉ áp dụng cho trường hợp chưa quan sát được thật (terminal-đối-terminal).
  Vá trọn cần một danh tính phiên bền hơn cho terminal tay gõ (deferred, backlog
  STR84 nhắm khác lớp — enforcement phía bee-core — không trực tiếp vá gap này).

- ~~**`return` không nhận ra hoàn tất của một `fgw/<id>` sinh ra từ lượt `take`/`pick` ĐẦU TIÊN (không phải tái claim một item `blocked`).**~~ RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)/RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai)'s discriminator nguồn-nhánh (`branchHeadAtTake`) trước đây chỉ được ghi trên cạnh `blocked→doing` (tái claim một đề xuất đã đỗ) — một lượt `pick` đầu tiên trên `todo→doing` chỉ ghi `headAtTake` (main-based), dù `pick` cũng dựng CÙNG worktree + nhánh `fgw/<id>` như đường tái claim. Vì `branchHeadAtTake` vắng mặt, `return` không rẽ vào nhánh nguồn-nhánh (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)) — nó chỉ đo `changedFilesSince` trên checkout CHÍNH, nơi không có gì đổi (việc thật nằm trên `fgw/<id>`) → từ chối "không có thay đổi", việc kẹt ở `doing`/`awaiting-human` dù verify xanh + đã commit thật trên nhánh riêng. Tái hiện thật (không suy đoán): `/fgOS:pick` một item `todo`, verify xanh 23/23, commit thật trên `fgw/tsk-57u` — `return` vẫn từ chối (docs/history/mvp2-scope-test-infra/reports/case-1-interactive.md, forgent workshop). **Đóng 2026-07-28:** `pick`'s nhánh claim ĐẦU TIÊN (`todo→doing`) nay ghi `branchHeadAtTake` (giá trị = HEAD hiện tại của repo lúc claim — đúng bằng điểm gốc `createWorktree` fork nhánh mới ra), cùng khuôn với nhánh tái-claim `blocked→doing` — không còn ghi `headAtTake` cho bất kỳ claim nào của `pick`; `take` (verb thuần, không dựng worktree) không đổi, vẫn dùng `headAtTake` đúng như trước.
- **`fgos-runner` không có cách tự-scope vào một thư mục/dự án con — luôn resolve repo root qua `git rev-parse --show-toplevel` từ `cwd`, không cờ/biến môi trường ghi đè.** `parseArgs` chỉ nhận `--once`/`--watch`/`--poll-ms`/`--dry-run` (`bin/fgos-runner.mjs`; `--config` đã bỏ, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)). Với một dự án con KHÔNG tự có `.git` riêng (vd một fixture/testbed sống bên trong một repo lớn hơn), `git rev-parse --show-toplevel` luôn thoát ra repo cha — runner claim/dispatch trên `.fgos/` của repo CHA, không phải của dự án con, dù các verb `fgos.mjs` khác (`submit`/`pick`/...) đã cô lập đúng qua `process.cwd()` trực tiếp. Tái hiện thật: `git -C <thư-mục-con> rev-parse --show-toplevel` thoát ra repo cha; không có config nào ở thư mục con mà runner tự nhận (docs/history/mvp2-scope-test-infra/reports/case-2-headless.md, forgent workshop). Việc: thêm một cờ/biến môi trường ghi đè root (vd `--root`/`FGOS_ROOT`) song song với cách các verb `fgos.mjs` đã cô lập, giữ `git rev-parse --show-toplevel` làm mặc định khi vắng cờ (`docs/backlog.md` PBI p-2a39f940).
