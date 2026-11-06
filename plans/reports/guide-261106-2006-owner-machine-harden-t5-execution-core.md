# Hướng dẫn cho máy owner: làm cứng Execution Core, Dispatch, Confinement, Seat Binding và Run Result (T5)

Hướng dẫn này cho máy owner và máy thứ ba (ba workspace: forgentX, mdview, mcp-skill-hub). fg-server2 đã tự land từng phase của T5 và chạy cổng cho từng phase (quyết định 61, 5a). Anh chọn giờ cập nhật; nên cập nhật **một lần** từ main sau khi T5 đóng, không dừng ở một commit giữa chừng.

Plan: [`plans/261106-0950-harden-t5-execution-core`](../261106-0950-harden-t5-execution-core/plan.md). Báo cáo đóng: [closing-261106-2006](closing-261106-2006-harden-t5-execution-core.md).

## Cảnh báo: không kích hoạt release dựng từ khoảng `9c35308d9` .. `92095f40a`

Từ `9c35308d9` (P03, che mọi home login) tới bản sửa `ba4925e54` (đuôi `92095f40a`), **mọi ghế pi và codex chạy trong bwrap không khởi động được**: mask che luôn thư mục cài đặt của CLI nằm trong home login (`~/.pi/agent/install`, `<CODEX_HOME>/packages/.../current`). Release dựng từ main ở bất kỳ commit nào trong khoảng đó đều có lỗi này. Chỉ dựng release từ `92095f40a` trở về sau (main hiện tại là được). Bản sửa bind lại chỉ-đọc ba thư mục `bin`, `install`, `packages` của CLI, file login vẫn bị che.

## Đã land trên main

| Phase | Commit | Thay đổi người dùng thấy |
|---|---|---|
| Lô A–D (4/11, trước plan) | `0f6843fc6`, `a56d56541`, `fc0d237d3`, `77861ee63..7b25e0b3c`, `8dabc57d1..8af1a6b71`, `eab8601b9..a6251673a`, `d49de8fa4`, `3875eeb3c` | Phần lớn đã nêu trong mục "các bản sửa đầu của T5" của [hướng dẫn T4](guide-261104-1651-owner-machine-harden-t4-run-supervisor.md). Thêm lô D: hai probe tài khoản chỉ coi một dòng là hết lượt khi nó khớp danh sách lời hết lượt của bộ phân loại (chữ "rate limit" hay "quota" trơ trọi không còn); danh sách account được đọc lại ở mỗi lần bind. |
| P02 lớp dưới không import Dispatch | `98e1c5824..7a4fa3654` | Không đổi hành vi. Một giá trị sai của `dispatch.gateKillGraceMs` hay `dispatch.cancelWaitMs` giờ thoát mã 1 (trước là mã validation); thông báo giữ nguyên. |
| P03 cửa credential và confinement | `accc31973..51d5d02dd`, `c3489b61a..8d97f97be`, sửa lỗi pi/codex `8f8b66eb3..92095f40a` | Worker bị confine không đọc được kho login nào khác của máy (kho của account inventory, home login mặc định và biến home của từng CLI, `homeEnv` của executor), cũng không đọc được home riêng của dispatch khác. Login gia hạn trong private home chỉ được **dàn** lúc ghi ngược; refresh-ahead kế tiếp áp nó sau khi probe chứng minh nó thuộc account được thuê (claim provider ký trong token Codex). Home bị giữ sau nhiều lần dàn lỗi **tự giải lại** nhờ record chỉ host giữ (`attempt-home.json`) cạnh mỗi home. |
| P04 nửa A: project chỉ được siết confinement | `10a6b8425..fcdffd361` | `.fgos/config.yaml` của project không còn hạ được confinement của capability, đổi sang policy khác, mở `allowInvocationOverride` hay tắt `runner.confinement.strict`: bị từ chối `config-confinement-lowered` tại dòng của project. `runner.confinementPolicies` chỉ được khai ở file global. |
| P05 trust store | codex/agy `de7454638..8f521eb2f`, claude `ca69911f6..6b5c80f9b` | Store codex/agy nằm sau link được ghi vào đích của link và vẫn là TOML hợp lệ. Mục trust thư mục của claude trong `~/.claude.json` chỉ được **thêm**, đọc lại và thêm lại khi mất, không bao giờ bị xoá (quyết định 66). Login claude của pane bị confine được gia hạn tại nguồn trước khi chạy. |
| P06 launch hỏng trả lại home và pane | `9d70a47cd..d481b1cf0` | Một launch bị từ chối trước khi giao cho supervisor (vd. herdr không mở được pane) trả lại private home và pane; adopt của attempt chưa chạy nhả pane theo khoá. |
| P07 sửa nhỏ | `3f81fa916..36b59f731` | Các ghế khởi động cùng lúc dùng chung một server herdr của phiên worker. `fgos dispatch recover` chỉ còn gợi ý `adopt`. Bản ghi `assignments` của provider state bị xoá ngay khi outcome của attempt đã ghi. Provider dừng vì login hay vì hết lượt chỉ còn đọc từ receipt. |
| P08 Run Result suy ra một lần trong Rust | `6a546bd11..7cb2cd535` | `result.json` mới luôn là bản 3, kể cả khi lease bị từ chối. Lý do outcome giờ ở dạng của Rust (vd. `infra-exec-failed`, `provider-blocked`), thấy trong `fgos dispatch show-run`. |
| P11 schema giữ luật kiểu của runner config | `68c426c31..e5ac48e88` | Config runner sai hình dạng bị cửa config từ chối từ schema, nêu file, dòng, cột và path (`config-schema`). Vài chỗ chặt hơn trước: `confinement` của invocation chỉ nhận các khoá đã biết; chuỗi chỉ có khoảng trắng bị từ chối; `via: api` bị từ chối. |
| P10 cắt Execution Core, thử lại brief bị mất | `59f6b6d3a..c5242df59` | Ghế mà brief chưa tới agent (receipt `abandoned*` hay `terminal:foreground-not-agent`) được chạy lại **một lần** trên cùng executor và account; ghế ghi đã đổi worktree thì dừng `partial-writes`; mất lần hai thì dừng có tên `brief-not-delivered`. Dry bind áp độc lập hai chiều và bind unit `blind` ở chế độ blind. Bản ghi unit không đọc được khi resume báo `unit-record-unreadable`. |
| P12 cấu trúc test, gộp dòng doctor | `cfff2aa7f..e3de56c54` | Dòng doctor `executor-posture-coverage` bị gộp vào `seat-binding-dry-bind` (cùng ba kết quả, cùng thông báo). |
| P09 cắt Dispatch, câu trả lời một chữ | `d3c0d0562..d3ed00d67` | Việc chỉ đọc mà report chỉ có một chữ như `ok`, `yes`, `no` giờ là câu trả lời có bằng chứng (`pass`), không còn `execution-failure` (quyết định 68). Brief chỉ đọc yêu cầu một câu nói rõ đã trả lời hay làm gì. |

**Chưa land:** P04 nửa B (`command`/`args` của executor chỉ ở file global) nằm trên nhánh `origin/harden/t5-p04b`, chờ anh cho phép chuyển config (mục cuối). Các việc nối tiếp về ghế không khởi động (`harden/t5-seat-start`) chưa land.

## Trước khi cập nhật (chỉ đọc, bắt buộc)

Làm trên **cả ba workspace**, với release **cũ** vẫn đang kích hoạt. Không sửa file nào ở bước này.

1. **Dừng.** Không còn `fgos run`, `fgos workflow`, dispatch hay lead nào đang chạy trên máy.
2. **Ghi lại release hiện tại** để quay lại được: `grep artifactDigest .fgos/installation/activation.json` trong từng workspace; chép dòng đó vào ghi chú.
3. **Census config cho hai thay đổi schema đã có trên main** (P04 nửa A: luật chỉ-siết; P11: luật kiểu ở schema). Release cũ không biết các luật mới, nên census chạy **code mới qua dev door** trong khi release cũ vẫn kích hoạt; lệnh chỉ đọc config, in path và mã lỗi, không bao giờ in giá trị.
   - Kéo main mới về một checkout riêng để dựng (ví dụ worktree `<wt>` tại `origin/main`), `CARGO_TARGET_DIR` riêng trên ext4, không đặt trên `/tmp`.
   - Mốc so sánh với release cũ, trong từng workspace: `fgos config check --json </dev/null > /tmp/cfg-old-<ws>.json`.
   - Luật mới, trong từng workspace: `CARGO_TARGET_DIR=<target> npm --prefix <wt> run -s fgos:dev -- config check --json </dev/null > /tmp/cfg-new-<ws>.json`.
   - **Kết quả mong đợi:** `ok: true` và không có dòng `severity: "fail"` nào ở bản mới mà bản cũ không có. Trên fg-server2 bản mới cho 0 lỗi (43 cảnh báo `config-comment-migrated-why` và 1 `config-redundant-value`, y như trước).
   - **Một lỗi trông như thế này:** dòng `severity: "fail"` với path `runner.*` và một trong các mã: `config-confinement-lowered` (project hạ mode, đổi policy, mở `allowInvocationOverride` hay tắt `strict` so với file global hoặc chuẩn), `config-key-out-of-scope` (project khai một mục `runner.confinementPolicies`), `config-schema` (hình dạng mà schema giờ từ chối, ví dụ executor có `command` mà thiếu `args`, invocation `via: cli` thiếu `command`/`args`, khoá lạ trong `confinement` của invocation, chuỗi chỉ có khoảng trắng, `via: api`).
   - **Gặp lỗi thì:** không cập nhật workspace đó. Sửa file trong một commit riêng của project (chuyển policy sang `~/.fgos/config.yaml`, bỏ dòng hạ confinement, sửa hình dạng), chạy lại hai lệnh, hoặc gửi em path và mã lỗi (không gửi giá trị).
4. **Home và bản login đang bị giữ:** `fgos doctor </dev/null` với release cũ; ghi lại dòng `credential-copies-retained`. Home bị giữ do release cũ đếm không có record chỉ host giữ, nên release mới **không** tự giải nó: vẫn khôi phục bằng tay như dòng doctor ghi.
5. **Bản ghi `assignments` cũ của provider state (H-T5f), tuỳ chọn:** đếm bằng
   ```
   node -e "const s=require(require('os').homedir()+'/.fgos/runtime/provider-capacity/state.json'); console.log('assignments', Object.keys(s.assignments||{}).length, 'leases', Object.keys(s.leases||{}).length)"
   ```
   Bản ghi do release trước P07 viết không bao giờ được xoá tự động (fg-server2 có 636). Chúng vô hại. Muốn dọn thì chỉ khi không có tiến trình fgOS nào chạy và `leases` là 0: sao lưu file rồi xoá các khoá trong `assignments`. Không bắt buộc.

## Cập nhật

1. Chờ không còn dispatch nào chạy.
2. `git pull --rebase` ở forgentX.
3. Build, stage và kích hoạt release như thường lệ (mdview, mcp-skill-hub rồi forgentX), từ main ở `92095f40a` hoặc mới hơn. Lệnh `fgos` thường chạy release đã kích hoạt, nên hành vi mới chỉ có sau bước này.
4. `fgos doctor </dev/null` trong từng workspace.

Đợt này không đổi file config của anh (trừ khi bước census bắt sửa). Các file mới trên đĩa đều do fgOS tự tạo.

## Kiểm sau cập nhật

**Doctor.** Các dòng của lớp này thay đổi:
- `executor-posture-coverage` **không còn**; `seat-binding-dry-bind` thêm `; posture: execute -> …` vào thông báo khi đạt, và báo lỗi posture bằng đúng câu cũ.
- `confinement-probe-freshness`: probe chạy lại một lần (danh sách kho login nằm trong dấu vân tay của probe), rồi đạt.
- `confinement-blind-read`: đạt.
- `credential-copies-retained`: thêm dòng riêng cho bản login dàn từ private home đang chờ cổng probe hoặc không nêu account được ký, và dòng `set-aside` cho bản agent bị gác sau các lần gia hạn không ra gì; fail khi một home v2 không có cả `envelope.json` lẫn `attempt-intent.json`.
- Quét file lock thấy thêm hai lock máy `worker-session` và `agent-trust-store`.

**Probe một account mỗi provider** (chỉ đọc, chạy CLI thật trong sandbox):
```
fgos dispatch probe-account --provider openai --account <account> </dev/null
fgos dispatch probe-account --provider <provider khác> --account <account> </dev/null
```
Mỗi invocation bị confine phải `ok` (`confined=true`), verdict `healthy`. Trên fg-server2 `openai` 4/4 ok (codex-cli-bwrap, codex-herdr, pi-herdr, pi-cli-bwrap). Một pi hay codex báo không khởi động được nghĩa là release dựng từ khoảng có lỗi ở trên.

**Smoke:** một `fgos run "Reply with exactly the word OK"` chỉ đọc phải ra `pass` (trước P09 nó ra `execution-failure`, mã 11).

## Hành vi anh sẽ thấy

- `~/.claude.json` giữ mục trust thư mục của các worktree fgOS: fgOS chỉ thêm, đọc lại, không bao giờ xoá. Pane claude không confine dùng config claude thật của anh.
- Worker bị confine không đọc được kho login nào ngoài login của chính nó; `gh` và `~/.ssh` vẫn đọc được; socket abstract và dịch vụ localhost vẫn tới được (backlog `p-x4qeqdvfl5`).
- Home bị giữ có record tự giải khi chạy `fgos doctor --fix` hoặc khi attempt kế tiếp cùng temp root kết thúc.
- Ghế không bao giờ khởi động được chạy lại một lần. `fgos-cook` cũng chạy lại dispatch như vậy một lần, nên một ghế luôn mất brief có thể khởi động tới 4 lần.
- Câu trả lời một chữ của việc chỉ đọc là `pass`.
- `fgos dispatch recover` chỉ gợi ý `adopt`; `--intent reassign` dừng với lý do.
- **Login xai (qua pi hay omp) và claude được gia hạn bên trong pane không bao giờ tự áp**: token của chúng không mang account do provider ký. Bản đó nằm trong `pending/` của kho account, `credential-copies-retained` liệt kê nó; anh chép tay vào kho của account nếu muốn giữ login mới (refresh token cũ trong kho có thể đã bị pane dùng mất). Codex được áp tự động sau probe.
- Lý do outcome trong `fgos dispatch show-run` của bản ghi mới ở dạng Rust; bản ghi cũ đọc như trước.

## omp 18.17

- Sau mỗi `omp update`, chạy `omp --profile=<p>` một lần cho **mỗi** profile được thuê, ngoài fgOS: omp 18.17 mở trình hướng dẫn lần đầu cho từng profile, và ghế omp trong pane herdr chết ở màn hình đó (thấy trên design-lap).
- Chạy omp một lần **ngoài sandbox** sau khi cập nhật để nó giải nén thư viện native; trong bwrap nó không ghi được chỗ đó. Một dòng doctor kiểm việc này (`omp-natives-present`) đang làm trên `harden/t5-seat-start`, chưa land.

## Định dạng trên đĩa

| Định dạng | Release trước đọc được? |
|---|---|
| `<tempRoot>/<dispatchId>/attempt-home.json` (record chỉ host giữ, 0600) | Bỏ qua; home vẫn bị giữ như trước. |
| Bản dàn trong `pending/` tên `<ts>-agent-<pid>-<hex>`, thư mục `torn/` | Release trước **áp bản `-agent-` mà không qua probe**. Trước khi quay lại, xem `credential-copies-retained` và xoá hoặc giữ riêng các bản `-agent-` anh không muốn bị áp. |
| `attempt-intent.json` có trường `terminal` | Adopt cũ bỏ qua trường lạ, đóng attempt mà không quyết pane. |
| Không còn `controller/trust-context.json` cho claude | Bước dọn trust cũ không thấy gì, không xoá gì. |
| `result.json` bản 3 cho lease bị từ chối; lý do dạng Rust | Có (reader bản 3 đã có). |
| `assignments` của provider state bị xoá sau outcome | Có (thiếu mục = không sticky). |
| Hàng lock `worker-session`, `agent-trust-store` | Release cũ không dùng chúng. |

## Cách quay lại

1. Chờ không còn dispatch nào chạy.
2. Xem mục `pending/` ở bảng trên.
3. Trong từng workspace: `fgctl upgrade --from ~/.local/state/fgos/releases/<artifactDigest đã ghi ở bước 2 trước khi cập nhật>` (hoặc `previousArtifactDigest` trong `.fgos/installation/activation.json`).
4. `fgos doctor </dev/null`.

Release cũ đọc được mọi bản ghi release mới viết. Khi quay lại, release cũ lại gợi ý `resume-driver`/`reassign-driver` và lại áp bản login `-agent-` không qua probe (lỗ A8 mở lại cho tới khi cập nhật lại). Revert mã nguồn: revert các commit trong bảng trên main theo thứ tự ngược.

## P04 nửa B: chuyển lệnh executor sang file global (**chưa làm — chờ anh cho phép**)

Nhánh `origin/harden/t5-p04b` làm `command`, `args`, `permissionMode` của executor và invocation, `backend`/`privateHome`/`isolatedSession` của confinement launch, và `aliases` của capability thành **chỉ ở file global**. Khi nhánh đó land, mọi project còn khai các khoá này bị từ chối ở mọi lần đọc config, trên mọi máy cùng lúc. Theo quyết định 64: chuyển giá trị trước, schema land sau. **Không làm bước nào dưới đây cho tới khi anh cho phép**; em sẽ báo giờ land.

1. **Census, chỉ đọc**, trên từng máy và từng project dùng fgOS (in path, không in giá trị): từ gốc project chạy `npm --prefix <checkout fgOS ở nhánh harden/t5-p04b> run fgos:dev -- config check` và đọc các dòng `severity: fail` có path `runner.*`. Trên repo này nó liệt kê đúng 4 path (sau khi `prefer` của capability vẫn được khai ở project):
   - `runner.executor.command`
   - `runner.executor.args`
   - `runner.executors.gitnexus.invocations`
   - `runner.executors.herdr.invocations`
   (báo cáo census [`research-261106-1202-project-executor-commands-census.md`](research-261106-1202-project-executor-commands-census.md) liệt kê y vậy.)
2. **Chép vào `~/.fgos/config.yaml`** của từng máy (gộp vào khối `runner:` đã có):
   - cả mapping `runner.executor` (`command` và `args` cùng nhau; `args` của project khác `args` global của fg-server2, anh chọn bản máy muốn dùng);
   - cả hai mục `runner.executors.gitnexus` và `runner.executors.herdr` lấy từ `.fgos/config.yaml` (mỗi mục cần `kind` của nó, gitnexus cần thêm `for` và `scanTarget`; file global được kiểm riêng).
   `prefer` của capability ở lại file project.
3. **Một commit trong repo này** xoá khỏi `.fgos/config.yaml`: `runner.executor`, và danh sách `invocations` của `runner.executors.gitnexus` và `runner.executors.herdr` (mục còn `kind`, `for` mà không có lệnh thì để lại được).
4. **Kiểm trên từng máy:** `npm --prefix <checkout> run fgos:dev -- config check` không còn dòng `fail`; sáu test đọc config thật của repo (danh sách trong báo cáo lead P04b) chuyển xanh.
5. Chỉ sau đó mới land nhánh, trong một khung giờ đã báo.
