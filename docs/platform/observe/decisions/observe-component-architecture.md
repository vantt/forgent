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
- **`nativeOnly`**: Các verb `metrics` và `friction` được đánh dấu `nativeOnly: true` trong command registry, Node legacy CLI từ chối trực tiếp với exit 4.
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
