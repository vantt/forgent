# Architecture Advisory Panel — Confinement Authority cho fgOS dispatch

**Coordination id:** `aap-260909-fgos-confinement-authority`
**Protocol:** `core.coordination-protocol.architecture-advisory-panel-v1` (chạy thật qua `fgos-group-thinking` gate, không phải một agent tự bàn)
**Ngày:** 2026-09-09
**Trạng thái session:** đang mở (`running`) — chưa `close-dialogue`, để anh có thể phản hồi/hỏi tiếp mà không cần mở panel mới.
**Evidence thô (request JSON + toàn bộ agent-result.json/agent-report.md thật):** `plans/260909-2107-confinement-authority-panel/evidence/`, và các assignment gốc dưới `.fgos/assignments/asgn_coordinator_driver_op_04[3-9]*`, `op_05*`.

---

## 0. Yêu cầu gốc (verbatim)

> "Cho tôi một architecture panel để thiết kế Confinement Authority cho fgOS dispatch. Hãy xác định component boundary, component parent, canonical contracts, backend abstraction, default implementation đơn giản và lộ trình mở rộng. Ghi toàn bộ discussion và quyết định cuối vào một file."

---

## 1. Cách panel này chạy (để anh biết đây là thật, không phải một agent tự đóng vai)

9 vai trò, mỗi vai là **một dispatch thật** (subprocess thật, model thật, đọc file thật bằng absolute path) qua CLI `fgos coordination run`, dưới protocol `architecture-advisory-panel-v1`. Roster ban đầu theo doctrine của skill dùng 3 họ provider (Claude / GPT-Codex / Gemini-Antigravity), nhưng **`codex-readonly` thất bại thật ngay ở lượt đầu** — sandbox `-s read-only` của nó không có exception ghi file, nên không thể viết `agent-result.json` (đúng gap đã biết, không phải bug mới). Panel co về **2 họ provider thật** (Claude qua `claude-bwrap`, Gemini/Antigravity qua `agy-bwrap`) — khớp với tiền lệ đã verify trước đó (P05.2). Việc này được nêu công khai, không giấu.

| Vai trò | Executor thật đã dùng | Tier | Assignment |
|---|---|---|---|
| lead-advisor | claude-bwrap (Claude, opus) | critical | op_043 (interpret), op_055 (explain) |
| context-investigator | codex-readonly → **thất bại (no-evidence)**, retry agy-bwrap (Gemini) rồi claude-bwrap (Claude) | standard | op_044 (fail), op_045, op_046 |
| system-shaper | claude-bwrap (Claude, sonnet) | analytical | op_047 |
| alternative-shaper | agy-bwrap (Gemini, gemini-3.1-pro-low) | analytical | op_048 |
| constraint-advocate | claude-bwrap (Claude, sonnet) | analytical | op_049, op_051 |
| architecture-critic | agy-bwrap (Gemini, gemini-3.1-pro-low) | analytical | op_050 |
| synthesizer | claude-bwrap (Claude, opus) | critical | op_052 |
| red-team | agy-bwrap (Gemini, gemini-3.1-pro-high) → **timeout lần 1** (giới hạn print-mode 5 phút riêng của agy, không phải fgOS), retry với prompt gọn hơn | critical | op_053 (timeout), op_054 |

Không vai nào thấy nội dung riêng của vai khác ngoài đúng những gì cơ chế visibility-window của protocol cho phép (3 shaper độc lập với nhau; critic/constraint-advocate chỉ thấy 3 proposal; synthesizer thấy cả critique+ranking; red-team **không** thấy bản synthesis, chỉ thấy ledger thô — đúng cơ chế cách ly).

---

## 2. Khung vấn đề (lead-advisor, interpret-request — op_043)

Lead-advisor đọc thật `.fgos/config.json` (583 dòng) và `dispatch/{resolve,transport,assignment,assignment-runner}.mjs`, xác định:

- **Độ cao (altitude):** đây là một **năng lực platform xuyên-cắt mới**, không phải shape nội bộ của một module, không phải viết lại dispatch. `transport.mjs`'s `resolveExecutorCommand` đã là **một funnel duy nhất** đáng để cắm vào, không cần model dispatch mới.
- **Gánh nặng quyết định (reversibility), chia 3 mức** ngay từ đầu — dùng xuyên suốt panel:
  - **Xanh (additive, dễ đảo):** thêm khái niệm Confinement Profile + backend abstraction, phát ra đúng argv hiện tại.
  - **Vàng (migratory):** dedupe 2 đoạn bwrap prologue copy-paste + sửa đường dẫn tuyệt đối hardcode `.fgos/assignments` — sửa cái này KHÔNG giữ behavior y hệt trên máy khác (đây là fix, không phải side-effect ngầm).
  - **Đỏ (breaking, KHÔNG tự quyết):** đổi/bỏ tên executor `claude-bwrap`/`agy-bwrap`/`codex-readonly` — các tên này có load ở `capabilities.advise`/`code:review`/`code:debug` và trong evidence trail tsk-1o4. Đây là **User Decision**, không phải kỹ thuật.
- **Một câu hỏi duy nhất được giữ lại (không tự đoán):** "Đại lượng nào là input đáng tin để chọn tư thế confinement tại thời điểm build argv — `mutation` posture của Assignment, hay việc chọn capability/executor?" — câu này quyết định luôn 3/6 sub-ask (boundary, parent, contract).

---

## 3. Scout thật (investigate-context — 2 lượt, op_045 + op_046)

**Lượt 1 (op_045, agy-bwrap)** — quét toàn bộ hiện trạng:

- Không có component "Confinement Authority" nào tồn tại. Confinement hôm nay = argv thuần: `claude-bwrap`/`agy-bwrap` (`.fgos/config.json:175-245`) hardcode y hệt 1 đoạn `bwrap --ro-bind / / --dev /dev --proc /proc --bind <abs>/.fgos/assignments <abs>/.fgos/assignments -- ...` (copy-paste, kể cả đường dẫn tuyệt đối riêng của máy này); `codex-readonly` (246-266) đạt cùng Ý ĐỊNH (read-only) bằng cơ chế hoàn toàn khác (`codex exec -s read-only`).
- **Đã có sẵn một scheme confinement KHÁC, hoàn toàn tách biệt:** `dispatch/config.mjs` khai báo field `confinement` với vocabulary `privateHome`/`isolatedSession`/`ownWorktree` (dòng 696, validate 713-775, có invariant thật: `permissionMode:'bypass'` bắt buộc cả 3 = true) — nhưng **chỉ** được enforce trong `herdr-round.mjs` (`establishConfinement`, dòng 209-253) cho adapter `herdr-spawn`. Zero liên kết với bwrap.
- Worktree isolation guard (`worktree.mjs`) và main-checkout lock — **không phải** Confinement Authority: worktree.mjs tự ghi rõ "SAME-USER TRUST INVARIANT... not a security boundary"; main-checkout-lock là mutex ghi-tuần-tự, không phải sandbox.

**Lượt 2 (op_046, claude-bwrap)** — trả lời thẳng câu hỏi lead-advisor giữ lại, bằng cách đọc call-site thật:

> **Sự thật quyết định:** `resolveExecutorCommand` (`transport.mjs:145`) **không có tham số `mutation` nào cả** trong signature. Hai caller thật của nó (`spawnWorker`, `executeExecutorCli`) đều KHÔNG forward `mutation`, **kể cả trên đường gọi duy nhất (`executeAssignment`) nơi giá trị `mutation` đã có sẵn trong scope**. Và `spawnWorker`'s đường gọi thật, chạy liên tục trong production (`loop.mjs:1005`, main fgos-runner loop) **hoàn toàn không có Assignment nào** để lấy `mutation` từ đó.

⇒ Input duy nhất luôn có mặt ở MỌI đường dispatch thật là **executor/config đã resolve**, không phải `Assignment.mutation`. Đây là bằng chứng quyết định hướng cả panel sau đó.

---

## 4. Ba đề xuất độc lập (Phase 5 — shaping, op_047/048/049)

Mỗi shaper chỉ nhận evidence ở trên, KHÔNG thấy đề xuất của 2 shaper khác.

### Đề xuất A — system-shaper (op_047): Runtime interception, field mới
- **Boundary:** chỉ render `{command,args}` từ tư thế confinement đã resolve. Không đụng việc chọn executor, không đụng worktree/main-checkout lock, không đụng herdr-round.mjs.
- **Parent:** `src/runner/dispatch/confinement.mjs`, gọi từ `transport.mjs#resolveExecutorCommand`, ngay sau `resolveExecutorConfig`.
- **Contract:** field MỚI `executor.confinementProfile = {backend, writableExceptions?}` → output `{command, args}`.
- **Backend:** `bwrap-ro`, `provider-native`. herdr-round.mjs giữ tách biệt (lý do: nó mutate env/session, không phải pure render).
- **Default impl:** opt-in field, 2 backend, migrate 3 executor hiện tại, test snapshot argv byte-identical.
- **Roadmap:** xanh/vàng/đỏ như lead-advisor đã chia.

### Đề xuất B — alternative-shaper (op_048): Compile-time synthesis, KHÔNG có runtime component
- Fold confinement vào **thời điểm load config** (`config.mjs`): executor khai báo `confinementDialects`, capability khai báo posture cần, một pass `compileConfinementDialects` tổng hợp executor block trong memory. **Tuyên bố "zero thay đổi runtime".**
- Lý do chọn hướng này: tránh phải xuyên `mutation` qua `loop.mjs`; tách rõ 2 threat model (mutation vs. session/credential isolation).
- Tiêu chí tự-falsify (do B tự nêu): nếu confinement cần một giá trị **chỉ có tại thời điểm spawn** (per-invocation, không thể template ở compile-time) → B sai.

### Đề xuất C — constraint-advocate (op_049): Value object runtime, khóa theo capability+cwd
- **Rủi ro số 1 mà C tự nêu (và đây là insight quan trọng nhất của cả panel):** bất kỳ thiết kế nào khóa confinement theo field `mutation`/Assignment sẽ **fail OPEN** (không phải fail closed) trên `loop.mjs:1005` — đường dispatch chạy liên tục thật trong production, không có Assignment. Nhìn qua review sẽ thấy "đúng", nhưng lặng lẽ không áp dụng trên đường chạy nhiều nhất.
- **Giải pháp của C:** không dùng field tùy chọn — luôn derive posture từ dữ liệu MỌI call site đã có sẵn (tên capability + cwd), không bao giờ từ field optional.
- **Contract:** `resolveConfinementProfile(executorEntry, {capabilityName, cwd, repoRoot})` gọi trong `resolveExecutorCommand`; value object `{mechanism, writableExceptions, requiresOwnWorktree, requiresPrivateHome, requiresIsolatedSession}` — **fold cả 3 boolean của herdr-round.mjs vào chung 1 object.**
- Rủi ro thứ 2 C tự nêu: mọi backend mới phải tôn trọng đúng 1 tập "writable exception" dùng chung (`.fgos/assignments`), nếu không sẽ lặp lại lỗi `no-evidence` đã confirm sống.

---

## 5. Phản biện thật (Phase 6 — critique + assess, op_050 + op_051)

**architecture-critic (op_050)** — tấn công đề xuất mạnh nhất, không phải yếu nhất:

1. **Đề xuất B bị falsify, CHẾT.** Confinement bwrap cần biết đường worktree per-item (`loop.mjs:1005`'s `wt.path`) — giá trị này **chỉ tồn tại tại thời điểm dispatch**, sau khi config đã load xong. B từ chối đụng `transport.mjs` nên không có chỗ để bơm giá trị này vào. Đúng tiêu chí tự-falsify mà B tự đặt ra.
2. **Đề xuất A tái tạo lại đúng loại rủi ro fail-open mà C cảnh báo** — chỉ chuyển từ tầng Assignment sang tầng executor-config: một executor mới quên khai `confinementProfile` sẽ chạy KHÔNG bị confine, im lặng.
3. **Đề xuất C rò rỉ abstraction:** `cliSpawnAdapter` (`transport.mjs:294`) chỉ đọc `{command, args, env}`, **hoàn toàn bỏ qua** các field `requiresPrivateHome`/`isolatedSession`/`ownWorktree` mà C fold vào — nghĩa là claim "fold an toàn" của C là sai cho mọi executor dùng `cli-spawn`. Lập luận "tách biệt vì thuần khiết" của A **không phải chỉ là thẩm mỹ** — nó đúng.

**constraint-advocate — assess-constraints (op_051)**, tự xếp hạng cả đề xuất của chính mình:

| Đề xuất | Rủi ro | Vì sao |
|---|---|---|
| B | **HIGH** | Cùng lỗ hổng critic tìm ra, tìm độc lập |
| C (của chính mình) | **MEDIUM-HIGH** | Cần thêm param mới vào signature `resolveExecutorCommand` + đổi caller `spawnWorker` (quy mô chưa verify), áp dụng lên **cả 15 executor** mỗi lần gọi, không phải opt-in |
| A | **LOW-MEDIUM** | Zero đổi signature/caller; rủi ro còn lại (attack #2 của critic) chỉ là rủi ro **thời điểm tác giả config quên khai báo** (review 1 lần khi thêm executor) — khác hẳn về độ lớn so với rủi ro per-dispatch-call mà C sinh ra để tránh |

Đề xuất mitigation rẻ cho lỗ hổng chết của B: giữ ý tưởng token hoá của B, thêm **một bước thay token→cwd runtime nhỏ** ngay trong `resolveExecutorCommand` (đúng funnel mà A đã sửa) — nhưng lúc này đã là **hybrid A+B**, không còn là B thuần.

---

## 6. Synthesis — cú lật quan trọng nhất (op_052)

Synthesizer phát hiện: **cả 3 đề xuất đều viết trên giả định greenfield — sai.** fgOS đã có **nửa** một Confinement Authority thật:

| Sự thật | Vị trí verify |
|---|---|
| `executor.confinement` là field config **thật, có validate** | `dispatch/config.mjs:733-760` |
| Vocabulary đóng `['privateHome','isolatedSession','ownWorktree']` | `config.mjs:696` |
| Key lạ bị **refuse**, không bị bỏ qua âm thầm | `config.mjs:750-759` |
| Invariant C5 đã hoạt động thật: `permissionMode:'bypass'` bắt buộc cả 3 flag = true | `config.mjs:764-774` |
| `resolveExecutorCommand` **đã trả về** `confinement` | `transport.mjs:196-197` |
| `herdrSpawnInteractiveAdapter` đã tiêu thụ nó | `transport.mjs:587` |
| `cliSpawnAdapter` chỉ lấy `{command, args, env}` — **bỏ qua hoàn toàn** | `transport.mjs:295` |
| **Không executor nào trong 3 executor bwrap khai báo `confinement` cả** | `.fgos/config.json:175-266` |

⇒ fgOS đang có **2 khái niệm confinement không liên quan tới nhau**: Axis 1 (session hygiene: privateHome/isolatedSession/ownWorktree — đã khai báo, validate, enforce, nhưng chỉ 1 adapter dùng) và Axis 2 (OS filesystem mount — không khai báo ở đâu cả, chỉ là argv copy-paste). Ba executor tồn tại CHÍNH VÌ để bị confine lại không tham gia axis nào theo kiểu khai báo.

### Quyết định cuối: **A′** — không phải A, không phải B, không phải C

> **Đừng xây Confinement Authority mới. Hoàn thiện cái đã có, ở axis còn thiếu.**

Lấy vị trí gọi (call site) và boundary của A. **Bỏ field mới `confinementProfile` của A.** Mở rộng field **`executor.confinement` đã có sẵn** bằng một sub-object mới:

```json
"confinement": {
  "filesystem": { "backend": "bwrap-ro", "writable": ["{repoRoot}/.fgos/assignments"] }
}
```

- Validate trong **chính validator đã có** (`config.mjs`'s `validateExecutionProfileShape`).
- Render bằng 1 function pure mới trong file mới `src/runner/dispatch/confinement.mjs`.
- Gọi từ `resolveExecutorCommand` ngay sau khi executor resolve — **zero đổi caller, zero đổi signature**, vì function này đã trả về key `confinement` từ trước.

**Vì sao A′ mà không phải A:** thêm `confinementProfile` bên cạnh `confinement` là tạo 2 khai báo confinement trên cùng 1 executor entry — một cái được validate, một cái không. Đây đúng là *tùm lum* theo AGENTS.md D-ADR0036. Dùng lại field cũ cũng đóng luôn lỗ hổng còn lại của A (quên khai báo) miễn phí, vì field đó đã có validator từ chối key lạ.

**Vì sao A′ mà không phải C:** cách C derive theo capability+cwd mua được sự an toàn chống fail-open — nhưng A′ đã đóng đúng lỗ hổng đó ngay tại cửa config (load-time), với blast radius nhỏ hơn nhiều (opt-in, không chạy trên cả 15 executor mỗi lần gọi).

### Tranh luận sống, KHÔNG bị làm mượt đi

- **A vs C về việc fold 3 boolean của herdr-round.mjs:** Critic đứng về phía A (tách biệt) — **đúng về mặt sự kiện** (`transport.mjs:295` xác nhận). Nhưng synthesizer **không nhận trọn** kết luận đó — tách làm 2 phần: **C đúng về SHAPE dữ liệu** (một object thống nhất — và field đó đã tồn tại thật trong repo!), **A đúng về BOUNDARY người tiêu thụ** (renderer thuần không được đụng vào session/env mutation của herdr-round.mjs). Bản constraint-ranking đọc critique như thể nó xác nhận CẢ HAI lập luận của A — synthesizer nói: nó chỉ xác nhận một.
- **Về độ lớn rủi ro fail-open giữa A và C:** synthesizer đồng ý khoảng cách đó là thật (rủi ro authoring-time, review 1 lần/executor mới ≠ rủi ro per-dispatch-call trên production loop) — nhưng dưới A′ thì tranh luận này **hết ý nghĩa**, vì cổng chặn đã đóng ngay tại config-load.
- **Đề xuất B:** synthesizer đồng ý bị falsify, và verify độc lập thêm bằng chính `transport.mjs:99` (đặt tên `fgw/<id>`) — không dựa dẫm vào lời khẳng định của critic.

### Một bất đối xứng chưa ai nêu — và nó có thật, đã tái hiện ngay trong session này

`bwrap-ro` diễn tả được exception ghi (`--bind`). **`provider-native` (codex `-s read-only`) KHÔNG THỂ.** Và `codex-readonly` hôm nay khai báo **0 exception ghi** — đúng nguyên nhân khiến `claude-bwrap` cần bind ghi cho `.fgos/assignments` (mô tả của chính `claude-bwrap` trong config.json từng ghi lại việc một dispatch đọc-hoàn-toàn bị kẹt ở `no-evidence`).

**Đây không phải lý thuyết — chính session panel này đã tái hiện lỗi đó 2 lần:** lượt scout đầu (op_044) gửi cho `codex-readonly` fail đúng kiểu này; và bản thân bản explain (op_055) khi thử viết ra `plans/` cũng bị `EROFS` (chỉ cây `.fgos/assignments` được mount ghi).

**⇒ Contract của backend phải: từ chối ngay lúc load nếu backend không thể đáp ứng `writable[]` được yêu cầu — không bao giờ âm thầm bỏ qua.**

### Sửa lỗ hổng còn lại — đúng cách, không đoán theo tên lệnh

Ý tưởng ban đầu ("từ chối load executor họ-bwrap thiếu profile") có shape đúng (như C5) nhưng trigger sai — nó soi `command === 'bwrap'`, mà **`codex-readonly` CŨNG là confinement-family nhưng command là `codex`**. Đoán theo tên lệnh là đoán mò.

**Cách đúng — lật ngược, dùng máy đã có sẵn:** để **capability** khai `requiresConfinement: true`; tại điểm cross-check `prefer` đã có sẵn (`config.mjs` dòng ~1045-1053, chạy SAU khi cả `capabilities` và `executors` đã hợp lệ riêng), từ chối nếu executor được `prefer` không có backend `confinement.filesystem`. Load-time, ồn ào (throw), không đoán mò. Bảo vệ đúng 3 binding thật đang trỏ vào executor bị confine: `advise→claude-bwrap`, `code:review→codex-readonly`, `code:debug→codex-readonly`.

---

## 7. Red-team độc lập — kiểm tra CÁCH PANEL LÀM VIỆC, không kiểm tra kiến trúc (op_054)

Không thấy bản synthesis (cách ly đúng thiết kế) — chỉ thấy ledger thô (3 đề xuất + critique + ranking) — và trả lời:

- Phản biện của critic lên A **là một phân biệt có lập luận thật về thời điểm (lifecycle timing)**, không phải một cách gạt bỏ tiện lợi.
- Việc constraint-advocate tự hạ hạng đề xuất của chính mình (C) **là tự-sửa thật**, không phải nói giảm.
- Đề xuất B **là một ứng viên nghiêm túc thật, bị falsify trên chính nội dung kỹ thuật** — không phải con rối để dựng lên rồi đánh đổ.

**Verdict: APPROVE.**

---

## 8. QUYẾT ĐỊNH CUỐI — trả lời đủ 6 câu hỏi (lead-advisor, explain-recommendation — op_055)

### (1) Component boundary
Chỉ làm một việc: biến tư thế confinement đã khai báo (`executor.confinement.filesystem`) thành `{command, args}` cụ thể.
**KHÔNG** làm: chọn executor cho capability (vẫn ở `resolve.mjs`), session/HOME isolation (vẫn ở `herdr-round.mjs`), git worktree disposability (`worktree.mjs` — tự nhận không phải security boundary), write-serialization checkout (`main-checkout-lock.mjs` — mutex, trục khác hẳn).

### (2) Component parent
File mới `src/runner/dispatch/confinement.mjs`, gọi từ `transport.mjs#resolveExecutorCommand` — funnel argv duy nhất, ngay sau khi executor resolve xong. **Không cần đổi bất kỳ caller nào** (`spawnWorker`, `executeExecutorCli`, `loop.mjs:1005`) vì hàm này đã trả về `confinement` từ trước.

### (3) Canonical contracts
Mở rộng field CÓ SẴN, không tạo field mới:
```json
"confinement": {
  "filesystem": { "backend": "bwrap-ro" | "provider-native", "writable": ["{repoRoot}/.fgos/assignments"] }
}
```
Validate trong `validateExecutionProfileShape` đã có (vocabulary đóng, key lạ bị refuse — cùng style C5). Output vẫn nguyên `{command, args}` mà `resolveExecutorCommand` đã trả.

### (4) Backend abstraction
Registry theo `backend`, mỗi backend là `(filesystem, ctx) -> {command, args} | null`:
- **`bwrap-ro`** — phát ra đúng prologue bwrap hiện tại, chỉ khác: `writable[]` là data, không phải string hardcode.
- **`provider-native`** — passthrough (codex đã tự mang `-s read-only` trong args của nó).
- `herdr-round.mjs` giữ **tách biệt**, không phải backend thứ 3 (khác contract: mutate env/session, không phải render argv thuần).
- **Luật bắt buộc:** backend không thể đáp ứng `writable[]` được yêu cầu phải **refuse lúc load**, không bao giờ âm thầm bỏ qua (xem §6, bất đối xứng đã tái hiện sống 2 lần).

### (5) Default implementation (ship ngay, KISS/YAGNI)
1. **Bước đầu tiên, trước khi sửa gì khác:** viết golden/snapshot test trong `test/runner/dispatch.test.mjs` (đã import `resolveExecutorCommand` sẵn) khẳng định argv của `claude-bwrap`/`agy-bwrap`/`codex-readonly` — lấy nguyên văn từ config sống hôm nay (đã liệt kê đủ 3 array trong §3 bản explain, xem file evidence).
2. Thêm 2 backend (`bwrap-ro`, `provider-native`) trong `confinement.mjs`.
3. Migrate 3 executor sang khai `confinement.filesystem`, để bwrap-ro phát ra đúng argv y hệt.
4. Test golden phải PASS không đổi trước/sau.

### (6) Lộ trình mở rộng — 3 mức, thứ tự đúng cách này
- **XANH (đảo được, làm ngay):** field `filesystem` mới trong `confinement` đã có + 2 backend + golden test + gate `requiresConfinement` phía capability. Additive hoàn toàn, argv y hệt, 0 ảnh hưởng executor không adopt.
- **VÀNG (đảo được, cần cẩn trọng, làm tiếp):** dedupe 2 đoạn bwrap prologue copy-paste; thay đường dẫn tuyệt đối hardcode bằng token `{repoRoot}` — sửa NGUỒN của argv, không phải GIÁ TRỊ (nên golden test phải có trước, không phải sau). Đây là fix một lỗi portability thật: 3 executor này hôm nay **không chạy được trên máy nào khác ngoài máy này** — trực tiếp mâu thuẫn với mission #1/#2 của fgOS (phục vụ project khác) theo D-ADR0035.
- **ĐỎ (không đảo được, KHÔNG tự quyết):** đổi/bỏ tên executor `claude-bwrap`/`agy-bwrap`/`codex-readonly` — load-bearing trong 3 capability binding sống + evidence trail tsk-1o4 (trích dẫn *bằng chính id đó* ngay trong description). **A′ không cần đụng tới mức đỏ này** — đây là điểm cộng thật của phương án, không phải tình cờ.

---

## 9. Phần vẫn là quyết định của anh (không phải disclaimer đóng bài)

1. **Gộp bước vàng (fix path) vào cùng lần ship với xanh, hay để riêng?** Gộp: sửa lỗi portability sớm hơn, rủi ro thấp vì đã có golden test. Để riêng: giữ câu chuyện review của bước xanh "chỉ thêm, giữ nguyên argv" hoàn toàn sạch.
2. **Việc `codex-readonly` không có writable exception nào — filed thành work item riêng ngay bây giờ, hay để sau?** Đây là gap thật, đã tái hiện sống, nhưng là vấn đề khác với quyết định kiến trúc này — A′ ship được mà không cần sửa nó, nhưng nó sẽ tiếp tục sinh `no-evidence`.
3. **Backend abstraction ở N=2: dùng registry hàm hay `switch` thuần?** Đây là **hoà thật trong evidence** — không cần quyết định ngay. Quan sát duy nhất sẽ phá hoà: có backend thứ 3 cần validation rule riêng của nó không (registry nếu có, switch nếu không). Không cái nào trong repo trả lời câu này hôm nay.

---

## 10. Đã verify, chưa verify (nói thật, không đoán)

- **Đã verify (đọc trực tiếp, nhiều lượt, độc lập, absolute path):** toàn bộ dòng/file trích trong §3, §6, §8 — được tối thiểu 2 vai đọc lại độc lập tại các thời điểm khác nhau trong panel (system-shaper, constraint-advocate, synthesizer, lead-advisor đều tự re-verify, không chỉ tin lời người trước).
- **Chưa verify (`Bash`/`grep` bị permission-gate trong runtime sandbox của các vai này suốt session):** liệu một golden test cho đúng 3 executor sống này đã tồn tại sẵn trong `test/runner/dispatch.test.mjs` chưa — file đó CÓ import `resolveExecutorCommand` (xác nhận được), nhưng nội dung test cụ thể thì chưa xác nhận hết. Đây là việc grep 2 phút, để cho lần code thật tiếp theo.

---

## 11. Ghi chú vận hành panel (để tái dùng / gỡ lỗi lần sau)

- `investigate-context` và `assess-constraints`/`critique-proposals` là operation "required"/"driver-authorized" với `budget.maxRuns: 1` mặc định — muốn retry một assignment đã fail phải cấp `taskKey` mới (op required) hoặc `authorize` mới với `authorizationId`/`invocationKey` mới (op driver-authorized). Không có cơ chế retry ngầm.
- `codex-readonly` **không dùng được cho bất kỳ operation nào cần viết file kết quả** trong protocol này (sandbox read-only tuyệt đối, không có writable exception) — dù doctrine gốc của skill gán nó cho context-investigator/constraint-advocate/architecture-critic. Đã tự sửa sang 2 họ `claude-bwrap`/`agy-bwrap`, khớp tiền lệ P05.2.
- `agy-bwrap` có giới hạn print-mode nội bộ 5 phút (không phải fgOS) — prompt quá dài/yêu cầu mở nhiều file dễ timeout; prompt gọn + inline evidence sẵn giúp tránh việc này.
