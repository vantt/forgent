# Spike S6: chi phí gọi Rust để resolve writer identity từ pre-commit hook

Ngày đo: 2026-10-15, máy Linux 16 core, load ~1.1, Node v24.18.0. Trigger: T4 của hội đồng kiến trúc (crate `fgos-session-identity` bằng Rust làm nguồn identity duy nhất, Node chỉ còn facade mỏng).

## 1. Câu hỏi và cách trả lời

Chuyển `resolveWriterIdentity()` (`src/util/session-identity.mjs`) sang Rust có làm các caller nóng chậm quá mức không, trước hết là `.githooks/pre-commit`?

Chưa có code identity bằng Rust, nên em đo proxy quyết định tính khả thi: **chi phí cố định để đi từ caller sang Rust** (exec Rust host chạy một verb native gần như không làm gì), so với chi phí Node in-process hiện tại. Một bản Rust thật đọc env, đọc `sessions.json` và đi 3 bước trong `/proc`, tức chỉ vài micro giây, nên chi phí exec chiếm gần hết.

Binary đã đo:

- Release đang active: `/home/vantt/.local/state/fgos/releases/sha256:1c4c84a01ccd62b4fb686f5b872a85078e696ea4a0d6162c1b63a4d17a64f0ca/bin/fgos`, `packageVersion 0.2.0`, `gitCommit 783ad0610` (= HEAD lúc đo), activate lúc 2026-10-15T06:17:43Z bởi fgctl 0.2.0.
- Chuỗi shim: `~/.local/bin/fgos` (sh launcher, tìm `.fgos/installation` đi ngược lên) → `.fgos/installation/bin/fgos` (sh + sed đọc `activation.json`) → binary của release.
- `version` là route native (`command-routes.json`: `route_kind: native`, `distribution.build.show`); không rơi xuống legacy-node.

## 2. Phương pháp

Script nằm trong `/tmp/claude-1000/-home-vantt-projects-forgentX/bbe6155f-ff18-4e69-ad42-40abac4a35bf/scratchpad/s6/`:

- `spawn-bench.mjs`: thời gian của toàn process (`spawnSync`), warm N=30 sau 3 lần warmup. Với "cold", trước **mỗi** lần chạy em đẩy page cache của binary đích ra bằng `posix_fadvise(DONTNEED)`, N=20. Không có root nên không drop được cache toàn hệ thống. Binary `node` đang được các process khác map nên khó đẩy hẳn ra khỏi cache.
- `inproc-probe.mjs` / `inproc-drive.mjs`: 20 process mới. Mỗi process đo thời gian import, lần gọi đầu tiên, 200 lần gọi lặp, và `invokeHost(['version'])` (lần đầu + 20 lần lặp).
- `facade-probe.mjs`: facade gọn nhất, tức `execFileSync(<release bin>, ['version'])` thẳng từ Node với `FGOS_RUST_HOST_RECURSION_GUARD=1`, 30 lần, chạy 3 vòng.
- `hook-bench.mjs`: chạy **đúng file** `.githooks/pre-commit` bằng `node` trong một repo nháp ở `s6/hookrepo` (bản copy `src/`, `.githooks/`, `package.json`, `git init`, có file đã stage). Như vậy hook chạy "at home" và lấy lock trong `.fgos` của repo nháp, không đụng `.fgos` của repo thật, không tạo commit thật. N=25.

Đơn vị là ms, ghi theo dạng min / median / p95.

## 3. Số liệu thô

### 3.1 Chi phí hiện tại trong Node (in-process)

| Phép đo | min | median | p95 |
|---|---|---|---|
| import `session-identity.mjs` (dynamic import đầu tiên của process, gồm cả chi phí khởi động ESM loader) | 3.87 | 4.00 | 4.20 |
| import `session-identity.mjs` theo đúng thứ tự import của hook (sau `main-checkout-lock.mjs`) | 1.35 | 1.76 | 5.84 |
| import `main-checkout-lock.mjs` (trong hook) | 3.00 | 3.26 | 5.35 |
| lần gọi đầu, có env agent (`CLAUDE_CODE_SESSION_ID`, đọc `sessions.json`) | 0.19 | 0.20 | 0.22 |
| lần gọi đầu, terminal trần (đi 3 bước trong `/proc`) | 0.32 | 0.33 | 0.35 |
| bước identity trong hook (lần gọi đầu) | 0.17 | 0.20 | 0.32 |
| các lần gọi lặp, env agent (đọc lại `sessions.json` mỗi lần) | — | 0.007 | 0.014 |
| các lần gọi lặp, terminal trần (lấy từ cache `ownPidIdentity`) | — | 0.001 | 0.002 |

### 3.2 Spawn process (toàn bộ, không đi qua shell)

| Lệnh | cold min/med/p95 | warm min/med/p95 |
|---|---|---|
| `/bin/true` (sàn exec) | — | 0.96 / 1.17 / 1.61 |
| `node -e ''` | 21.83 / 25.23 / 28.85 | 19.89 / 22.10 / 24.17 |
| `node` import + resolve 1 lần (env agent) | 25.73 / 27.65 / 29.89 | 23.41 / 26.76 / 29.35 |
| `node` import + resolve 1 lần (pid walk) | 25.15 / 26.89 / 29.83 | 24.23 / 26.51 / 28.04 |
| Rust trực tiếp, verb không tồn tại (sàn route, exit 4) | 1.66 / 1.81 / 2.05 | 1.27 / 1.53 / 1.69 |
| Rust trực tiếp `version` | 4.18 / 4.46 / 4.73 | 2.65 / 3.39 / 3.74 |
| Rust trực tiếp `version`, `GUARD=1` | 4.04 / 4.24 / 4.46 | 2.83 / 3.32 / 3.71 |
| Rust trực tiếp `version --dir <root>` (argv như invokeHost) | 4.14 / 4.43 / 4.95 | 2.58 / 3.26 / 3.74 |
| workspace shim `version` | 8.37 / 8.88 / 9.37 | 7.33 / 7.99 / 8.49 |
| global shim `~/.local/bin/fgos version` | 8.86 / 9.53 / 11.13 | 7.92 / 8.41 / 8.91 |
| global shim `version`, `GUARD=1` | 8.72 / 9.51 / 10.21 | 7.86 / 8.41 / 8.93 |

Khoảng 5 ms là phí của shim (hai lớp sh + sed), còn `GUARD=1` không làm đổi số đo. `version` tốn hơn sàn route khoảng 1.8 ms vì phải đăng ký provider và dựng tokio runtime; một verb identity native sẽ phải trả cùng phần phí khởi động đó, trừ khi được gọi sớm hơn bước này.

### 3.3 Facade từ Node gọi sang Rust

| Đường gọi | lần đầu | các lần sau min/med/p95 |
|---|---|---|
| `execFileSync(releaseBin, ['version'])` (facade gọn nhất, 3 vòng) | 4.09–4.77 | 2.76–2.89 / 3.30–3.37 / 3.68–3.95 |
| `execFileSync(releaseBin, ['__nope'])` (sàn) | — | ~1.2 / 1.35–1.48 / 1.54–1.67 |
| `execFileSync('/bin/true')` | — | ~0.8 / 0.81–0.96 / 1.06–1.24 |
| import `src/util/host-bin.mjs` (một lần mỗi process) | 17.42 / 17.92 / 18.48 | — |
| `resolveHostBin()` (parse `manifest.json` 242 KB **mỗi lần gọi**) | 4.24 / 4.62 / 5.36 | med 2.97 |
| `invokeHost(['version'])` | 8.82 / 9.62 / 10.38 | 8.62 / 8.87 / 10.32 |

### 3.4 Toàn bộ pre-commit hook (repo nháp, `node .githooks/pre-commit`, N=25)

| Biến thể | min / med / p95 |
|---|---|
| at home, env agent (bước identity chạy, lấy lock) | 42.67 / 45.92 / 55.33 |
| at home, terminal trần (identity đi pid walk) | 41.76 / 44.38 / 48.78 |
| away from home (không có bước identity hay lock) | 30.58 / 34.53 / 38.15 |
| at home + `apps/fgos/Cargo.toml`, không stage report (không gọi Rust) | 48.63 / 58.19 / 78.83 |
| như dòng trên + stage `plans/reports/*.md` → convention check gọi Rust host qua `invokeHost`, `GUARD=1` | 70.29 / 76.00 / 94.10 |

Bản thân hook đã có một lần gọi Node→Rust (convention check, `src/convention/convention-client.mjs` → `invokeHost`). Lần gọi đó tốn khoảng **+18 ms median**, và phần lớn nằm ở việc import `host-bin.mjs`, không nằm ở exec.

## 4. Mỗi commit và mỗi round gọi identity bao nhiêu lần

- **Mỗi commit:** hook gọi `resolveIdentity()` **1 lần**, chỉ khi chạy at home và không có `HOLDER_PID_ENV_VAR` (đường merge root→main mượn pid của process cha nên bỏ qua bước này). Bước identity hiện chiếm ~0.2 ms gọi + ~1.4–1.8 ms import, tức chưa tới 5% của ~45 ms median cho cả hook.
- **Mỗi round dispatch:** các call site trên đường nóng gồm `transport.mjs:535` (1 lần cho mỗi worker spawn), `confinement/authority.mjs:1402` (1 lần cho mỗi request confined), `dispatch/cli.mjs:1208` (đường inline), `runtime-coordination.mjs:228` (claim), `events.mjs:482` (**mỗi** `appendEvent`, nằm **bên trong** `events.lock`), và `store.mjs` (161/369/451/486/708/1141/1484/1586/1623, mỗi lần ghi state). Ngoài ra `bin/fgos.mjs` gọi 5 lần khi nhả lock. Em ước tính **2–6 lần resolve trong process runner cho mỗi round**, cộng thêm **1 lần trong hook** cho commit mà runner tạo sau một round pass. Mỗi lệnh CLI `fgos` mà worker gọi là một process riêng, có 1 + (số event ghi) lần resolve. Đây là ước tính từ code tĩnh; `.fgos/assignments/<unitRunId>/` không ghi event vào `.fgos/events` nên em không đếm được bằng dữ liệu chạy thật.

## 5. Overhead dự kiến

Lấy số warm median, cold là lần đầu sau khi page cache bị đẩy ra. Mốc so sánh là hook hiện tại ~45 ms median, ~55 ms p95.

| Phương án | Thêm vào mỗi commit (hook) | Thêm vào mỗi round (k = 2–6 lần resolve) | Thời gian giữ `events.lock` mỗi lần append |
|---|---|---|---|
| (a1) facade exec Rust **mỗi lần gọi**, đi qua `invokeHost` hiện tại | +18 ms import + ~9 ms gọi ≈ **+27 ms (+60%)** | 18 + 9k ≈ 36–72 ms | 0.007 → ~9 ms |
| (a2) facade exec **mỗi lần gọi**, `execFileSync` gọn vào release bin | **+3.3 ms warm / +4.5 ms cold (+7–10%)** | 6.6–20 ms | 0.007 → ~3.3 ms (tăng ~470 lần) |
| (b) gọi **1 lần mỗi process** rồi cache, exec gọn | hook vốn chỉ gọi 1 lần nên vẫn **+3.3 / +4.5 ms**. Nếu bỏ được import `session-identity.mjs` thì còn ~+2 ms | **+3.3 ms một lần** cho mỗi process | ~0 (resolve trước khi lấy lock) |
| (c) Rust host gọi crate in-process (không qua ranh giới process) | 0 với caller Rust. Hook hiện là Node nên chỉ hưởng được (c) khi hook thành verb Rust native: 1 exec ~3–8 ms **thay cho** ~22 ms khởi động Node | ~µs | ~µs |

Diễn giải:

- So với ngân sách thời gian, (a) không phải vấn đề với hook. Vấn đề là gọi bên trong `events.lock`: `appendEventCore` resolve identity khi đang giữ lock, nên exec mỗi lần gọi làm thời gian giữ lock dài hơn 2–3 bậc độ lớn. Khi nhiều writer tranh lock, độ trễ cộng dồn theo số event của burst.
- Đường `invokeHost` hiện tại không hợp làm facade: import `host-bin.mjs` mất 18 ms, `resolveHostBin()` parse lại manifest 242 KB ở mỗi lần gọi (~3 ms).
- Shim tốn thêm ~5 ms mỗi lần, nên facade phải exec thẳng release bin lấy từ activation, không đi qua shim.

## 6. Ngân sách

- **Không có ngân sách thời gian tường minh cho pre-commit hook** (không có timeout trong hook và git cũng không đặt). Em lấy số đo hook ~45 ms median / ~55 ms p95 (at home, env agent) làm mốc.
- Các hằng số tường minh liên quan:
  - `PPID_TIMEOUT_MS = 200`: ngân sách cho mỗi bước `ps` trong identity. Comment ghi rõ lý do: identity chạy trong lúc giữ `events.lock`.
  - `EVENTS_LOCK_TIMEOUT_MS = 5000`: thời gian chờ tối đa của bên đợi lock, override được bằng `FGOS_EVENTS_LOCK_TIMEOUT_MS`.
  - `HOST_TIMEOUT_MS = 5000` trong `invokeHost`.
  - `HOOK_TTL_MS = 20000`: thời gian giữ main-checkout lock. Đây là TTL, không phải ngân sách độ trễ.
- `FGOS_RUST_HOST_RECURSION_GUARD` chỉ được kiểm tra trên route `legacy-cli`. Verb native chạy bình thường khi `GUARD=1` (đã kiểm: `version` exit 0); verb legacy bị từ chối (đã kiểm: `list` exit 1, "recursion guard triggered"). Khi `fgos` sinh ra `git commit`, process con thừa hưởng `GUARD=1`, nên **verb identity bắt buộc phải là native**.

## 7. Kết luận cho trigger T4

**CONDITIONAL PASS.** Chi phí cố định khi đi sang Rust từ Node là ~3.3 ms warm (p95 ≤ 3.95 ms) và ~4.1–4.8 ms cho lần đầu khi cache lạnh. Mức này chỉ cộng thêm 7–10% vào một hook ~45 ms. T4 đạt nếu thỏa **đủ cả năm điều kiện**:

1. Verb identity là route **native** trong `command-routes.json` (chạy được khi `FGOS_RUST_HOST_RECURSION_GUARD=1`).
2. Facade Node **exec thẳng release binary**, lấy đường dẫn từ activation/manifest **một lần mỗi process**. Không đi qua shim, không parse manifest mỗi lần gọi, và không dùng `src/util/host-bin.mjs` ở dạng hiện tại trong hook (riêng import đã mất 18 ms).
3. **Không bao giờ exec bên trong `events.lock`**: resolve một lần mỗi process rồi cache (phương án b), trước khi lấy lock.
4. Ngân sách đo lại khi đã có crate thật: hook thêm **≤ 5 ms p95 warm và ≤ 6 ms cho lần đầu khi cache lạnh** so với baseline Node. Số hiện tại là 3.95 / 4.77 ms.
5. Giữ nguyên ngữ nghĩa identity khi đi qua ranh giới process. Process Rust con nằm sâu hơn hook Node **một bậc**, nên khi pid walk 3 bước tính từ pid của chính nó, nó sẽ ra **một ancestor khác** với resolver Node hiện tại, làm hỏng việc self-recognition của main-checkout lock. Facade phải truyền pid của caller (ví dụ `--pid <process.pid>`), hoặc Rust phải bắt đầu walk từ ppid của chính nó.

T4 **FAIL** với phương án (a1), tức gọi qua `invokeHost` cho mỗi lần resolve: thêm ~27 ms (+60%) vào mỗi commit và kéo dài thời gian giữ `events.lock` ~9 ms cho mỗi event.

## 8. Câu hỏi còn mở

- Cache kết quả một lần mỗi process (b) đổi ngữ nghĩa của đường env: hiện mỗi lần gọi đều đọc lại `sessions.json`, nên `source` có thể chuyển từ ENV sang REGISTRY khi session đăng ký giữa chừng. Có chấp nhận cache cả `source`, hay chỉ cache `id` rồi để Node xác nhận registry?
- Có nên đo luôn phương án viết lại hook thành verb Rust native (`fgos hook pre-commit`)? Một exec ~3–8 ms thay cho ~22 ms khởi động Node, khi đó hook nhanh hơn hiện tại. Tuy vậy, hook hiện cố ý chỉ dùng Node built-in để không phụ thuộc gì, và phải vẫn chạy được khi chưa có activation.
- Khi repo chưa có activation (clone mới, CI, repo khách chỉ có hook) thì facade làm gì: fallback về resolver Node (lại thành hai nguồn identity) hay fail-closed?
- Số lần resolve mỗi round đang là ước tính từ code tĩnh. Nếu cần con số chính xác thì phải instrument tạm một round thật, việc này nằm ngoài phạm vi spike chỉ-đo.
- "Cold activation" ở đây mới là page cache của binary bị đẩy ra. Lần chạy đầu ngay sau khi `fgctl` activate một release mới (binary chưa từng được đọc, cộng thêm shim) chưa đo riêng, nhưng dự kiến nằm gần dòng cold của bảng 3.2.
