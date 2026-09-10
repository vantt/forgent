# Group-thinking sẵn sàng code Confinement Authority chưa?

Ngày: 2026-09-10. Ràng buộc: **không dùng Work item**, chỉ `fgos coordination` qua
`fgos-plan-loop`/`fgos-code-panel`; **tạm bỏ confinement** (executor unconfined).
Yêu cầu thêm của anh: `code:implement` do **agy Gemini 3.8 Flash** đảm nhận.

## Kết luận

Engine sẵn sàng. Cấu hình và đầu vào **chưa**. Bốn việc phải làm trước, hai việc nên làm.

| Lớp | Trạng thái | Bằng chứng |
|---|---|---|
| Cửa `fgos coordination run/show/chain` + protocol `standalone-master-coordination-loop` trong pack | OK | `core/protocol-packs/group-thinking.json`; `fgos coordination` usage |
| Mutation rule (doer ghi được khi `--cwd` là linked worktree) | OK | `session-engine.mjs` `assertMutatingDispatchAllowed`; `run.mjs:457` forward `step.mutation` (tsk-371 fix `da078125` **đã ở main**) |
| Roster per-actor + cảnh báo khi thiếu `actors[]` | OK (chưa commit) | diff `run.mjs`, test mới 445/445 xanh |
| Doer `agy-cli` chạy shell thật ở headless (`--mode accept-edits`) | **OK, đã probe** | cat token file + `node --test` trả đúng, exit 0 |
| Reviewer `claude`/`claude-reviewer` chạy Bash | **CHẶN** | probe: `acceptEdits` không allowlist → "This command requires approval"; allowlist phải ghi cả dạng `rtk <cmd>` (hook RTK rewrite) thì mới chạy |
| Red-team `codex-cli` | OK | `--dangerously-bypass-approvals-and-sandbox`, `codex login status` = logged in |
| `code:implement` → agy | **chưa** | `decide --for code:implement` → `claude` |
| Track plan cho plan-loop (`plan.md` + `phase-NN-*.md`) | **chưa có** | `plans/260909-*confinement*` chỉ có `evidence/` |
| Spec + fix run.mjs/schema.mjs đã commit | **chưa** | `git status`: spec untracked, 5 file src/test modified |

## Phải làm (4)

### 1. Viết track plan từ spec §10

`fgos-plan-loop` resume/mở cell từ `plans/<track>/plan.md` + `phase-NN-*.md`; spec
(`docs/specs/confinement-authority.md`, đã nhận sửa từ review: có `workspace-write`,
`ResourceResolverV1`, `confinement.strict`, `proofProfile`) là design, chưa phải plan.
Đề xuất `plans/260910-confinement-authority/`:

- `phase-01-s1-one-door-observe.md` — hai call site chỉ gọi Authority, detector +
  attestation mô tả 17 executor, chưa đổi enforcement. Gate: static/import test +
  golden posture + mismatch falsifier.
- `phase-02-s2-declare.md` — mọi capability khai policy ID/`unconfined`; 3 bwrap
  executor tham chiếu backend `bwrap`.
- `phase-03-s3-prove.md` — probe harness + doctor checks.
- `phase-04-s4-enforce.md` — `required` fail-closed.

Mỗi phase = 1 cell (hoặc tách nhỏ hơn nếu diff > ~400 dòng, vì flash làm tốt hơn
với scope hẹp). Objective của doer phải **trỏ tới file plan trong worktree** (đường
dẫn trong `objective` text, không phải `contextRefs`).

### 2. Commit trước khi mở worktree

`git worktree add` chỉ checkout state đã commit. Cần commit: spec, plan track (mục 1),
5 file fix A2/A5 đang modified, 4 report. Không commit `.fgos/events/*.jsonl` chung
với code (ADR0020 — để `fgos catchup`/shard commit riêng như thường lệ).

### 3. Sửa `.fgos/config.json` (unconfined, tạm)

```jsonc
// a) code:implement → agy flash 3.8
"capabilities": {
  "code:implement": { "prefer": "agy-cli" }   // giữ description
}

// b) agy-cli: tier standard → flash-medium thay vì flash-low
"executors": {
  "agy-cli": {
    "rigorOverrides": { "light": "lightweight", "standard": "standard", "heavy": "creative" }
    // gemini: lightweight=3.8-flash-low, standard=3.8-flash-medium, creative=3.8-flash-high
  },

// c) claude-reviewer: cho Bash read-only, kê cả dạng rtk vì hook rewrite
  "claude-reviewer": {
    "invocations": [{ "via": "cli", "adapter": "cli-spawn", "command": "claude",
      "args": ["-p", "{prompt}", "--model", "{model}", "--permission-mode", "acceptEdits",
        "--allowedTools",
        "Bash(git diff:*),Bash(rtk git diff:*),Bash(git log:*),Bash(rtk git log:*),Bash(git show:*),Bash(rtk git show:*),Bash(git status:*),Bash(rtk git status:*),Bash(node --test:*),Bash(rtk node --test:*),Bash(npm test:*),Bash(rtk npm test:*)"] }]
  }
}
```

Lý do (b): `actors[].model` **không** có kênh cho `declared-protocol` (`run.mjs:172`),
model chỉ đến từ `executor.rigorOverrides` × `operation.policy.minTier`; hiện agy-cli
map mọi tier → `lightweight` = flash-low. Đổi ở (b) ảnh hưởng mọi caller của
`agy-cli` (fgos-coding-implement dùng `agy-herdr`, không bị). Nếu anh muốn giữ
agy-cli nguyên, thay bằng executor mới `agy-dev` copy agy-cli + rigor ở (b) và roster
dùng `agy-dev`.

Không cần `--dangerously-skip-permissions` cho agy: probe cho thấy `accept-edits` đã
chạy shell. Chỉ thêm nếu dispatch thật bị chặn.

Sau khi sửa: `fgos doctor` phải xanh; `node src/runner/dispatch.mjs decide --for code:implement`
phải trả `agy-cli`.

### 4. Roster cho cell

```json
"actors": [
  { "id": "doer",     "executor": "agy-cli",         "tier": "standard",   "persona": "focused-code-implementer" },
  { "id": "reviewer", "executor": "claude-reviewer", "tier": "analytical", "persona": "code-quality-reviewer" },
  { "id": "red-team", "executor": "codex-cli",       "tier": "analytical", "persona": "edge-case-and-security-attacker" }
]
```

Fix round: `fixer` = `agy-cli`. Mỗi request resume **phải lặp lại `actors[]`** (cảnh
báo A2 sẽ nhắc nếu quên). Chạy: `fgos coordination run --cwd ../<track>-<cell> --file open.json`
từ main checkout.

## Nên làm (2)

5. **Skill `fgos-code-panel` mục "Known gap tsk-371"** đã stale: fix đã ở main, nhưng
   doc vẫn bảo workaround "status failed là bình thường". Sửa ở `core/skills/…` rồi
   `npm run build:skills` (đừng sửa `.agents/`). tsk-371 item đang `awaiting-approval`
   — approve để đóng sổ.
6. **Timeout**: coordination không truyền `timeoutMs` → dùng `runner.timeoutMs`
   = 35 phút; agy có `--print-timeout 30m` riêng. Cell S1 với flash có thể vượt.
   Nếu cell đầu bị `timed-out`, nâng cả hai (vd 60m) hoặc chia cell nhỏ hơn.

## Không cần làm bây giờ

- Bwrap executor / Confinement Authority: đúng ý anh, hoãn; roster trên toàn
  unconfined. Reviewer `claude-reviewer` vẫn `acceptEdits` nên ghi được file trong
  worktree — chấp nhận rủi ro tạm, protocol vẫn gate `mutation` chỉ cho doer/fixer.
- A4 (cảnh báo gitnexus spam), B1/B2, 2 test đỏ có sẵn (`cohort-planner`,
  `check-decision-citation-drift`): không chặn track này; vẫn treo như report
  remediation đã nêu.

## Câu hỏi treo

1. (b) sửa `agy-cli` trực tiếp hay tạo `agy-dev`?
2. Reviewer dùng `claude-reviewer` (opus, có Bash read-only sau sửa) hay `codex-readonly`
   (đổi provider, khác doer/red-team đều codex → mất diversity)? Em đề xuất
   `claude-reviewer`.
3. Cell đầu: S1 nguyên khối hay tách "detector + attestation cho 17 executor" thành
   cell riêng trước?

## Bổ sung 13:21 — herdr-spawn cho cả 3 role: ĐÃ CHỨNG MINH qua cửa coordination

Session `herdr-smoke--cell-01` (protocol master-loop, `--cwd` worktree tạm, roster
`agy-herdr` / `claude-reviewer-herdr` / `codex-herdr`):

| Role | Executor | Model | Kết quả |
|---|---|---|---|
| doer | `agy-herdr` | gemini-3.8-flash-medium | `settled`; commit `52290f37`, node probe 42, `outbox/result-1.json` đúng schema |
| reviewer | `claude-reviewer-herdr` (mới) | opus | `settled`; đọc `git show --stat`, `cat -A`, sha256, chạy `node --test`, bắt exit code un-piped; finding info đúng |
| red-team | `codex-herdr` | gpt-5.6-terra | `settled` ở lần 3; `git status` sạch, `xxd` đúng byte |

Ba lỗi phải sửa trong config để tới được kết quả trên (đã sửa trong `.fgos/config.json`):

1. `codex-herdr` thiếu `providerModel: "openai-codex"` → tier `analytical` không map model, fail trước spawn.
2. Thêm `--dangerously-bypass-approvals-and-sandbox` vào args → "cannot be used multiple times": pane herdr là shell tương tác của anh, alias `codex` (account switcher trong `.zshrc`) đã cấp cờ đó. Bỏ cờ khỏi config, ghi điều kiện vào description.
3. herdr gõ tên trần từ `--kind`, không dùng `command` path của executor → trỏ absolute path không có tác dụng.

Thêm: `agy-herdr.rigorOverrides.standard` → `standard` (flash-medium); executor mới
`claude-reviewer-herdr` (allowlist Bash read-only, kê cả dạng `rtk`). Skill `fgos-code-panel`
ghi roster herdr là biến thể đã chứng minh; mục stale `tsk-371` đã thay. Evidence giữ ở
`.fgos/assignments/asgn_lead_herdr_smoke_op_00{1,2,6}`; worktree/branch smoke đã xóa.

## Bổ sung 13:35 — codex account: một nguồn cho dispatch

Phát hiện: `codex` trong `.zshrc` là function account-switcher (đọc `~/.codex_active_account`,
ghi đè `CODEX_HOME`, luôn thêm cờ bypass). Pane herdr chạy shell tương tác nên function áp
dụng; smoke trước đó chạy bằng `fgovn` (active) trong khi config khai `tetnu` và trust seed
vào `tetnu`. `codex-cli`/`codex-bwrap` lại dùng `~/.codex`. Ba nguồn account khác nhau.

Quyết định (anh chốt 13:31): fgOS là nguồn duy nhất cho dispatch, account `fgovn`
(tetnu hết quota).

Đã làm:
- `~/.zshrc` function `codex`: tôn trọng `CODEX_HOME` đã set sẵn (dispatch export vào pane),
  chỉ thêm cờ bypass khi args chưa có. Backup `~/.zshrc.bak-260910`. Terminal thường vẫn
  dùng `codex-switch` như cũ.
- `.fgos/config.json`: `codex-cli`, `codex-readonly`, `codex-herdr` khai `env.CODEX_HOME=${HOME}/.codex-fgovn`;
  `codex-bwrap` bind `~/.codex-fgovn/auth.json`; `codex-herdr` tự mang cờ bypass trở lại.

Chứng minh (13:38, `asgn_lead_herdr_smoke_op_007`, `codex-herdr` qua pane herdr, config mang cờ
bypass, function `.zshrc` đã sửa): `settled`, red-team kết luận đúng; file touched sau mốc:
`~/.codex-fgovn` 27, `~/.codex-tetnu` 0, `~/.codex` 0. Account của dispatch giờ do config quyết.
