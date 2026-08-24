# plan — tsk-3tp: Sweep checkpoint redesign cho `.fgos/events`

Mode: high-risk

Lane cao vì: đổi hành vi commit của toàn bộ write-path metadata trên main
checkout (risk field: heavy), chạm `merge.mjs` (đường merge sống của mọi
item) và cơ chế guard từng gắn với 3 sự cố mất data thật. Lane nhỏ hơn
không cover honest được blast radius này.

## Approach (D2 — cite CONTEXT.md)

**Chosen path:** chuyển commit metadata từ "commit chuyên dụng theo
timer/đếm" sang "đi nhờ commit sẵn có":

1. **Sweep tại merge/approve:** ngay trước `git commit` của staged merge
   trong `mergeRunnerItem` (`src/runner/merge.mjs` — merge path đã là
   `--no-commit --no-ff` → verify → commit), `git add` các file dirty/
   untracked dưới `.fgos/events/` để chúng ride cùng merge commit. Điểm
   móc là nơi commit được TẠO — không thêm commit mới.
2. **Fallback thưa:** giữ hook opportunistic hiện có
   (`runOpportunisticMainCheckoutChecks`, gọi từ `merge.mjs`/
   `claim-port.mjs`) nhưng đổi trigger: chỉ commit khi shard dirty ĐÃ
   quá `fallbackIntervalSec` (mặc định 3600s) mà không lần merge nào
   sweep chúng. Bỏ hẳn trigger đếm-event (`DEFAULT_CHECKPOINT_EVENT_
   THRESHOLD=50`) và interval 900s.
3. **Config:** key mới `checkpoint.fallbackIntervalSec` (mặc định 3600)
   đăng ký vào `fgos setup` config-merge + `fgos doctor` check registry
   (`src/setup/checks.mjs`) theo đúng Install/setup/doctor gate của
   AGENTS.md; retire key `checkpoint.eventThreshold`.

**Alternatives rejected** (đã bác trong DISCUSSION.md, cite D-ID):
nested-repo/separate-ref (vi phạm D1); Tầng B piggyback từ nhánh (D3 —
coordination ~40% không đi được đường đó, đục merge guard); giữ nguyên
checkpoint mịn (nguồn churn #1, report 21/8).

**Vì sao an toàn (điều kiện đứng trên dep):** Tầng A (tsk-3ve) shard
per-writer + content-hash — hai writer không còn đụng file; tsk-1i3/
tsk-56u đã đóng vector merge-đè/`git add -A`-nuốt; merge path đã
staged-verify. Cửa sổ chưa-commit dài chỉ còn là độ trễ history.

## Phases

**P0 — re-verify khi claim (bắt buộc, dep-sensitive):** xác nhận Tầng A
T3-T6 đã land thật trên main (shard dir `.fgos/events/` active, replay
đa-file, compaction tồn tại); nếu hình dạng lệch mô tả, cập nhật plan
trước khi code. GitNexus posture lúc plan: `present` nhưng index stale →
Degraded — blast radius chứng minh bằng grep trực tiếp (dưới), cross-check
lại khi claim.

**P1 — sweep mechanism:**
- `src/state/events-jsonl-truncation-guard.mjs`: gỡ nhánh periodic-commit
  (interval 900/threshold 50, commit message
  `chore(.fgos): periodic events.jsonl checkpoint`); thay bằng
  fallback-thưa theo mtime shard dirty; giữ nguyên phần D1 detect
  truncation (xóa sâu hơn thuộc P2).
- `src/runner/merge.mjs`: thêm bước sweep-stage `.fgos/events/*` dirty
  vào commit của staged merge; gỡ/điều chỉnh call site opportunistic
  checkpoint (vùng ~788/911).
- `src/runner/claim-port.mjs`: cập nhật caller theo API mới.
- `src/setup/checks.mjs`: đăng ký `checkpoint.fallbackIntervalSec`.
- `CHANGELOG.md` `## [Unreleased]`: hành vi commit metadata đổi.
- Tests: sửa test checkpoint hiện có; thêm (a) merge commit chứa shard
  dirty, (b) e2e không sinh commit `periodic events.jsonl checkpoint`
  chuyên dụng nào, (c) fallback fires đúng sau interval khi không có
  merge, (d) `FGOS_DISABLE_OPPORTUNISTIC_CHECKS` vẫn opt-out sạch (giữ
  tương thích tới P2).

**P2 — legacy deletion (sau P1 xanh, cùng item):**
- `.gitattributes`: gỡ `merge=union` cho events.jsonl (file đã frozen
  baseline-0 bởi Tầng A T3/T6).
- `scripts/events-jsonl-contiguity.mjs`: xóa (band-aid cho seq — seq
  không còn là identity).
- Guard surface: mark sidecar `events-jsonl.truncation-guard.json`,
  warnings file, env opt-out — xóa phần không còn đối tượng bảo vệ; giữ
  merge guard `.fgos-write-rejected` + pre-commit hook nguyên trạng (D2).
- 2 file backup `events.jsonl.backup-*`: xóa khỏi tree (còn trong git
  history).
- Tests grep-absence tương ứng.

## Risk map

| Rủi ro | Mức | Proof point tại validating |
|---|---|---|
| Sweep stage nhầm file ngoài `.fgos/events/` vào merge commit | M | Điểm móc là đường staged-merge đã có sẵn `git add` có kiểm soát; test (a) pin đúng path prefix |
| Fallback không fire → shard không bao giờ vào history trên máy ít merge | M | Trigger theo mtime shard dirty tại hook opportunistic — hook này đã chạy ở mọi lần acquire main-checkout lock (evidence: guard code hiện tại) |
| Gỡ checkpoint làm 7 test tsk-5k1-class gãy | M | Grep test suite theo `periodic events.jsonl checkpoint` + `eventThreshold` trước khi code (P1 bước 1) |
| Tầng A land khác hình dạng plan giả định | H | P0 re-verify bắt buộc; dep cứng tsk-3ve chặn claim sớm |
| Cửa sổ chưa-commit dài hơn → mất shard do xóa file thô (không phải git-op) | L | Chấp nhận theo D2 (độ trễ history, không phải rủi ro merge/checkout — các vector đó đã đóng); fallback thưa chặn trần |

## Split decision

**Chia 2 con tuần tự (D4 — supersede đề xuất pass-through bản đầu,
theo câu trả lời của anh tại engine gate 24/8).** Footprint disjoint có
chủ đích: toàn bộ chỉnh sửa `events-jsonl-truncation-guard.mjs` (kể cả
trim guard surface vốn xếp ở P2) dồn về con 1 để hai con không đụng file;
con 2 chỉ còn xóa legacy cấp repo. Xóa 2 file backup `.fgos/events.jsonl.
backup-*` KHÔNG thuộc con nào — diff chạm `.fgos/` từ nhánh bị merge
guard từ chối cứng (ADR0020); đó là bước tùy chọn chạy trực tiếp trên
main sau approve, nếu pre-commit hook cho phép.

```json
[
  {
    "title": "Sweep mechanism: bỏ checkpoint chuyên dụng, gom shard vào merge/approve commit + fallback thưa",
    "verify": "npm test",
    "action": "Per D2 và D4: gỡ nhánh periodic-commit (interval 900s / threshold 50, commit message chore(.fgos): periodic events.jsonl checkpoint) trong src/state/events-jsonl-truncation-guard.mjs, kèm mark sidecar/warnings/env opt-out của nó; thêm sweep-stage các file dirty/untracked dưới .fgos/events/ vào commit của staged merge trong src/runner/merge.mjs; cập nhật caller src/runner/claim-port.mjs; đăng ký checkpoint.fallbackIntervalSec (mặc định 3600) vào src/setup/checks.mjs theo Install/setup/doctor gate; thêm dòng CHANGELOG Unreleased; bước đầu bắt buộc: P0 re-verify hình dạng Tầng A đã land (plan.md P0).",
    "footprint": ["src/state/events-jsonl-truncation-guard.mjs", "src/runner/merge.mjs", "src/runner/claim-port.mjs", "src/setup/checks.mjs", "CHANGELOG.md", "test/state/events-jsonl-truncation-guard.test.mjs", "test/setup/checks.test.mjs"],
    "kind": "task",
    "risk": "heavy"
  },
  {
    "title": "Xóa legacy repo-level: union driver + toàn bộ contiguity surface + grep-absence tests",
    "verify": "npm test",
    "action": "Per D2 và D4: gỡ dòng merge=union cho events.jsonl khỏi .gitattributes (file đã frozen baseline-0 bởi Tầng A); retire toàn bộ contiguity surface — grep 24/8 xác nhận blast radius thật: src/state/events-jsonl-contiguity.mjs, scripts/events-jsonl-contiguity.mjs, scripts/check-events-seq-contiguity.mjs, registration trong src/setup/registrations.mjs, npm script trong package.json, và 4 test file liên quan (test/scripts/*contiguity*, cập nhật test/runner/concurrent-claim-eventlog-loss.test.mjs + test/state/replay.test.mjs nếu import) — seq không còn là identity sau Tầng A T1; thêm test grep-absence mới test/state/events-legacy-absence.test.mjs; chạy SAU khi con sweep đã merge về nhánh cha (thứ tự tuần tự theo D4).",
    "footprint": [".gitattributes", "src/state/events-jsonl-contiguity.mjs", "scripts/events-jsonl-contiguity.mjs", "scripts/check-events-seq-contiguity.mjs", "src/setup/registrations.mjs", "package.json", "test/scripts/events-jsonl-contiguity.test.mjs", "test/scripts/check-events-seq-contiguity.test.mjs", "test/runner/concurrent-claim-eventlog-loss.test.mjs", "test/state/replay.test.mjs", "test/state/events-legacy-absence.test.mjs"],
    "kind": "task",
    "risk": "standard"
  }
]
```

## Verify

`npm test` (full suite — risk heavy) + hai kiểm bổ sung trong test mới:
e2e không còn commit checkpoint chuyên dụng; grep-absence các cơ chế P2
đã xóa.

## Outstanding questions

None

## Validation — reality gate & feasibility matrix (fgos-coding-validating, 24/8)

Reality gate (mỗi trục PASS kèm citation):

- **Mode fit — PASS.** risk field heavy + chạm merge path sống → high-risk
  đúng lane; không lane nhỏ hơn nào cover (plan §Mode).
- **Repo fit — PASS.** Điểm móc sweep là đường staged-merge ĐÃ tồn tại
  (`merge.mjs:17,856,1217` — `--no-commit --no-ff` → verify → commit);
  hook fallback là `runOpportunisticMainCheckoutChecks` ĐÃ chạy sau mỗi
  lần acquire main-checkout lock (`events-jsonl-truncation-guard.mjs:
  241-244` doc comment). Không dựng cơ chế mới.
- **Assumptions — PASS.** Mọi assumption nặng đều trace về D1-D3
  (CONTEXT.md) hoặc scout evidence có file:line; assumption dep-sensitive
  duy nhất (hình dạng Tầng A) có P0 re-verify bắt buộc.
- **Smaller path — PASS.** Biến thể nhỏ hơn (chỉ giãn interval) đã bị bác
  có chủ đích tại DISCUSSION.md vòng 3 (giữ nguyên cả 9 legacy — rớt tiêu
  chí D2); pass-through một item là shape nhỏ nhất còn honest.
- **Proof surface — PASS.** Verify = `npm test` full suite + 2 test mới
  có thể viết được bằng hạ tầng test hiện có (e2e đã có sẵn pattern kiểm
  commit history).
- **Impact-analysis posture — DEGRADED, ghi nhận.** GitNexus `present`
  nhưng index stale (last indexed 7bb3231 ≠ HEAD) — blast radius KHÔNG
  lấy từ tool; chứng minh bằng grep trực tiếp thay thế (matrix dưới) và
  P0 yêu cầu cross-check lại lúc claim.

Feasibility matrix (mọi risk M trở lên):

| Assumption | Risk | Proof cần | Evidence tìm được | Kết quả |
|---|---|---|---|---|
| Sweep móc được vào staged-merge mà không stage nhầm path ngoài `.fgos/events/` | M | Đường staged-merge tồn tại thật, có chỗ chèn `git add` trước commit | `merge.mjs:1217` (`git merge --no-commit --no-ff`), `:856` (thứ tự check→verify→commit), `:17` doc | PASS |
| Fallback thưa có chỗ chạy định kỳ mà không cần daemon mới | M | Hook opportunistic chạy ở mọi acquire lock | `events-jsonl-truncation-guard.mjs:241-244` ("Runs opportunistic checks immediately after main checkout lock acquisition"), caller `merge.mjs`/`claim-port.mjs` (grep 24/8) | PASS |
| Số test coupled vào checkpoint machinery là hữu hạn, sửa được | M | Đếm thật trong test/ | grep 24/8: đúng 2 file — `test/state/events-jsonl-truncation-guard.test.mjs`, `test/setup/checks.test.mjs` | PASS |
| Tầng A land đúng hình dạng plan giả định | H | Không chứng minh được TRƯỚC khi tsk-3ve xong — dep cứng chặn claim + P0 re-verify là proof point tại thời điểm duy nhất có thể | deps=[tsk-3ve] enforced bởi engine (fgos show); rollup 23/8: T1/T2 delivered, T3-T6 todo | PASS-với-ràng-buộc (P0 bắt buộc) |

**Verdict: READY WITH CONSTRAINTS** — ràng buộc duy nhất: không claim/
implement trước khi tsk-3ve done (engine tự chặn qua deps); P0 re-verify
là bước đầu tiên bắt buộc của mọi session implement.
