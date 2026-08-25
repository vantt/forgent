# Knowledge registry — kế hoạch thi công (tsk-28x)

**Trạng thái:** chờ chia con (`tsk-28x` đang `awaiting-human` ở stage `planning`).
**Nguồn thiết kế:** `docs/history/compound-learn-artifact-registry/DISCUSSION.md`
— §6.7 (bức tranh bốn nhãn + Q1-Q8), §7 (task + thứ tự), §3 (bảng vấn đề),
§4 (18 D-ID đã chốt).

Kế hoạch này viết cho **một agent tự code không có ngữ cảnh hội thoại**. Mỗi
phase file tự chứa: đọc phase file + các link trong đó là đủ làm, không cần đọc
lại toàn bộ DISCUSSION.md 1700 dòng.

## Vấn đề đang giải (một đoạn)

`fgos-coding-compounding` viết tài liệu end-user bằng cách **tự nghĩ ra tên file
mỗi lần**, và quyết grow-vs-create chỉ bằng `fs.existsSync` trên đường dẫn tự
đặt đó. Hệ quả đo được trên `main` 2026-08-25: **268 tài liệu**, **+50 trong 7
ngày** (~7,1/ngày), **28%** tài liệu chạm ≥2 thực thể ngay trong tên file, và
các cụm trùng chủ đề rõ ràng (3 file cùng nói về thu hồi worktree mồ côi, tên
khác hẳn nhau). Cơ chế chống trùng **đã tồn tại** (`fgos authoritative-match`,
`tsk-1lv-6`) nhưng phủ **67/331 ≈ 20%** và **không có caller nào ngoài unit test
của chính nó** ⇒ đang trả kết quả sạch giả.

## Bốn invariant khoá — không phase nào được vi phạm

| # | Invariant | D-ID |
|---|---|---|
| 1 | `activeDoc(topicId, role) <= 1` | D-tsk28x-14 |
| 2 | Không có "extra doc cùng role" lúc ghi; muốn tách phải qua **topic split có lineage** | D-tsk28x-14 |
| 3 | `docPath` cũ là **lịch sử, không sửa**; mọi lookup đi qua resolver `oldPath → currentPath` | D-tsk28x-9 |
| 4 | Tài liệu dùng `provisional \| active \| superseded \| retired`; **`draft` chỉ thuộc tầng chất liệu** | D-tsk28x-15 |

## Mô hình dữ liệu (dùng chung mọi phase)

```
topicId, purposeSlug, purposeTitle, entities[]
lineage: splitFrom | mergedFrom | renamedFrom
role, framework, mode
docLifecycle: reserved | provisional | active | superseded | retired
currentPath, aliases[], sourceCaptureIds[]
```

Layout đích: **`docs/<purposeSlug>/<role>.md`**. Diataxis **không** làm thư mục —
nó nằm trong frontmatter (`framework: diataxis`, `mode: explanation`).

## Phases

| Phase | Nội dung | Chặn bởi | Là cổng cho |
|---|---|---|---|
| [01](phase-01-registry-domain-model.md) | Domain model + reducer + invariant | — | 04, 05 |
| [02](phase-02-resolver-alias.md) | Resolver `oldPath→currentPath` | 01 | 07 |
| [03](phase-03-classifier-inventory.md) | Classifier/inventory đọc-thuần 268 docs | — | **04, 11** |
| [04](phase-04-bootstrap-registry.md) | Bootstrap registry từ output 03 | 01, **03** | 06 |
| [05](phase-05-registry-verbs.md) | Verb `fgos topic *` / `fgos doc *` | 01 | 06 |
| [06](phase-06-attest-gate.md) | `fgos knowledge attest` + gate + enforce | 04, 05 | **09** |
| [07](phase-07-consumers-resolver.md) | `doc-sources`/`docs-index` qua resolver | 02 | **11** |
| [08](phase-08-projections-doctor.md) | Hai ảnh cuối cùng + 8 doctor check | 01, 02 | — |
| [09](phase-09-writer-skill.md) | Skill `fgos-coding-knowledge` registry-first | 06 | 10 |
| [10](phase-10-writer-canary.md) | Writer canary | 09 | **11** |
| [11](phase-11-migration.md) | Migration dry-run → apply/fold | 03, 07, **10** | 12 |
| [12](phase-12-deprecate-compound.md) | Deprecate `fgos compound` | 11 | — |

### Ba cổng cứng — vi phạm là hỏng dữ liệu, không phải chậm tiến độ

1. **03 trước 04.** Bootstrap phải gán `(topicId, role)` cho 268 tài liệu; việc
   gán đó *chính là* phân loại. Bootstrap không có classifier ⇒ 268 dòng registry
   rỗng nghĩa ⇒ invariant #1 vô hiệu vì cả hai khoá đều rỗng.
2. **06 trước 09.** Bật enforcement ở producer verb trước khi đụng writer. Writer
   là **skill prose**, không gì cưỡng chế nó — chỉ verb chặn được.
3. **10 XANH trước 11.** Migration chỉ chạy sau khi đã chứng minh writer mới thật
   sự biết registry.

Trong phase 11 còn cổng riêng: **dry-run sạch trước, apply sau**.

### Xung đột footprint

`bin/fgos.mjs` bị **phase 05, 06, 07** cùng chạm ⇒ **không chạy song song**. Chạy
`fgos conflicts` trước mỗi đợt dispatch. Phase **03 và 01/02 chạy song song
được** (03 đọc-thuần, không chạm `src/`).

## Acceptance của cả kế hoạch

- `npm test` xanh (mọi harness mới nằm trong đó).
- `fgos doctor` xanh, gồm 8 check knowledge mới.
- `fgos doc-sources <oldPath>` **vẫn trả capture** sau migration.
- Tổng source captures reachable **không giảm** trước/sau migration.
- `docs/doc-registry.md` mở ra thấy đúng hình dạng cây tài liệu.

## Khuôn có sẵn trong repo — dùng lại, đừng phát minh

| Cần làm | Khuôn có sẵn |
|---|---|
| Ghi event | `src/state/events.mjs` → `withEventsLock` + `appendEventLocked` |
| Fold event thành view | `src/state/replay.mjs` — switch `case 'work.xxx':` |
| Thêm verb CLI | `src/cli/command-registry.mjs` (`COMMAND_REGISTRY`) + `bin/fgos.mjs` |
| Doctor check | `src/setup/registrations.mjs` → `registerCheck({id, description, check})` |
| Config default | cùng file → `registerConfigDefault({id, key, shape})` |
| Doctor auto-fix | cùng file → `registerFix({id, fix})` |
| Chỉ mục sinh tự động | `docs/decisions/index.md` (từ `fgos decision-index`) — khuôn "generated, never hand-edit" |
| Mảnh chuyên môn dùng chung cho skill | `.agents/skills/_shared/` |
| Thông điệp từ chối nêu cách sửa | `docs/explanation/fsm-refusal-messages-name-a-remedy...` |
