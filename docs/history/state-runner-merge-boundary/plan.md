# plan.md — state/runner merge boundary (tsk-49i)

Mode: standard

Lane quyết theo Mode-gate của `fgos-routing`: **3 flag** áp dụng —
`public contracts` (contract `fgos.v1` phải bất biến trong khi mọi code
path sinh ra nó bị tái cấu trúc), `existing covered behavior` (2800+ test
phủ đúng đường approve/merge/catchup), `weak proof around the area`
(`plugins/fgOS/skills/terminal/rename.sh` hỏng im lặng, field `trace` của
`review` không test nào assert — `RESEARCH.md` §A1). Không flag hard-gate
nào (auth / data loss / audit-security / external provider / removing a
validation). 2–3 flag → `standard`. Lane nhỏ hơn (`small`) không trung
thực ở đây: việc chạm 20+ file qua 2 pha bắt buộc theo thứ tự, trong đó
có một git hook thật, không phải "a few files, no gray areas".

## Approach

**Đường đã chọn.** Làm đúng 2 pha, tuần tự, không gộp: pha 1 cắt cycle
import và dọn 2 hàm về đúng module (D1, D2); pha 2 tách tầng use-case ra
khỏi `bin/fgos.mjs` (D3, D4, D5). Thứ tự bắt buộc — pha 2 di chuyển chính
những case block mà pha 1 vừa sửa call site bên trong; đảo ngược lại sẽ
phải sửa cùng một chỗ hai lần trên hai hình dạng khác nhau.

**Các lựa chọn đã loại** (đầy đủ lý do ở `DISCUSSION.md` §5):
- Gộp cả 2 pha thành một lần sửa — loại: pha 1 nhỏ, đã chốt sớm hơn, và
  làm nền sạch cho pha 2; gộp lại thì mọi lỗi của pha 2 lẫn với pha 1.
- Decompose `approve` (600 dòng) trong lúc dời — loại: nhân rủi ro hành vi
  lên nhiều lần khi test suite đang exact-match payload. Move nguyên khối
  trước; tách sâu hơn là item khác nếu bao giờ cần.
- Đặt tầng use-case ở `src/usecase/` hoặc `src/commands/` — loại theo D4.

**Thứ tự không do đòn bẩy graph quyết.** `fgos graph --json`:
`tsk-49i` không nằm trong `criticalPath` (path hiện tại depth 10, toàn
item khác) và `topUnblock` rỗng — item này không chặn việc nào khác. Vậy
thứ tự do phụ thuộc nội bộ quyết định, không phải do unblock leverage.

**impact-analysis: degraded.** `fgos tool query --capability
impact-analysis --status present` trả provider `gitnexus` `status:
present`, nhưng index đã stale so với HEAD trong suốt phiên này (hook báo
`last indexed` tụt sau nhiều commit). Theo `CLAUDE.md`: chạy mọi kiểm tra
khác, đánh dấu bằng chứng blast-radius là yếu, nói rõ khoảng trống. Vì
vậy toàn bộ danh sách call-site/import-site trong plan này lấy từ
grep/read thật (`RESEARCH.md` §A1), **không** từ code graph — và đó là lý
do nó tìm ra 6 file mà 6 vòng shaping trước bỏ sót.

**Đã sync với `main` và re-verify 2 lần (2026-08-15).** Lần 1: nhánh đứng
sau `main` 171 commit, trong đó 14 commit chạm `src/state`/`src/runner`.
Lần 2: thêm 44 commit của đợt `tsk-5tm` (dispatch unification) — diện ảnh
hưởng hẹp, đúng 1 file `src/runner/dispatch.mjs` đổi, không file `.mjs`
mới, `bin/fgos.mjs` byte-identical, `test/architecture.test.mjs` xanh; chi
tiết ở `RESEARCH.md` Vòng 3, **không đổi phạm vi gì**. Cả hai lần đều merge
(không rebase, theo D2 `src/runner/worktree.mjs`), sạch.
Toàn bộ anchor `file:line` của `RESEARCH.md` đã được kiểm lại trên cây
sau merge — kết quả đầy đủ ở `RESEARCH.md` Vòng 2. Ba điều plan này đã
sửa theo: **cạnh import thứ 5** (F1, thêm vào pha 1), toạ độ bằng chứng
của A-2 bên dưới (F3), và 2 tham chiếu `session-identity` bỏ sót (F5).
Mọi kết luận về hình dạng (manifest, rank, 3 điều architecture test
enforce, convention verify) vẫn đúng nguyên, không phải làm lại.

### Risk map

| Thành phần | Mức | Cái gì chứng minh được |
|---|---|---|
| `.githooks/pre-commit:29` import `session-identity.mjs` (D2) | **cao** | Hook chạy trên mọi commit của repo; hỏng là chặn toàn bộ. Proof: `test/e2e/main-checkout-lock-hook*.test.mjs` chạy xanh (2 file đó copy chính module này vào `src/runner/` giả và thực thi hook thật) |
| `plugins/fgOS/skills/terminal/rename.sh:64` (D2) | **cao** | Hỏng **im lặng** (`[ -f … ]` guard + `\|\| true`) — không test nào đỏ. Proof duy nhất là sửa có chủ đích + kiểm bằng mắt; ghi thành assumption bên dưới |
| 24 call site 2-tham-số trong `test/state/drift-status.test.mjs` (D1) | trung bình | `npm test` xanh sau khi thêm `{trunk}` vào cả 24 chỗ |
| Chuyển `approve` (600 dòng) sang `src/verbs/merge/approve.mjs` (D3) | trung bình | `npm test` xanh; test suite spawn CLI thật và so JSON exact-match nên chính nó là safety net cho "0 đổi hành vi" |
| Forwarding option `merge next` → `approve`/`sync-root` (D3) | trung bình | Hôm nay forward RAW `flags`; sau khi tách phải qua một parser chung, truyền nguyên khối. Proof: test `merge next` hiện có + kiểm tay `--acknowledge-iron-law`/`--trust-dir` vẫn tới nơi |
| Layer row cho 8 file mới trong manifest (D4, D5) | thấp | `node --test test/architecture.test.mjs` (0.14s) — cũng là invariant check repo tự chạy ở `return`/`merge` |
| Re-export shim (nếu dùng) vô hình với architecture test | thấp | `RESEARCH.md` §A2: check là regex, `export {x} from './y'` lọt. Nếu pha 1 dùng shim thì không được coi test xanh là bằng chứng shim đúng tầng |

### Assumptions (chưa chứng minh được bằng test)

- **A-1.** Sửa `plugins/fgOS/skills/terminal/rename.sh` đúng thì tính năng
  đổi tên pane vẫn chạy. Không test nào phủ đường này và nó nuốt lỗi
  (`|| true`), nên đây là assumption, không phải claim đã chứng minh.
  `fgos-coding-validating` cần biết điều này là điểm yếu đã biết, không
  phải chỗ bị bỏ quên.
- **A-2.** `npm test` xanh là bằng chứng MẠNH nhưng KHÔNG tuyệt đối cho
  "0 đổi hành vi CLI". Đã kiểm thật ở vòng validating: test spawn
  `bin/fgos.mjs` như tiến trình thật (không mock), parse JSON stdout và
  assert trên **field cụ thể** (`test/cli/fgos-approve.test.mjs:1314,:1316`
  `data.mode`/`data.deliveryUnrecorded`; `:1348-1349`
  `data.deliveryUnrecorded`/`data.seq`), cộng exit code và row trong event
  log. Đây KHÔNG phải deepEqual toàn payload. Hệ quả còn lại:
  một field nào của payload mà không test nào assert thì có thể đổi mà
  suite vẫn xanh. Ràng buộc rút ra: khi chuyển 7 case block sang tầng
  use-case, payload trả về phải được sao chép nguyên văn theo từng nhánh
  return, không "dựng lại cho gọn" — vì suite sẽ không bắt được phần sai
  ở field không được assert.

## Shape (phased)

**Pha 1 — cắt cycle + dọn hàm (D1, D2).** 5 cạnh, 4 động tác:
`drift-status.mjs` nhận `trunk` bắt buộc (2 caller thật:
`bin/fgos.mjs`, `src/setup/registrations.mjs`); dời `resolveRoot` từ
`runner/root-affinity.mjs` về `state/frontier.mjs` (6 import site); dời
nguyên `session-identity.mjs` sang `src/util/` (4 import site trong
`src`/`bin` + 6 file ngoài); dời `normalizePath` từ
`runner/frozen-judge.mjs` sang `src/util/normalize-path.mjs` (4 consumer:
`frozen-judge.mjs` chính nó, `runner/merge.mjs`, `state/graph-metrics.mjs`,
`bin/fgos.mjs` — chỗ cuối phải tách import hiện đang gom chung với
`frozenJudgeHits`/`footprintDiffHits`). Kèm: tạo `src/runner/iron-law-gate.mjs`
(tầng `infra` — bắt buộc rank ≤ 2 vì nó import `merge.mjs`/`worktree.mjs`
ở `infra`), 3 call site trong `bin/fgos.mjs` gọi `ironLawForItem`; dời
`isMainWorktree` + `detectTrunk` sang `worktree.mjs` (2 import site).

**Pha 2 — tầng use-case (D3, D4, D5).** 7 file
`src/verbs/merge/<verb>.mjs` ở tầng `use-case`, chữ ký
`<verb>UseCase(ctx, options)`; `src/report/item-trace.mjs` ở tầng
`domain`; `performCatchUp` → `runner/merge.mjs`; `ensureBranchPushed` →
`runner/worktree.mjs`; `bin/fgos.mjs` còn 5–12 dòng/case.

**Ca cần chứng minh (scale theo lane standard):**
- Hành vi hiện có không được đổi: `npm test` (142 file, ~50s) là ca chính.
- Biên: `merge next` khi `ready` rỗng và `blockedOnSync` không rỗng (đường
  auto-sync-root) — đường dễ vỡ nhất khi đổi cách forward option.
- Truy cập đồng thời: `withMergeTargetSlot`/main-checkout lock giữ nguyên
  ngữ nghĩa sau khi chuyển sang use-case (không đổi thứ tự acquire).
- Hỏng một phần: `approve` gãy giữa chừng phải vẫn `git merge --abort` và
  park `blocked` đúng như trước — 6 outcome dispatch không được rơi mất.
- Layer: `node --test test/architecture.test.mjs` sau mỗi pha.

### Chia việc

Hai pha ở trên là 2 hạng mục độc lập làm được, có thứ tự bắt buộc. Spec
(chưa tạo item — `fgos-coding-validating` mới materialize ở gate):

```json
[
  {
    "title": "Cắt 5 cạnh import state/runner, gộp Iron Law check, dời isMainWorktree/detectTrunk",
    "verify": "npm test && test -f src/runner/iron-law-gate.mjs && test -f src/util/session-identity.mjs && test -f src/util/normalize-path.mjs && grep -qF ironLawForItem bin/fgos.mjs && ! grep -rqF ../runner/ src/state/ && ! grep -rqF runner/session-identity plugins/fgOS/skills/terminal/rename.sh .githooks/pre-commit && ! grep -qF 1.1.0 plugins/fgOS/.claude-plugin/plugin.json",
    "action": "D1: drift-status.mjs nhan trunk qua tham so bat buoc; doi resolveRoot ve state/frontier.mjs; gop 3 ban copy-paste Iron Law vao src/runner/iron-law-gate.mjs o tang infra; doi isMainWorktree va detectTrunk sang runner/worktree.mjs; doi normalizePath tu runner/frozen-judge.mjs sang src/util/normalize-path.mjs o tang kernel va sua ca 4 consumer (frozen-judge.mjs, runner/merge.mjs, state/graph-metrics.mjs, bin/fgos.mjs) — canh thu 5 nay do commit ac1e30f1 tren main them vao sau khi plan duoc viet, xem RESEARCH.md Vong 2 muc F1. D2: doi session-identity.mjs sang src/util/ KHONG de lai re-export shim, migrate ca 6 file ngoai src va bin ma RESEARCH.md muc A1 liet ke (gom .githooks/pre-commit va plugins/fgOS/skills/terminal/rename.sh), cap nhat 2 tham chieu Vong 2 muc F5 tim them (plugins/fgOS/skills/_shared/capacity-dispatch-fallback.md va scripts/check-decision-codes.baseline.json neu file test doi cho), va bump version trong plugins/fgOS/.claude-plugin/plugin.json de ban cache cua plugin khong tiep tuc phuc vu script tro vao duong dan cu.",
    "footprint": [
      "src/state/drift-status.mjs",
      "src/state/frontier.mjs",
      "src/state/graph-harness.mjs",
      "src/state/cleanup-harness.mjs",
      "src/state/store.mjs",
      "src/state/graph-metrics.mjs",
      "src/runner/root-affinity.mjs",
      "src/runner/merge.mjs",
      "src/runner/worktree.mjs",
      "src/runner/iron-law-gate.mjs",
      "src/runner/frozen-judge.mjs",
      "src/runner/claim-port.mjs",
      "src/runner/loop.mjs",
      "src/runner/promote-engine.mjs",
      "src/util/session-identity.mjs",
      "src/util/normalize-path.mjs",
      "src/cli/invocation-fault-log.mjs",
      "src/setup/registrations.mjs",
      "bin/fgos.mjs",
      "docs/architecture-manifest.json",
      "test/runner/root-affinity.test.mjs",
      "test/runner/merge.test.mjs",
      "test/runner/session-identity.test.mjs",
      "test/state/store.test.mjs",
      "test/state/drift-status.test.mjs",
      "test/e2e/main-checkout-lock-hook.test.mjs",
      "test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs",
      ".githooks/pre-commit",
      "plugins/fgOS/skills/terminal/rename.sh",
      "plugins/fgOS/.claude-plugin/plugin.json"
    ],
    "kind": "chore",
    "risk": "heavy"
  },
  {
    "title": "Tach tang use-case cho cum verb merge vao src/verbs/merge/",
    "verify": "npm test && test -d src/verbs/merge && test -f src/report/item-trace.mjs && ! grep -qF state/drift-status bin/fgos.mjs",
    "action": "D3: tach logic nghiep vu dang inline trong 7 case block cua bin/fgos.mjs (merge, approve, review, sync-root, catchup, reject, promote-to-component) ra tang use-case, de bin chi con parse args, goi mot ham use-case, format JSON fgos.v1. D4: dat tai src/verbs/merge/<verb>.mjs, nest theo domain. D5: doi collectOutcomeEntry va collectFrictionData sang src/report/item-trace.mjs dang ky o tang domain. Kem: performCatchUp ve runner/merge.mjs, ensureBranchPushed ve runner/worktree.mjs.",
    "footprint": [
      "bin/fgos.mjs",
      "src/verbs/merge/merge.mjs",
      "src/verbs/merge/approve.mjs",
      "src/verbs/merge/review.mjs",
      "src/verbs/merge/sync-root.mjs",
      "src/verbs/merge/catchup.mjs",
      "src/verbs/merge/reject.mjs",
      "src/verbs/merge/promote-to-component.mjs",
      "src/report/item-trace.mjs",
      "src/runner/merge.mjs",
      "src/runner/worktree.mjs",
      "docs/architecture-manifest.json"
    ],
    "kind": "chore",
    "risk": "standard",
    "deps": [0]
  }
]
```

**Footprint hai con chồng nhau có chủ đích** (`bin/fgos.mjs`,
`src/runner/merge.mjs`, `src/runner/worktree.mjs`,
`docs/architecture-manifest.json`). Đây không phải xung đột cần gỡ: hai
con vốn phải chạy tuần tự (`deps: [0]`), nên `footprintOverlapAmong` báo
chồng lấn chính là hành vi đúng — nó chặn việc dispatch song song hai con
này, điều mà thiết kế cũng không muốn.

## Cost read (cho gate của fgos-coding-validating)

- **Rẻ nếu sai:** vị trí/tên tầng use-case (D4). Đổi tên thư mục sau này
  là một lần `git mv` + sửa import + sửa row manifest; không có consumer
  ngoài repo nào phụ thuộc đường dẫn nội bộ này.
- **Rẻ nếu sai:** layer gán cho `src/util/session-identity.mjs`
  (`kernel` hay `infra`) — cả hai hợp lệ với 4 importer hiện tại; sửa là
  đổi một chuỗi trong manifest.
- **Đắt nếu sai:** đụng `.githooks/pre-commit`. Sai ở đây chặn commit của
  mọi phiên đang chạy trên repo cho tới khi được sửa.
- **Đắt và IM LẶNG nếu sai:** `plugins/fgOS/skills/terminal/rename.sh` —
  không có tín hiệu đỏ nào, tính năng chỉ lặng lẽ ngừng chạy (A-1).
- **Thay thế đảo được:** cho D2, giữ một re-export shim ở
  `src/runner/session-identity.mjs` sẽ khiến hook, 2 e2e test và
  `rename.sh` không cần sửa gì — bỏ hẳn hai rủi ro cao ở trên. Giá phải
  trả: shim vô hình với architecture test (`RESEARCH.md` §A2), và đường
  dẫn cũ vẫn tồn tại. Cycle thật vẫn bị cắt trong cả hai trường hợp, vì
  `state/store.mjs` import thẳng từ `src/util/` — verify của item cố ý
  không chứa clause nào cấm shim, để chỗ này còn mở cho gate quyết.

## Outstanding questions

None
