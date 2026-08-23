# Judge scout result not persisted/reused — problem report

Session: thảo luận bắt đầu từ tsk-3go, lệch sang gap thật trong judge-executor scout flow. Report này chốt lại vấn đề + task liên quan đã/chưa làm, để không mất context.

## 1. Vấn đề đang gặp

tsk-62d (done) cho judgeDiscovery/judgeDecompose (`src/intake/discovery.mjs`, `src/intake/plan.mjs`) khả năng autonomous scout thật (`Bash(rg:*)`) trước khi park item vào awaiting-human. Nhưng mỗi lần judge chạy = 1 nested `claude -p` process mới (`runJudgeExecutor`, `src/intake/judge-executor.mjs`), `spawnSync` chỉ đọc `stdout` cuối (JSON verdict) — không capture tool-call transcript, không cache, không ghi ra đâu cả. Kết quả scout mất ngay sau mỗi lần gọi.

Hệ quả: chi phí/latency scout là **per-call**, không amortize được dù cùng 1 item chạy nhiều lần (discover → decompose, hoặc nhiều iteration của 1 loop sau này). tsk-62d's own decision note đã tự cảnh báo điều này compound với chi phí per-run của tsk-3go (discover-loop).

## 2. Verify code (căn cứ, không phải suy đoán)

- `judge-executor.mjs`: `spawnAttempt` gọi `spawnSync(command, args, {...})`, `runJudgeExecutor` chỉ parse `result.stdout` thành verdict JSON. Không có nơi nào lưu transcript.
- `allowedTools` cho tier `judge` (tsk-62d D2/D4, `resolveExecutorCommand(cfg, {..., tier: 'judge'})`): mặc định kế thừa `Bash(git add:*),Bash(git commit:*)`, tsk-62d thêm `Bash(rg:*)` qua `cfg.executors.judge` override. **Không có `Write`.**
- tsk-62d gate answer (đã khóa, verify từ `fgos show tsk-62d`): *"Scope cho v1: CHỈ Bash(rg:*)... Không có tool đọc file trực tiếp/git log/khác nào khác ở item này — nếu rg không đủ, đó là item follow-up riêng, ngoài scope tsk-62d."* → chính task đó đã tự route persistence/reuse thành item riêng, chưa filed.
- Chỗ CONTEXT.md/plan.md thật sự tồn tại: mỗi item có `work.docsRef` trỏ `docs/history/<slug>/`, đọc qua `readLockedContext(repoRoot, work.docsRef)` (discovery.mjs:270). Nhưng file đó được **fgos-coding-exploring/fgos-coding-planning** (session người thật, có Write) ghi, không phải judge mechanical call. Không có file tương đương cho scout notes.
- Search toàn bộ backlog fgOS (`fgos list --all`) theo từ khóa scout/persist/reuse/cache: **không có item nào** cover đúng "persist/reuse judge scout output". Không phải đã có sẵn rồi bỏ sót.

## 3. Task liên quan đã làm (nhưng không giải quyết vấn đề này)

| Task | Status | Liên quan gì | Vì sao chưa giải quyết |
|---|---|---|---|
| tsk-62d | done | Cho judge khả năng scout (`Bash(rg:*)`) trước khi park awaiting-human | Chính nó tạo ra chi phí scout lặp lại; tự locked scope KHÔNG làm persistence, note rõ để item follow-up |
| tsk-4y8 | done | Fix hand-back path fgos-coding-planning khi gặp gap CONTEXT.md giữa decompose | Khác cơ chế — đây là session người thật (fgos-coding-planning), không phải judgeDiscovery/judgeDecompose mechanical call. Không đụng scout/judge-executor |

## 4. Task liên quan chưa làm / còn treo

| Task | Status/stage | Liên quan gì |
|---|---|---|
| tsk-3go | todo / clarify | discover-loop (/loop quanh discover/decompose picker) — chi phí per-run của nó cộng dồn trực tiếp với chi phí scout lặp lại này. Description gốc đã tự note liên hệ cost với tsk-62d |
| tsk-4xr | todo / clarify | fgos-coding-exploring re-scout giữa hội thoại khi câu trả lời người hé lộ fact mới — sibling item của tsk-62d (nêu trong description tsk-62d), nhưng là re-scout trong session người thật, KHÔNG phải persist/reuse output của judge mechanical call. Không cùng vấn đề |
| tsk-62v | todo / clarify | Generalize executor resolution theo capacity, không chỉ tier — có thể là chỗ đúng để mở rộng `cfg.executors.judge` sau này (thêm Write, thêm path scoping), nhưng chưa xác nhận trong scope gốc của nó |
| **(chưa filed)** | — | "Persist + reuse judge scout output" — vấn đề đang bàn ở đây. Chưa có item fgOS nào cover. Cần `/fgOS:submit` riêng hoặc gộp vào tsk-3go lúc discover/plan |

## 5. Hướng kỹ thuật đã thảo luận (chưa chọn)

**Cách A — model tự ghi file:** thêm `Write` vào `allowedTools` tier judge, sửa `judge-scout-instructions.txt` bảo model ghi `docs/history/<docsRef>/scout-notes.md` trước khi trả verdict; discovery.mjs/decompose.mjs đọc file đó trước (giống `readLockedContext`), có thì dùng lại không scout lại. Rủi ro: cấp Write cho process tự động không người giám sát — nới quyền lớn hơn hẳn read-only rg hiện tại.

**Cách B — parent capture transcript:** đổi executor sang `--output-format stream-json`, parent tự parse tool_use/tool_result (rg output) từ transcript, tự ghi file, không cần cấp Write cho judge. An toàn hơn nhưng phải tự parse format CLI, phức tạp hơn.

Routing (chưa chốt): submit item fgOS riêng (khớp cách tsk-62d tự chỉ định) / gộp vào tsk-3go lúc discover / sửa code ngay bỏ qua fgOS lifecycle.

## Câu hỏi chưa giải quyết

1. Cách A hay B?
2. Item riêng hay gộp vào tsk-3go?
3. Nếu cách A: path Write có scope được hẹp về đúng 1 file (`docs/history/<docsRef>/scout-notes.md`) hay chỉ có full `Write` (không path-scoped) trong allowedTools hiện tại của Claude CLI? Chưa verify được giới hạn permission thật của `--allowedTools Write(...)` pattern.
4. tsk-62v (capacity-aware executor resolution) có phải chỗ đúng để mount thêm cấu hình judge (Write scope, path) hay nên độc lập? Chưa đọc kỹ description đầy đủ của tsk-62v để xác nhận.
