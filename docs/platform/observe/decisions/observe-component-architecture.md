# Added in candidate: observe component architecture

```txt
Document type: Decision record
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/specs/observe.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/observe.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding. New subdivision authorized by Step 8 and constitution kind placement. Original heading levels and numbers are retained. Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.

## 6. Lịch sử quyết định

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
