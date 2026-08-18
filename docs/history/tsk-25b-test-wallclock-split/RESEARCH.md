# RESEARCH — tsk-25b (chẻ nhỏ/song song hoá hai file test chi phối wall-clock)

Accumulating record. Each round appends its own dated section; never
overwrite an earlier round.

## Round 1 — 2026-08-11 (stage `discovery`, called from `fgos-coding-driving`)

### Asked

Item goal: hạ wall-clock của `npm test`, hiện bị chi phối bởi đúng hai file
(`test/cli/fgos.test.mjs`, `test/setup/checks.test.mjs`). Câu hỏi cần chốt
trước khi rời `discovery`: **cơ chế nào thật sự quyết định wall-clock ở đây,
và "chẻ nhỏ" với "song song hoá" — cái nào là đòn bẩy thật, cái nào là ngõ
cụt?** Không quyết kiến trúc/scope ở vòng này; chỉ lấy bằng chứng.

### Checked

**Repo trước (mechanical route):**

- `package.json` → `"test": "node --test 'test/**/*.test.mjs'"` — không cờ
  concurrency nào được truyền, tức mọi hành vi song song đều là mặc định
  của Node. Node tại chỗ: `v24.18.0`. Máy đo: `nproc` = 16.
- `test/cli/fgos.test.mjs` — 9761 dòng, 511 KB, **547 `test(` top-level**,
  0 `describe(`. Import `execFileSync, spawnSync` (`test/cli/fgos.test.mjs:7`);
  harness chạy CLI thật qua `spawnSync(process.execPath, [FGOS, ...args])`
  (`:49`), fixture git thật qua `execFileSync('git', ...)` (`:120-126`,
  `:138`, `:152-170`, `:180`). 103 chỗ khớp spawn/exec trong file.
  `tmpCwd()` (`:~40`) còn bootstrap `fgos init` bằng một lần spawn nữa cho
  gần như mọi test — chi phí spawn là chi phí thống trị, không phải chi phí
  assert.
- `test/setup/checks.test.mjs` — 1367 dòng, **85 `test(` top-level**, cùng
  kiểu harness spawn thật (`:12`, `:496`, `:774-798`) và dựng git repo thật
  (`:80-99`, `:487`, `:947-971`). Header file tự nói rõ: "no mocking the CLI
  process itself".
- `test/cli/` đã có sẵn tiền lệ tách file theo chủ đề — `fgos-help.test.mjs`,
  `fgos-manifest.test.mjs`, `fgos-tool.test.mjs`,
  `take-pick-claim-eligibility.test.mjs`, `invocation-fault-log.test.mjs`.
  Tức "chẻ `fgos.test.mjs` ra thêm file cùng thư mục" là mở rộng một quy ước
  đã có, không phải phát minh bố cục mới.
- `test/architecture.test.mjs` — hai phép kiểm chỉ quét `src/` + `bin/`
  ("đủ sổ" so `docs/architecture-manifest.json` với file .mjs dưới `src`,
  `bin`). **`test/` nằm ngoài manifest**, nên tách/đổi tên file test không
  đụng phép kiểm kiến trúc nào.
- `docs/history/tsk-516-approve-reverify-scope/CONTEXT.md:46,106` — nguồn
  của các con số trong mô tả item (163.1s / 2827 test cho full suite; D2 đã
  chốt check rộng dùng tập con bất biến rẻ chứ không phải full suite).

**Ngoài repo:** `nodejs.org/api/test.html` và `nodejs.org/api/cli.html` được
fetch nhưng trả lời mâu thuẫn/cắt cụt về giá trị mặc định của
`--test-concurrency` — **không dùng làm bằng chứng**. Thay bằng phép đo
trực tiếp bên dưới.

**Phép đo trực tiếp (probe rời, scratchpad, Node v24.18.0, cùng máy):**
hai file test giống hệt nhau, mỗi file 2 test, mỗi test `execFileSync('sleep',
['2'])` (chặn luồng đúng như harness thật):

| Chạy | Tổng test | Wall-clock |
|---|---|---|
| `node --test a.test.mjs` (1 file) | 2 | **4.07s** |
| `node --test` (2 file) | 4 | **4.09s** |

### Found

1. **Song song theo file là mặc định, không cần cờ.** Gấp đôi số test nhưng
   trải ra 2 file thì wall-clock không đổi (4.07 → 4.09s). Khớp với bằng
   chứng sẵn có trong mô tả item: full suite 118 file = 163.1s trong khi
   riêng `fgos.test.mjs` = 171.0s — cả suite chỉ xấp xỉ *file chậm nhất*,
   điều bất khả nếu file chạy tuần tự.
2. **Trong một file, test chạy tuần tự — và ở repo này không sửa được bằng
   cờ.** 2 test × 2s trong cùng file = 4.07s, không phải ~2s. Quan trọng
   hơn: harness ở cả hai file dùng `spawnSync`/`execFileSync` (đồng bộ,
   chặn event loop), nên kể cả bật `concurrency` của node:test cũng vô
   nghĩa — muốn song song *trong* file thì phải viết lại toàn bộ harness
   sang spawn bất đồng bộ. → **"song song hoá tại chỗ" là ngõ cụt rẻ tiền
   không tồn tại; "chẻ nhỏ ra nhiều file" là đòn bẩy thật.**
3. **Chi phí là chi phí spawn process, không phải chi phí assert.**
   547 test × ~0.31s ≈ 171s; mỗi test bỏ ra ít nhất 1–2 lần spawn Node CLI
   thật + fixture git thật. Chẻ file không làm giảm tổng CPU-time, nó chỉ
   trải tổng đó ra nhiều process song song — với 16 CPU và 118 file hiện
   chỉ có ~2 file thật sự bận, đầu chạy còn rất nhiều.
4. **Phải chẻ CẢ HAI file mới có lợi thật.** Wall-clock ≈ max(file). Chẻ
   riêng `fgos.test.mjs` (171s) thành ~6 nhóm ≈ 28s/nhóm thì trần mới rơi
   xuống `checks.test.mjs` = 109s — tức chỉ tiết kiệm 163 → ~109s. Chỉ khi
   cả hai cùng được chẻ thì trần mới về gần đáy. Đây là xác nhận cho phạm
   vi hai-file mà item đã nêu, không phải mở rộng phạm vi.
5. Không có ràng buộc kiến trúc nào chặn việc tách file test (điểm
   `architecture.test.mjs` ở trên).

### Still open (dành cho stage sau, không chặn `discovery`)

- Chẻ `fgos.test.mjs` theo *đường cắt* nào (theo verb? theo vùng chức năng?)
  và bao nhiêu nhóm — đây là quyết định shape, thuộc `fgos-coding-exploring`/
  `fgos-coding-planning`, không phải finding.
- Trong `checks.test.mjs`, hai test nặng nhất (12.2s + 10.7s, dựng môi
  trường thật) nằm cùng một nhóm thì nhóm đó thành trần mới; cách phân bổ
  là việc của plan.
- Có nên đồng thời hạ *tổng* chi phí (gộp fixture, bớt spawn) hay chỉ trải
  song song — câu hỏi scope, để `fgos-coding-exploring` chốt.
