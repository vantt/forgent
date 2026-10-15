# Independent bounded runner source review

Content commit: 81d0ed0747014e976c0d29222439fd6e3592b468

Author session: codex-session:unit-run-1792057868388-68b4a62c@2026-10-15

Entries: **8**. Target: `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md`; part 1/1. Shard: `plans/260925-documentation-authority-unification/ledger/decisions/s9-runner-01.json`; SHA256 `de26feeaa57cfde916a78fdb423735da6335dbc35138e4ef545293c3bb50222b`. Sidecar SHA256 `cf55f6e9ad26a2f5576476eecb3359b16b040627807e31a60f2bcfe24b805d75`.

Read review-brief.md, owner-answers.md A19/A22/A28/A34/A36 and the frozen runner map. Ordinary conservation review only; no truth, promotion or retirement approval. Mechanically verify every digest, anchor, ancestry, native identity, one owner and shard/pack equality. Reviewer independently selects and records seeds and IDs, reads both directions with the full diff, and labels every own note deep or mechanical. More than 3% deep rework requires full-pack deep reading. Return Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and one five-column Claim | Verdict | Note | Source digest | Target digest row per entry; full 64-hex digests, literal none for absent target, ok/rework/hold. No producer verdict, draw or seed is supplied. Consolidate source packs by the original shard before ordinary application.

A36: reviewer-drawn minimum **8/8** Weak-exact/Judgment entries for this pack, plus every unequal-digest pair. Complete batch: 494 Weak-exact and 1 Judgment; at least 75 Weak-exact plus the sole Judgment overall (per-pack minima can require more). No Unit-exact population exists. Full direct-section text is shown for headings; large single sections may span consecutive block packs, without truncating any unit. Map additions and both rebound anchors are explicitly marked on every affected section row.

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [
      "claim_552ef3d6e22bac10c24cc31e48463d50",
      "claim_5a944093894be93c5792a1c5e14990c6",
      "claim_2c3300909e21da9dd0feb02e991c5f0a",
      "claim_62d9996e5897714517de064047f1ff83",
      "claim_0735a1a1ac2e5c08ab7dde6f393746f0",
      "claim_092c6c62f6b2c014d24f74aca3dee571",
      "claim_ec3f286e81c31817022a1caa3eebda54",
      "claim_e9802a0cf16dad3c227c5159d457e3dd"
    ],
    "Judgment": []
  },
  "unequalDigestPairs": [],
  "mapAmendmentIDs": [],
  "reboundAnchorIDs": []
}
```

## claim_552ef3d6e22bac10c24cc31e48463d50

Source digest: b91663aeb373f3e9759bda7e8edf97edc512497d6d3adbf55ebdb6b8c7af5187

Target digest: b91663aeb373f3e9759bda7e8edf97edc512497d6d3adbf55ebdb6b8c7af5187

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "data-dictionary",
  "sourceLines": [
    71,
    71
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
  "targetAnchor": "data-dictionary",
  "targetAncestry": [
    "Added in candidate: Runner Data Dictionary"
  ],
  "nativeTargetClaimId": "claim_5d18d39505152ccae6e2f5e8667400a7",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; source unit shorter than 40 characters; document exact share below one half",
  "section": "data-dictionary",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_552ef3d6e22bac10c24cc31e48463d50",
    "sourceUnitDigest": "b91663aeb373f3e9759bda7e8edf97edc512497d6d3adbf55ebdb6b8c7af5187",
    "targetOwner": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "targetAnchor": "data-dictionary",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; source unit shorter than 40 characters; document exact share below one half. Whole heading docs/specs/runner.md#data-dictionary (lines 71–71) carried at docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#data-dictionary. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "b91663aeb373f3e9759bda7e8edf97edc512497d6d3adbf55ebdb6b8c7af5187",
    "targetAncestry": [
      "Added in candidate: Runner Data Dictionary"
    ]
  }
}
```

### Full source unit

```text
## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế `{prompt}`/`{model}` theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`) · `executors` — catalog executor theo danh tính provider/cách gọi, không mang khẩu vị chất lượng · `modelPolicies` — bảng bắt buộc provider→tier→model với tier cung `nano|mini|standard|advanced|flagship|frontier` · `rigorToTier` — bảng bắt buộc ánh xạ đủ bốn mức cầu `low|standard|high|critical` sang tier cung · `capabilities.<name>.rigor` — sàn cầu tùy chọn, chỉ nâng; khối `capabilities.<name>.overrides` bị từ chối · `timeoutMs` — trần thời gian mặc định của một worker, tối đa 4h; một lượt chạy có thể xin thời gian riêng (RUL96 (one run may take its own timeout)) · `confinement`/`confinementPolicies` — chính sách giam giữ · `capabilities` — catalog lời hứa hành vi và binding executor/invocation | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`); `fgos setup` điền `rigorToTier`, `fgos doctor` kiểm bảng này và các khoá placement đã retired; một `--config <path>` tường minh trỏ vào đường vắng mặt vẫn báo lỗi ngay (`fgos discover`/`plan`; `fgos-runner` không còn `--config`, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) |
| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: "codex-home", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock ở `~/.fgos/runtime/provider-capacity/state.lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |
| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |
| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |
| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |
| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` **ở stage executing** TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp. Executing-phase-only scoping (claim-lock): trước đây, pick/take chỉ mở frontier (executing-phase), nên counting mọi `todo→doing` move tương đương dispatch attempts. Claim-lock cho phép `pick` cầm stage khác — claim-release cycle ở các stage đầu vòng (`discovery`/`exploring`/`planning`, cộng tên di sản `decompose`) không được tính vào ngân sách executing-phase (per claim-lock code-review finding) | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |
| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |
| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |
| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |
| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem "Xem live output worker khi đang chạy") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |
| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |
| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem "Cổng duyệt PR nội bộ" và "Iron Law" dưới, Business Rules RUL36 (`evolve --submit` là hành động ghi duy nhất trên bề mặt evolve, tái dùng chính cửa `submit`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |
| 11 | Prompt template worker (STR49, `src/runner/prompt-templates/`) | Nội dung chữ nghĩa của `buildPrompt`, tách khỏi code sang file committed — sửa prompt là sửa MỘT file, không đụng code | `selectTemplate({kind, tier, domain})` — bảng luật cơ học, wildcard cuối luôn khớp (từ STR91: luật `domain: 'coding'` khớp TRƯỚC wildcard — domain vắng mặt hay không nhận diện được đều fold về `coding` giống mọi nơi khác trong hệ, không phải một fallback riêng — trỏ `worker-prompt-skill-pointer.txt`; mọi domain đã đăng ký khác `coding` (vd `synthetic`) vẫn rơi về wildcard, trỏ `worker-prompt-default.txt` như trước STR91) · `renderTemplate` — substitution `{placeholder}` string-replace thuần, không engine · `hashTemplate` — sha256 nội dung raw file, ghi kèm dispatch log (xem RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`)) · template `worker-prompt-skill-pointer.txt` giữ đủ 6 mục cố định sẵn có, CHỈ thêm đúng một mục `# Agent skill` trỏ `SKILL.md` của domain đó — đường dẫn luôn resolve qua sổ đăng ký domain→skill (`skillForStage`, spec Work-State "Mô hình domain"), không bao giờ hardcode (xem RUL52 (luật template theo domain `coding` khớp trước wildcard; domain lạ/vắng mặt fold về `coding`)) | yes (một template mặc định luôn có) | `worker-prompt-default.txt`, `worker-prompt-skill-pointer.txt` |
```

### Full target unit

```text
## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế `{prompt}`/`{model}` theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`) · `executors` — catalog executor theo danh tính provider/cách gọi, không mang khẩu vị chất lượng · `modelPolicies` — bảng bắt buộc provider→tier→model với tier cung `nano|mini|standard|advanced|flagship|frontier` · `rigorToTier` — bảng bắt buộc ánh xạ đủ bốn mức cầu `low|standard|high|critical` sang tier cung · `capabilities.<name>.rigor` — sàn cầu tùy chọn, chỉ nâng; khối `capabilities.<name>.overrides` bị từ chối · `timeoutMs` — trần thời gian mặc định của một worker, tối đa 4h; một lượt chạy có thể xin thời gian riêng (RUL96 (one run may take its own timeout)) · `confinement`/`confinementPolicies` — chính sách giam giữ · `capabilities` — catalog lời hứa hành vi và binding executor/invocation | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`); `fgos setup` điền `rigorToTier`, `fgos doctor` kiểm bảng này và các khoá placement đã retired; một `--config <path>` tường minh trỏ vào đường vắng mặt vẫn báo lỗi ngay (`fgos discover`/`plan`; `fgos-runner` không còn `--config`, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) |
| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: "codex-home", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock ở `~/.fgos/runtime/provider-capacity/state.lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |
| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |
| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |
| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |
| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` **ở stage executing** TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp. Executing-phase-only scoping (claim-lock): trước đây, pick/take chỉ mở frontier (executing-phase), nên counting mọi `todo→doing` move tương đương dispatch attempts. Claim-lock cho phép `pick` cầm stage khác — claim-release cycle ở các stage đầu vòng (`discovery`/`exploring`/`planning`, cộng tên di sản `decompose`) không được tính vào ngân sách executing-phase (per claim-lock code-review finding) | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |
| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |
| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |
| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |
| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem "Xem live output worker khi đang chạy") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |
| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |
| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem "Cổng duyệt PR nội bộ" và "Iron Law" dưới, Business Rules RUL36 (`evolve --submit` là hành động ghi duy nhất trên bề mặt evolve, tái dùng chính cửa `submit`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |
| 11 | Prompt template worker (STR49, `src/runner/prompt-templates/`) | Nội dung chữ nghĩa của `buildPrompt`, tách khỏi code sang file committed — sửa prompt là sửa MỘT file, không đụng code | `selectTemplate({kind, tier, domain})` — bảng luật cơ học, wildcard cuối luôn khớp (từ STR91: luật `domain: 'coding'` khớp TRƯỚC wildcard — domain vắng mặt hay không nhận diện được đều fold về `coding` giống mọi nơi khác trong hệ, không phải một fallback riêng — trỏ `worker-prompt-skill-pointer.txt`; mọi domain đã đăng ký khác `coding` (vd `synthetic`) vẫn rơi về wildcard, trỏ `worker-prompt-default.txt` như trước STR91) · `renderTemplate` — substitution `{placeholder}` string-replace thuần, không engine · `hashTemplate` — sha256 nội dung raw file, ghi kèm dispatch log (xem RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`)) · template `worker-prompt-skill-pointer.txt` giữ đủ 6 mục cố định sẵn có, CHỈ thêm đúng một mục `# Agent skill` trỏ `SKILL.md` của domain đó — đường dẫn luôn resolve qua sổ đăng ký domain→skill (`skillForStage`, spec Work-State "Mô hình domain"), không bao giờ hardcode (xem RUL52 (luật template theo domain `coding` khớp trước wildcard; domain lạ/vắng mặt fold về `coding`)) | yes (một template mặc định luôn có) | `worker-prompt-default.txt`, `worker-prompt-skill-pointer.txt` |
```

### Full diff

```diff
No text difference.
```

## claim_5a944093894be93c5792a1c5e14990c6

Source digest: 43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e

Target digest: 43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-9",
  "sourceLines": [
    73,
    87
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Data Dictionary"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
  "targetAnchor": "unheaded-block-3",
  "targetAncestry": [
    "Added in candidate: Runner Data Dictionary",
    "Data Dictionary"
  ],
  "nativeTargetClaimId": "claim_79b0799153cbe0703b7f81884263d622",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "data-dictionary",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_5a944093894be93c5792a1c5e14990c6",
    "sourceUnitDigest": "43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e",
    "targetOwner": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "targetAnchor": "unheaded-block-3",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-9 (lines 73–87) carried at docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#unheaded-block-3. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "43f03eb4dffdeff420f464531d60be7e37e13192429963b10ba302be1e9b777e",
    "targetAncestry": [
      "Added in candidate: Runner Data Dictionary",
      "Data Dictionary"
    ]
  }
}
```

### Full source unit

```text
| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế `{prompt}`/`{model}` theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`) · `executors` — catalog executor theo danh tính provider/cách gọi, không mang khẩu vị chất lượng · `modelPolicies` — bảng bắt buộc provider→tier→model với tier cung `nano|mini|standard|advanced|flagship|frontier` · `rigorToTier` — bảng bắt buộc ánh xạ đủ bốn mức cầu `low|standard|high|critical` sang tier cung · `capabilities.<name>.rigor` — sàn cầu tùy chọn, chỉ nâng; khối `capabilities.<name>.overrides` bị từ chối · `timeoutMs` — trần thời gian mặc định của một worker, tối đa 4h; một lượt chạy có thể xin thời gian riêng (RUL96 (one run may take its own timeout)) · `confinement`/`confinementPolicies` — chính sách giam giữ · `capabilities` — catalog lời hứa hành vi và binding executor/invocation | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`); `fgos setup` điền `rigorToTier`, `fgos doctor` kiểm bảng này và các khoá placement đã retired; một `--config <path>` tường minh trỏ vào đường vắng mặt vẫn báo lỗi ngay (`fgos discover`/`plan`; `fgos-runner` không còn `--config`, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) |
| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: "codex-home", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock ở `~/.fgos/runtime/provider-capacity/state.lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |
| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |
| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |
| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |
| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` **ở stage executing** TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp. Executing-phase-only scoping (claim-lock): trước đây, pick/take chỉ mở frontier (executing-phase), nên counting mọi `todo→doing` move tương đương dispatch attempts. Claim-lock cho phép `pick` cầm stage khác — claim-release cycle ở các stage đầu vòng (`discovery`/`exploring`/`planning`, cộng tên di sản `decompose`) không được tính vào ngân sách executing-phase (per claim-lock code-review finding) | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |
| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |
| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |
| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |
| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem "Xem live output worker khi đang chạy") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |
| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |
| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem "Cổng duyệt PR nội bộ" và "Iron Law" dưới, Business Rules RUL36 (`evolve --submit` là hành động ghi duy nhất trên bề mặt evolve, tái dùng chính cửa `submit`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |
| 11 | Prompt template worker (STR49, `src/runner/prompt-templates/`) | Nội dung chữ nghĩa của `buildPrompt`, tách khỏi code sang file committed — sửa prompt là sửa MỘT file, không đụng code | `selectTemplate({kind, tier, domain})` — bảng luật cơ học, wildcard cuối luôn khớp (từ STR91: luật `domain: 'coding'` khớp TRƯỚC wildcard — domain vắng mặt hay không nhận diện được đều fold về `coding` giống mọi nơi khác trong hệ, không phải một fallback riêng — trỏ `worker-prompt-skill-pointer.txt`; mọi domain đã đăng ký khác `coding` (vd `synthetic`) vẫn rơi về wildcard, trỏ `worker-prompt-default.txt` như trước STR91) · `renderTemplate` — substitution `{placeholder}` string-replace thuần, không engine · `hashTemplate` — sha256 nội dung raw file, ghi kèm dispatch log (xem RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`)) · template `worker-prompt-skill-pointer.txt` giữ đủ 6 mục cố định sẵn có, CHỈ thêm đúng một mục `# Agent skill` trỏ `SKILL.md` của domain đó — đường dẫn luôn resolve qua sổ đăng ký domain→skill (`skillForStage`, spec Work-State "Mô hình domain"), không bao giờ hardcode (xem RUL52 (luật template theo domain `coding` khớp trước wildcard; domain lạ/vắng mặt fold về `coding`)) | yes (một template mặc định luôn có) | `worker-prompt-default.txt`, `worker-prompt-skill-pointer.txt` |
```

### Full target unit

```text
| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế `{prompt}`/`{model}` theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`) · `executors` — catalog executor theo danh tính provider/cách gọi, không mang khẩu vị chất lượng · `modelPolicies` — bảng bắt buộc provider→tier→model với tier cung `nano|mini|standard|advanced|flagship|frontier` · `rigorToTier` — bảng bắt buộc ánh xạ đủ bốn mức cầu `low|standard|high|critical` sang tier cung · `capabilities.<name>.rigor` — sàn cầu tùy chọn, chỉ nâng; khối `capabilities.<name>.overrides` bị từ chối · `timeoutMs` — trần thời gian mặc định của một worker, tối đa 4h; một lượt chạy có thể xin thời gian riêng (RUL96 (one run may take its own timeout)) · `confinement`/`confinementPolicies` — chính sách giam giữ · `capabilities` — catalog lời hứa hành vi và binding executor/invocation | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`); `fgos setup` điền `rigorToTier`, `fgos doctor` kiểm bảng này và các khoá placement đã retired; một `--config <path>` tường minh trỏ vào đường vắng mặt vẫn báo lỗi ngay (`fgos discover`/`plan`; `fgos-runner` không còn `--config`, RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)) |
| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: "codex-home", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock ở `~/.fgos/runtime/provider-capacity/state.lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |
| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |
| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |
| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |
| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` **ở stage executing** TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp. Executing-phase-only scoping (claim-lock): trước đây, pick/take chỉ mở frontier (executing-phase), nên counting mọi `todo→doing` move tương đương dispatch attempts. Claim-lock cho phép `pick` cầm stage khác — claim-release cycle ở các stage đầu vòng (`discovery`/`exploring`/`planning`, cộng tên di sản `decompose`) không được tính vào ngân sách executing-phase (per claim-lock code-review finding) | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |
| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |
| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |
| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |
| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem "Xem live output worker khi đang chạy") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |
| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |
| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem "Cổng duyệt PR nội bộ" và "Iron Law" dưới, Business Rules RUL36 (`evolve --submit` là hành động ghi duy nhất trên bề mặt evolve, tái dùng chính cửa `submit`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |
| 11 | Prompt template worker (STR49, `src/runner/prompt-templates/`) | Nội dung chữ nghĩa của `buildPrompt`, tách khỏi code sang file committed — sửa prompt là sửa MỘT file, không đụng code | `selectTemplate({kind, tier, domain})` — bảng luật cơ học, wildcard cuối luôn khớp (từ STR91: luật `domain: 'coding'` khớp TRƯỚC wildcard — domain vắng mặt hay không nhận diện được đều fold về `coding` giống mọi nơi khác trong hệ, không phải một fallback riêng — trỏ `worker-prompt-skill-pointer.txt`; mọi domain đã đăng ký khác `coding` (vd `synthetic`) vẫn rơi về wildcard, trỏ `worker-prompt-default.txt` như trước STR91) · `renderTemplate` — substitution `{placeholder}` string-replace thuần, không engine · `hashTemplate` — sha256 nội dung raw file, ghi kèm dispatch log (xem RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`)) · template `worker-prompt-skill-pointer.txt` giữ đủ 6 mục cố định sẵn có, CHỈ thêm đúng một mục `# Agent skill` trỏ `SKILL.md` của domain đó — đường dẫn luôn resolve qua sổ đăng ký domain→skill (`skillForStage`, spec Work-State "Mô hình domain"), không bao giờ hardcode (xem RUL52 (luật template theo domain `coding` khớp trước wildcard; domain lạ/vắng mặt fold về `coding`)) | yes (một template mặc định luôn có) | `worker-prompt-default.txt`, `worker-prompt-skill-pointer.txt` |
```

### Full diff

```diff
No text difference.
```

## claim_2c3300909e21da9dd0feb02e991c5f0a

Source digest: cfd79dea41e34baf7969fddba3e30ecc5666de6a7ee32a50dd97cf099bfd8448

Target digest: cfd79dea41e34baf7969fddba3e30ecc5666de6a7ee32a50dd97cf099bfd8448

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "hợp-đồng-rigor-tier-phase-2-2026-10-01",
  "sourceLines": [
    89,
    89
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Data Dictionary"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
  "targetAnchor": "hợp-đồng-rigor-tier-phase-2-2026-10-01",
  "targetAncestry": [
    "Added in candidate: Runner Data Dictionary",
    "Data Dictionary"
  ],
  "nativeTargetClaimId": "claim_324198a239aba086e1e4ad2636c35a54",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "hợp-đồng-rigor-tier-phase-2-2026-10-01",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_2c3300909e21da9dd0feb02e991c5f0a",
    "sourceUnitDigest": "cfd79dea41e34baf7969fddba3e30ecc5666de6a7ee32a50dd97cf099bfd8448",
    "targetOwner": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "targetAnchor": "hợp-đồng-rigor-tier-phase-2-2026-10-01",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole heading docs/specs/runner.md#hợp-đồng-rigor-tier-phase-2-2026-10-01 (lines 89–89) carried at docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#hợp-đồng-rigor-tier-phase-2-2026-10-01. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "cfd79dea41e34baf7969fddba3e30ecc5666de6a7ee32a50dd97cf099bfd8448",
    "targetAncestry": [
      "Added in candidate: Runner Data Dictionary",
      "Data Dictionary"
    ]
  }
}
```

### Full source unit

```text
### Hợp đồng rigor → tier (Phase 2, 2026-10-01)

Workflow/Unit và operation chỉ phát biểu nhu cầu bằng `rigor = low|standard|high|critical`. `rigor` gộp chỉ-nâng qua workflow → unit → assignment, rồi gộp sàn `capabilities.<cap>.rigor`. Runner ánh xạ mức cầu cuối qua `runner.rigorToTier`, sau đó chọn model tại `runner.modelPolicies[provider][tier]`. `reasoningEffort` suy từ `rigor`; một override `tier` tường minh không tự nâng effort.

**Effort và model khi launch (2026-10-14).** `reasoningEffort` suy từ `rigor` chỉ là ghi nhận trong policy, không được render vào lệnh chạy: đo trên `.fgos/assignments` ngày 2026-10-14, 21/32 run Codex có policy ghi effort chạy ở mức khác (header Codex `reasoning effort:` lấy từ `config.toml` của `CODEX_HOME`). Một mức nêu tường minh được render. Ở cửa chuẩn, `fgos run --effort low|medium|high|max` (hoặc khoá `reasoningEffort` trong `--override`) là một override của `bind()`; `bind()` kiểm bằng `assertReasoningEffort` (từ vựng chuẩn, rồi `executors.<id>.supports.reasoningEffort` của executor được bind — danh sách hẹp hơn là giới hạn có chủ đích, mức ngoài danh sách thành binding bị từ chối `reasoning-effort`), ghi `binding.reasoningEffort` + `provenance.reasoningEffort`, rồi Assignment mang nó xuống. Cửa compat `fgos dispatch execute --effort` (plain, `--assignment`, `--contract`) và `reasoningEffort` của operation policy đi cùng hàm kiểm đó. Render ở một chỗ, `resolveExecutorCommand`, vào template theo CLI được spawn (`provider-adapter.mjs` `renderReasoningEffortArgs`): claude/agy `--effort`, pi/omp `--thinking` (thay giá trị template đã ghi cứng), codex `-c model_reasoning_effort=` (`max` → `xhigh`); CLI không có điều khiển effort → từ chối trước khi spawn.

Model chạy lệch với model đã bind được ghi thành provenance: receipt `assignment-run-result` mang `policy.provenance.modelDrift = {value: [...], source}` và `policy.provenance.reasoningEffort.rendered` (cờ thật đã render). Mã cảnh báo: `model-overridden` (policy thay model trước launch, vd redirect sang provider khác tính lại theo tier), `model-not-passed` (argv không chứa model), `model-unsupported` (CLI từ chối/không biết model — câu từ chối thật của agy, pi, codex), `model-reported-different` (header `model:` trên stderr của codex khác model đã truyền). Kiểm trước-spawn ở `resolveExecutorCommand` (`modelCheck`), sau-run ở `collectModelWarnings`, cả hai trong `provider-adapter.mjs`, dùng chung cho mọi cửa; kết quả `execute` thô (compat) mang cùng dữ liệu ở `reasoningEffort`/`modelWarnings`.

`tier` là kênh placement tường minh, chỉ hợp lệ ở actor/assignment/CLI và chỉ được nâng so với tier suy từ rigor. Workflow/Unit dùng `tier` bị từ chối. Contract/assignment đã lưu trước Phase 2 được đọc một lần tại biên load để đổi field tier cũ thành `tier`; mọi bản ghi mới chỉ ghi `tier`.

Capability không được ghi model hoặc tier trực tiếp: `capabilities.<cap>.rigor` là sàn duy nhất theo loại việc. Config còn `capabilities.*.overrides`, bảng model phẳng, hoặc field quality bridge cũ bị fail-fast với hướng dẫn sửa; setup/doctor sở hữu default và chẩn đoán tương ứng.
```

### Full target unit

```text
### Hợp đồng rigor → tier (Phase 2, 2026-10-01)

Workflow/Unit và operation chỉ phát biểu nhu cầu bằng `rigor = low|standard|high|critical`. `rigor` gộp chỉ-nâng qua workflow → unit → assignment, rồi gộp sàn `capabilities.<cap>.rigor`. Runner ánh xạ mức cầu cuối qua `runner.rigorToTier`, sau đó chọn model tại `runner.modelPolicies[provider][tier]`. `reasoningEffort` suy từ `rigor`; một override `tier` tường minh không tự nâng effort.

**Effort và model khi launch (2026-10-14).** `reasoningEffort` suy từ `rigor` chỉ là ghi nhận trong policy, không được render vào lệnh chạy: đo trên `.fgos/assignments` ngày 2026-10-14, 21/32 run Codex có policy ghi effort chạy ở mức khác (header Codex `reasoning effort:` lấy từ `config.toml` của `CODEX_HOME`). Một mức nêu tường minh được render. Ở cửa chuẩn, `fgos run --effort low|medium|high|max` (hoặc khoá `reasoningEffort` trong `--override`) là một override của `bind()`; `bind()` kiểm bằng `assertReasoningEffort` (từ vựng chuẩn, rồi `executors.<id>.supports.reasoningEffort` của executor được bind — danh sách hẹp hơn là giới hạn có chủ đích, mức ngoài danh sách thành binding bị từ chối `reasoning-effort`), ghi `binding.reasoningEffort` + `provenance.reasoningEffort`, rồi Assignment mang nó xuống. Cửa compat `fgos dispatch execute --effort` (plain, `--assignment`, `--contract`) và `reasoningEffort` của operation policy đi cùng hàm kiểm đó. Render ở một chỗ, `resolveExecutorCommand`, vào template theo CLI được spawn (`provider-adapter.mjs` `renderReasoningEffortArgs`): claude/agy `--effort`, pi/omp `--thinking` (thay giá trị template đã ghi cứng), codex `-c model_reasoning_effort=` (`max` → `xhigh`); CLI không có điều khiển effort → từ chối trước khi spawn.

Model chạy lệch với model đã bind được ghi thành provenance: receipt `assignment-run-result` mang `policy.provenance.modelDrift = {value: [...], source}` và `policy.provenance.reasoningEffort.rendered` (cờ thật đã render). Mã cảnh báo: `model-overridden` (policy thay model trước launch, vd redirect sang provider khác tính lại theo tier), `model-not-passed` (argv không chứa model), `model-unsupported` (CLI từ chối/không biết model — câu từ chối thật của agy, pi, codex), `model-reported-different` (header `model:` trên stderr của codex khác model đã truyền). Kiểm trước-spawn ở `resolveExecutorCommand` (`modelCheck`), sau-run ở `collectModelWarnings`, cả hai trong `provider-adapter.mjs`, dùng chung cho mọi cửa; kết quả `execute` thô (compat) mang cùng dữ liệu ở `reasoningEffort`/`modelWarnings`.

`tier` là kênh placement tường minh, chỉ hợp lệ ở actor/assignment/CLI và chỉ được nâng so với tier suy từ rigor. Workflow/Unit dùng `tier` bị từ chối. Contract/assignment đã lưu trước Phase 2 được đọc một lần tại biên load để đổi field tier cũ thành `tier`; mọi bản ghi mới chỉ ghi `tier`.

Capability không được ghi model hoặc tier trực tiếp: `capabilities.<cap>.rigor` là sàn duy nhất theo loại việc. Config còn `capabilities.*.overrides`, bảng model phẳng, hoặc field quality bridge cũ bị fail-fast với hướng dẫn sửa; setup/doctor sở hữu default và chẩn đoán tương ứng.
```

### Full diff

```diff
No text difference.
```

## claim_62d9996e5897714517de064047f1ff83

Source digest: 2431683892c8c5b500b16f2b6cb61a09cdf6832f5955012397fd028aabaf5d73

Target digest: 2431683892c8c5b500b16f2b6cb61a09cdf6832f5955012397fd028aabaf5d73

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-10",
  "sourceLines": [
    91,
    91
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Data Dictionary",
    "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
  "targetAnchor": "unheaded-block-4",
  "targetAncestry": [
    "Added in candidate: Runner Data Dictionary",
    "Data Dictionary",
    "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
  ],
  "nativeTargetClaimId": "claim_e512a4b1a689c4e8c63c4279efa78ce6",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "hợp-đồng-rigor-tier-phase-2-2026-10-01",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_62d9996e5897714517de064047f1ff83",
    "sourceUnitDigest": "2431683892c8c5b500b16f2b6cb61a09cdf6832f5955012397fd028aabaf5d73",
    "targetOwner": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "targetAnchor": "unheaded-block-4",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-10 (lines 91–91) carried at docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#unheaded-block-4. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "2431683892c8c5b500b16f2b6cb61a09cdf6832f5955012397fd028aabaf5d73",
    "targetAncestry": [
      "Added in candidate: Runner Data Dictionary",
      "Data Dictionary",
      "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
    ]
  }
}
```

### Full source unit

```text
Workflow/Unit và operation chỉ phát biểu nhu cầu bằng `rigor = low|standard|high|critical`. `rigor` gộp chỉ-nâng qua workflow → unit → assignment, rồi gộp sàn `capabilities.<cap>.rigor`. Runner ánh xạ mức cầu cuối qua `runner.rigorToTier`, sau đó chọn model tại `runner.modelPolicies[provider][tier]`. `reasoningEffort` suy từ `rigor`; một override `tier` tường minh không tự nâng effort.
```

### Full target unit

```text
Workflow/Unit và operation chỉ phát biểu nhu cầu bằng `rigor = low|standard|high|critical`. `rigor` gộp chỉ-nâng qua workflow → unit → assignment, rồi gộp sàn `capabilities.<cap>.rigor`. Runner ánh xạ mức cầu cuối qua `runner.rigorToTier`, sau đó chọn model tại `runner.modelPolicies[provider][tier]`. `reasoningEffort` suy từ `rigor`; một override `tier` tường minh không tự nâng effort.
```

### Full diff

```diff
No text difference.
```

## claim_0735a1a1ac2e5c08ab7dde6f393746f0

Source digest: 940f6b04cc13b1d6f8fbd92cf30fab8804ad74f218ab9ca618ca424dba8583d6

Target digest: 940f6b04cc13b1d6f8fbd92cf30fab8804ad74f218ab9ca618ca424dba8583d6

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-11",
  "sourceLines": [
    93,
    93
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Data Dictionary",
    "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
  "targetAnchor": "unheaded-block-5",
  "targetAncestry": [
    "Added in candidate: Runner Data Dictionary",
    "Data Dictionary",
    "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
  ],
  "nativeTargetClaimId": "claim_9a6512066f55979f987ff9748264782b",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "hợp-đồng-rigor-tier-phase-2-2026-10-01",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_0735a1a1ac2e5c08ab7dde6f393746f0",
    "sourceUnitDigest": "940f6b04cc13b1d6f8fbd92cf30fab8804ad74f218ab9ca618ca424dba8583d6",
    "targetOwner": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "targetAnchor": "unheaded-block-5",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-11 (lines 93–93) carried at docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#unheaded-block-5. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "940f6b04cc13b1d6f8fbd92cf30fab8804ad74f218ab9ca618ca424dba8583d6",
    "targetAncestry": [
      "Added in candidate: Runner Data Dictionary",
      "Data Dictionary",
      "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
    ]
  }
}
```

### Full source unit

```text
**Effort và model khi launch (2026-10-14).** `reasoningEffort` suy từ `rigor` chỉ là ghi nhận trong policy, không được render vào lệnh chạy: đo trên `.fgos/assignments` ngày 2026-10-14, 21/32 run Codex có policy ghi effort chạy ở mức khác (header Codex `reasoning effort:` lấy từ `config.toml` của `CODEX_HOME`). Một mức nêu tường minh được render. Ở cửa chuẩn, `fgos run --effort low|medium|high|max` (hoặc khoá `reasoningEffort` trong `--override`) là một override của `bind()`; `bind()` kiểm bằng `assertReasoningEffort` (từ vựng chuẩn, rồi `executors.<id>.supports.reasoningEffort` của executor được bind — danh sách hẹp hơn là giới hạn có chủ đích, mức ngoài danh sách thành binding bị từ chối `reasoning-effort`), ghi `binding.reasoningEffort` + `provenance.reasoningEffort`, rồi Assignment mang nó xuống. Cửa compat `fgos dispatch execute --effort` (plain, `--assignment`, `--contract`) và `reasoningEffort` của operation policy đi cùng hàm kiểm đó. Render ở một chỗ, `resolveExecutorCommand`, vào template theo CLI được spawn (`provider-adapter.mjs` `renderReasoningEffortArgs`): claude/agy `--effort`, pi/omp `--thinking` (thay giá trị template đã ghi cứng), codex `-c model_reasoning_effort=` (`max` → `xhigh`); CLI không có điều khiển effort → từ chối trước khi spawn.
```

### Full target unit

```text
**Effort và model khi launch (2026-10-14).** `reasoningEffort` suy từ `rigor` chỉ là ghi nhận trong policy, không được render vào lệnh chạy: đo trên `.fgos/assignments` ngày 2026-10-14, 21/32 run Codex có policy ghi effort chạy ở mức khác (header Codex `reasoning effort:` lấy từ `config.toml` của `CODEX_HOME`). Một mức nêu tường minh được render. Ở cửa chuẩn, `fgos run --effort low|medium|high|max` (hoặc khoá `reasoningEffort` trong `--override`) là một override của `bind()`; `bind()` kiểm bằng `assertReasoningEffort` (từ vựng chuẩn, rồi `executors.<id>.supports.reasoningEffort` của executor được bind — danh sách hẹp hơn là giới hạn có chủ đích, mức ngoài danh sách thành binding bị từ chối `reasoning-effort`), ghi `binding.reasoningEffort` + `provenance.reasoningEffort`, rồi Assignment mang nó xuống. Cửa compat `fgos dispatch execute --effort` (plain, `--assignment`, `--contract`) và `reasoningEffort` của operation policy đi cùng hàm kiểm đó. Render ở một chỗ, `resolveExecutorCommand`, vào template theo CLI được spawn (`provider-adapter.mjs` `renderReasoningEffortArgs`): claude/agy `--effort`, pi/omp `--thinking` (thay giá trị template đã ghi cứng), codex `-c model_reasoning_effort=` (`max` → `xhigh`); CLI không có điều khiển effort → từ chối trước khi spawn.
```

### Full diff

```diff
No text difference.
```

## claim_092c6c62f6b2c014d24f74aca3dee571

Source digest: 344985adb8cb7f6b7f62c1b4ef88be9a3d3f73e531130851c57fa9a9106d3c12

Target digest: 344985adb8cb7f6b7f62c1b4ef88be9a3d3f73e531130851c57fa9a9106d3c12

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-12",
  "sourceLines": [
    95,
    95
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Data Dictionary",
    "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
  "targetAnchor": "unheaded-block-6",
  "targetAncestry": [
    "Added in candidate: Runner Data Dictionary",
    "Data Dictionary",
    "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
  ],
  "nativeTargetClaimId": "claim_3920b30c1f9a988ee00eb156ef3fe503",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "hợp-đồng-rigor-tier-phase-2-2026-10-01",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_092c6c62f6b2c014d24f74aca3dee571",
    "sourceUnitDigest": "344985adb8cb7f6b7f62c1b4ef88be9a3d3f73e531130851c57fa9a9106d3c12",
    "targetOwner": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "targetAnchor": "unheaded-block-6",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-12 (lines 95–95) carried at docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#unheaded-block-6. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "344985adb8cb7f6b7f62c1b4ef88be9a3d3f73e531130851c57fa9a9106d3c12",
    "targetAncestry": [
      "Added in candidate: Runner Data Dictionary",
      "Data Dictionary",
      "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
    ]
  }
}
```

### Full source unit

```text
Model chạy lệch với model đã bind được ghi thành provenance: receipt `assignment-run-result` mang `policy.provenance.modelDrift = {value: [...], source}` và `policy.provenance.reasoningEffort.rendered` (cờ thật đã render). Mã cảnh báo: `model-overridden` (policy thay model trước launch, vd redirect sang provider khác tính lại theo tier), `model-not-passed` (argv không chứa model), `model-unsupported` (CLI từ chối/không biết model — câu từ chối thật của agy, pi, codex), `model-reported-different` (header `model:` trên stderr của codex khác model đã truyền). Kiểm trước-spawn ở `resolveExecutorCommand` (`modelCheck`), sau-run ở `collectModelWarnings`, cả hai trong `provider-adapter.mjs`, dùng chung cho mọi cửa; kết quả `execute` thô (compat) mang cùng dữ liệu ở `reasoningEffort`/`modelWarnings`.
```

### Full target unit

```text
Model chạy lệch với model đã bind được ghi thành provenance: receipt `assignment-run-result` mang `policy.provenance.modelDrift = {value: [...], source}` và `policy.provenance.reasoningEffort.rendered` (cờ thật đã render). Mã cảnh báo: `model-overridden` (policy thay model trước launch, vd redirect sang provider khác tính lại theo tier), `model-not-passed` (argv không chứa model), `model-unsupported` (CLI từ chối/không biết model — câu từ chối thật của agy, pi, codex), `model-reported-different` (header `model:` trên stderr của codex khác model đã truyền). Kiểm trước-spawn ở `resolveExecutorCommand` (`modelCheck`), sau-run ở `collectModelWarnings`, cả hai trong `provider-adapter.mjs`, dùng chung cho mọi cửa; kết quả `execute` thô (compat) mang cùng dữ liệu ở `reasoningEffort`/`modelWarnings`.
```

### Full diff

```diff
No text difference.
```

## claim_ec3f286e81c31817022a1caa3eebda54

Source digest: a52e7ad1d984e28c180b20e213675e16bd0225c3a2746cbe06a3f3f1168e63cb

Target digest: a52e7ad1d984e28c180b20e213675e16bd0225c3a2746cbe06a3f3f1168e63cb

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-13",
  "sourceLines": [
    97,
    97
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Data Dictionary",
    "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
  "targetAnchor": "unheaded-block-7",
  "targetAncestry": [
    "Added in candidate: Runner Data Dictionary",
    "Data Dictionary",
    "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
  ],
  "nativeTargetClaimId": "claim_4ad0df26dabf05e5442ac9858b45fb83",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "hợp-đồng-rigor-tier-phase-2-2026-10-01",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_ec3f286e81c31817022a1caa3eebda54",
    "sourceUnitDigest": "a52e7ad1d984e28c180b20e213675e16bd0225c3a2746cbe06a3f3f1168e63cb",
    "targetOwner": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "targetAnchor": "unheaded-block-7",
    "claimKind": "contract",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-13 (lines 97–97) carried at docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#unheaded-block-7. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "a52e7ad1d984e28c180b20e213675e16bd0225c3a2746cbe06a3f3f1168e63cb",
    "targetAncestry": [
      "Added in candidate: Runner Data Dictionary",
      "Data Dictionary",
      "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
    ]
  }
}
```

### Full source unit

```text
`tier` là kênh placement tường minh, chỉ hợp lệ ở actor/assignment/CLI và chỉ được nâng so với tier suy từ rigor. Workflow/Unit dùng `tier` bị từ chối. Contract/assignment đã lưu trước Phase 2 được đọc một lần tại biên load để đổi field tier cũ thành `tier`; mọi bản ghi mới chỉ ghi `tier`.
```

### Full target unit

```text
`tier` là kênh placement tường minh, chỉ hợp lệ ở actor/assignment/CLI và chỉ được nâng so với tier suy từ rigor. Workflow/Unit dùng `tier` bị từ chối. Contract/assignment đã lưu trước Phase 2 được đọc một lần tại biên load để đổi field tier cũ thành `tier`; mọi bản ghi mới chỉ ghi `tier`.
```

### Full diff

```diff
No text difference.
```

## claim_e9802a0cf16dad3c227c5159d457e3dd

Source digest: c9c5d3f64f4d2259f31180907787ac87bd85322dc67c1ae9a63bac140497ce41

Target digest: c9c5d3f64f4d2259f31180907787ac87bd85322dc67c1ae9a63bac140497ce41

```json
{
  "sourcePath": "docs/specs/runner.md",
  "sourceAnchor": "unheaded-block-14",
  "sourceLines": [
    99,
    99
  ],
  "sourceAncestry": [
    "Spec: Runner (vòng tự hành)",
    "Data Dictionary",
    "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
  ],
  "targetPath": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
  "targetAnchor": "unheaded-block-8",
  "targetAncestry": [
    "Added in candidate: Runner Data Dictionary",
    "Data Dictionary",
    "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
  ],
  "nativeTargetClaimId": "claim_012a595f595cb3f46bd99970dffb2f4f",
  "class": "Weak-exact",
  "classReason": "ancestor headings differ; document exact share below one half",
  "section": "hợp-đồng-rigor-tier-phase-2-2026-10-01",
  "mapAmendments": [],
  "reboundAnchors": [],
  "decision": {
    "claimId": "claim_e9802a0cf16dad3c227c5159d457e3dd",
    "sourceUnitDigest": "c9c5d3f64f4d2259f31180907787ac87bd85322dc67c1ae9a63bac140497ce41",
    "targetOwner": "docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md",
    "targetAnchor": "unheaded-block-8",
    "claimKind": "specification",
    "disposition": "move",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792057868388-68b4a62c@2026-10-15",
    "rationale": "Weak-exact: ancestor headings differ; document exact share below one half. Whole unheaded-block docs/specs/runner.md#unheaded-block-14 (lines 99–99) carried at docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md#unheaded-block-8. Full native unit digest equal. P2 frozen map with explicit Lead additive amendment; original headings, RUL ids and decision ids retained. A19 carriage and explicit Lead A35 note: known stale carried sentences; full truth check owed at promotion. Decision/history placement is not a retirement judgment. Pending independent review; no approval carry or cutover.",
    "targetUnitDigest": "c9c5d3f64f4d2259f31180907787ac87bd85322dc67c1ae9a63bac140497ce41",
    "targetAncestry": [
      "Added in candidate: Runner Data Dictionary",
      "Data Dictionary",
      "Hợp đồng rigor → tier (Phase 2, 2026-10-01)"
    ]
  }
}
```

### Full source unit

```text
Capability không được ghi model hoặc tier trực tiếp: `capabilities.<cap>.rigor` là sàn duy nhất theo loại việc. Config còn `capabilities.*.overrides`, bảng model phẳng, hoặc field quality bridge cũ bị fail-fast với hướng dẫn sửa; setup/doctor sở hữu default và chẩn đoán tương ứng.
```

### Full target unit

```text
Capability không được ghi model hoặc tier trực tiếp: `capabilities.<cap>.rigor` là sàn duy nhất theo loại việc. Config còn `capabilities.*.overrides`, bảng model phẳng, hoặc field quality bridge cũ bị fail-fast với hướng dẫn sửa; setup/doctor sở hữu default và chẩn đoán tương ứng.
```

### Full diff

```diff
No text difference.
```
