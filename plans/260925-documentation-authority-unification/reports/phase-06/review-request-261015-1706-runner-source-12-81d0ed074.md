# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **4**. Target: `docs/platform/runner/subcomponents/h-2e032393add1/spec.md`; part 1/1. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `3a15a735699c02f74d4f66604e76af20a53a0a94e0387121c9a93a31a27dd84d`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **4/4** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_faf7be822c2140f22e6d5a5882f84595",
      "claim_5c6238369ac0200472ee37488cd0e09a",
      "claim_199e9de005d19f4b2d061005d959b3ed",
      "claim_2bb6c6025afdbad3c1a26762f903bcd2"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_faf7be822c2140f22e6d5a5882f84595

Source digest: b0767ddee6872a0d1e26fae94c0bcca47ba8db1743e511050e4d859694c4fc02

Target digest: b0767ddee6872a0d1e26fae94c0bcca47ba8db1743e511050e4d859694c4fc02

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "open-gaps",
  "sourceLines": [
    1175,
    1175
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-2e032393add1/spec.md",
  "targetAnchor": "open-gaps",
  "targetAncestry": [
    "Added in candidate: Runner Open Gaps"
  ],
  "nativeTargetClaimId": "claim_a1c9aea472d4c3e840e426ec5ca772f7",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters; document exact share below one half",
  "section": "open-gaps",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_faf7be822c2140f22e6d5a5882f84595",
    "sourceUnitDigest": "b0767ddee6872a0d1e26fae94c0bcca47ba8db1743e511050e4d859694c4fc02",
    "targetOwner": "docs/platform/runner/subcomponents/h-2e032393add1/spec.md",
    "targetAnchor": "open-gaps",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. Whole heading docs/specs/runner.md#open-gaps (lines 1175–1175) carried at docs/platform/runner/subcomponents/h-2e032393add1/spec.md#open-gaps. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b0767ddee6872a0d1e26fae94c0bcca47ba8db1743e511050e4d859694c4fc02",
    "targetAncestry": [
      "Added in candidate: Runner Open Gaps"
    ]
  }
}
```

### Full source unit

```text
## Open Gaps

- Cầu dao (breaker, Data Dictionary #5) trơ trong `--once`: `maxRetries` mặc định 2 luôn nhỏ hơn trần cầu dao 3, nên một việc không bao giờ tự kéo cầu dao trong một lượt `--once` đơn — chỉ đỗ qua đường trần thử-lại thường. Cần một cầu dao dùng chung xuyên lượt (hoặc hạ trần) mới làm cầu dao có tác dụng thật ở chế độ này; ghi nhận là biết-nhưng-chưa-sửa (review-debt-runner-2, không đổi hành vi).
- Nhiều lượt `check` chạy đồng thời trên cùng một kho chưa có cơ chế khóa/chống-tranh-chấp cho dòng lịch sử xu hướng (khác với nhật ký sự kiện chính, vốn đã có CAS) — cùng tinh thần ngưỡng-chưa-tới của RUL10 (diễn tập không chạm log thật) (work-state), mở lại khi ghi đồng thời thành tải chính.
- Tên nhánh trục (trunk) của cổng duyệt hiện là literal `"main"` (`merge.mjs`) — một host project dùng tên nhánh trục khác (vd `master`) sẽ gãy `approve`/`review`; đề xuất là tự phát hiện trunk lúc init/config thay vì literal (friction filed khi viết e2e cell pr-lifecycle-3, layer task-spec, severity P3 — xem `.bee/backlog.jsonl`).
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
```

### Full target unit

```text
## Open Gaps

- Cầu dao (breaker, Data Dictionary #5) trơ trong `--once`: `maxRetries` mặc định 2 luôn nhỏ hơn trần cầu dao 3, nên một việc không bao giờ tự kéo cầu dao trong một lượt `--once` đơn — chỉ đỗ qua đường trần thử-lại thường. Cần một cầu dao dùng chung xuyên lượt (hoặc hạ trần) mới làm cầu dao có tác dụng thật ở chế độ này; ghi nhận là biết-nhưng-chưa-sửa (review-debt-runner-2, không đổi hành vi).
- Nhiều lượt `check` chạy đồng thời trên cùng một kho chưa có cơ chế khóa/chống-tranh-chấp cho dòng lịch sử xu hướng (khác với nhật ký sự kiện chính, vốn đã có CAS) — cùng tinh thần ngưỡng-chưa-tới của RUL10 (diễn tập không chạm log thật) (work-state), mở lại khi ghi đồng thời thành tải chính.
- Tên nhánh trục (trunk) của cổng duyệt hiện là literal `"main"` (`merge.mjs`) — một host project dùng tên nhánh trục khác (vd `master`) sẽ gãy `approve`/`review`; đề xuất là tự phát hiện trunk lúc init/config thay vì literal (friction filed khi viết e2e cell pr-lifecycle-3, layer task-spec, severity P3 — xem `.bee/backlog.jsonl`).
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
```

### Full diff

```diff
No text difference.
```

## claim_5c6238369ac0200472ee37488cd0e09a

Source digest: d18835d06937f979c98f008115c46b322ad995e2a465a6cdad4099bae761ebee

Target digest: d18835d06937f979c98f008115c46b322ad995e2a465a6cdad4099bae761ebee

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-98",
  "sourceLines": [
    1177,
    1192
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Open Gaps"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-2e032393add1/spec.md",
  "targetAnchor": "unheaded-block-3",
  "targetAncestry": [
    "Added in candidate: Runner Open Gaps",
    "Open Gaps"
  ],
  "nativeTargetClaimId": "claim_1d00d9a671ff7b2e5310aac9cf7926b8",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "open-gaps",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5c6238369ac0200472ee37488cd0e09a",
    "sourceUnitDigest": "d18835d06937f979c98f008115c46b322ad995e2a465a6cdad4099bae761ebee",
    "targetOwner": "docs/platform/runner/subcomponents/h-2e032393add1/spec.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-98 (lines 1177–1192) carried at docs/platform/runner/subcomponents/h-2e032393add1/spec.md#unheaded-block-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "d18835d06937f979c98f008115c46b322ad995e2a465a6cdad4099bae761ebee",
    "targetAncestry": [
      "Added in candidate: Runner Open Gaps",
      "Open Gaps"
    ]
  }
}
```

### Full source unit

```text
- Cầu dao (breaker, Data Dictionary #5) trơ trong `--once`: `maxRetries` mặc định 2 luôn nhỏ hơn trần cầu dao 3, nên một việc không bao giờ tự kéo cầu dao trong một lượt `--once` đơn — chỉ đỗ qua đường trần thử-lại thường. Cần một cầu dao dùng chung xuyên lượt (hoặc hạ trần) mới làm cầu dao có tác dụng thật ở chế độ này; ghi nhận là biết-nhưng-chưa-sửa (review-debt-runner-2, không đổi hành vi).
- Nhiều lượt `check` chạy đồng thời trên cùng một kho chưa có cơ chế khóa/chống-tranh-chấp cho dòng lịch sử xu hướng (khác với nhật ký sự kiện chính, vốn đã có CAS) — cùng tinh thần ngưỡng-chưa-tới của RUL10 (diễn tập không chạm log thật) (work-state), mở lại khi ghi đồng thời thành tải chính.
- Tên nhánh trục (trunk) của cổng duyệt hiện là literal `"main"` (`merge.mjs`) — một host project dùng tên nhánh trục khác (vd `master`) sẽ gãy `approve`/`review`; đề xuất là tự phát hiện trunk lúc init/config thay vì literal (friction filed khi viết e2e cell pr-lifecycle-3, layer task-spec, severity P3 — xem `.bee/backlog.jsonl`).
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
```

### Full target unit

```text
- Cầu dao (breaker, Data Dictionary #5) trơ trong `--once`: `maxRetries` mặc định 2 luôn nhỏ hơn trần cầu dao 3, nên một việc không bao giờ tự kéo cầu dao trong một lượt `--once` đơn — chỉ đỗ qua đường trần thử-lại thường. Cần một cầu dao dùng chung xuyên lượt (hoặc hạ trần) mới làm cầu dao có tác dụng thật ở chế độ này; ghi nhận là biết-nhưng-chưa-sửa (review-debt-runner-2, không đổi hành vi).
- Nhiều lượt `check` chạy đồng thời trên cùng một kho chưa có cơ chế khóa/chống-tranh-chấp cho dòng lịch sử xu hướng (khác với nhật ký sự kiện chính, vốn đã có CAS) — cùng tinh thần ngưỡng-chưa-tới của RUL10 (diễn tập không chạm log thật) (work-state), mở lại khi ghi đồng thời thành tải chính.
- Tên nhánh trục (trunk) của cổng duyệt hiện là literal `"main"` (`merge.mjs`) — một host project dùng tên nhánh trục khác (vd `master`) sẽ gãy `approve`/`review`; đề xuất là tự phát hiện trunk lúc init/config thay vì literal (friction filed khi viết e2e cell pr-lifecycle-3, layer task-spec, severity P3 — xem `.bee/backlog.jsonl`).
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
```

### Full diff

```diff
No text difference.
```

## claim_199e9de005d19f4b2d061005d959b3ed

Source digest: 197a395073121e8ebc1dc71f8efdabbb4a02ddff6c28689ba1711e008b226e34

Target digest: 197a395073121e8ebc1dc71f8efdabbb4a02ddff6c28689ba1711e008b226e34

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-99",
  "sourceLines": [
    1194,
    1202
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Open Gaps"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-2e032393add1/spec.md",
  "targetAnchor": "unheaded-block-4",
  "targetAncestry": [
    "Added in candidate: Runner Open Gaps",
    "Open Gaps"
  ],
  "nativeTargetClaimId": "claim_bddc365c4d3947adf45f137f179409c5",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "open-gaps",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_199e9de005d19f4b2d061005d959b3ed",
    "sourceUnitDigest": "197a395073121e8ebc1dc71f8efdabbb4a02ddff6c28689ba1711e008b226e34",
    "targetOwner": "docs/platform/runner/subcomponents/h-2e032393add1/spec.md",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-99 (lines 1194–1202) carried at docs/platform/runner/subcomponents/h-2e032393add1/spec.md#unheaded-block-4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "197a395073121e8ebc1dc71f8efdabbb4a02ddff6c28689ba1711e008b226e34",
    "targetAncestry": [
      "Added in candidate: Runner Open Gaps",
      "Open Gaps"
    ]
  }
}
```

### Full source unit

```text
- Khóa hoạt động cây chính (STR65) suy danh tính từ một tiến trình tổ tiên gần khi
  không có biến môi trường phiên trợ lý — suy đoán tốt-nhất cho terminal người gõ
  tay, KHÔNG tuyệt đối: hai terminal người khác nhau chia sẻ cùng một tiến trình cha
  đủ gần (vd cùng phiên tmux/sshd) vẫn có thể đọc ra cùng một danh tính và không bị
  chặn dù đang thực sự đồng thời hoạt động. Cả 3 sự cố STR65 có SHA cụ thể trước đây
  đều là phiên trợ lý (có biến môi trường riêng, không rơi vào giới hạn này) — giới
  hạn chỉ áp dụng cho trường hợp chưa quan sát được thật (terminal-đối-terminal).
  Vá trọn cần một danh tính phiên bền hơn cho terminal tay gõ (deferred, backlog
  STR84 nhắm khác lớp — enforcement phía bee-core — không trực tiếp vá gap này).
```

### Full target unit

```text
- Khóa hoạt động cây chính (STR65) suy danh tính từ một tiến trình tổ tiên gần khi
  không có biến môi trường phiên trợ lý — suy đoán tốt-nhất cho terminal người gõ
  tay, KHÔNG tuyệt đối: hai terminal người khác nhau chia sẻ cùng một tiến trình cha
  đủ gần (vd cùng phiên tmux/sshd) vẫn có thể đọc ra cùng một danh tính và không bị
  chặn dù đang thực sự đồng thời hoạt động. Cả 3 sự cố STR65 có SHA cụ thể trước đây
  đều là phiên trợ lý (có biến môi trường riêng, không rơi vào giới hạn này) — giới
  hạn chỉ áp dụng cho trường hợp chưa quan sát được thật (terminal-đối-terminal).
  Vá trọn cần một danh tính phiên bền hơn cho terminal tay gõ (deferred, backlog
  STR84 nhắm khác lớp — enforcement phía bee-core — không trực tiếp vá gap này).
```

### Full diff

```diff
No text difference.
```

## claim_2bb6c6025afdbad3c1a26762f903bcd2

Source digest: 33397038e11c79d2866f7ccc09b04d90f18eb593080a2bc3a9f2a2a39ec95136

Target digest: 33397038e11c79d2866f7ccc09b04d90f18eb593080a2bc3a9f2a2a39ec95136

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-100",
  "sourceLines": [
    1204,
    1205
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Open Gaps"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-2e032393add1/spec.md",
  "targetAnchor": "unheaded-block-5",
  "targetAncestry": [
    "Added in candidate: Runner Open Gaps",
    "Open Gaps"
  ],
  "nativeTargetClaimId": "claim_beee9a8831d93e1da915cc394ebb7a69",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "open-gaps",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_2bb6c6025afdbad3c1a26762f903bcd2",
    "sourceUnitDigest": "33397038e11c79d2866f7ccc09b04d90f18eb593080a2bc3a9f2a2a39ec95136",
    "targetOwner": "docs/platform/runner/subcomponents/h-2e032393add1/spec.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-100 (lines 1204–1205) carried at docs/platform/runner/subcomponents/h-2e032393add1/spec.md#unheaded-block-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "33397038e11c79d2866f7ccc09b04d90f18eb593080a2bc3a9f2a2a39ec95136",
    "targetAncestry": [
      "Added in candidate: Runner Open Gaps",
      "Open Gaps"
    ]
  }
}
```

### Full source unit

```text
- ~~**`return` không nhận ra hoàn tất của một `fgw/<id>` sinh ra từ lượt `take`/`pick` ĐẦU TIÊN (không phải tái claim một item `blocked`).**~~ RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)/RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai)'s discriminator nguồn-nhánh (`branchHeadAtTake`) trước đây chỉ được ghi trên cạnh `blocked→doing` (tái claim một đề xuất đã đỗ) — một lượt `pick` đầu tiên trên `todo→doing` chỉ ghi `headAtTake` (main-based), dù `pick` cũng dựng CÙNG worktree + nhánh `fgw/<id>` như đường tái claim. Vì `branchHeadAtTake` vắng mặt, `return` không rẽ vào nhánh nguồn-nhánh (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)) — nó chỉ đo `changedFilesSince` trên checkout CHÍNH, nơi không có gì đổi (việc thật nằm trên `fgw/<id>`) → từ chối "không có thay đổi", việc kẹt ở `doing`/`awaiting-human` dù verify xanh + đã commit thật trên nhánh riêng. Tái hiện thật (không suy đoán): `/fgOS:pick` một item `todo`, verify xanh 23/23, commit thật trên `fgw/tsk-57u` — `return` vẫn từ chối (docs/history/mvp2-scope-test-infra/reports/case-1-interactive.md, forgent workshop). **Đóng 2026-07-28:** `pick`'s nhánh claim ĐẦU TIÊN (`todo→doing`) nay ghi `branchHeadAtTake` (giá trị = HEAD hiện tại của repo lúc claim — đúng bằng điểm gốc `createWorktree` fork nhánh mới ra), cùng khuôn với nhánh tái-claim `blocked→doing` — không còn ghi `headAtTake` cho bất kỳ claim nào của `pick`; `take` (verb thuần, không dựng worktree) không đổi, vẫn dùng `headAtTake` đúng như trước.
- **`fgos-runner` không có cách tự-scope vào một thư mục/dự án con — luôn resolve repo root qua `git rev-parse --show-toplevel` từ `cwd`, không cờ/biến môi trường ghi đè.** `parseArgs` chỉ nhận `--once`/`--watch`/`--poll-ms`/`--dry-run` (`bin/fgos-runner.mjs`; `--config` đã bỏ, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)). Với một dự án con KHÔNG tự có `.git` riêng (vd một fixture/testbed sống bên trong một repo lớn hơn), `git rev-parse --show-toplevel` luôn thoát ra repo cha — runner claim/dispatch trên `.fgos/` của repo CHA, không phải của dự án con, dù các verb `fgos.mjs` khác (`submit`/`pick`/...) đã cô lập đúng qua `process.cwd()` trực tiếp. Tái hiện thật: `git -C <thư-mục-con> rev-parse --show-toplevel` thoát ra repo cha; không có config nào ở thư mục con mà runner tự nhận (docs/history/mvp2-scope-test-infra/reports/case-2-headless.md, forgent workshop). Việc: thêm một cờ/biến môi trường ghi đè root (vd `--root`/`FGOS_ROOT`) song song với cách các verb `fgos.mjs` đã cô lập, giữ `git rev-parse --show-toplevel` làm mặc định khi vắng cờ (`docs/backlog.md` PBI p-2a39f940).
```

### Full target unit

```text
- ~~**`return` không nhận ra hoàn tất của một `fgw/<id>` sinh ra từ lượt `take`/`pick` ĐẦU TIÊN (không phải tái claim một item `blocked`).**~~ RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)/RUL34 (Iron Law áp dụng khi chạm cờ rủi ro hoặc module năng-lực — không cần cả hai)'s discriminator nguồn-nhánh (`branchHeadAtTake`) trước đây chỉ được ghi trên cạnh `blocked→doing` (tái claim một đề xuất đã đỗ) — một lượt `pick` đầu tiên trên `todo→doing` chỉ ghi `headAtTake` (main-based), dù `pick` cũng dựng CÙNG worktree + nhánh `fgw/<id>` như đường tái claim. Vì `branchHeadAtTake` vắng mặt, `return` không rẽ vào nhánh nguồn-nhánh (RUL30 (cửa người-hoàn-tất một đề xuất nguồn-nhánh bị đỗ — mở rộng take/return, không verb mới)) — nó chỉ đo `changedFilesSince` trên checkout CHÍNH, nơi không có gì đổi (việc thật nằm trên `fgw/<id>`) → từ chối "không có thay đổi", việc kẹt ở `doing`/`awaiting-human` dù verify xanh + đã commit thật trên nhánh riêng. Tái hiện thật (không suy đoán): `/fgOS:pick` một item `todo`, verify xanh 23/23, commit thật trên `fgw/tsk-57u` — `return` vẫn từ chối (docs/history/mvp2-scope-test-infra/reports/case-1-interactive.md, forgent workshop). **Đóng 2026-07-28:** `pick`'s nhánh claim ĐẦU TIÊN (`todo→doing`) nay ghi `branchHeadAtTake` (giá trị = HEAD hiện tại của repo lúc claim — đúng bằng điểm gốc `createWorktree` fork nhánh mới ra), cùng khuôn với nhánh tái-claim `blocked→doing` — không còn ghi `headAtTake` cho bất kỳ claim nào của `pick`; `take` (verb thuần, không dựng worktree) không đổi, vẫn dùng `headAtTake` đúng như trước.
- **`fgos-runner` không có cách tự-scope vào một thư mục/dự án con — luôn resolve repo root qua `git rev-parse --show-toplevel` từ `cwd`, không cờ/biến môi trường ghi đè.** `parseArgs` chỉ nhận `--once`/`--watch`/`--poll-ms`/`--dry-run` (`bin/fgos-runner.mjs`; `--config` đã bỏ, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)). Với một dự án con KHÔNG tự có `.git` riêng (vd một fixture/testbed sống bên trong một repo lớn hơn), `git rev-parse --show-toplevel` luôn thoát ra repo cha — runner claim/dispatch trên `.fgos/` của repo CHA, không phải của dự án con, dù các verb `fgos.mjs` khác (`submit`/`pick`/...) đã cô lập đúng qua `process.cwd()` trực tiếp. Tái hiện thật: `git -C <thư-mục-con> rev-parse --show-toplevel` thoát ra repo cha; không có config nào ở thư mục con mà runner tự nhận (docs/history/mvp2-scope-test-infra/reports/case-2-headless.md, forgent workshop). Việc: thêm một cờ/biến môi trường ghi đè root (vd `--root`/`FGOS_ROOT`) song song với cách các verb `fgos.mjs` đã cô lập, giữ `git rev-parse --show-toplevel` làm mặc định khi vắng cờ (`docs/backlog.md` PBI p-2a39f940).
```

### Full diff

```diff
No text difference.
```
