# Knowledge Registry State Contract

```txt
Document type: Contract
Audience: Human reviewer, maintainer, implementation agent
Purpose: Define registry identity and attestation constraints plus end-user authoring and index contracts
Design status: Candidate carry under L13-4; not an authority promotion or implementation change
Last reviewed: 2026-10-23
Related:
- docs/platform/work-state/spec.md
- src/report/enduser-index-generate.mjs
- src/setup/registrations.mjs
```

Owner: Work-state (existing `src/state/knowledge-registry.mjs` registry and projection boundary)
Status: Live candidate holder for maintained registry rules, subject to the existing transitional switchboard; not a proposal snapshot.
Canonical for: Framework/role vocabulary, durable document identity, lifecycle and attestation constraints consumed by the existing registry, CLI and producer skill. This does not claim the whole redesign, migration or resolver horizon is implemented.

The source clauses below are conserved verbatim from `docs/architect/knowledge-registry-redesign.md` at the source pin recorded in the carry receipt. Section numbering remains stable so the existing §5.5/§7.2/§7.3/§7.4/§8/§13.5/§14.1/§14.3 citations can resolve without guessing an alias write path. §13.5 describes the migration rule, not permission to run a migration. The original design's open questions, planned work and implementation sequencing are not promoted. Existing end-user Diataxis paths remain registry-managed and unchanged.

Owning proof: `test/state/knowledge-registry.test.mjs` (registry/schema semantics), `test/state/knowledge-bootstrap.test.mjs` (bootstrap role vocabulary), `test/cli/knowledge-verbs.test.mjs` and `test/cli/knowledge-attest-gate.test.mjs` (CLI producer wiring). No new registry mechanism or test-only bypass is introduced.

## 5. Vocabulary

### 5.1 Capture

Capture is raw recorded material from work: outcome, friction, decisions, questions, answers, verification evidence, and other event-log facts. Capture is not a finished document and should not be blocked on human approval.

### 5.2 Material

Material is extracted evidence selected from capture for possible knowledge use. If the previous discussion uses "draft" for this layer, keep that meaning here. Material can be draft-like without claiming to be authoritative prose.

### 5.3 Topic

A topic is a long-lived subject slot. It answers: "what problem domain or reader job is this knowledge about?"

A topic grows slower than work items. A normal retrospective writer must not silently open a new official topic whenever it cannot find a path. Topic creation goes through `fgos topic register` or through migration/classification tooling whose output is reviewed by the registry harness.

### 5.4 Purpose

Purpose is the reader-facing form of a topic. It appears in the filesystem as the directory slug:

```txt
docs/knowledge/<purposeSlug>/<role>.md
```

Purpose must not be a restatement of a single work item title. It must describe a reusable reader job or problem domain.

### 5.5 Role

Role is the knowledge-artifact role within a topic. It answers: "what kind of knowledge artifact is this?"

Examples:

- `decision` - records a choice, rationale, supersession, and alternatives;
- `runbook` - tells an operator how to handle a recurring situation;
- `pitfall` - records a failure shape and how to avoid or recognize it;
- `pattern` - records a reusable design or execution pattern;
- `evidence` - preserves a measured result or audit finding.

Role is not a synonym for Diataxis mode. Two roles can share the same writing mode but have different lifecycle policy. A decision can be superseded; a pattern is refined; a runbook can be retired when its operational surface disappears.

Role vocabulary is closed-with-a-door. New roles are proposed when existing roles do not fit, but normal writers assign the nearest existing role and record the proposal rather than expanding the vocabulary immediately.

### 5.6 Entity

Entity is an open, multi-value metadata axis. It names things the document touches: subsystems, commands, actors, stores, concepts, or other durable objects. Entity never becomes a directory, because many documents legitimately touch multiple entities.

### 5.7 Framework And Mode

Framework and mode describe how to write the document. Diataxis is the first framework:

```txt
framework: diataxis
mode: explanation
```

Diataxis modes remain closed to tutorial, how-to, reference, and explanation. Other writing frameworks can be registered later, and each framework owns its own closed mode vocabulary.

Framework/mode must not be used as the primary filesystem layout. Otherwise the first non-Diataxis framework recreates the same structural problem under another name.

### 5.8 Document Lifecycle

Documents use the lifecycle vocabulary:

- `reserved` - a registry slot and path are held before prose exists;
- `provisional` - prose exists and is linked, but is not yet authoritative;
- `active` - the authoritative document for its topic and role;
- `superseded` - replaced by another document or topic lineage;
- `retired` - no longer current, with successor or reason recorded.

Do not use `draft` for document lifecycle while `draft` is already used for extracted material. That would put the same label on two different axes.

## 6. Identity Model

### 6.1 Cardinality

The central invariant is:

```txt
activeDoc(topicId, role) <= 1
```

There is no "extra doc id" escape hatch at write time. A technical `docId` may exist as a registry row identifier, but it never grants semantic permission to create another active document for the same topic and role.

If the system needs more than one active document for what appears to be the same topic and role, the topic boundary is wrong. The path forward is an explicit topic split, topic merge, or role change with lineage.

### 6.2 Path Projection

The normal projected path is:

```txt
docs/knowledge/<purposeSlug>/<role>.md
```

This path is a projection of registry state, not the source of truth. It gives the filesystem the structure humans want from `ls docs/`, while the registry preserves identity across moves.

### 6.3 Current Path And Aliases

Each document slot has:

- `currentPath` - the only path accepted for new attestations;
- `aliases` - historical paths used for read resolution only.

Aliases are not write targets. A new capture must not tag an alias path. If a legacy writer commits a file at an old path, the producer door refuses it even if the alias resolves for reads.

### 6.4 Topic Lineage

Topic lineage records:

- rename: one topic keeps identity, purpose label changes;
- split: one topic retires or narrows, two or more successor topics become active;
- merge: multiple topics retire into one successor;
- retire: topic no longer accepts active documents.

Lineage is what makes "many documents after a split" legitimate. Multiple active documents with the same role are allowed only when they belong to different successor topics.

## 7. Registry Model

The registry source is event-sourced. Projections are derived.

### 7.1 Topic Events

```txt
topic.register
topic.rename
topic.split
topic.merge
topic.retire
```

A topic record contains:

```yaml
topicId: worktree-reclaim-safety
purposeSlug: worktree-reclaim-safety
purposeTitle: Worktree reclaim safety
description: How fgOS distinguishes reclaimable worktrees from live work
entities: [worktree, claim, session-liveness, uncommitted-work]
lifecycle: active
lineage: []
```

### 7.2 Role Registry

Role vocabulary is a registry with explicit policy:

```yaml
role: pitfall
meaning: A recurring failure shape, its cause, and how to avoid or recognize it
defaultFramework: diataxis
defaultMode: explanation
requiredFields: [symptom, cause, prevention]
lifecyclePolicy: refine
```

Rules:

1. A role name must not equal any framework mode name. For example, `reference` is not a valid role name while Diataxis has `reference` as a mode.
2. A role exists only when it carries different lifecycle, metadata, or consumption policy.
3. A one-off role with only one document is suspicious and must be surfaced by the harness, not silently accepted forever.

### 7.3 Document Events

```txt
doc.reserve
doc.mark-rendered
doc.move-path
doc.promote
doc.supersede
doc.retire
```

A document record contains:

```yaml
docId: doc-worktree-reclaim-safety-pitfall
topicId: worktree-reclaim-safety
role: pitfall
framework: diataxis
mode: explanation
lifecycle: provisional
currentPath: docs/worktree-reclaim-safety/pitfall.md
aliases:
  - docs/explanation/orphaned-worktree-reclaim-must-check-for-live-uncommitted-work.md
  - docs/explanation/why-reclaimorphanedcheckout-refuses-a-live-session-worktree.md
sourceCaptureIds: [tsk-a, tsk-b]
```

### 7.4 Attestation

Attestation links a capture to a document slot. It is the precise replacement for the old "compound stores docType/docPath" meaning.

An attestation records:

```yaml
captureId: tsk-123
docId: doc-worktree-reclaim-safety-pitfall
docPath: docs/worktree-reclaim-safety/pitfall.md
framework: diataxis
mode: explanation
```

`docPath` in new attestations must equal the document's `currentPath`. Old capture events remain unchanged and are resolved through aliases.

## 8. Producer Enforcement

The producer door must enforce registry membership in code. Skill prose is not enough.

The current producer already refuses a path that is not committed at the main checkout's `HEAD`. The new producer gate extends that rule:

```txt
knowledge attestation / legacy compound:
  require path committed at main HEAD
  require registry enforcement active
  require path equals a registered document currentPath
  reject alias paths for new attestations
  require topic and role still valid
  reject if the target would violate activeDoc(topicId, role) <= 1
```

This closes the rollout window where the corpus has been migrated but an old writer still self-names a fresh path. Even if a legacy writer commits `docs/explanation/new-random.md`, attestation fails because the path is not a registry current path.

### 8.1 Reserved Slots

New documents are created by reserving a slot first:

```txt
fgos doc reserve --topic <topicId> --role <role> --path docs/<purpose>/<role>.md
```

The writer then renders prose and commits the file. Only after the file exists at `HEAD` may the capture be attested to that document.

`reserved` is not a prose lifecycle claim. It is a registry-level path hold.

### 8.2 Provisional By Default

The conservative policy is: rendered prose becomes `provisional`, not `active`.

A human-registered topic proves the slot is legitimate. It does not prove that the generated prose is authoritative. Promotion remains an explicit `fgos doc promote` action unless a later decision narrows the policy.

Open policy question: if a topic and document slot were both explicitly created by a human for a known purpose, should the first rendered document move directly to `active`? The current design says no by default.

### 13.5 Apply

Apply runs after enforcement and read surfaces are registry-aware.

It:

1. records path move events;
2. moves or folds files by target document;
3. creates aliases for every old path;
4. rebuilds machine and human projections;
5. verifies source reachability before and after;
6. leaves every migrated document provisional unless explicitly promoted.

Parallelism is allowed by target document, not by arbitrary source file. Multiple workers must not write the same target document concurrently.

## 14. Harness Layer

The harness is part of the design, not a follow-up nicety.

### 14.1 Unit Harness

Reducer and model tests:

- topic register creates an active topic with stable identity;
- topic rename changes labels without losing identity;
- topic split records successor lineage and retires or narrows the old topic;
- topic merge records predecessors and successor;
- doc reserve holds exactly one slot for `(topicId, role)`;
- active documents obey `activeDoc(topicId, role) <= 1`;
- aliases resolve to the same document but do not count as current paths;
- role names cannot collide with framework mode names;
- unknown role and unknown framework mode are rejected;
- projections are deterministic.

### 14.2 CLI Harness

Command tests:

- `fgos topic register` records a topic event;
- `fgos topic split` records lineage and successors;
- `fgos topic merge` retires predecessors and points to successor;
- `fgos doc reserve` refuses a duplicate active/reserved slot;
- `fgos doc move-path` changes current path and preserves old path as alias;
- `fgos doc promote` accepts only `provisional -> active`;
- `fgos doc promote` refuses when another active doc already owns `(topicId, role)`;
- `fgos doc promote` refuses if the current path is absent from `HEAD`;
- no command creates an extra active document for the same topic and role without a split.

### 14.3 Producer Gate Harness

Producer tests:

- attestation rejects a committed path not present in registry;
- attestation accepts a registered current path committed at `HEAD`;
- attestation rejects an alias path;
- attestation rejects a registered path that is not committed at `HEAD`;
- attestation rejects retired topics and retired documents;
- legacy compound compatibility uses the same gate;
- a legacy writer that self-names `docs/explanation/new-random.md` and commits it still fails attestation because the path is not a registry current path.

## End-user documentation carriage

The following two source contracts are conserved under L13-4. Their original metadata is retained in fenced YAML; heading depth alone is adapted for this contract. Dated implementation pointers, gaps and historical vocabulary are preserved, not silently modernized. The maintained registry constraints above still apply to producers; these source passages do not restore alias write targets or bypass attestation.

Code truth for the index is `src/report/enduser-index-generate.mjs`; the `enduser-docs-index-stale` doctor check/fix in `src/setup/registrations.mjs` calls that same generator.

## Spec: Soạn & nuôi tài liệu người-dùng-cuối (enduser-docs-authoring)

```yaml
---
area: enduser-docs-authoring
updated: 2026-08-12
sources: [compound-learn-enduser-docs, spec-docs-lifecycle-realignment]
decisions: [02623bff, c74bcef9]
coverage: full
---
```


Khi một việc mang status **`retrospective`** — khâu tổng-hợp của vòng đời, sau
`delivered` và trước `cleanup` — một kỷ luật soạn tài liệu biến outcome
đã capture thật của việc thành một **tài liệu người-dùng-cuối thật**, xếp theo ngăn
Diataxis. Mỗi đường dẫn tài liệu là một **tài liệu sống**: các capture kế tiếp cùng khai
một đường dẫn được **tích luỹ** vào tài liệu đó mà không mất chi tiết đã có. Đây là mặt
write-side, đối trọng với mặt read-side (area `enduser-docs-index` — liệt kê + liên kết).

### Entry Points & Triggers

- **Việc tới status `retrospective`** — người hoặc agent thực thi kỷ luật soạn tài liệu
  cho việc đó. Không có lịch tự động; kỷ luật chạy khi việc ở đúng status này.
- **`fgos compound <id> --doc-type <quadrant> --doc-path <path>`** — bề mặt producer duy
  nhất được phép dùng: nó lưu **tag ngăn Diataxis** và **móc đường-dẫn** lên capture của
  việc trong một lần gọi. Vì chỉ chạy khi việc đã ở status `retrospective`, lần gọi này
  chỉ gắn tag, không dời khâu thêm.
- **`fgos doc-sources <docPath>`** (đọc-thuần, area `enduser-docs-index`) — gom **mọi**
  capture đã liên kết tới một đường dẫn, làm nguồn để dựng/nuôi tài liệu không mất chi
  tiết.

### Data Dictionary

| # | Trường | Nghĩa | Miền giá trị |
|---|---|---|---|
| 1 | quadrant | Ngăn Diataxis của tài liệu — quyết định cả **hình dạng** tài liệu lẫn thư mục chứa nó | `tutorial` / `how-to` / `reference` / `explanation` |
| 2 | docPath | Vị trí tài liệu — đồng thời là **danh tính** của tài liệu sống; các capture cùng docPath tích luỹ vào cùng một tệp | chuỗi đường dẫn (vd `docs/how-to/x.md`) |
| 3 | capture | Bản ghi outcome thật của việc (dự-đoán/thực-tế, friction ghi được, và tham chiếu lịch sử nếu có) — nguồn DUY NHẤT được phép tổng hợp ra tài liệu | bản ghi capture của một việc |
| 4 | chế-độ grow-vs-create | Nuôi tài liệu có sẵn hay tạo mới — suy hoàn toàn từ việc tệp tại `docPath` đã tồn tại trên đĩa hay chưa | `create` (tệp chưa có) / `grow` (tệp đã có) |

### Behaviors & Operations

#### Soạn / nuôi một tài liệu người-dùng-cuối

- **Triggers:** việc ở status `retrospective`; agent thực thi kỷ luật.
- **Điều gì xảy ra:**
  1. **Gom capture thật.** Đọc outcome dự-đoán/thực-tế và friction của việc; nếu việc có
     tham chiếu lịch sử, đọc thêm câu chuyện đầy đủ ở đó. Đây là bằng chứng DUY NHẤT được
     tổng hợp từ.
  2. **Phân ngăn.** Chọn đúng một ngăn Diataxis cho nội dung thật của capture — quyết
     định phán đoán, không mặc định, không tung đồng xu.
  3. **Lưu tag + móc.** Gọi producer với ngăn đã chọn và đúng đường dẫn tài liệu sẽ đặt —
     lưu tag ngăn và móc đường-dẫn lên capture.
  4. **Gom mọi nguồn rồi nuôi/tạo tài liệu.** Trước khi viết, gom **mọi** capture đã liên
     kết tới đường dẫn (không chỉ cái vừa gắn) — đây là gom-không-mất. Rồi:
     - **Tệp chưa tồn tại → tạo mới** từ (các) capture đã gom, trích dẫn, không diễn giải
       lại.
     - **Tệp đã tồn tại → nuôi:** thêm (các) capture mới gom vào prose sống như **mục bổ
       sung** — thêm phần mới, KHÔNG xoá/rút gọn/xáo lại prose đã có. Tài liệu giữ trọn
       mọi chi tiết và cấu trúc cũ, đồng thời nhận thêm những gì capture mới mang lại.
     Khớp hình dạng của ngăn (tutorial = các bước có thứ tự; how-to = công thức cho một
     mục tiêu; reference = bảng/danh sách tra cứu; explanation = prose bàn luận). Ngăn
     Diataxis là trục cấu trúc DUY NHẤT — nuôi prose, không thêm trục tổ chức thứ hai
     bên trong tài liệu.
  5. **Xác nhận đóng.** Kiểm lại: tag `docType` của việc hiện đúng ngăn vừa lưu, và tài
     liệu ở bước 4 tồn tại trên đĩa. Tag không có tài liệu, hoặc tài liệu không có tag,
     là chưa xong.
- **Side effects:** một sự kiện capture (tag + móc đường-dẫn) được ghi lên việc; một tệp
  tài liệu được tạo hoặc mọc thêm. Không dời khâu/đổi trạng thái việc trực tiếp — việc để
  engine tự áp.
- **Sau đó, người/hệ quan sát:** một tài liệu người-dùng-cuối thật ở đúng ngăn, trích từ
  capture thật (evidence quote được); capture của việc mang tag ngăn + móc đường-dẫn; và
  area `enduser-docs-index` chạy lại sẽ liệt kê tài liệu với `sourceCaptureId` thật.

### Actors & Access

- **Agent/kỹ năng soạn tài liệu ở status `retrospective`** — đọc capture, viết tài liệu, lưu tag
  + móc qua bề mặt producer. Không vai trò đặc quyền; đi qua đúng cửa lệnh có sẵn.
- **Hệ tiêu thụ** — area `enduser-docs-index` (liệt kê tài liệu đã soạn); người đọc tài
  liệu (nhận một tài liệu người-dùng-cuối sống).

### Business Rules

- **R1 (chỉ soạn từ capture thật).** Tài liệu chỉ được tổng hợp từ outcome/friction thật
  của việc (và lịch sử tham chiếu nếu có), không bao giờ từ tiêu đề hay phán đoán.
- **R2 (một tài liệu sống trên mỗi đường dẫn).** Các capture cùng khai một `docPath` tích
  luỹ vào đúng một tài liệu tại đường dẫn đó — độ mịn là theo-đường-dẫn.
- **R3 (nuôi là bổ sung, không mất).** Khi nuôi tài liệu đã có, chỉ thêm phần mới; không
  xoá, rút gọn, hay xáo lại prose/cấu trúc đã có — tài liệu giữ trọn chi tiết cũ.
- **R4 (grow-vs-create theo tồn-tại-tệp).** Phân biệt nuôi hay tạo hoàn toàn bằng việc
  tệp tại `docPath` đã tồn tại chưa — không cờ phụ, không dấu trên capture.
- **R5 (Diataxis là trục cấu trúc DUY NHẤT).** Ngăn Diataxis là trục cấu trúc duy nhất
  của một tài liệu; không tổ chức lại theo trục thứ hai (đối tượng/persona, mảng sản
  phẩm) bên trong. Thư mục tài liệu khớp tag ngăn của nó. Chỉ cân nhắc trục thứ hai khi
  tài liệu thật va chạm.
- **R6 (trích, không diễn giải lại).** Nội dung được trích từ capture thật, không diễn
  giải lại hay bịa.
- **R7 (tag và tài liệu đi liền).** Một tag không có tài liệu, hoặc một tài liệu không có
  tag, là chưa xong — quay lại làm nốt nửa còn thiếu.

### Edge Cases Settled

- **Capture chỉ mang tag ngăn (không có prose dự-đoán/thực-tế phong phú):** tài liệu vẫn
  được soạn từ bối cảnh thật của việc (hành vi thật, lịch sử), trích dẫn — cơ chế tích
  luỹ vẫn chạy dù một capture mỏng. Tài liệu how-to đầu tiên (`docs/how-to/`) được soạn
  đúng theo lối này.
- **Tài liệu đầu tiên tại một đường dẫn (create) vs capture về sau (grow):** phân biệt
  thuần bằng tồn-tại-tệp (R4).

### Open Gaps

- **Tích luỹ nhiều-capture phong phú** mới được thử nhẹ: hiện mỗi đường dẫn mới có một
  capture liên kết, nên nhánh "nuôi" (grow nhiều capture qua nhiều chu kỳ) chưa được chạy
  nặng — kỷ luật đã hỗ trợ, chờ thêm capture thật.
- **Bề rộng ngăn:** mới ngăn `how-to` có tài liệu thật; ba ngăn còn lại chờ tài liệu loại
  đó được soạn.

### Pointers (implementation)

- Kỷ luật soạn: kỹ năng `fgos-coding-compounding` (cả hai gốc `repo/.claude/skills/` và
  `repo/.agents/skills/`), Flow bước 1-5 — gom capture, phân ngăn, lưu tag+móc, gom
  mọi nguồn qua `fgos doc-sources` rồi grow-or-create theo tồn-tại-tệp, xác nhận.
- Producer tag+móc: nhánh `compound` trong `repo/bin/fgos.mjs` (nhánh tổng-hợp ghi
  outcome mang `docPath`).
- Gom nguồn: verb `fgos doc-sources` (area `enduser-docs-index`).
- Tài liệu thật đầu tiên: `repo/docs/how-to/check-rollup-progress.md`, liên kết tới
  capture `doc-fgos-rollup-howto`.

## Spec: Chỉ mục đọc-theo-tag tài liệu người-dùng-cuối (enduser-docs-index)

```yaml
---
area: enduser-docs-index
updated: 2026-08-12
sources: [compound-learn-enduser-docs, str64-backfill, spec-docs-lifecycle-realignment]
decisions: [1d336d8a, 02623bff, c74bcef9, acda11a7]
coverage: full
---
```


Một **chỉ mục máy-đọc-được** của toàn bộ tài liệu hướng người-dùng-cuối trong repo,
sinh theo yêu cầu từ hai nguồn sự-thật đã có — cây tài liệu trên đĩa và nhật ký
capture của việc — chứ không tự nó là nguồn sự-thật. Mục đích: cho người và agent
một bảng tra "có tài liệu gì, thuộc loại nào, phục vụ mục đích/đối tượng nào, và nó
sinh ra từ việc nào" mà không phải mở từng tệp; và giữ **móc truy ngược** từ mỗi tài
liệu về capture đã sinh ra nó, để một slice về sau dựng lại tài liệu hợp nhất từ
nguồn mà không mất chi tiết hay cấu trúc.

Chỉ mục này KHÔNG hợp nhất, viết lại, hay sửa bất kỳ tài liệu nào — nó chỉ liệt kê và
liên kết. Việc **dựng/nuôi tài liệu prose sống** từ các capture là area chị em
`enduser-docs-authoring` (write-side); area này là read-side: liệt kê, liên kết, và
cung cấp truy vấn ngược "một tài liệu sinh ra từ những capture nào".

### Entry Points & Triggers

- **`fgos docs-index`** — người hoặc agent gọi verb này để (tái) sinh chỉ mục. Đây là
  bề mặt duy nhất; không có lịch chạy tự động, không có sự kiện nào kích hoạt nó. Bề
  mặt CLI sống ở area work-state (cửa lệnh `fgos` một cửa); hành vi sống ở đây.
- Kỳ vọng chạy sau khi một tài liệu người-dùng-cuối mới được soạn ở khâu
  tổng-hợp (việc mang status `retrospective`), để chỉ mục bắt kịp tài liệu và
  linkage mới.
- **`fgos doc-sources <docPath>`** — người hoặc agent gọi verb này để lấy **mọi**
  capture đã liên kết tới một đường dẫn tài liệu (truy vấn ngược nhiều-kết-quả), làm
  nguồn cho area `enduser-docs-authoring` dựng lại tài liệu không mất chi tiết. Cũng
  đọc-thuần, không lịch chạy tự động, không sự kiện kích hoạt.

### Data Dictionary

Chỉ mục là một **danh sách mục** (thứ tự theo quadrant rồi theo tài liệu). Mỗi mục mô
tả đúng một tài liệu người-dùng-cuối:

| # | Trường | Nghĩa | Miền giá trị |
|---|---|---|---|
| 1 | quadrant | Ngăn Diataxis của tài liệu, suy ra từ thư mục chứa nó | `tutorial` / `how-to` / `reference` / `explanation` |
| 2 | purpose | Mục đích của ngăn — "tài liệu loại này dùng để làm gì" — lấy từ một bảng ánh xạ CỐ ĐỊNH theo quadrant, nên chỉ mục tự-mô-tả, không buộc người đọc đã thuộc Diataxis | câu mô tả mục đích của ngăn (xem Business Rules R4) |
| 3 | audience | Đối tượng của ngăn — "ai đọc tài liệu loại này" — lấy từ cùng bảng ánh xạ cố định | câu mô tả đối tượng của ngăn (xem R4) |
| 4 | docPath | Đường dẫn tới tệp tài liệu trong repo | chuỗi đường dẫn (vd `docs/how-to/x.md`) |
| 5 | title | Tiêu đề tài liệu — dòng tiêu đề cấp cao nhất đầu tiên bên trong tệp | chuỗi; rỗng nếu tệp không có tiêu đề |
| 6 | sourceCaptureId | Móc truy ngược: mã của bản ghi capture (outcome) đã khai `docPath` đúng bằng tệp này — tức việc đã sinh ra tài liệu; `null` khi không việc nào khai linkage tới nó (tài liệu di sản soạn trước khi có cơ chế linkage) | mã item, hoặc `null` |

`purpose`/`audience` được **gieo từ quadrant**, không đọc từ bên trong tài liệu: mọi
tài liệu cùng ngăn mang cùng cặp purpose/audience. Bảng ánh xạ quadrant→{purpose,
audience} có đúng MỘT nguồn sự-thật (xem R4).

#### Đầu-mô-tả riêng của mỗi tài liệu (self-description header)

Độc lập với chỉ mục, mỗi tài liệu người-dùng-cuối tự mang một **khối mô tả** ở đầu
tệp — soạn lúc tài liệu được tạo/backfill, không phải do `fgos docs-index` sinh ra:

| # | Trường | Nghĩa | Miền giá trị |
|---|---|---|---|
| 1 | loại | Loại tài liệu (khớp `quadrant`) | `tutorial` / `how-to` / `reference` / `explanation` |
| 2 | tiêu đề | Tên hiển thị của tài liệu | chuỗi |
| 3 | nhãn | Nhãn phân loại tự do theo chủ đề/thực thể (trục thứ hai, độc lập với quadrant — xem R10) | danh sách chuỗi, có thể rỗng |
| 4 | thời điểm | Lúc khối mô tả này được ghi/sửa gần nhất | thời khắc ISO 8601 |
| 5 | móc-liên-kết-nguồn | Bản sao-ghi-lúc-soạn của những capture đã sinh ra tài liệu này | danh sách mã việc, có thể rỗng |

Trường `móc-liên-kết-nguồn` KHÔNG phải nguồn thẩm quyền (xem R1 mở rộng, R11) — nó là
bản sao tiện dụng để tài liệu tự-đọc-được mà không cần chạy verb; nguồn thẩm quyền
duy nhất của linkage vẫn là nhật ký capture, tra qua `fgos doc-sources`.

### Behaviors & Operations

#### Sinh chỉ mục (fgos docs-index)

- **Triggers:** gọi `fgos docs-index`.
- **Blocked when:** không có điều kiện chặn riêng. Verb đọc-thuần đối với trạng thái
  việc; nếu nhật ký capture hỏng, tầng đọc chung báo lỗi log-hỏng như mọi bên đọc.
- **Điều gì xảy ra:**
  1. Với mỗi ngăn Diataxis, tìm thư mục CHÍNH tương ứng trên đĩa, **cộng thêm mọi vị
     trí thay thế đã khai cho ngăn đó** (hiện có đúng một: ngăn `explanation` còn nhận
     tài liệu từ vị trí sổ quyết định sản phẩm, coi như cùng ngăn — xem R10). **Thư
     mục vắng thì bỏ qua sạch sẽ** — không lỗi, không mục — vì không phải ngăn nào
     cũng đã có tài liệu, dù là vị trí chính hay vị trí thay thế.
  2. Với mỗi tài liệu tìm thấy trong một thư mục ngăn (chính hoặc thay thế): suy
     `quadrant` từ NGĂN (không phải từ tên thư mục vật lý — vị trí thay thế mang tên
     khác nhưng vẫn gắn đúng ngăn), tra
     `purpose`/`audience` từ bảng cố định, đọc `title` là tiêu đề cấp cao nhất đầu tiên
     của tệp, và ghi `docPath`.
  3. Truy `sourceCaptureId`: kiểm nhật ký sự kiện (`events.jsonl` dưới `.fgos/`) có
     tới được không (tsk-f31) — nhật ký vắng mặt (vd một worktree theo ADR0020 (chặn .fgos/ khỏi worktree worker — fgw/<id> không mang .fgos/ riêng, xóa hẳn khỏi checkout), không mang `.fgos/` riêng) khác với nhật ký tới được nhưng thật sự rỗng; `.fgos/` bản
     thân thư mục có thể tồn tại (giữ mỗi `main-checkout.lock`) trong khi
     `events.jsonl` bên trong vắng mặt — tín hiệu đúng là sự tồn tại của chính tệp
     nhật ký, không phải thư mục `.fgos/`. Nhật ký tới được: dựng bản chiếu capture
     (đọc-thuần) và tìm bản ghi outcome nào khai `docPath` trùng đúng tệp này; thấy
     thì lấy mã việc của nó, không thấy thì để `null` (như cũ). Nhật ký KHÔNG tới
     được: nếu manifest đang có trên đĩa đã mang một `sourceCaptureId` thật (khác
     `null`) cho đúng `docPath` này, giữ nguyên giá trị đó thay vì ghi đè `null` —
     chỉ một nhật ký thật sự tới được mới được phép ghi `null` đè lên giá trị cũ.
  4. Ghi/ghi-đè manifest thành một tệp máy-đọc-được ở vị trí cố định ngoài cây spec.
- **Side effects:** chỉ tạo/ghi-đè đúng một tệp manifest. Không ghi sự kiện, không đổi
  trạng thái việc, không đụng vào bất kỳ tài liệu người-dùng-cuối nào.
- **Sau đó, người/hệ tiêu thụ quan sát:** một manifest đầy đủ — mỗi tài liệu hiện có
  một mục với ngăn, mục đích, đối tượng, đường dẫn, tiêu đề, và linkage ngược (hoặc
  `null`). Chạy lại verb cho ra manifest tương đương: **không nhân đôi** mục cho cùng
  một `docPath`/`sourceCaptureId`.

#### Truy nguồn của một tài liệu (fgos doc-sources)

- **Triggers:** gọi `fgos doc-sources <docPath>`.
- **Blocked when:** không có điều kiện chặn riêng; đọc-thuần đối với trạng thái việc.
- **Điều gì xảy ra:** dựng bản chiếu capture từ nhật ký (đọc-thuần), rồi trả về **mọi**
  bản ghi outcome khai `docPath` trùng đúng tệp được hỏi, theo thứ tự ghi ổn định —
  không chỉ cái đầu tiên (khác móc `sourceCaptureId` của chỉ mục, vốn chỉ giữ một). Mỗi
  kết quả kèm nội dung capture (mã việc, docType, docPath, và các trường dự-đoán/thực-tế
  nếu có) đủ để dựng lại tài liệu.
- **Side effects:** không có — không ghi sự kiện, không đổi trạng thái, không đụng tài
  liệu.
- **Sau đó, hệ tiêu thụ quan sát:** danh sách đầy đủ các capture của đường dẫn đó
  (rỗng nếu không có capture nào liên kết) — đây là bề mặt gom-nguồn mà area
  `enduser-docs-authoring` dùng để nuôi tài liệu không mất chi tiết.

### Actors & Access

- **Người vận hành / agent trong repo** — gọi `fgos docs-index`, đọc manifest. Không
  có vai trò đặc quyền: verb mang quyền `read` (chỉ đọc trạng thái việc; ghi manifest
  là artifact dẫn xuất, không phải một lần ghi sự kiện hay đổi trạng thái).
- **Hệ tiêu thụ** — bất kỳ công cụ/agent nào cần bảng tra tài liệu hoặc muốn dựng lại
  tài liệu hợp nhất từ nguồn, đọc manifest và đi theo `sourceCaptureId` về capture.

### Business Rules

- **R1 (chỉ mục là dẫn xuất, không phải nguồn).** Manifest được sinh lại được hoàn
  toàn từ cây tài liệu trên đĩa và nhật ký capture; nó không giữ sự-thật nào của riêng
  mình. Xóa đi rồi chạy lại verb cho ra cùng nội dung. **Mở rộng (str64-backfill):**
  đầu-mô-tả riêng của mỗi tài liệu (self-description header) là một
  bề mặt KHÁC, tồn tại song song — nó KHÔNG đổi tính chất dẫn-xuất-thuần của manifest.
  Manifest vẫn tính lại 100% từ đĩa+log mỗi lần chạy; đầu-mô-tả là bản sao ghi-lúc-soạn,
  không quyền, chỉ để tài liệu tự-đọc-được (xem R11).
- **R2 (chỉ liệt kê và liên kết, không viết lại).** Verb là đọc-thuần với tài liệu:
  không hợp nhất, không sửa, không sinh tài liệu. Việc gộp tài liệu là slice sau.
- **R3 (linkage nguồn↔tài-liệu là bắt buộc-nếu-có, không bắt buộc-phải-có).** Mỗi mục
  cố truy `sourceCaptureId` qua `docPath` đã ghi lúc capture; tài liệu không có capture
  nào khai linkage vẫn được liệt kê với `sourceCaptureId: null`. Linkage đảm bảo slice
  gộp-sống dựng lại tài liệu không mất chi tiết/cấu trúc.
- **R4 (bảng quadrant→{mục-đích,đối-tượng} có đúng MỘT nguồn sự-thật).** Cặp
  purpose/audience của mỗi ngăn được định nghĩa một chỗ duy nhất trong phần hiện thực
  và mọi nơi khác (kỹ năng `fgos-indexing`, tài liệu) TRỎ tới nó, không chép lại giá
  trị. Ý nghĩa từng ngăn theo Diataxis: `tutorial` — dẫn người mới học qua một trải
  nghiệm; `how-to` — chỉ các bước đạt một mục tiêu cụ thể đã hiểu rõ; `reference` — tra
  cứu chính xác, khô khan; `explanation` — làm rõ bối cảnh/lý do. Câu chữ đích xác của
  từng cặp là của phần hiện thực.
- **R5 (tự-mô-tả; Diataxis là trục cấu trúc DUY NHẤT).** Vì mỗi mục mang sẵn
  purpose+audience chứ không chỉ tên ngăn, người đọc chỉ mục hiểu ngay "để làm gì / ai
  dùng" mà không cần thuộc Diataxis. Nghi vấn "Diataxis một mình có đủ không" đã được
  **chốt**: ngăn Diataxis là trục cấu trúc duy nhất của tài liệu; purpose/audience là
  trường **mô tả** (metadata), không phải trục cấu trúc thứ hai. Chỉ thêm trục thứ hai
  (vd đối tượng/persona) khi tài liệu thật va chạm — rẻ vì audience đã là trường sẵn có.
- **R9 (truy nguồn là gom NHIỀU, khác móc chỉ mục gom MỘT).** `fgos doc-sources` trả về
  mọi capture của một đường dẫn; móc `sourceCaptureId` trong manifest chỉ giữ capture
  đầu tiên khớp. Sự khác biệt là có chủ đích: chỉ mục cần một con trỏ gọn, còn việc nuôi
  tài liệu cần trọn nguồn để không mất chi tiết.
- **R6 (dung sai ngăn vắng).** Ngăn chưa có thư mục trên đĩa (chính lẫn thay thế) bị bỏ
  qua sạch; verb không bao giờ gãy vì thiếu ngăn. Hiện `how-to` và `explanation` đã có
  tài liệu thật; `tutorial`/`reference` còn trống (ràng buộc validation
  bước-3; mở rộng theo str64-backfill).
- **R7 (idempotent).** Chạy lại verb không sinh mục trùng cho cùng
  `docPath`/`sourceCaptureId`.
- **R8 (vị trí manifest ngoài cây spec).** Manifest KHÔNG sống dưới cây tài liệu tham
  chiếu BA nội bộ; nó là artifact sản phẩm ở vị trí riêng.
- **R10 (một ngăn có thể nhận thêm ĐÚNG MỘT vị trí thay thế đã khai — không phải cơ chế
  đa-vị-trí chung).** Hiện chỉ ngăn `explanation` có vị trí thay thế: sổ quyết định
  sản phẩm đã tồn tại từ trước, đã tự chưng cất product-facing, được công nhận là một
  nguồn hợp lệ của ngăn `explanation` thay vì di dời/viết lại (theo
  str64-backfill). Đây là một khai báo tường minh cho từng ngăn, không phải quy tắc
  "mọi ngăn đều có thể có nhiều vị trí" — thêm vị trí thay thế cho một ngăn khác cần
  quyết định riêng, không suy diễn từ R10.
- **R11 (nhãn tự do là trục MÔ TẢ thứ hai, không phải trục cấu trúc).** Đầu-mô-tả của
  mỗi tài liệu mang thêm `nhãn` tự do theo chủ đề/thực thể — độc lập với `purpose`/
  `audience` (đã gieo theo quadrant, R4) và không thay thế Diataxis làm trục cấu trúc
  (R5 giữ nguyên). `nhãn` cho phép lọc theo thực thể/chủ đề (vd "tất cả tài liệu về
  X") mà không cần đổi cấu trúc thư mục (theo str64-backfill).

### Edge Cases Settled

- Ngăn Diataxis chưa có thư mục (vd `tutorial`/`reference` hiện chưa tồn tại): bỏ qua,
  không lỗi, không mục — verb vẫn chạy trọn và ghi manifest cho các ngăn đã có (ràng
  buộc validation).
- Tài liệu không có capture nào khai `docPath` tới nó: vẫn được liệt kê,
  `sourceCaptureId: null` — không phải lỗi. (Tài liệu how-to đầu tiên nay
  ĐÃ được liên kết tới capture `doc-fgos-rollup-howto` qua slice gộp-sống, nên mục của
  nó mang `sourceCaptureId` thật, không còn `null`.)
- Nhật ký sự kiện không tới được (vd một worktree theo ADR0020 (chặn .fgos/ khỏi worktree worker)) trong khi manifest đang
  có trên đĩa đã mang `sourceCaptureId` thật cho một `docPath`: khác với bullet trên —
  đây KHÔNG phải "tài liệu không có capture", giá trị thật vẫn tồn tại, chỉ là lần chạy
  này không tra được. Giữ nguyên giá trị cũ trên đĩa thay vì null-hóa (tsk-f31; xem
  bước 3 ở trên).
- Tài liệu backfill từ nội dung di sản (không qua khâu tổng-hợp ở status
  `retrospective`): đầu-mô-tả của nó
  khai `móc-liên-kết-nguồn` rỗng một cách trung thực — không bịa linkage giả (theo
  str64-backfill).
- Chạy `fgos docs-index` nhiều lần liên tiếp: manifest hội tụ, không mục trùng (R7).

### Open Gaps

- **Bề rộng ngăn.** `how-to` và `explanation` đã có tài liệu thật (explanation qua cả
  vị trí chính lẫn vị trí thay thế, R10); `tutorial`/`reference` còn trống cho tới khi
  tài liệu loại đó được soạn.
- **Chưa có kiểm tra lệch giữa đầu-mô-tả và log.** `móc-liên-kết-nguồn` (R1 mở rộng)
  có thể lệch theo thời gian với sự thật trong log nếu tài liệu được liên kết lại sau
  khi đầu-mô-tả đã ghi; hiện chưa có cơ chế phát hiện lệch tự động — ưu tiên thấp, chỉ
  xây khi quan sát thấy lệch thật.

### Pointers (implementation)

- Bộ sinh thuần (không I/O): `repo/src/report/enduser-index.mjs` — export
  `QUADRANTS`, bảng nguồn-sự-thật `QUADRANT_META` (cặp purpose/audience mỗi ngăn — R4),
  `QUADRANT_DIR_ALIASES` (khai vị trí thay thế mỗi ngăn — R10; hiện `explanation` ->
  `['decisions']`), `findSourceCaptureId` (gom một, cho chỉ mục), `findSourceCaptureIds`
  (gom mọi capture của một đường dẫn, cho `doc-sources` — R9), `buildEnduserIndex`.
- I/O + sinh chỉ mục: `repo/src/report/enduser-index-generate.mjs` (tsk-1m0) — quét thư
  mục ngăn CHÍNH và mọi vị trí thay thế trong `QUADRANT_DIR_ALIASES`, rút tiêu đề H1 đầu,
  fold nhật ký qua bề mặt đọc-thuần `listWork`, và (chỉ ở `generateEnduserDocsIndex`) ghi
  manifest — đây là MỘT đường sinh duy nhất mà cả nhánh `docs-index` trong
  `repo/bin/fgos.mjs` lẫn doctor check/fix `enduser-docs-index-stale`
  (`repo/src/setup/registrations.mjs`) cùng gọi, không bên nào lặp lại logic của bên kia.
  `computeEnduserDocsIndex` là nửa đọc-thuần (không ghi) mà doctor check dùng để tính độ
  lệch mà không đụng đĩa. Nhánh `doc-sources` vẫn ở `repo/bin/fgos.mjs` (gom nguồn của một
  đường dẫn qua `findSourceCaptureIds` + `listWork`); đăng ký cả hai verb ở
  `repo/src/cli/command-registry.mjs` với quyền `read`.
- Bộ đọc/ghi đầu-mô-tả (không I/O, không phụ thuộc thư viện ngoài): `repo/src/report/frontmatter.mjs`
  — `parseFrontmatter`/`renderFrontmatter`; đây là cơ chế đọc/ghi khối mô tả riêng của
  từng tài liệu (mục "Đầu-mô-tả riêng của mỗi tài liệu" ở trên), tách biệt với bộ sinh
  chỉ mục.
- Manifest sinh ra: `repo/docs/enduser-docs-index.json`.
- Vị trí chính + vị trí thay thế trên đĩa: `repo/docs/how-to/`, `repo/docs/explanation/`
  (chính, ngăn `explanation`), `repo/docs/decisions/` (thay thế đã khai cho ngăn
  `explanation`, R10).
- Kỹ năng vận hành: `fgos-indexing` (cả hai gốc skill) — khi nào chạy verb, trỏ về
  `QUADRANT_META`/`QUADRANT_DIR_ALIASES` làm nguồn ánh xạ duy nhất.
- Kiểm thử: `repo/test/report/enduser-index.test.mjs` (chạy verb thật trên cây `docs/`
  thật và đọc manifest sinh ra, không dùng proxy — gồm cả `findSourceCaptureIds` đa-kết-
  quả và vị trí thay thế của ngăn `explanation`); `repo/test/report/frontmatter.test.mjs`
  (đầu-mô-tả, round-trip); hành vi verb `doc-sources` ở `repo/test/cli/fgos.test.mjs`.
