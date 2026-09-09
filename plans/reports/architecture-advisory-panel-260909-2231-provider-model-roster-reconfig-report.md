# Đề nghị lại config provider/model cho architecture-advisory-panel

**Ngày:** 2026-09-09 · **Protocol:** `core.coordination-protocol.architecture-advisory-panel-v1`
**Bằng chứng:** panel chạy thật tối nay (`plans/260909-2107-confinement-authority-panel/`) + 4 probe live trong session này.

## 0. TL;DR

Roster hiện tại gán **3/9 vai** vào `codex-readonly` — executor **không thể chạy được vai nào**, đã fail thật tối nay.
Đã tìm ra và verify live cách khôi phục họ provider thứ 3 (`codex-bwrap`), cộng 1 fix timeout cho `agy-bwrap`.
Roster mới: claude 4 slot / gemini 2 / codex 2, mỗi cặp cần độc lập đều khác họ, và bỏ pin tier ở lead-advisor để 3 op của nó tự phân tầng chi phí.

---

## 1. Ràng buộc thật (không phải giả định)

**Read/write:** cả 9 vai đều là advisory read-only, nhưng **mọi vai đều BẮT BUỘC ghi 1 file**: `agent-result.json` trong `runDir` của chính nó (`src/runner/dispatch/assignment-runner.mjs`, `assignment.mjs:703`). Không ghi được = `no-evidence` = dispatch mất trắng. Vậy tiêu chuẩn executor là: **đọc mọi thứ + ghi đúng runDir + không ghi được repo đích**.

**Tier là monotonic-max** (`assignment-policy.mjs:92-123`): `effectiveTier = max(op.minTier, actor.tier)`. Hệ quả quan trọng:
- `actors[].tier` **chỉ nâng được, không hạ được** dưới `minTier` của protocol.
- Pin `actors[].tier` cho một actor chạy nhiều op sẽ **kéo tất cả op của actor đó lên cùng một tier** — mất khả năng phân tầng chi phí theo từng op.

**Model derive từ executor + tier**, không được ghi `actors[].model` (`run.mjs:166-175` từ chối cho `declared-protocol`).

Bảng tier→model thật (`.fgos/config.json` `runner.modelPolicies`):

| Họ | lightweight | standard | analytical | critical |
|---|---|---|---|---|
| claude | haiku | sonnet | sonnet | opus |
| gemini | 3.6-flash-medium | 3.6-flash-high | 3.1-pro-low | 3.1-pro-high |
| openai-codex | gpt-5.5 | gpt-5.5 | gpt-5.5 | gpt-5.5 |

→ **họ codex không có đòn bẩy tier nào**: mọi tier ra cùng một model. Chọn tier cho vai chạy codex là vô nghĩa về chi phí lẫn năng lực.

---

## 2. Vấn đề của config hiện tại

| # | Vấn đề | Bằng chứng |
|---|---|---|
| P1 | `codex-readonly` **không chạy được vai nào** — `-s read-only` không có cơ chế writable exception nên không ghi nổi `agent-result.json` | Fail thật tối nay (op_044 → no-evidence, phải retry 2 lần). Probe lại: `codex exec -s read-only --add-dir <dir>` vẫn **FAILED**, `--add-dir` không cấp quyền ghi ở read-only mode |
| P2 | Roster gán `codex-readonly` cho **3/9 vai** (context-investigator, constraint-advocate, architecture-critic) | `core/skills/fgos-architecture-panel/SKILL.md:243,246,247` |
| P3 | `agy-bwrap` **thiếu `--print-timeout`** → dính giới hạn print-mode mặc định của agy (~5 phút), giết đúng vai red-team | op_053 timeout tối nay. `agy-cli` có `--print-timeout 30m`, `agy-bwrap` thì không |
| P4 | Red-team nằm trên `agy-bwrap`, đúng chỗ agy hay hỏng nhất: wrapper kết quả rỗng/1 dòng (B12) → tạo ra vẻ "APPROVE nghi thức" mà không kiểm gì | Known Gaps của chính skill |
| P5 | Panel co về **2 họ provider**, tức là mất luôn giá trị cốt lõi của panel (đa dạng priors) | Report tối nay, mục 1 |
| P6 | **Ngoài panel:** `capabilities.code:review.prefer` và `code:debug.prefer` cũng trỏ vào `codex-readonly` → cùng cơ chế hỏng, cần verify 1 lần chạy | `.fgos/config.json` |

---

## 3. Khôi phục họ provider thứ 3 — đã verify live

`codex-bwrap`: bwrap cấp confinement thay cho sandbox nội bộ của codex. P00.1 từng loại nó vì crash `os error 30`; nguyên nhân thật là codex **cần ghi vào `CODEX_HOME`** lúc startup, không phải `/tmp`.

Xác nhận từ OpenAI Docs + strace trên codex-cli 0.153.2 (do người dùng tra): các đường cần ghi lúc khởi động gồm `tmp/arg0/*`, `installation_id`, `models_cache.json`, và loạt SQLite (`state_*`, `logs_*`, `goals_*`, `memories_*`, `queue_*`, `thread_history_*`) — nằm ngay **gốc** `CODEX_HOME`. `--ephemeral` chỉ tắt session rollout files; `-c sqlite_home` chỉ dời SQLite, không dời `models_cache.json`. Nên **không có cấu hình nào giữ `CODEX_HOME` read-only mà vẫn chạy đầy đủ** — đã probe và xác nhận.

Recipe cuối (đã verify):

```
bwrap --ro-bind / / --dev /dev --proc /proc --tmpfs /tmp \
      --ro-bind /home/vantt/.codex/auth.json /tmp/cdxhome/auth.json \
      --setenv CODEX_HOME /tmp/cdxhome \
      --bind <ABS>/.fgos/assignments <ABS>/.fgos/assignments \
      -- codex exec --skip-git-repo-check -s danger-full-access --model {model} {prompt}
```

`CODEX_HOME` là **tmpfs riêng mỗi run**, chỉ ro-bind `auth.json` vào. `-s danger-full-access` đúng ở đây và chỉ ở đây: bwrap mới là lớp chặn thật, y hệt lập luận `claude-bwrap` không dựa vào `--permission-mode`.

**Vì sao phải là tmpfs chứ không phải bind ghi được lên `~/.codex` thật** (đây là lỗ đã suýt lọt): `CODEX_HOME` nạp `AGENTS.md`, `AGENTS.override.md`, `config.toml`, `hooks.json`, `rules/`, `skills/`, `plugins/` **làm chỉ thị** lúc startup. `~/.codex` ghi được = vector prompt-injection và persistence xuyên phiên. Ro-bind từng file không chặn được việc *tạo file chưa tồn tại* như `AGENTS.md`.

Falsification đã chạy:

| Đích | Kết quả | Kiểm trên host |
|---|---|---|
| `agent-result.json` trong run dir | WROTE | file có thật |
| `~/.codex/AGENTS.md` | BLOCKED | không tồn tại |
| `~/.codex/config.toml` | BLOCKED | không đổi |
| `forgentX/PROBE.txt` | BLOCKED | không tồn tại |

Lợi ích kèm theo: không carry-over goals/memories/thread state giữa các advisory dispatch, và không nạp hooks/rules/skills của operator vào agent advisory. **Không còn ngoại lệ ghi nào** ngoài tmpfs per-run và `.fgos/assignments`.

## 4. Roster đề nghị

Nguyên tắc: (a) chỉ executor bwrap-wrapped mới đủ read+write; (b) đa dạng họ chỉ đặt ở cặp vai **thật sự cần độc lập**; (c) tier theo tải nhận thức, và **chỉ pin `actors[].tier` khi mọi op của actor đó cùng nhu cầu**.

| Vai | Executor | Tier | Model derive | Lý do |
|---|---|---|---|---|
| lead-advisor | `claude-bwrap` | **không pin actor tier** | interpret=opus, explain/revise-explanation=opus, close-dialogue=sonnet | Khung bài + tiếng nói người-đối-diện cần calibration mạnh nhất; nhưng `close-dialogue` chỉ là sổ sách. Bỏ pin để 3 op tự phân tầng theo `minTier` — pin vào là kéo cả close-dialogue lên opus |
| context-investigator | `claude-bwrap` | standard | sonnet | Đọc rộng, suy luận nông; cần tool-use tin cậy + absolute path. Đây đúng là lane đã cứu panel tối nay sau khi codex fail |
| system-shaper | `claude-bwrap` | analytical | sonnet | Họ A trong bộ ba shaper |
| alternative-shaper | `agy-bwrap` | analytical | gemini-3.1-pro-low | Họ B — chỗ đa dạng priors đáng tiền nhất, giữ nguyên |
| constraint-advocate | `codex-bwrap` | analytical | gpt-5.5 | Họ C; chạy 2 lượt (Phase 5 + Phase 6) nên cần lane rẻ, ổn định |
| architecture-critic | `agy-bwrap` | **critical** | gemini-3.1-pro-high | Công kích chéo 3 proposal là đòn bẩy chất lượng lớn thứ hai sau synthesis → cần model mạnh, nhưng pro-high rẻ hơn opus. Trùng họ với alternative-shaper nhưng **khác model**, và cách ly thật của critic là fresh assignment chứ không phải executor |
| synthesizer | `claude-bwrap` | critical | opus | Tích hợp toàn ledger — giữ nguyên |
| red-team | `codex-bwrap` | (tier vô nghĩa) | gpt-5.5 | **Đổi khỏi agy**: vẫn khác họ synthesizer (yêu cầu doctrine), lại tránh đúng chỗ agy hỏng nhất (P4 — wrapper rỗng làm red-team thành nghi thức) |
| specialist | `codex-bwrap` mặc định | analytical | gpt-5.5 | Bind lúc authorize; đổi họ nếu câu hỏi hợp lane khác |

Phân bố: **claude 4 / gemini 2 / codex 2**. Kiểm tra các cặp cần độc lập:
- 3 shaper: claude / gemini / codex — **3 họ khác nhau** ✓
- red-team vs synthesizer: codex vs claude ✓
- critic vs shaper mạnh nhất: gemini-pro-high vs sonnet ✓

**Không dùng** `glm-cli` cho vai advisory nào: nó gọi `claude` với `acceptEdits` + `--allowedTools Bash(git add/commit)` không có bwrap (ghi được thật), và bảng `z-ai` chỉ khai `lightweight` → mọi tier khác **throw `RunnerConfigError`**.

---

## 5. Thay đổi cụ thể — ĐÃ ÁP DỤNG 2026-09-09

### 5.1 `.fgos/config.json`

1. **Thêm** executor `codex-bwrap` theo recipe mục 3.
2. **`agy-bwrap`**: thêm `--print-timeout 30m` (fix P3).
3. **`codex-readonly`**: giữ đăng ký, description đổi thành "RETIRED FOR DISPATCH", gỡ khỏi mọi roster.
4. **`capabilities.code:review.prefer` / `code:debug.prefer`**: `codex-readonly` → `codex-bwrap`.
5. **`modelPolicies` — đủ 5 tier cho cả 4 provider.** Trước đây `openai-codex` phẳng một model và `z-ai` chỉ khai `lightweight` (4 tier còn lại `throw RunnerConfigError`).

| Tier | claude | gemini | openai-codex | z-ai |
|---|---|---|---|---|
| lightweight | haiku | `gemini-3.8-flash-low` | `gpt-5.6-luna` | `z-ai/glm-5.2` |
| standard | sonnet | `gemini-3.8-flash-medium` | `gpt-5.6-terra` | `z-ai/glm-5.2` |
| creative | sonnet | `gemini-3.8-flash-high` | `gpt-5.6-terra` | `z-ai/glm-5.2` |
| analytical | **opus** | `gemini-3.1-pro-low` | `gpt-5.6-terra` | `z-ai/glm-5.2` |
| critical | opus | `gemini-3.1-pro-high` | `gpt-5.6-sol` | `z-ai/glm-5.2` |

`claude.analytical` = opus là quyết định của operator (2026-09-09), không phải suy ra từ catalog. Bán kính: 15 operation khai `minTier: analytical` trên 4 protocol (architecture-advisory-panel-v1, standalone-master-coordination-loop, group-thinking-delphi-feedback-lite, group-cognition-framework), cộng mọi work item `risk: heavy` (assignment-policy.mjs nâng sàn lên analytical). Hệ quả cần biết: trên họ claude, `analytical` và `critical` giờ ra **cùng một model**, nên panel không còn phân tầng model giữa shaper và synthesizer — độc lập của họ dựa hoàn toàn vào brief và cách ly context.

Nguồn xếp hạng, không đoán: gemini theo `agy models` (3.8-flash low/medium/high tồn tại thật; 3.1-pro vẫn là dòng pro hiện hành). openai-codex theo `priority` + description trong `models_cache.json` của chính CLI: sol (6, "reliable agentic workhorse") > terra (7, "balanced ... everyday work") > luna (8, "fast and affordable"). `gpt-6-astra` không dùng cho dispatch tự động. z-ai điền cùng một giá trị vì `glm-cli` ghim cứng cả ba alias Anthropic về `z-ai/glm-5.2` bằng env — nó là executor một-model theo thiết kế, không phải thang bị bỏ trống.

6. **`capabilities.fgos-coding-implement.overrides.rigorOverrides`**: `lightweight` → `standard` (bảo toàn hành vi). Trước đây `lightweight` = flash-medium; sau khi gemini có thang 5 bậc thật thì `lightweight` = flash-low. Đổi sang `standard` giữ nguyên model hiệu dụng là flash-medium — đúng model mà capability này đã verify live.

Verify: `decide` trả `{"mechanism":"out-of-process","configured":true}` cho cả `codex-bwrap`/`claude-bwrap`/`agy-bwrap`. `fgos doctor` không sinh lỗi mới; `executor-confinement` pass.

### 5.2 Còn mở

- Thang tier hiện dựa trên thứ tự catalog + mô tả của nhà cung cấp, chưa dựa trên giá thật đo được. Có số giá thì xem lại từng bậc.
- `gpt-5.4`/`gpt-5.4-mini` xuất hiện ở một số listing nhưng **không** có trong `models_cache.json` của máy này — chưa rõ có dùng được không.

### 5.3 Protocol YAML — KHÔNG sửa (quyết định)

Bỏ pin `actors[].tier` ở `lead-advisor-actor` đã tự hạ `close-dialogue` từ opus xuống sonnet mà không phải đụng contract dùng chung. Không đủ lợi ích để sửa YAML.

### 5.4 SKILL.md — đã cập nhật

Bảng roster, đoạn allowlist executor, note đăng ký, Known Gaps (`tsk-1o4`, caveat agy B12). Đã chạy `npm run build:skills`; `.agents/` và `plugins/fgOS/` đồng bộ.

## 6. Chi phí thay đổi ra sao

Bỏ được: 3 dispatch chết + 2 retry (tối nay) và 1 timeout agy + 1 retry. Đó mới là chỗ đốt tiền thật, không phải chọn tier.
Thêm: critic lên pro-high (rẻ hơn opus). Giảm: `close-dialogue` opus→sonnet (hoặc haiku nếu sửa YAML).
Số lần chạy opus mỗi phiên: 3 (interpret, synthesize, explain) + tối đa 2 revise — giữ nguyên, đây là 3 chỗ một lỗi sẽ làm hỏng cả 12 dispatch còn lại.

---

## Câu hỏi còn treo

1. Thang tier thật cho `openai-codex` (mục 5.2) — cần giá/năng lực của `gpt-6-astra`, `gpt-5.4-mini` trước khi map.
2. `modelPolicies.gemini` có nên đồng nhất về thế hệ 3.6 không.
3. ~~`code:review`/`code:debug` chưa verify~~ — **đã verify**: `dispatch execute --for code:review --tier standard` chạy thật qua `codex-bwrap`, exit 0, `headBefore == headAfter` (không đụng repo). `code:debug` dùng đúng executor và đúng đường đó.
4. Cảnh báo lành tính khi `CODEX_HOME` nằm dưới `/tmp`: codex từ chối tạo helper binaries (`codex-execve-wrapper`, `codex-linux-sandbox`) rồi chạy tiếp. Các helper đó phục vụ sandbox riêng của codex — thứ executor này cố ý không dùng. Muốn hết cảnh báo thì đặt `CODEX_HOME` ngoài `/tmp` (cần một thư mục có sẵn trên host để tmpfs đè lên).
