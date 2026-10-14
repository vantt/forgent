# Phase 01 — Bộ so khớp `writes` dùng chung + hợp đồng Unit `prefer`/`persona`

Mốc M1, bước A (song song 00, 08; rebase sau khi 00 merge) · Lane L1 (`feat/rununit-scope`) · Ước lượng 1d · Rủi ro: cao (là nền cho commit, coverage, cảnh báo) · Red-team gộp với 02

## Context

- Quyết định Lead #7 (writes), Lead sửa plan #3 (glob chỉ `*`/`**`), #1 (đưa phần `unit.mjs` của 04 vào đây để 04 và 05 chạy song song thật).
- Red-team RT-R4-2: Unit nhận nguyên văn `./docs`, `docs//`, `.` (`src/runner/execution/unit.mjs:50-59,151-165`). Git `:(literal)` và `checkCoverage` (`src/runner/dispatch/evidence-attribution.mjs:123-127`) hiểu các path đó khác nhau.
- AGENTS.md "Install/setup/doctor gate".

## Prior art

| Có sẵn | Dùng lại | Còn thiếu |
|---|---|---|
| `isValidRepoRelativePath` `unit.mjs:50`: chặn `/`, `..`, `\`, NUL | giữ nguyên các luật chặn | chuẩn hoá; glob; chặn `:` đầu path |
| `checkCoverage` `evidence-attribution.mjs:123`: exact hoặc tiền tố thư mục | ngữ nghĩa cho mục không glob | 03 thay hàm này bằng matcher chung |
| `definition.mjs:282-295`: luật `writes` chép riêng | — | gộp về một chỗ (RUL11) |
| `DEFAULT_RUNNER_CONFIG` → `registerConfigDefault({key:'runner'})` (`src/setup/registrations.mjs:2396`); tiền lệ doctor `checkRunnerPatternsConfig` (`registrations.mjs:502`) | key mới tự đi vào setup config-merge | doctor check theo shape |
| `DISALLOWED_UNIT_FIELDS` `unit.mjs:7-16`, kiểm ở `:111-119`; object trả về `:232-245` chỉ giữ field đã biết | — | `prefer`, `persona` |
| Không có thư viện glob (chỉ dùng `yaml`); Node 20 (CI) không có `path.matchesGlob` | — | matcher nhỏ tự viết |

## Requirements

1. NEW `src/runner/dispatch/write-scope.mjs`. File thuộc tầng dispatch/infra, không biết Unit hay Work. API:
   - `canonicalizeWriteEntry(raw)`:
     - trim; bỏ `./` ở đầu (lặp tới hết); gộp `//`; bỏ `/` cuối và `/.` cuối;
     - từ chối: rỗng, `.`, path tuyệt đối, `..`, `\`, NUL, `:` đầu path (pathspec magic);
     - **chỉ `*` và `**` là glob**; mọi ký tự khác (`[ ] { } ! ? ( )`...) là nghĩa đen (Lead #3);
     - `**` phải đứng thành một segment; `**` trần nghĩa là toàn repo.
   - `canonicalizeWrites(list)`: chuẩn hoá từng mục, khử trùng lặp, giữ thứ tự.
   - `expandGenerated(writes, generatedPaths)`: so phần literal (trước ký tự glob đầu tiên) của mục `writes` với phần literal của `from`. Nếu cái này nằm trong cái kia (chiều nào cũng được) thì thêm `also`.
   - `matchesWriteScope(relPath, scope)`:
     - mục không có glob: khớp khi bằng đúng, hoặc khi là tiền tố thư mục;
     - `*` khớp trong một segment;
     - `**` khớp 0..n segment;
     - `.fgos` và `.fgos/**` không bao giờ khớp, kể cả scope `**`.
   - `partitionPaths(paths, scope)` trả `{inScope, outOfScope}`.

   Một hàm duy nhất cho stage (02), coverage + `evaluateAttributionPolicy` (03) và outOfScope (02). Git không bao giờ tự diễn giải scope.
2. **Biên Unit** (`unit.mjs`):
   - `writes` đi qua `canonicalizeWrites`.
   - Bỏ `prefer` khỏi `DISALLOWED_UNIT_FIELDS`. Vẫn cấm executor, provider, model, tier, invocation, actors, overrides.
   - `prefer`: mảng gồm `"<executorId>"` hoặc `{executor, invocation?}`, cùng shape với `normalizeCandidates` của `bind.mjs:24`. Chỉ validate shape, không tra config.
   - `persona`: chuỗi không rỗng.
   - Object trả về giữ cả `prefer` và `persona`.
   - Sửa câu lỗi G2 theo danh sách cấm mới.
3. **`definition.mjs`** gọi `canonicalizeWrites` thay luật chép tay. Bọc `RunnerConfigError` thành `WorkflowDefinitionError` và giữ nhãn `${unitLabel}` (V-L7).
4. **Config:**
   - Thêm `runner.generatedPaths: []` (mảng `{from, also}`) vào `DEFAULT_RUNNER_CONFIG`.
   - Validate lúc load: `from` không được là `**` trần; entry có key lạ thì lỗi.
   - Doctor check mới `runner-generated-paths` trong `registrations.mjs`, theo khuôn `checkRunnerPatternsConfig`.
   - Bác R-M4 (lý do ở plan.md): giữ đường setup config-merge. `ensureRunnerConfigForDir` (`config.mjs:353-368`) sẽ tự ghi `generatedPaths: []` vào `.fgos/config.json` khi chạy `fgos:dev` lần đầu. **Lead commit dòng đó trên main ngay khi merge 01.** Entry thật cho repo này (`{from: "core/skills/**", also: [".agents/skills/**", "plugins/fgOS/skills/**", ".claude/skills/**"]}`) chỉ commit sau mốc E (activate).
5. **`runUnit`** (`run.mjs`, chỗ dựng `unitRecord` ~dòng 248):
   - `unitRecord.writeScope = expandGenerated(unit.writes, configSnapshot.runner.generatedPaths ?? [])`. Lưu trong `unit.json`; resume dùng lại, không tính lại.
   - `dispatchBound` đặt `assignment.writes = unitRecord.writeScope ?? unit.writes` (dòng ~361).
6. **Manifest:** thêm row cho `write-scope.mjs`.

## Files

Sở hữu:
- NEW `src/runner/dispatch/write-scope.mjs`
- `src/runner/execution/unit.mjs`
- `src/workflow/definition.mjs` (chỉ khối `writes`)
- `src/runner/execution/run.mjs` (chỉ `unitRecord` và `assignment.writes`)
- `src/runner/dispatch/config.mjs`
- `src/setup/registrations.mjs` (một check)
- `docs/architecture-manifest.json`
- NEW `test/runner/write-scope.test.mjs`, `test/runner/execution/unit.test.mjs`, test config/doctor tương ứng, `test/runner/execution/run.test.mjs` (các ca `writeScope`)

Chỉ đọc: `evidence-attribution.mjs`, `commit-unit-work.mjs`, `bind.mjs`.

## Bước

1. Test đỏ `test/runner/write-scope.test.mjs` theo bảng ca:
   - Tương đương: `./docs` ≡ `docs/` ≡ `docs//` ≡ `docs`.
   - Bị từ chối: `.`, `''`, `/x`, `a/../b`, `a\b`, `:(top)x`, `:!x`.
   - Được nhận, là nghĩa đen: `app/[slug]/page.tsx`, `app/(group)/[id]/route.ts`, `a?b`, `{a,b}`, `!x`. Mỗi mục chỉ khớp đúng path đó.
   - `**` được nhận.
   - `docs` khớp `docs/a.md` và `docs`, không khớp `docs-old/a.md`.
   - `plans/*/reports/**` khớp `plans/x/reports/a/b.md`, không khớp `plans/x/y/reports/a.md`.
   - `*.md` khớp `a.md`, không khớp `d/a.md`.
   - `**` không khớp `.fgos/state.json`.
   - Tên có khoảng trắng hoặc unicode.
   - Expand: `core/skills/x/SKILL.md` thêm 3 `also`; `docs/` không thêm gì.
2. Viết `write-scope.mjs` cho xanh.
3. Test đỏ `unit.test.mjs`:
   - chuẩn hoá `writes`;
   - `prefer` hợp lệ: chuỗi, object;
   - `prefer` không hợp lệ: số, object thiếu `executor`;
   - `persona` rỗng bị từ chối;
   - `executor`/`provider`/`overrides` vẫn bị cấm;
   - object trả về có `prefer` và `persona`.

   Thêm test definition (cùng hàm chuẩn hoá, lỗi vẫn là `WorkflowDefinitionError`). Sửa cho xanh.
4. Test đỏ config và doctor. Sửa cho xanh.
5. Test đỏ `run.test.mjs`:
   - `unit.json` có `writeScope` đã expand;
   - `assignment.json` có `writes` bằng `writeScope`;
   - resume không tính lại khi config đổi.
6. Đo release đang activate:
   - copy config vào một thư mục tạm, thêm key mới, chạy `fgos doctor` trần, ghi kết quả;
   - đọc code, `validateRunnerConfigShape` (`config.mjs:1438`) không từ chối key lạ ở cấp `runner`.
7. Chạy `npm test`. Báo cáo lane có Spec delta và CHANGELOG delta.

## Rủi ro + rollback

- Expand thô kéo theo cả cây render (R-L4): chấp nhận. Entry chỉ được thêm sau khi activate; 02 liệt kê file của commit để Lead thấy.
- Resume Unit cũ trên đĩa: dùng `rg` đếm `unit.json` có mục `writes` mà chuẩn hoá đổi giá trị. Ghi số vào báo cáo.
- Rollback: revert commit của lane. `writeScope` vắng thì code đọc lùi về `writes`.

## Xong khi

- Bảng ca ở bước 1, 3, 5 xanh.
- `rg -n "contains path escape" src/workflow` ra 0.
- Doctor có check `runner-generated-paths`.
- `npm test` exit 0.
- Red-team (gộp với 02) sạch.
- Lead đã commit dòng config mặc định trên main.
