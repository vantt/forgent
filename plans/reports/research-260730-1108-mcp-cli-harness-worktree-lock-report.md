# Research Report: MCP làm agent interface cho fgOS CLI harness (Code Mode, multi-project worktree lock)

Conducted: 2026-07-30 | Repo: forgentX (fgOS)

## TOC
1. Executive Summary
2. Methodology
3. Findings — Cloudflare Code Mode
4. Findings — MCP stateful/lock/queue design (2026)
5. Findings — worktree orchestration prior art
6. Current fgOS architecture (grounding)
7. Recommendation & Architecture
8. Ngôn ngữ triển khai: Rust được không?
9. Trade-offs / Risks
10. Staged Plan
11. Resources
12. Unresolved Questions

## 1. Executive Summary

MCP đáng làm — nhưng KHÔNG phải "wrap toàn bộ CLI thành MCP tools". Giá trị thật nằm ở 1 process sống lâu đóng vai control-plane: nó serialize/queue call thay vì fail-fast như CLI hiện tại, và nó thấy được TOÀN BỘ worktree đang chạy trên máy (điều CLI per-invocation không thấy được) để chặn quá tải RAM/CPU. Code Mode của Cloudflare là pattern đúng hướng cho "nhanh, nhẹ" (giảm token 32-81%) nhưng hạ tầng thật (Dynamic Workers/V8 isolate) là sản phẩm cloud của Cloudflare, không tự host được — chỉ copy được PATTERN (2 tool: `search`+`execute`, typed API thay vì spec khổng lồ), chạy local bằng `node:vm`/`worker_threads`.

Thứ tự ưu tiên user đặt ra (ổn định > UX > nhanh) map đúng vào kiến trúc đề xuất: tận dụng lock primitive đã proven trong repo (`main-checkout-lock.mjs` lineage: 4 lock độc lập, wx-atomic-create, PID/TTL liveness, self-recognition refresh) thay vì viết lại — MCP chỉ thêm lớp hàng đợi (queue) trên đó.

## 2. Methodology
- Sources: 5 WebSearch (max cho phép), 1 local repo scan.
- Search terms: "Cloudflare Code Mode MCP", "MCP stateful lock manager job queue 2026", "git worktree manager MCP orchestration", "MCP multi-project parallel session coordination 2026", "Code Mode TypeScript sandbox security".
- Gemini toggle: `useGemini=false` trong `.ck.json` → dùng WebSearch trực tiếp.
- Local: đọc `src/runner/main-checkout-lock.mjs`, `src/runner/worktree.mjs`, `bin/fgos.mjs` (grep), `package.json`.

## 3. Findings — Cloudflare Code Mode

- Cơ chế: MCP server chỉ expose **2 tool**: `search()` + `execute()`. Spec API (dạng TypeScript interface, không phải OpenAPI) sống trên server; model viết JS gọi các "tool" như hàm SDK, code chạy trong **V8 isolate cô lập** (Dynamic Workers), chỉ kết quả cuối trả về model.
- Token: ~1000 token cho toàn bộ API bất kể số lượng endpoint (so với >1M token nếu expose từng tool riêng). Batch/chain nhiều call: tiết kiệm tới 81% vì kết quả trung gian không phải đi qua model.
- Bảo mật: code sinh ra KHÔNG bao giờ thấy credential/client object thật — call ra ngoài đi qua RPC boundary, token được inject bởi supervisor bên ngoài sandbox.
- **Giới hạn quan trọng**: đây là sản phẩm hosted của Cloudflare (Dynamic Workers, workerd isolate) — không self-host nguyên bản được cho 1 máy dev local. Cái tận dụng được là PATTERN, không phải binary/service.

## 4. Findings — MCP stateful/lock/queue (2026)

- MCP spec 2026-07-28 (release candidate) đẩy protocol về hướng **stateless-at-core** + chính thức hoá **Tasks extension**: `tools/call` trả về task handle, client poll `tasks/get`/`tasks/update`/`tasks/cancel` thay vì block đồng bộ. Đây đúng là cơ chế nên dùng cho case "lock đang bị giữ, chờ" thay vì fail ngay.
- Concurrency: khuyến nghị chung là dùng external DB (Postgres/Redis) hoặc file lock khi nhiều agent ghi đồng thời; tách worker pool theo loại việc (fast call vs slow file processing) để tránh head-of-line blocking.
- Job-queue pattern (Airflow-MCP): lớp orchestrator durable đứng giữa agent protocol (stateless) và tool execution (stateful) — convert request rời rạc thành workflow có state.

## 5. Findings — worktree orchestration prior art

- Nhiều tool cộng đồng đã build đúng hướng: `treehouse-worktree` (git worktree manager + MCP support cho parallel AI agent), MCP Git Worktree Workflows (LobeHub) có sẵn "voting workflow", "orchestration workflow" (chia task lớn thành subtask + coordinate), auto-cleanup variant thất bại.
- Multi-agent: `ccswarm`, `Swarm Orchestrator` — pool agent theo domain (Frontend/Backend/DevOps/QA), mỗi agent 1 worktree riêng, orchestrator lo conflict detection + merge coordination.
- **Giới hạn thực tế quan trọng**: 4-5 worktree song song là trần thực tế trên laptop hiện đại trước khi RAM/CPU (build/test) thành nút thắt — và **worktree isolation không giải quyết được dependency ở mức file** giữa các agent chạy song song (chỉ cô lập git state, không cô lập tài nguyên máy).
- Coordination đa session: pattern "presence MCP" (session awareness) + per-session sandbox isolation; cảnh báo thẳng: 2 agent sửa cùng file cùng lúc → conflict chắc chắn xảy ra, phải coordinate ở mức branch, không phải mức file.

## 6. Current fgOS architecture (grounding — quan trọng, quyết định design)

- Lock hiện tại: **4 lock độc lập cùng lineage** (`acquireRunnerLock` trong `loop.mjs`, `acquireSessionsLock` trong `session.mjs`, `acquireEventsLock` trong `events.mjs`, và `main-checkout-lock.mjs`) — cùng 1 kỹ thuật: `wx`-atomic-create + reclaim-stale (PID liveness hoặc TTL cho string identity) + **self-recognition** (cùng identity → refresh, không phải giành lock mới) + re-read-before-unlink (né TOCTOU).
- Đây đã là primitive CHẤT LƯỢNG CAO, cross-process-safe, non-blocking (1 lần thử + tối đa 1 lần reclaim-retry, không sleep/loop). Vấn đề KHÔNG phải là lock sai — vấn đề là UX khi `HELD`: verb fail ngay, người dùng phải tự chạy `fgos-unlock`/đọc `lock-status`.
- Phạm vi hiện tại: **mỗi lock chỉ biết về 1 repo** (`.fgos/` dir của chính nó). Không có registry cấp máy biết "đang có bao nhiêu project, bao nhiêu worktree, cái nào đang bận" cùng lúc.
- Worktree lifecycle (`worktree.mjs`): mỗi work item → 1 worktree ephemeral tại `.claude/worktrees/`, branch `fgw/<id>`, tự reclaim orphaned checkout khi crash. Đã có kỷ luật CWD tốt (luôn chạy git từ `repoRoot`, không từ trong worktree đang bị xoá).
- Kết luận: fgOS đã tự giải quyết đúng bài toán "1 project, nhiều lock/nhiều worktree". Cái CHƯA có: bài toán "N project, mỗi project M worktree, cùng lúc, cùng máy" — đúng thứ user hỏi.

## 7. Recommendation & Architecture

**Không** build MCP kiểu "expose mọi verb CLI thành 1 tool riêng" (tốn token, không giải quyết contention). Build **1 daemon MCP nhẹ, sống lâu, cấp MÁY** (không phải cấp project):

```
                    ┌─────────────────────────────┐
                    │   fgOS control-plane (MCP)   │  ← 1 process/máy
                    │                              │
  Claude Code #1 ───┤ project registry:            │
  (project A)       │  A → {.fgos dir, wt pool}    │
                    │  B → {.fgos dir, wt pool}    │
  Claude Code #2 ───┤  ...                         │
  (project B)       │                              │
                    │ per-(project,lock) queue      │
  git hook / CLI ───┤ (async mutex, in-process)    │──→ calls EXISTING
  (không qua MCP)   │                              │    fgos modules
                    │ global worktree governor      │    (main-checkout-
                    │  (cap tổng worktree toàn máy) │     lock.mjs,
                    │                              │     worktree.mjs,
                    │ execute(code) — Code-Mode-lite│     claim-port.mjs)
                    └─────────────────────────────┘
                                  │
                        file lock (wx-atomic, đã có)
                                  │
                      .fgos/main-checkout.lock (per repo)
```

Các thành phần:

1. **Registry cấp máy**: `projectRoot(canonical) → {fgosDir, lockCache, worktreePool}`. Đăng ký khi agent trỏ vào project lần đầu — không đoán, không quét ổ đĩa.
2. **Không viết lại lock**: server gọi thẳng `main-checkout-lock.mjs`/`claim-port.mjs`/`worktree.mjs` đã có — MCP chỉ là lớp điều phối, tránh 2 bản logic lệch nhau (rủi ro lớn nhất của việc build MCP riêng).
3. **Hàng đợi trong-process**: mỗi `(projectRoot, lockName)` có 1 async queue — nhiều tool-call từ cùng server tự serialize, không bao giờ race nhau. Process ngoài (terminal, git hook) vẫn an toàn nhờ file lock gốc.
4. **Bounded retry thay fail-fast**: khi gặp `HELD`, đừng trả lỗi ngay — trả **task handle** (đúng theo MCP Tasks extension 2026-07-28), retry có backoff trong giới hạn TTL hiện tại (3 phút), client poll `tasks/get`. Đây là chỗ giải quyết trực tiếp "ít tranh chấp → UX tốt".
5. **Code-Mode-lite cho tốc độ**: 1 tool `execute(code)` chạy script ngắn trong `node:vm`/`worker_threads` (Node builtin, khớp `"type": "module"` + zero-dep convention của repo), bind vào 1 object API đã gõ kiểu (typed facade: `lockStatus(project)`, `claim(project, id)`, `listWorktrees(project)`...) — KHÔNG cấp fs/child_process trực tiếp. Cho phép agent gộp "check status 6 project → chọn cái rảnh nhất → claim" thành 1 round-trip thay vì 6+ tool-call riêng lẻ. Đây chính là pattern Code Mode, chạy local, không phụ thuộc hạ tầng Cloudflare.
6. **Global worktree governor**: server đếm tổng worktree đang mở TRÊN TOÀN MÁY (không chỉ 1 project), áp trần cấu hình được (mặc định 4-5, theo research thực tế) — điều duy nhất CLI hiện tại không thể tự làm vì mỗi lời gọi CLI chỉ thấy repo của chính nó.

Map vào thứ tự ưu tiên user đặt:
- **Ổn định**: tái dùng lock primitive đã test, server không giữ state là nguồn sự thật — file lock vẫn là nguồn sự thật, server chỉ cache + serialize.
- **UX tốt**: task-handle + bounded retry thay vì "fail, người tự chạy fgos-unlock"; governor chặn máy đơ vì quá nhiều worktree.
- **Nhanh**: Code-Mode-lite batch nhiều thao tác/1 round-trip — xếp cuối, đúng như user muốn.

## 8. Ngôn ngữ triển khai: Rust được không?

Câu hỏi user: MCP này chủ yếu handle process (map request → gọi CLI phù hợp), domain logic không nằm trong nó — vậy viết Rust cho nhanh được không?

**Premise đúng một phần** — daemon ở mục 7 tách làm 2 lớp rõ rệt, và chỉ 1 lớp là "thuần process, không domain logic":

| Lớp | Chứa gì | Domain logic? | Ngôn ngữ có được đổi không |
|---|---|---|---|
| Orchestration | registry, per-lock queue, worktree governor, MCP protocol/transport | Không — thuần state + concurrency | **Có** — Rust hợp lý, đây đúng chỗ user nghĩ tới |
| Domain (lock/worktree/claim) | logic trong `main-checkout-lock.mjs`, `worktree.mjs`, `claim-port.mjs` | Có — đây LÀ business logic | **Không nên** — port sang Rust = viết lại từ đầu, tự tạo bản thứ 2 có thể lệch hành vi với CLI gốc |

**Hệ quả kiến trúc nếu chọn Rust cho orchestration**: không còn `import` thẳng module `.mjs` như mục 7.2 đề xuất (Rust không gọi hàm JS trực tiếp được) — bắt buộc chuyển sang gọi `fgos <verb>` như **subprocess**, parse JSON ở stdout. Điều này kéo theo 1 điểm phải làm đúng: lock lineage (mục 6) dùng **identity string** để tự nhận diện "cùng 1 caller đang refresh" (self-recognition, D6) vs "caller khác đang giành lock". Nếu mỗi lần daemon Rust spawn subprocess mà không truyền CÙNG 1 session identity (qua flag/env nhất quán), CLI con mỗi lần chạy sẽ tự sinh identity khác nhau (mặc định là `process.pid` của chính subprocess đó) → daemon vô tình "tự đấu với chính mình" thay vì refresh đúng cơ chế đã thiết kế. Cần CLI hỗ trợ 1 flag/env truyền identity cố định (vd `FGOS_SESSION_ID`) trước khi daemon hoá theo hướng subprocess.

**Thực tế hiệu năng — bottleneck nằm ở đâu**: mỗi lời gọi `fgos <verb>` hôm nay tốn:
- Node process cold-start (~50-150ms tuỳ máy)
- 1+ lệnh `git` subprocess bên trong (I/O-bound, không phải CPU-bound)

Rust glue chỉ tiết kiệm phần "code chạy" (thường <1ms cho việc map request→command) — không đụng tới 2 khoản trên. Vậy đổi glue-language từ Node sang Rust **không làm 1 lời gọi đơn lẻ "siêu nhanh"** như kỳ vọng ban đầu. Rust thật sự thắng ở chỗ khác: **nhiều connection đồng thời** (nhiều project/nhiều worktree cùng poll status/cùng xếp hàng lock) — `tokio` async + RAM thấp xử lý hàng trăm connection nhẹ hơn 1 process Node giữ event loop — đây là lợi ích thật, nhưng chỉ hiện rõ khi quy mô đủ lớn (nhiều project song song thật sự, không phải 1-2 project thỉnh thoảng).

**Khuyến nghị**: nếu build daemon (Phase 1, mục 10), Rust chấp nhận được CHO LỚP ORCHESTRATION (registry/queue/governor/MCP transport) — không chấp nhận cho việc port lock/worktree logic. Domain logic vẫn gọi qua `fgos` CLI subprocess, chấp nhận chi phí spawn hiện có (không tệ hơn hôm nay, chỉ thêm 1 lớp điều phối phía trước). Đổi lại: thêm 1 runtime thứ 2 phải build/deploy/test (Rust binary + Node CLI) — tăng bề mặt bảo trì, cần cân nhắc so với việc giữ toàn bộ daemon bằng Node (import trực tiếp, không cần identity-passthrough, ít rủi ro hơn, chỉ đánh đổi throughput ở quy mô rất lớn).

## 9. Trade-offs / Risks

- **Process mới = failure mode mới**: daemon phải sống, phải version-match CLI. Giảm rủi ro bằng cách server import thẳng module `.mjs` hiện có, không fork logic riêng.
- **Spec MCP đang chuyển sang stateless-first**: thiết kế theo Tasks extension ngay từ đầu, đừng tự chế cơ chế async riêng rồi phải migrate sau.
- **`node:vm` không phải security boundary mạnh** (khác V8 isolate thật của Cloudflare) — nhưng `worktree.mjs` đã tự nhận "same-user trust invariant, không sandbox chống hostile worker" — chấp nhận được cho local dev, KHÔNG chấp nhận được nếu sau này chạy code không tin cậy.
- **YAGNI check**: nếu thực tế user hiếm khi chạy >1 project × >1 worktree cùng lúc, lợi ích contention-reduction rất nhỏ so với chi phí maintain daemon — lock lineage hiện tại đã đủ tốt cho case 1-project.

## 10. Staged Plan (đề xuất, chưa implement)

### Phase 0 — chi tiết: flag `--wait` nghĩa là gì, vì sao rẻ

**Vấn đề hôm nay**: `acquireMainCheckoutLock` (mục 6) được thiết kế **non-blocking có chủ đích** — 1 lần thử `wx`-create, gặp `EEXIST` thì đọc lock, nếu stale thì reclaim-và-thử-lại (tối đa 1 lần), nếu `HELD` (live) hoặc `AMBIGUOUS` thì **return ngay lập tức**, không sleep, không loop. Đây là quyết định đúng cho chính hàm đó (một lệnh commit-time cần trả lời ngay, không treo). Nhưng verb CLI gọi nó (`fgos take`/`pick`/`return`/`merge`) hiện thừa hưởng nguyên tính "trả lời ngay" đó lên tận UX: gặp `HELD` → in lỗi, exit non-zero, **người dùng phải tự** chạy `fgos lock-status`, đợi, thử lại tay, hoặc chạy `fgos-unlock` nếu nghi ngờ stale.

**Đề xuất**: thêm 1 flag optional ở **lớp CLI verb** (không đụng `acquireMainCheckoutLock`/`tryAcquireOnce`), vd `--wait[=<ms>]`:
- Khi verb gặp `HELD`, thay vì fail ngay: sleep 1 khoảng ngắn (backoff, vd 500ms → 1s → 2s), rồi **gọi lại `acquireMainCheckoutLock` y nguyên** (hàm đã có, không sửa 1 dòng logic lock nào).
- Lặp tối đa tới `remainingTtlMs` mà lần đọc lock đầu tiên báo về, hoặc tới giá trị `--wait` do user chỉ định (cái nào nhỏ hơn).
- Nếu trong lúc chờ, holder cũ tự chết/hết TTL → lần gọi lại sẽ tự `ACQUIRED` nhờ logic reclaim **đã có sẵn** trong `tryAcquireOnce` — vòng lặp mới không cần biết gì về reclaim, chỉ cần gọi lại.
- Hết thời gian chờ mà vẫn `HELD`/`AMBIGUOUS` → fail như hôm nay (không có phép màu, chỉ tránh fail NGAY LẬP TỨC ở tranh chấp ngắn hạn).

**Vì sao rẻ hơn Phase 1 (daemon MCP) rất nhiều**:
1. Không cần process sống lâu — không daemon, không lifecycle/socket/systemd, không gì phải "luôn chạy" trên máy.
2. Không cần lớp giao thức MCP, không cần task-handle/polling phía client — Claude Code vẫn gọi `Bash` y như hôm nay, chỉ là lệnh đó tự đợi bên trong thay vì trả lỗi tức thì. Không đổi cách agent gọi CLI.
3. Không cần queue trong-process — vì không có server dùng chung giữa nhiều tool-call; mỗi lần gọi vẫn là 1 process CLI độc lập, thứ nó đợi (file lock) vốn đã cross-process-safe sẵn.
4. Diff code nhỏ: 1 vòng retry-with-backoff bọc quanh lời gọi `acquireMainCheckoutLock` đã có — ước chừng vài chục dòng ở lớp verb, không chạm `tryAcquireOnce`/lock primitive → rủi ro thấp, test hiện có (`main-checkout-lock.test.mjs`) không cần đổi, chỉ thêm test mới cho vòng lặp.

**Giới hạn Phase 0 (không giải quyết hết bài toán gốc)**:
- Vẫn per-repo — không thấy được nhiều project cùng lúc, không có "registry cấp máy".
- Không có global worktree governor (không đếm/tổng worktree toàn máy để chặn quá tải RAM/CPU).
- N agent cùng đợi 1 lock = N process độc lập tự poll riêng lẻ, **không FIFO/không công bằng** — agent đợi trước có thể vẫn thua agent join sau trong 1 lần race cụ thể (không ai giữ hàng đợi trung tâm). Đây chính là lý do Phase 1 (daemon + queue tập trung) đáng làm KHI có nhiều client thật sự tranh nhau thường xuyên, không chỉ occasional.
- Nếu holder là process LIVE thật (không stale) và giữ lâu hơn cả thời gian chờ, verb vẫn fail cuối cùng — flag chỉ hấp thụ tranh chấp ngắn hạn (vài giây giữa các lần commit), không thay thế việc điều tra 1 lock bị giữ bất thường lâu.

**Kết luận Phase 0**: đáng làm ngay nếu mục tiêu chỉ là "đừng bắt người dùng tự retry tay khi 2 lần `fgos take` đụng nhau trong vài giây" — chi phí thấp, không rủi ro kiến trúc. Chỉ nhảy sang Phase 1 khi có bằng chứng thực tế: tranh chấp xảy ra thường xuyên, nhiều agent đợi đồng thời thật sự, và/hoặc cần nhìn xuyên nhiều project cùng lúc.

### Phase 1 & 2

- **Phase 1** (chỉ làm nếu multi-project song song là pattern lặp lại thật): build daemon MCP như mục 7, bắt đầu với registry + queue + task-handle, CHƯA cần Code-Mode. Ngôn ngữ: xem mục 8 (Rust chỉ cho lớp orchestration nếu quy mô đủ lớn để đáng thêm runtime thứ 2; mặc định Node cho đơn giản/ít rủi ro).
- **Phase 2**: thêm `execute(code)` Code-Mode-lite khi đã có ≥3 tool cố định và thực tế thấy token cost cao vì agent chain nhiều call.

## 11. Resources

- [Code Mode: give agents an entire API in 1,000 tokens — Cloudflare Blog](https://blog.cloudflare.com/code-mode-mcp/)
- [Code Mode: the better way to use MCP — Cloudflare Blog](https://blog.cloudflare.com/code-mode/)
- [Code Mode MCP server patterns — Cloudflare Agents docs](https://developers.cloudflare.com/agents/model-context-protocol/codemode/)
- [How Code Mode works — Cloudflare Agents docs](https://developers.cloudflare.com/agents/tools/codemode/how-it-works/)
- [Cloudflare's new Dynamic Workers — VentureBeat](https://venturebeat.com/infrastructure/cloudflares-new-dynamic-workers-ditch-containers-to-run-ai-agent-code-100x)
- [Cloudflare Launches Code Mode MCP Server — InfoQ](https://www.infoq.com/news/2026/04/cloudflare-code-mode-mcp-server/)
- [Building Stateful MCP Servers: A Complete Guide (2026) — Fastio](https://fast.io/resources/building-stateful-mcp-servers/)
- [The 2026-07-28 MCP Specification Release Candidate — modelcontextprotocol.io](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/)
- [MCP 2026-07-28: From Local Tool to Distributed Protocol — AAIF](https://aaif.io/blog/mcp-2026-07-28-whats-changing-and-how-to-migrate)
- [Airflow MCP Architecture — Markaicode](https://markaicode.com/architecture/airflow-mcp-architecture/)
- [treehouse-worktree — GitHub](https://github.com/mark-hingston/treehouse-worktree)
- [MCP Git Worktree Workflows — LobeHub](https://lobehub.com/mcp/doctacon-mcp-worktree-workflows)
- [Git Worktree Isolation Patterns for Parallel AI Agent Development — Zylos Research](https://zylos.ai/research/2026-02-22-git-worktree-parallel-ai-development/)
- [Swarm Orchestrator README — glama.ai](https://glama.ai/mcp/servers/@sbraind/mcp-lite-wrappers/blob/3755ee1d1e29edb66ef4ac1af0b86fb414de44f0/packages/swarm-orchestrator/README.md)
- [Coordinate Multiple Claude Code Sessions on a Shared Repo — DEV Community](https://dev.to/sahil_kat/coordinate-multiple-claude-code-sessions-on-a-shared-repo-1dh4)

## 12. Unresolved Questions

- Thực tế hiện tại user chạy bao nhiêu project song song, bao nhiêu worktree/project — chưa có data, quyết định Phase 0 vs Phase 1 phụ thuộc cái này.
- Daemon MCP này chạy per-user hay per-machine (nhiều user cùng máy)? Ảnh hưởng chỗ đặt registry/socket (`~/.fgos/` vs `/tmp`).
- MCP Tasks extension (2026-07-28) còn là release candidate — SDK/client (Claude Code) đã support đủ để dựa vào chưa, hay cần fallback polling tự chế trong lúc chờ.
- Có cần daemon tự khởi động (systemd/launchd) hay chỉ start on-demand khi Claude Code kết nối lần đầu?
- Nếu Phase 1 dùng Rust cho orchestration: CLI hiện tại đã có cơ chế truyền session identity cố định qua flag/env chưa, hay phải thêm mới trước?
