# Advisory — giảm thời gian `npm test` mà không mất confidence

Ngày: 2026-09-15. Trạng thái: recommendation, **bản 3** (04:48) — bản 2 được chấp nhận với hai hiệu chỉnh (pin identity rõ ràng; giữ Node >=18, sửa discovery portable), cả hai đã kiểm bằng source/log và ghi dưới đây. Chưa có item/plan nào được tạo.
Artifact đo: `plans/reports/artifacts/260915-npm-test-baseline-224f0803/` (junit.xml, time-v.log, log test đỏ standalone, CI log-failed).

## 0. Thay đổi so với bản 1 (trả lời phản biện)

| Điểm phản biện | Kết luận bản 2 | Bằng chứng |
|---|---|---|
| "main đỏ deterministic ở `fgos-intake-4`" | **Rút lại chữ deterministic. Nguyên nhân đã tìm ra**: test phụ thuộc env của shell gọi. Trong phiên agent (env `CLAUDE_CODE_SESSION_ID`/`FGOS_SESSION_ID` set) → fail 4/4; unset env đó → pass 1/1; anh chạy shell thường → pass. Không phải regression sản phẩm, là **test không hermetic**. Chi tiết §2.2. | `src/util/session-identity.mjs:134` (`envSessionId` ưu tiên 2 env var, mới rơi về pid-walk); `src/state/store.mjs` `resolveWriterLogPath` reuse file theo writerId; test comment tự nói seq đếm theo writer-log; thí nghiệm `env -u` (artifact) |
| CI đỏ do case này? | **Không.** Job test (Node 20, cả 3 OS) fail sau ~13s: `Could not find '.../test/**/*.test.mjs'` — Node 20 `node --test` không expand glob (quoted glob vào từ commit `96210f7f` 2026-07-23). Job cargo fail do clippy (`?` operator, `fgos-distribution`). **CI chưa từng chạy suite trong 12 run gần nhất (từ 2026-09-03).** | artifact `ci-run-34700199177-log-failed.log`; `.github/workflows/ci.yml:22,94` node-version 20 |
| Không đưa "sửa regression" thành Phase 0 | Chấp nhận. Thay bằng 2 việc baseline nhỏ, độc lập: (a) harness pin writer identity cho spawn (hermetic), (b) CI thật sự chạy suite (glob bằng shell hoặc Node ≥22 trong CI). | — |
| docs-index 100-190s chưa đủ provenance | Chấp nhận là ước tính chọn pilot. Artifact junit kèm; đo thêm 1 spawn lúc rảnh = 24.0s (`time`). Acceptance để pilot tự đo. | artifact junit: file 214.7s, test 100.8s |
| "10 real-Claude site ≥85s" | Sửa: **8 site xác nhận bằng source + 1 đo trực tiếp**: 6 site `doctor` + 2 site `setup` (`uninstall-wiring-2.test.mjs:39`, `uninstall-wiring-3.test.mjs:40`). Loại 2 file bản 1 kể nhầm: `fgos-manifest.test.mjs:142` chỉ `setup --help` (không chạy check), `self-uninstall-spike` chỉ `uninstall` (không tới registry). Đo `uninstall-wiring-2` chặn/không chặn `claude`: **17.64s → 0.65s**. | thí nghiệm `FGOS_CLAUDE_COMMAND=/nonexistent/x`; `bin/fgos.mjs` case `uninstall` chỉ `uninstallGitHooks` |
| Fixture store cho docs-index cần equivalence, không mặc định "giữ 1 lần store thật" | Chấp nhận. Sửa đề xuất: fixture store **seed sẵn** một compound capture giả lập đúng shape → assertion `sourceCaptureId` thành **vô điều kiện** (hiện đang conditional = vacuous ở worktree mới). Mạnh hơn, không yếu hơn. Equivalence test là acceptance của pilot. | `test/report/enduser-index.test.mjs:35,182` |
| Coverage before/after chỉ là supporting | Chấp nhận. Guard-site là proof chính; coverage là chặn hồi quy phụ. | — |
| Tiers khỏi Phase 1 | Chấp nhận. Tiers lùi sau khi selector chứng minh giá trị. | — |
| Selector bỏ qua md/json không map, chỉ log | Chấp nhận: **mọi changed path không giải thích được → full.** | — |
| Regex import graph làm xương sống | Chấp nhận: **manifest ownership bảo thủ là xương sống**, import graph chỉ mở rộng selection, không bao giờ miễn fallback. | — |
| `test:failed` dùng `--test-rerun-failures` | **Loại.** `engines.node >=18`, CI Node 20. | `package.json:6-8` |
| Trigger-full list thiếu | Chấp nhận; list ở §3 Q1 mở rộng và đánh dấu "chưa đầy đủ, ownership manifest phải liệt kê chủ động, phần dư → full". | — |
| Ceiling 90s thành CI fail sau 2 tuần | **Loại khỏi plan này.** Chỉ report qua `test:timing`; threshold là quyết định riêng khi có baseline sạch. | — |
| Phase 1 gom nhiều đòn bẩy | Chấp nhận: mỗi optimization = 1 pilot đo độc lập (before/after riêng). | — |
| **(bản 3)** P0a: chỉ unset env chưa đủ, phải pin identity | Chấp nhận. `envSessionId` duyệt `['FGOS_SESSION_ID', 'CLAUDE_CODE_SESSION_ID']` theo thứ tự → pin `FGOS_SESSION_ID` test-only cho child là đủ kể cả khi `CLAUDE_CODE_SESSION_ID` được kế thừa; giá trị pin phải khớp `SESSION_ID_RE`/`MAX_ID_LENGTH`. pid-walk `MAX_HOPS = 3` nên unset-only thật sự có thể quy về cùng ancestor. `extraEnv` override cho test kiểm identity. | `session-identity.mjs:56,65-74` |
| **(bản 3)** "12 run cùng lỗi glob" cần kiểm từng run | Đã kiểm 12/12: mọi run có `Could not find`, 0 run có `# tests`; cargo chỉ đỏ ở 2 run cuối (09-11, 09-12). Ghi thành fact. | artifact `ci-runs-glob-check.txt` |
| **(bản 3)** Không hỏi release-owner về Node; giữ `>=18`, sửa discovery portable | Chấp nhận. P0b = runner Node nhỏ liệt kê `test/**/*.test.mjs` bằng `fs`, gọi `node --test` với argument array, cùng cửa trên 3 OS, có test chống zero-selection + kiểm tổng file. Không dùng shell glob. Bỏ điểm mở "engines" ở §6. | — |
| **(bản 3)** Artifact 356s không phải green baseline (exit 1 do P0a) | Chấp nhận. Nó là **profile** để chọn pilot; green baseline cô lập dựng lại sau P0a+P0b, trước mọi pilot. | `time-v.log` exit=1 |

## 1. Kết luận ngắn

Nút thắt tsk-25b D5 vẫn đúng: **wall ≈ tổng CPU / core; CPU bị spawn `node bin/fgos.mjs` chi phối.** Chẻ file hết dư địa. Đòn bẩy còn lại, theo lợi/chi phí:

1. **Bớt spawn không chứng minh gì** (docs-index trên store thật; real-`claude`; fixture init/seed) — giảm CPU thật, không mất coverage.
2. **Chạy ít test hơn mỗi vòng lặp** (`test:related`, manifest-first, fail-safe) — không giảm CPU, giảm số lần trả CPU.
3. **Matrix validation/gate xuống guard/use-case** — giữ 1 cửa subprocess đại diện/verb.
4. (Dài hạn) **`runCli(argv, ctx)`** — option (b) tsk-25b D5; đối chiếu Rust-host roadmap trước.

`npm test` full **vẫn là proof DoD** ở `return`/`approve`/CI. Điều kiện tiên quyết: suite phải **hermetic** (kết quả không đổi theo shell gọi) và CI phải **thật sự chạy** nó — hôm nay cả hai đều chưa đúng (§2.2).

## 2. Bằng chứng đã kiểm (2026-09-15, main @ 224f0803)

| Fact | Nguồn |
|---|---|
| 328 file / ~7187 `test()` tĩnh (junit ghi 6523 testcase); 16 core; Node v24.18 local, **Node 20 trên CI**, `engines >=18` | `nproc`, `package.json`, `ci.yml` |
| Harness CLI: `run()` = `spawnSync(node, [bin/fgos.mjs, ...])` kế thừa `process.env`; `tmpCwd()` = mkdtemp + 1 spawn `fgos init` | `test/cli/helpers/fgos-cli-harness.mjs:40-60` |
| Call site tĩnh: ~1838 `run(` trong cli+setup; 492 `tmpCwd()`; 87 `['add'`, 76 `['submit'`, 159 `['take'/'pick'` | grep |
| `fgos init` = `initStore` (fs thuần) + coexistence manifest + `git rev-parse HEAD` | `bin/fgos.mjs:1065`, `store.mjs:225` |
| `main()` đọc `process.argv`/`process.cwd()` (28 chỗ), `runVerb()` trả data, ghi stdout, set exitCode, gọi top-level | `bin/fgos.mjs:5152-5293` |
| Harness đã import in-process `addWork/moveWork/appendEvent/…` — seeding in-process là convention có sẵn | harness dòng 18-24 |
| `src/verbs/{merge,coordination,dispatch}` 18 file; `test/verbs` 15 file/221 test; registry `command-registry.mjs` là data, không map verb→module | ls, grep |
| Verify item: 433 `npm test`, 273 `node --test <files>`, 335 khác; `return` chạy verify qua `runGoalCheck` → `spawn(shell:true)` | `.fgos/state.json`, `goal-check.mjs:48` |
| Writer identity: env `CLAUDE_CODE_SESSION_ID`/`FGOS_SESSION_ID` nếu set (source ENV/REGISTRY), không thì pid-walk; writer log `<id>-<ts>.jsonl` **reuse file mới nhất cùng id** | `session-identity.mjs:134-172`, `store.mjs` `resolveWriterLogPath` |

### 2.1 Số đo per-file (một lần full, junit, load 7-20)

| Tổng | Giá trị |
|---|---|
| Wall | **5m56s** (356s) |
| CPU user+sys | **3167s** (~53 CPU-phút), 888% ≈ 8.9/16 core |
| Σ thời gian test (junit) | 3596s ≈ CPU ⇒ chi phí là blocking spawn |
| File >90s: **5**; >30s: 40; <1s: 146 (Σ 23s) | |
| Số file gom 50% / 80% / 90% thời gian | 26 / 68 / 98 |

| Dir | Σs | % | files | tests | s/test |
|---|---|---|---|---|---|
| test/cli | 1882 | 52% | 64 | 949 | 1.98 |
| test/runner | 576 | 16% | 100 | 2623 | 0.22 |
| test/rust-host | 322 | 9% | 7 | 102 | 3.16 |
| test/report | 249 | 7% | 8 | 141 | 1.77 |
| test/verbs | 175 | 5% | 15 | 221 | 0.79 |
| test/e2e | 157 | 4% | 12 | 78 | 2.02 |
| test/setup | 135 | 4% | 33 | 536 | 0.25 |
| test/state | 52 | 1% | 50 | 1337 | 0.04 |
| còn lại | 49 | 1% | 39 | 536 | — |

Top file (s, tests): enduser-index 214.7/21 (**1 test 100.8s**, spawn `docs-index` cwd=repo thật → `listWork` fold 10.8MB events; đo rảnh 24s/spawn × 5) · fgctl-init 191.4/20 (binary `target/release/fgctl` + stage release thật) · fgos-merge 165.2/61 · fgos-return 155.4/57 · fgctl-upgrade 92.2/16 · fgos-merge-2 84.7/30 · runner/loop 61.8/103 · fgos-claim{,-2} 61.0/56.6 · fgos-edit{,-3} 54.7/47.0 · fgos-read-{5,2,4} 52.5/41.9/39.0 · e2e/runner-loop 48.8/15 · runner/dispatch 44.5/369 · fgos-setup 42.9/17 (1 test 21.3s spawn `setup` thật).

Histogram theo test (bucket: n, Σs): <0.1s 4306/46 · <0.5s 713/189 · <1s 413/315 · <2s 542/780 · <5s 482/1402 · <10s 43/271 · ≥10s 24/594. **549 test ≥2s (8%) = 63% thời gian.**

Cluster theo tên test trong test/cli: validation-shaped ("rejected as validation / exit 4 / bare --") 189 test, Σ309s, 1.63s/test; gate-shaped (Iron Law/CTR005/gate) 48 test, Σ103s. Con số cluster là ước tính từ tên, dùng để chọn vùng audit, không phải acceptance.

### 2.2 Hai lỗ hổng của chính "proof DoD" (ngoài phạm vi tối ưu, nhưng phải đóng trước)

**(a) Suite không hermetic theo shell gọi.** `test/cli/fgos-intake-4.test.mjs` › "…genuinely legacy durable-doing item… answer clamps to todo":

| Điều kiện | Kết quả |
|---|---|
| Trong phiên Claude Code (env `CLAUDE_CODE_SESSION_ID` set), 4 lần, load 12-23 | fail 4/4 — `seq` thực 3, mong 2 |
| Cùng máy, `env -u CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID` | pass |
| Shell thường (phản biện đo) | pass 15/15, 3/3 |

Cơ chế: fixture `moveToDurableDoingForTest` ghi in-process qua `resolveWriterLogPath(dir)`; `addOk`/`ask` ghi qua CLI spawn. Test giả định 2 đường ghi thuộc **2 writer khác nhau** (comment trong test: "addOk … is not part of this item's subsequent writer-log sequence"). Khi env agent-session set, `run()` kế thừa `process.env` → CLI spawn và test process resolve **cùng** writerId → cùng file → seq +1. Hai commit đổi expectation qua lại (`90224196` 09-09, `39de5f8e` 09-15) là hệ quả: người chạy trong agent session thấy 3, shell thường thấy 2. **Đây là bug harness, không phải bug sản phẩm và không phải flake theo tải.** Hệ quả rộng hơn: agent (người dùng chính của fgOS) chạy `npm test` từ trong phiên có thể nhận kết quả khác shell thường — cần grep mọi test đếm `seq`/writer file với cùng giả định.

Fix chốt (item riêng, nhỏ): harness `run()` **pin** `FGOS_SESSION_ID` test-only (charset hợp lệ theo `SESSION_ID_RE`) vào env child, `extraEnv` được override cho test kiểm identity. Không unset-only: `FGOS_SESSION_ID` đứng trước `CLAUDE_CODE_SESSION_ID` trong `envSessionId` nên pin thắng mọi kế thừa; pid-walk (`MAX_HOPS = 3`) có thể quy parent/child về cùng ancestor nên unset không bảo đảm. Không sửa expectation lần thứ ba trước khi pin. Acceptance: file pass cả trong phiên agent lẫn shell thường; grep các test khác cùng giả định writer tách biệt.

**(b) CI không chạy suite — kiểm 12/12 run.** 12 run gần nhất (2026-09-03 → 09-12): mọi run job `test` chết sau ~13s với `Could not find '.../test/**/*.test.mjs'` (Node 20 nhận quoted glob nguyên văn), 0 run có dòng `# tests`; job `cargo (workspace)` chỉ đỏ thêm ở 2 run cuối (clippy). Artifact `ci-runs-glob-check.txt`. Fix chốt: **giữ `engines >=18`**, thêm runner Node nhỏ (`scripts/run-tests.mjs`) liệt kê đệ quy `test/**/*.test.mjs` bằng `fs`, gọi `node --test` với argument array (cùng cửa Linux/macOS/Windows, không shell glob); có test chống zero-selection và kiểm tổng file phát hiện = số file trên đĩa. `scripts/test-select.mjs` (Q1) dùng lại chính cửa này.

## 3. Trả lời 5 câu hỏi

### Q1 — Chỉ chạy test liên quan (`test:related`, manifest-first, fail-safe)

`scripts/test-select.mjs` (Node thuần) nhận `--base <ref>` | `--staged` | `--files …`, in tập file test + lý do, rồi tự exec `node --test` trên tập đó (không xargs; 0 file → exit ≠ 0).

Thứ tự quyết định cho **mỗi** changed path — dừng ở bước đầu tiên khớp:
1. **Ownership manifest** `test/ownership.mjs` (bảo thủ, liệt kê chủ động): `{ pathGlob → testGlobs | 'FULL' }`. Ví dụ: `src/verbs/merge/** → test/verbs/merge/**, test/cli/fgos-approve*, fgos-merge*, fgos-return*, fgos-post-merge*`; `src/runner/loop.mjs → test/runner/loop*, test/e2e/runner-loop*`; `bin/fgos.mjs`, `src/cli/**`, `src/state/store.mjs`, `src/state/events*.mjs`, `test/**/helpers/**`, `package*.json`, `.github/**`, `Cargo.*`, `**/*.rs`, `scripts/**`, `core/**` (render source của `.agents/`), `docs/architecture-manifest.json`, `**/*.schema.json`, `**/templates/**` → `FULL`.
2. **Import graph tĩnh** — chỉ **mở rộng** tập đã chọn ở bước 1 (thêm test file có closure import chứa path), không bao giờ thay thế fallback.
3. **Không khớp bước 1** (kể cả `.md`, `.json`, file mới) → **FULL**. Không có "bỏ qua có log".

Drift test `test/ownership.test.mjs`: mọi glob trong manifest phải khớp ≥1 file thật (chống mục chết); mọi `src/**/*.mjs` phải rơi vào ≥1 glob hoặc `FULL` (chống lỗ). Danh sách trigger ở trên **chưa đầy đủ** — manifest phải chủ động liệt kê, mọi thứ ngoài manifest là full.

Đầu ra kèm evidence: `selected N files (reason per file) | fallback FULL because <path>`. Agent ghi dòng này vào verify note. Impact-analysis capability (GitNexus) khi present chỉ là nguồn mở rộng thêm, không miễn fallback.

Không thêm `test:failed` (`--test-rerun-failures` là Node 24, `engines >=18`).

### Q2 — Audit dư thừa

Quy trình 3 bước, dùng lại định nghĩa tsk-34y ("same invariant" = cùng setup → cùng loại assert → cùng side-effect, chỉ khác input; đọc assertion body):

1. **Inventory máy làm:** gom cluster theo `(verb, exit code, postcondition)` + file; ra bảng cluster/số test/Σs/guard site.
2. **Phân loại bằng guard site trong src** (proof chính): N test cùng rơi vào **một** `throw StoreError('validation', …)` / một nhánh `parseArgs` / registry-validate → same invariant → 1 test subprocess đại diện cho cửa (parse → exit 4 → envelope/stderr → không event) + **data-table unit test** gọi thẳng guard/use-case, mỗi edge case một dòng. Guard **khác nhau** (verb tự viết validation riêng) → không gộp test trước khi gom guard (RUL11); gom guard = refactor src, impact-analysis riêng.
3. **Bằng chứng mỗi PR:** bảng before/after (số test, cluster, guard site); `npm test` xanh; coverage before/after của `src` liên quan không giảm (**supporting**, không phải proof cùng invariant).

Giữ subprocess (không chuyển tầng): process contract (exit code, stdout/stderr split), env seam, `process.cwd()`/worktree guard/`--dir`, lock giữa 2 process, PID liveness, signal/timeout, git transport/merge thật, regression test có tên bug ở tầng CLI (chuyển chỉ khi bug ở use-case). Khác error category cùng mechanism → cùng bảng với cột `expectedCategory`.

### Q3 — Script/package commands (tiers lùi lại)

Bước đầu **không** thêm tier manifest. Thêm:

```json
"test":         "(không đổi — proof DoD)",
"test:related": "FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node scripts/test-select.mjs",
"test:timing":  "… node --test --test-reporter=junit --test-reporter-destination=.fgos/cache/junit.xml 'test/**/*.test.mjs'; node scripts/test-timing.mjs .fgos/cache/junit.xml"
```

`test:timing` chỉ **report** (top-N file/test, Σ theo dir, so với baseline artifact); không threshold, không fail. Tier manifest (`unit`/`cli`/`e2e`) xét lại sau khi `test:related` chứng minh giá trị bằng số đo.

Quy ước (ghi `docs/how-to/run-the-right-tests.md` + `fgos-coding-implement` trỏ tới; `reading-map.md` dòng `test/`; `CHANGELOG.md` Unreleased vì script mới là user-visible): vòng lặp trong = `test:related`; trước `return` = `npm test` một lần; verify của item vẫn `npm test`.

### Q4 — Ưu tiên, mỗi dòng = 1 pilot đo độc lập

| # | Pilot | Ước tiết kiệm | Công | Acceptance riêng |
|---|---|---|---|---|
| P0a | Harness pin writer identity (hermetic) | 0s; **điều kiện tiên quyết** | nhỏ | `fgos-intake-4` pass cả trong và ngoài agent session; grep các test cùng giả định seq |
| P0b | CI chạy được suite | 0s; tiên quyết | nhỏ | CI job test có dòng `# tests N` |
| P1 | `enduser-index.test.mjs` → fixture store seed sẵn capture | ~100s clean (ước; 24s × 4 spawn) | nhỏ | before/after file time; equivalence: mọi assertion cũ giữ + `sourceCaptureId` vô điều kiện |
| P2 | 8 site real-`claude` → `NO_CLAUDE_ENV` | ≥17s (đo wiring-2) + ~6×10s doctor (ước) | 1 dòng/site | before/after per file; assert đi nhánh blocked như tsk-1opx |
| P3 | `tmpCwd()` không spawn (in-process init hoặc template copy — đo cả hai trên 3 file rồi chọn) | ~492 × 155ms ≈ 75s CPU (ước) | vừa | tier cli xanh; before/after Σ test/cli |
| P4 | Seed helper `addOk`… in-process **chỉ khi** stamp tầng CLI tái tạo đúng | ~320 × 155ms (ước) | vừa | per-helper, có ghi lý do giữ spawn nếu không tương đương |
| P5 | Validation matrix (189 test, 309s) → unit trên guard | ~250s CPU (ước) | vừa-lớn | Q2 bước 3 |
| P6 | Gate merge cluster (`fgos-merge*` 250s, `fgos-return*` 246s, `fgos-approve*` 7 mảnh) → `test/verbs/merge` | ~200s CPU (ước) | lớn | Q2 bước 3; mỗi gate giữ cửa CLI đại diện |
| — | `test/rust-host` (322s), `test/e2e` (157s) | không cắt | — | chỉ tách khỏi vòng lặp trong qua ownership manifest |

Sau P1+P2, trần per-file rơi từ 215s → 191s (`fgctl-init`) → 165s (`fgos-merge`): wall khi máy rảnh bị chặn bởi 2-3 file tuần tự dài, không phải tổng CPU. Việc kế tiếp theo wall là tách `fgctl-init`, `fgos-merge`, `fgos-return` (mỗi file >150s, đều vượt trần D5 ≤90s) — quyết riêng sau khi có số P1-P2.

### Q5 — Guardrail giữ DoD

1. `npm test` full là proof duy nhất tại `return`/`approve`/CI; `test:related` không bao giờ thay full trong `verify`.
2. Selector: 0 file → fail; path không giải thích được → full; manifest liệt kê chủ động.
3. Suite hermetic: kết quả không phụ thuộc env shell gọi (agent session vs thường) — harness tự pin/xoá env agent-session.
4. Mỗi PR gộp/chuyển tầng: before/after số test + guard site (proof) + coverage (supporting).
5. Mỗi verb giữ ≥1 test subprocess/lớp exit code + 1 test envelope ("cửa đại diện"); inventory script warn.
6. `test:timing` chỉ report; threshold là quyết định riêng khi có baseline sạch.
7. Không `--test-name-pattern` trong verify string mà không assert số test chạy (xanh giả).
8. Harness in-process (Phase 3) chạy song song với spawn ≥1 chu kỳ trước khi thành mặc định.

## 4. Chiến lược theo phase

**Phase 0 — Tiên quyết, theo đúng thứ tự, mỗi việc 1 item nhỏ:**
1. P0a harness hermetic (pin `FGOS_SESSION_ID`).
2. P0b CI thật sự chạy suite trên Node 20 (runner discovery portable).
3. **Green baseline cô lập** mới: `npm test` exit 0, chạy từ shell thường và từ phiên agent, máy rảnh, kèm `scripts/test-timing.mjs` + artifact. Bản 356s hiện tại chỉ là profile (exit 1).

**Phase 1 — Pilot độc lập (mỗi pilot 1 item, 1 số đo before/after so với green baseline):** P1 docs-index, P2 real-`claude`, `test:related` v1 (manifest-first; đo bằng số file chọn trung bình trên 20 commit gần nhất vs full và tỷ lệ fallback full), P3 fixture init. Đánh giá rồi mới mở rộng.

**Phase 2 — Fixture + audit (medium):** P4, inventory script, P5, P6; extract handler inline từ `bin/fgos.mjs` sang `src/verbs/` **chỉ** cho cluster đang audit; tuân impact-analysis gate.

**Phase 3 — `runCli(argv, ctx)` (long-term, điều kiện):** chỉ mở sau khi đối chiếu `docs/platform/packaging-distribution/` — nếu legacy-node là kênh deprecated có ngày kết thúc, không đầu tư. Nếu làm: `src/cli/run-cli.mjs`, `bin/fgos.mjs` wrapper mỏng (giữ path theo ownership boundary), harness `runInProcess()` cùng chữ ký `run()`, guardrail 8. Tier manifest (unit/cli/e2e) xét ở đây nếu selector đã chứng minh cần.

## 5. Trade-off

| Lựa chọn | Được | Mất / rủi ro |
|---|---|---|
| Manifest-first selector | an toàn, fallback full mặc định | Maintenance manifest; drift test bù; tỷ lệ fallback cao lúc đầu |
| Fixture store docs-index | -100s, assertion mạnh hơn | Phải chứng minh equivalence; fixture seed phải đúng shape capture |
| Fixture in-process | giảm CPU thật | Lệch stamp tầng CLI → chỉ đổi helper chứng minh được |
| Matrix → unit | giảm CPU + số test | Gộp nhầm guard → bắt buộc guard site |
| `runCli` | đòn CPU lớn nhất | Đụng entry toàn hệ thống; có thể vô nghĩa nếu Rust host thay legacy-node |

## 6. Điểm còn mở

- `tmpCwd()`: in-process `initStore` hay template copy — đo trên 3 file trong P3.
- Có test nào khác giả định writer-identity tách biệt giữa helper in-process và CLI spawn? Cần grep trong P0a.
- Phase 3 vs Rust-host roadmap: cần release posture chốt (spec.md đang có sửa tay "preview, legacy deprecated" chưa commit).
