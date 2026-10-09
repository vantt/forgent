# Targeted main-sync successor check

Author session: codex-session:1@2026-10-08
Review mode: ordinary

Review only the two pending retired rows in `ledger/retired-unit-decisions.json` and the two IO identity gaps in `ledger/main-sync-successors.json`. No retired or gap row is approved by the author. Both predecessor IDs remain in registry accounting. The three current IO bindings are reviewed in the b-io-contract diff pack.

For RUL11, compare AGENTS.md at `f33612119^` and `f33612119`, including the complete old and successor heading payloads; verify the explicit owner-authorized successor and cite the rename commit. Do not amend AGENTS.md or either law. For IO, compare docs/io-contract.md at `3ea75475d^` and `3ea75475d`; verify the original discovered paragraph survives in full in the candidate’s whole reasoned-exceptions section. The paragraph separator in the candidate is intentional and all downstream anchors are unchanged.

Commit `reports/phase-06/review-2final-retired-unit.md` in the same per-row style as `review-2rework-retired-unit.md`; record reviewer identity, author identity, one verdict/note and the full source/target digests for each pending retired/gap item. These are accounting decisions, not source-text edits.

## claim_c3ef3a4ddc116883db10a70d55ba7bd5

Source: `AGENTS.md#rul11-tùm-lum-không-phải-nặng-d-adr0036-docsspecsplatform-foundationsmd`  
Source unit digest: `4485eb54512289665baad03b45714d0d19bdb4b46f1ce565850aea8aa969b940`  
Target: `AGENTS.md#rul11-tùm-lum-không-phải-nặng-d-adr0054-supersedes-d-adr0036-docsspecsplatform-foundationsmd`  
Target unit digest: `52ff86d66f342109d00adeffc09b80352fec793ccd934413bf59a0d8dd0d32c2`  
Shown target digest: `53ac9f9ff1a0476287e5746059f0dd1681d73d704b010f7ef12b61b325d1d9fe`

Owner A13 supersede: main commit f33612119f1158716b6797859598033cda6eb89c renames the RUL11 heading from D-ADR0036 to D-ADR0054, explicitly retaining the superseded decision reference. This is instruction identity accounting only; no law or instruction text is edited.

~~~~text
## RUL11 — tùm lum, không phải nặng (D-ADR0054, supersedes D-ADR0036, docs/specs/platform-foundations.md)

Việc trở nặng không vì bản chất nó lớn mà vì thiếu và quên — tên đúng của
tình trạng đó là tùm lum, không phải nặng. Khi thấy tùm lum trong phạm vi
việc đang làm, gom lại — gom tới khi hết; quy mô không bao giờ là lý do miễn
trừ. Tùm lum thấy ngoài phạm vi thì ghi thành item riêng; gom mà phải xây
công cụ mới là một câu hỏi quyết định. Đích của mọi lần gom
là một hình dạng duy nhất: ranh giới rõ, contract tường minh, đổi và biến
hình dễ, không chắp vá.

khong phai no nang ma no tum lum
~~~~

## claim_3c993001919f57e0f96a36c2a4d92c43

Source: `docs/io-contract.md#unheaded-block-16`  
Source unit digest: `549dded9fe85b1cfd57f1ec7079141e4feb9e6468a31e93485ab91a2305e79fe`  
Target: `docs/platform/work-state/contracts/cli-io-contract.md#5-reasoned-envelope-exceptions`  
Target unit digest: `bc5d36dad759ec51b5aeab14930524be6e9814c9d2a85cb8af2cbecccdd846a2`  
Shown target digest: `5ca1201a0e7c0df5e8a9b04c1cc2e1f9b07e92e48d295648597c3a6e63a554ba`

Main commit 3ea75475d911ca02c9d8b5011dca4f748cc5820f folds the unchanged fgos-discovered paragraph into the source exception-list unit. Its entire text is preserved verbatim inside the current candidate reasoned-exceptions heading section, together with the fifth hook exception. The candidate retains the prior paragraph separator to preserve unrelated block identities. Supersede is pending; no approval is inherited.

~~~~text
## 5. Reasoned Envelope Exceptions

Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:

1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
   siêu dữ liệu về CLI, không phải payload của một verb.
2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
   qua cờ `--pretty`, không phải payload mặc định.
3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.

**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.
~~~~

## IO identity gaps

- `claim_b92ac199356ff830e5554647ab143a90`: `docs/io-contract.md#unheaded-block-14`, source digest `e24cc26161b017265526e8e287d7ddb0777cabce83f1effd56099a3ea79814e5`, pending supersede to `docs/platform/work-state/contracts/cli-io-contract.md#5-reasoned-envelope-exceptions`.
- `claim_6a8087a3f502f37f9c7b729e871bee9c`: `docs/io-contract.md#unheaded-block-15`, source digest `74809b036d96332c8fd99e73be67a5abacbef4b899eb741b946b39aed1ce1fa6`, pending supersede to `docs/platform/work-state/contracts/cli-io-contract.md#5-reasoned-envelope-exceptions`.
