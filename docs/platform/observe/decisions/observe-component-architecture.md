# observe component architecture

```txt
Document type: Decision record
Audience: Maintainer, implementer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/specs/observe.md at 947dc310396071a4d530216d5c06d05993d63bf5
Writer type: Agent draft writer
Canonical: Yes
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading or changing the stated scope and its contracts
Do not use this for: Standalone implemented-behavior proof or claims outside the stated scope
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/observe/spec.md
Supersedes: The mapped source location at atomic cutover
Superseded by: None
```

> Source carriage: Mapped subdivision and constitution kind placement. Original heading levels and numbers are retained. 
## 6. Lịch sử quyết định

### 2026-10-16 — Store lock chuyển sang kernel lock

Store lock đổi từ file `O_EXCL` có pid/TTL sang kernel lock `<fgosDir>/locks/observe.lock` của holder-lock: chờ 5 giây, không TTL, snapshot shard ghi dưới lock, holder chết thì lock nhả ngay. Đường cũ `.fgos/observe/.lock` thành thư mục tombstone. Quyết định gốc và bằng chứng: `docs/platform/holder-lock/spec.md` §15.



### D-ADR0037 (Observe Component Architecture)

- **Một component Observe**: Gom toàn bộ đo lường (`fgos metrics`) và friction (`fgos friction`) vào một crate Rust duy nhất (`packages/observe/rust`).
- **Subject tầng nền**: Subject đo lường là các thực thể tầng nền (`run`, `session`, `executor`, `case`); Work Item là source quan sát tuỳ chọn, không phải trung tâm đo lường.
- **Friction rời Work**: Lưu trữ friction tách rời khỏi `work.friction` trong Work event store; chuyển thành append-only shards trong `.fgos/observe/friction/<writerId>.jsonl`.
- **Writer Rust duy nhất**: Mọi component ghi friction hoặc metrics đều gọi qua native CLI của Rust host. Recursion guard chỉ còn cho `legacy-cli`.
- **`native`** (trước là `nativeOnly`, đổi tên 2026-11-14 khi gom về một trường khai báo): Các verb `metrics` và `friction` được đánh dấu `native: true` trong command registry, Node legacy CLI từ chối trực tiếp với exit 4.
- **Không backward compat**: Supersede luật "Preserve current commands" của `node-to-rust-migration.md` đối với `check/faults/dispatch-report/evolve`; chuyển hẳn sang `metrics` và `friction`.
- **Single path**: Một con đường thực thi duy nhất qua host router native.
- **Store Observe tracked, shard theo writer**: Lưu trữ dưới `.fgos/observe/<store>/<writerId>.jsonl` được git theo dõi; migration theo cursor `(src, seq)`.
- **Kênh phụ best-effort cho friction**: Ghi friction là kênh phụ không chặn luồng chính (lỗi ghi được ghi nhận thành `friction-write-failed` trong `invocation-faults`). Resolve host theo thứ tự ưu tiên: env (`FGOS_HOST_BIN`) → release manifest (`.fgos/installation`) → fault.
- **Work ngừng đọc friction**: Work không đọc friction; CLI friction của Observe không join state của Work.
- **Bỏ `learning.frictions`**: Bỏ `learning.frictions` khỏi event đóng item và bỏ mục `frictions` khỏi output của `list` / `show`.
- **Map output `check` và `evolve`**: Outcomes, settlement, learning, nag → `metrics outcomes`; entropy → `metrics entropy`; `evolve --submit` → `friction rank` + `fgos submit`.

### 2026-10-24 — Một cửa shard, doctor thôi tự admit run, protocol định danh outcome

Phiên chốt `plans/reports/council-261024-1947-harden-t3a-arbitration.md` §2 và quyết định chủ 30–31 trong `plans/261021-1118-harden-low-layers-bottom-up/plan.md`.

- Bốn store Observe ghi và đọc qua một cửa shard (§ 3): ba cái appender riêng và reader riêng của eval gộp lại, vì mỗi cái có lỗ khác nhau (theo symlink, một byte hỏng dừng cả store, dòng đứt nuốt record kế tiếp). Cửa lớn hơn tổng ba appender nó thay; đổi lại mọi store có chung một bộ luật.
- Lock chờ 4 giây thay vì 5 để host kịp trả `observe-lock-timeout` trước khi `invokeHost` cắt tiến trình ở 5 giây.
- **Thay thế (quyết định chủ 31)**: câu "Hermetic consumer invariant" về Node eligibility projection độc lập, dòng "Observe độc lập" ở § 1 theo nghĩa đó, và dòng doctor cũ (so eligible unique count với projection của Node) không còn hiệu lực. Fixture dùng chung `test/fixtures/run-layout/expected.json` là bằng chứng duy nhất về admission; doctor kiểm accounting của host và so số thư mục, không admit lại run ở Node. Lý do: một bản admission thứ hai ở Node kéo chậm doctor (khoảng 1,5 giây mỗi lần) và là bản sao phải sửa cùng lúc với Rust.
- Friction: migration tường minh, settle so instant (§ Friction); verb ghi dùng root main checkout.
- Phương án bị loại: áp luật root main checkout cho cả verb đọc (thêm khoảng 20 đến 25 ms mỗi lần gọi, chỉ verb ghi cần).

### 2026-11-15 — Bản ghi lệnh gọi sai: hai writer, một file vector

- Host Rust ghi lệnh gọi sai của verb native (`packages/observe/rust/src/invocation_fault.rs`), Node vẫn ghi cho verb legacy (`src/observe/invocation-fault-log.mjs`). Giữ hai writer cho đến khi verb Node cuối cùng chuyển sang host; lý do: Node phải ghi được một lỗi ngay cả khi host không với tới được (`src/observe/friction-client.mjs` ghi `friction-write-failed` khi `invokeHost` thất bại), còn host phải ghi lỗi của chính nó mà không dựng một tiến trình Node.
- Hợp đồng là `test/rust-host/fixtures/invocation-fault-vectors.json`, hai bên cùng đọc; mỗi hành vi có đúng một bằng chứng sở hữu (bảng vector), phía còn lại chỉ nối dây.
- Writer Rust che `message` theo argv; writer Node chưa (việc riêng, không sửa trong đợt này). Cặp writer có row `retiredBy` trong bảng `doors`.

### 2026-11-18 — Đo vận hành: một contract ghi và truy vấn

Plan `plans/261118-0936-ops-metrics`, discussion `docs/discussions/ops-metrics/DISCUSSION.md` (chủ dự án chốt ngày 2026-11-18; mỗi quyết định dưới đây có số và nhật ký hỏi đáp trong discussion đó). Facts hiện tại: [spec § Record contract v2](../spec.md#-record-contract-v2-đo-vận-hành) và § Friction.

Vấn đề: người vận hành không trả lời được các câu về nhiều plan (token theo plan/phase/provider/account/model, thời gian theo phase, lead time, tỉ lệ hỏng, friction theo loại và chữ ký) vì năm store Observe mỗi cái một hình, `observe.observation.v1` chỉ là hình đọc nội bộ với subject đóng thời Work, run không mang khoá plan, và 0 trên 98 kết quả run có token.

Quyết định:

- **Ba tầng, contract trước.** (1) Contract công khai ghi và truy vấn, phổ quát, ít đổi, làm tốt nhất và sớm nhất; (2) tích hợp với agent và hạ tầng, quan sát nhiều nơi mà không làm chậm hay làm sai bên bị quan sát, cải thiện dần; (3) lưu trữ, tự do đổi, chấp nhận chi phí migration. Bản ghi v2 mở rộng hình v1 (thêm `id` tất định, span `endTs`, `refs`, tách `attrs` khỏi `measures`, `basis`, `origin`, `detail` có trần và dấu che) thay vì thêm hình thứ hai; tiến hoá chỉ cộng thêm.
- **Observe không biết khái niệm của bên dùng.** Plan, phase, lead time, bảy thước đo bộ lái, "plan đứng yên", "head chết" là định nghĩa có tên của tầng trên chạy qua một ngữ pháp truy vấn chung. Phương án bị loại: verb `metrics plans` trong Observe, và code phát hiện riêng trong attention view.
- **Khai báo tại nơi dùng.** Observe giữ envelope, tên dùng chung và bộ máy; mỗi owner khai báo kind/attr/measure trong file của mình (crate nhúng, payload `core|domains/**/observe/kinds`, project `.fgos/observe/kinds`), gộp lúc chạy, test chặn trùng tên. Phương án bị loại: một registry tập trung hay enum đóng trong Observe, vì mỗi số đo mới sẽ phải sửa code Observe.
- **Tên theo OpenTelemetry.** Tên GenAI `gen_ai.*` (phiên bản semconv ghi trong `observe-names.json`) chỗ chuẩn đã có, `fgos.*` cho phần riêng; OTel đổi tên thì thêm alias, không đổi tên chuẩn tại chỗ. Phương án bị loại: SDK hay collector OTel trong lõi (nhận OTLP để sau, tên đã khớp nên rẻ).
- **Cửa ghi fail-open có bộ đếm.** Mở rộng luật kênh phụ best-effort của D-ADR0037 (Observe Component Architecture): ghi có hạn thời gian, lỗi không đổi kết quả của việc chính, và mỗi writer có bộ đếm accepted/written/duplicates/rejected/errors đọc được qua truy vấn (bài học từ skillstation). Phương án bị loại: chép sự thật của component khác vào store; run, unit, verify, head, plan được chiếu lại từ owner ở mỗi truy vấn (một nguồn sự thật).
- **Cost bằng token trước, tiền hoãn.** Không có hạ tầng giá và phần lớn account là subscription; không dựng bảng giá trong plan này. Parser token theo CLI viết mới bằng Rust; CLI không lộ số trả `reason` có tên, không bao giờ số đoán.
- **Code mới bằng Rust.** Phần viết mới viết Rust khi làm được mà không ảnh hưởng phần đang có; Node chỉ còn caller mỏng. Phương án bị loại: viết lại phần Node đã land chỉ để đổi ngôn ngữ.
- **Thước đo bộ lái.** Plan này dựng nguồn cho thước đo 1, 2, 7 (và 3 khi câu hỏi có sự kiện); thước đo 4, 5, 6 trả `unmeasured` kèm lý do, mỗi cái một dòng backlog.
- **Phát hiện, không cảnh báo.** Liveness/no-progress chỉ là phát hiện hiện trong `fgos dispatch inspect --attention`, không cảnh báo khi mailbox còn hoãn. "Plan đứng yên" = plan `running` không có commit, dòng board hay run attempt mang khoá plan trong N phút, N là config mặc định 60. Mỗi phát hiện là một định nghĩa có tên (query + ngưỡng + kind row); pace và trigger đánh thức là định nghĩa của plan supervisor, thêm sau không đổi code hay contract. Hành động theo kind row thuộc watcher của supervisor.
- **Friction.** Hai trục và chữ ký: `kind` (bug, instability, missing, awkward, doc) là loại gì, `layer` (thay danh sách thời Work, nhận `skill`) là ở đâu, `class` là chữ ký ổn định; `rank` gom theo chữ ký thay vì theo subject để thấy một vấn đề lặp ở nhiều plan; `resolve --class --reason filed:<id>` settle cả nhóm khi nó thành dòng backlog; plan và dòng backlog gắn bằng ref. Phương án bị loại: chép lỗi run sang friction (đã nằm trong bản ghi run, đọc từ đó), và migration lười trên đường ghi (giữ migration tường minh `migrate --to-records`, id cố định, shard cũ giữ tới khi cổng tích hợp xanh).
- **Câu hỏi cho chủ dự án.** Reader câu hỏi và tổ chức component câu hỏi (người hỏi, nơi xem chung, đánh thức) không thuộc ops-metrics; verb Rust `fgos questions ask|answer` của component đó phát `fgos.question.asked|answered` qua cửa ghi và tự khai báo chúng. Tới lúc đó phần chờ chủ dự án của thước đo 2 và thước đo 3 trả `unmeasured`.

Ngoài phạm vi và để lại thành dòng backlog: nguồn thước đo 4, 5, 6; nghỉ hình v1 khi `WorkSource` chuyển; đưa case, eval, snapshot, invocation-faults lên contract; `metrics runs`/`discussions` thành preset của truy vấn; giữ số đo của plan sau khi run dir bị prune; nhận OTLP; tiền và bảng giá; lời gọi Git `walk_changes` cho lịch sử plan (truy vấn `fgos.plan.*` mất 30-80 giây).
