# Architecture Advisory Panel — Confinement Authority cho fgOS dispatch (RUN 2)

**Coordination id:** `aap-260909-2343-fgos-confinement-run2`
**Protocol:** `core.coordination-protocol.architecture-advisory-panel-v1`, chạy thật qua `fgos-group-thinking` gate
**Ngày:** 2026-09-09 23:43 → 2026-09-10 02:16 (Asia/Saigon)
**Evidence thô:** `.fgos/assignments/asgn_coordinator_driver_op_056` … `op_075`; request bodies tại `plans/260909-2343-confinement-authority-panel-run2/evidence/requests/`
**Panel trước (để so sánh):** `aap-260909-fgos-confinement-authority` (21:07 cùng ngày), báo cáo tại `plans/reports/architecture-advisory-panel-260909-2107-confinement-authority-fgos-dispatch-report.md`

---

## 0. Yêu cầu gốc (verbatim)

> "Cho tôi một architecture panel để thiết kế Confinement Authority cho fgOS dispatch. Hãy xác định component boundary, component parent, canonical contracts, backend abstraction, default implementation đơn giản và lộ trình mở rộng. Ghi toàn bộ discussion và quyết định cuối vào một file."

Và sau khi được báo là panel y hệt đã chạy lúc 21:07:

> "chạy lại di, sau đó so sanh sau"

Run 2 vì vậy có **hai** deliverable: (A) một quyết định kiến trúc độc lập, (B) so sánh hội tụ với run 1.

---

## 1. Đọc file này thế nào

- **Cần quyết định kiến trúc thôi** → §7 (sáu câu trả lời) + §8 (những gì còn để anh quyết).
- **Cần biết panel có thật không, làm ăn thế nào** → §2, §3.
- **Cần so sánh run 1 / run 2** → §9.
- **Cần biết chỗ nào chưa chắc** → §10.

Một câu tóm tắt thẳng: **đừng xây Confinement Authority mới từ đầu, và cũng đừng xoá cái đang có — cái đang có trả lời một mối đe doạ khác. Ship bước quan sát trước, ép buộc sau, và phần ép buộc hiện đang bị chặn vì bằng chứng gốc của nó không còn trong repo.**

---

## 2. Panel này chạy thật ra sao

16 assignment thật (`op_056`–`op_075`), mỗi cái là một subprocess thật dưới mount `bwrap --ro-bind / /`, ghi kết quả về `.fgos/assignments/`. Không vai nào do coordinator đóng thế.

| Vai | Executor thật | Provider | Assignment |
|---|---|---|---|
| lead-advisor | claude-bwrap | claude/opus | `op_056`, `op_065` |
| context-investigator | claude-bwrap | claude/sonnet | `op_057` |
| system-shaper | claude (lần 1, **sai roster**) → claude-bwrap | claude | `op_058` → `op_066` |
| alternative-shaper | claude (lần 1, **sai roster**) → agy-bwrap | claude → **gemini** | `op_059` → `op_067` |
| constraint-advocate | claude (lần 1, **sai roster**) → codex-bwrap | claude → **openai-codex** | `op_060` → `op_068`, `op_070` |
| architecture-critic | agy-bwrap | gemini | `op_061`, `op_069`, `op_075` |
| synthesizer | claude-bwrap | claude | `op_063`, `op_071`, `op_073` (fail), `op_074` |
| red-team | codex-bwrap | openai-codex | `op_064`, `op_072` |

**Ba họ provider thật** (claude / gemini / openai-codex) — nhưng xem §3, phase shaping lần đầu **không** có, và đó là lỗi của em.

---

## 3. Ba lần panel tự bắt lỗi — kể đủ, không gọt

Đây là phần đáng giá nhất của run 2, và nó không phải phần đẹp.

### 3.1 Lỗi roster (em gây ra, red-team #1 bắt)

`actors[]` nằm trong **request body**, không dính vào session. Em bỏ nó ra khỏi request resume của phase shaping. Hậu quả: cả 3 shaper âm thầm rơi về executor mặc định — **một họ provider duy nhất**, và cụ thể là `claude-reviewer`, đúng cái invocation có quyền ghi git mà doctrine của chính panel này loại trừ khỏi việc advisory. **Không có gì từ chối cả.**

Em đã kiểm tra repo ngay: không có mutation, không commit lạ, không staged file. Không thiệt hại. Nhưng claim "3 họ provider" thì sai.

Em ban đầu **quyết định không chạy lại**, lý do: chạy lại chỉ ra một mẫu khác chứ không sửa được gì. Red-team `op_064` (codex) bác thẳng:

> "A re-run would indeed produce a different sample; obtaining a genuinely independent sample **is** the correction... **This reads at least partly as protection of sunk work.**"

Nó đúng. Em mô tả cái giá của việc chạy lại rồi gọi đó là lý do không chạy. Anh chỉ đạo chạy lại. **Chạy lại cho thấy anh đúng** — xem §5.

### 3.2 Lỗi nhiễm prompt (em gây ra, red-team #2 bắt, verdict REJECT)

Khi dựng lại phase synthesis, em copy objective cũ và remap op id — nhưng **để nguyên các kết luận** của vòng đã bỏ. Red-team `op_072` đọc thẳng `assignment.json` của em và chứng minh:

- `"FO-1"` — nhãn **không tồn tại** ở bất kỳ đâu trong vòng đã sửa (`op_066`–`op_070`), chỉ có ở vòng đã bỏ.
- Phán quyết "constructive backend đã bị falsify" — do em cấp sẵn, không phải do critic `op_069` kết luận.
- Khung "rủi ro cả ba đều bỏ sót" — cũng do em cấp sẵn.

Synthesizer `op_071` sau đó trình bày một phần trong số đó như phát hiện của chính nó. Verdict: **REJECT**. Câu chốt của red-team:

> "The rerun cures provider assignment, **not provenance**."

Em chạy lại synthesis với brief sạch (`op_074`) — kết quả tốt hơn hẳn, xem §6.

### 3.3 Hai lần dừng do cơ chế, không phải do lỗi

- `op_073` **failed**: tài khoản claude chạm giới hạn phiên (`"You've hit your session limit · resets 2am"`). Nguyên văn provider được giữ trong `stdout.log` nên nguyên nhân rõ ràng, không phải đoán. Chạy lại sau 2am thành công.
- Phase explanation cuối **không chạy được**: engine từ chối vì session đã dùng hết `aggregateBounds.maxRounds: 20` — chính cái bound em khai lúc mở session, bị tiêu hết bởi hai lần rerun. Em **không nâng trần budget của chính mình để lách**. Ghi nhận đây là gap thật: phần trình bày trong §7 là của **coordinator**, có dẫn nguồn từng vai, **không phải** giọng lead-advisor. (`op_065` có tồn tại nhưng viết trên bản synthesis đã bị thay thế, nên không dùng.)

**Điểm chung của cả ba lỗi kỹ thuật trong phiên này và của chính bug em gây ra:** một thứ *trông như* đang được enforce mà thật ra thì không. C5 canh một tập rỗng; `contentCarries` inert ở 2/3 call site; `actors[]` rơi im lặng. Đây đúng là hình dạng vấn đề mà Confinement Authority sinh ra để giải.

---

## 4. Bằng chứng nền (context-investigator `op_057`)

Scout viết giả thuyết trước rồi đi tìm cách bác nó — và bác được thật.

**Hôm nay tồn tại HAI cơ chế confinement rời nhau:**

| | Cơ chế 1 — schema khai báo | Cơ chế 2 — thứ thật sự đang bảo vệ |
|---|---|---|
| Là gì | `confinement: {privateHome, isolatedSession, ownWorktree}` | argv `bwrap` gõ tay trong `.fgos/config.json` |
| Validate | **Có**, vocabulary đóng, key lạ bị refuse (`config.mjs:696,750-759`) | **Không** — validator chỉ thấy "command là string, args là mảng string" |
| Enforce | `herdr-round.mjs:209-253` (thật, có chạy) | `spawn()` thẳng |
| Ai dùng | **0 / 17 executor** | **3 / 17** (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`) |

**Các lỗ hổng scout tìm ra:**

- `cliSpawnAdapter` (`transport.mjs:294-295`) destructure `{command, args, env}` — **bỏ hoàn toàn** `confinement`. Adapter mặc định không đọc field này.
- `invocations[].confinement` **không được validate ở đâu cả** (`config.mjs:503-577`) trong khi `resolve.mjs:398` lại **ưu tiên nó** hơn field đã validate. Gõ sai → load sạch, không có tác dụng, không có tín hiệu nào.
- C5 (`permissionMode:'bypass'` bắt buộc đủ 3 flag) là code đúng đang canh **một tập rỗng**.
- `worktree.mjs` tự khai trong header của chính nó: *"isolation here is 'own branch, easy to discard,' **not a security boundary** against a hostile worker."*

Scout khai báo thẳng giới hạn: Bash/Grep/Glob không dùng được trong mount (EROFS), mọi thứ đọc bằng `Read` với absolute path; và tách bạch "đã tìm, không có" với "chưa tìm".

---

## 5. Ba đề xuất — và thí nghiệm về provider diversity

Phase 5 chạy **hai lần với brief byte-identical**, chỉ khác họ provider. Đây là thí nghiệm có kiểm soát.

| | Lần 1 — claude ×3 (roster sai) | Lần 2 — roster thật |
|---|---|---|
| system-shaper | module + attest-only | *(claude)* derive + attest, sửa provider-derivation |
| alternative-shaper | posture join + attestation ledger *(vẫn nằm trong fgOS)* | **gemini: đưa hẳn RA NGOÀI fgOS** — wrapper script OS, dispatch mù tịt về confinement |
| constraint-advocate | deny-by-default ladder + `plan()` | **codex: compile profile → bwrap launch, derive `runDir` lúc runtime** |
| "rủi ro cả ba bỏ sót" | toàn vẹn ledger (ai được ghi?) | **threat model hẹp hơn chữ "confinement"** — `--ro-bind / /` chặn *ghi*, không chặn *đọc bí mật* hay *network egress* |

Ba instance claude ra ba biến thể **không va nhau**. Ba họ ra một **xung đột thật**: tiêu chí tự-falsify của gemini là *"nếu writable bind phải thu hẹp theo từng dispatch"* — mà đề xuất của codex **làm đúng điều đó**.

**Cách phát biểu đúng** (theo nguyên văn red-team, không phải cách em nói ban đầu): *roster đã dự định mang lại một lựa chọn khác biệt về chất*. **Không** phải "đã chứng minh provider diversity có giá trị" — n=1 mỗi họ, và bị lẫn với biến role.

---

## 6. Phản biện, tự-sửa, tổng hợp

**Critic `op_069` (gemini)** bác đề xuất gemini bằng **chính tiêu chí tự-falsify của nó**: `tsk-63z` đòi thu hẹp bind về đúng `runDir` của từng dispatch; wrapper script tĩnh không làm được nếu fgOS không tính và truyền `runDir` cho nó. Vậy fgOS **buộc phải** tham gia vào boundary.

**Constraint advocate `op_070` (codex)** tự hạ hạng đề xuất của chính mình, nói rõ bằng chứng nào làm nó đổi ý — và cảnh báo: `--ro-bind / /` bảo vệ *ghi trên host*, không bảo vệ *bí mật* hay *egress*; gắn nhãn "read-only" có thể thành một claim an ninh gây hiểu lầm.

**Synthesizer `op_074` (brief sạch)** làm được ba việc mà bản bị nhiễm không làm được:

1. **Mở một primary source chưa vai nào mở.** `config.mjs:710-711` trỏ tới `permission-posture-findings.md`. Tài liệu đó cho thấy 3 boolean `confinement` **không** phải abstraction thất bại — chúng trả lời một mối đe doạ *đã đo được* mà bwrap không chạm tới: permission posture bị quyết bởi *"hai dòng fgOS không nhìn thấy, trong file fgOS không sở hữu"* (`~/.zshrc:148`, `~/.claude/settings.json:204`). **Điều này bác tiền đề nền của đề xuất gemini tại primary source**, không phải bằng sở thích.
2. **Sửa cách hiểu "0/17".** Consumer duy nhất của schema là adapter `herdr-spawn`, và **3 trong 4** executor của nó tự khai **DORMANT** trong description (`config.json:357,393,429`). Schema không được dùng vì *đường tiêu thụ gần như ngủ*, không phải vì abstraction sai.
3. **Tìm một mitigation không phủ được rủi ro của chính nó** — `watchWritesOutsideWorkspace` chỉ diff path git-dirty *bên trong* `repoRoot` và chỉ khi `cwd !== repoRoot`, nên một wrap vô hiệu ghi vào `$HOME`, `/etc` hay thư mục assignment khác thì **không ai thấy**. Không critic nào nêu.

Nó cũng **tự khai ba thứ nó tự nghĩ ra** (I1/I2/I3) và nói rõ chưa ai tấn công.

**Critic độc lập `op_075` (gemini) đánh vào composite** — theo đúng yêu cầu remediation của red-team:

- **I2 bị BÁC** (smuggling): biến một detective control thành phụ thuộc vào chính declarative control mà nó sinh ra để kiểm tra → vòng tròn. I1, I3 chấp nhận là integration hợp lệ.
- **DECISIVE:** toàn bộ nhánh enforcement (S3–S5) dựa vào probe P00.1 chạy lại được. **Script `scratch/run_probes.mjs` không có trong repo.** → theo logic của chính packet, lộ trình phải **thu về S1 + S2**.
- Claim "ngoài `dispatch/` không ai đọc `executor.confinement`" là **SAI**: `src/setup/registrations.mjs:3407` đọc nó cho doctor check.

**Ba claim decisive này em tự verify lại:** `ls scratch/run_probes.mjs` → không có; `grep confinement src/setup/registrations.mjs` → dòng 3407 có thật; `grep -c "confinement\|bwrap" test/runner/dispatch.test.mjs` → **0**.

---

## 7. QUYẾT ĐỊNH CUỐI — sáu câu trả lời

Nguồn: synthesizer `op_074`, đã qua critic độc lập `op_075`. Phần trình bày là của coordinator (xem §3.3).

**Hình dạng:** lấy **cấu trúc** của constraint-advocate (codex), ship theo **thứ tự** của system-shaper (claude): mô tả-và-chứng thực trước, ép buộc sau, thu hẹp writable bind sau nữa — và tách "thu hẹp bind" với "ngữ nghĩa từ chối" thành **hai quyết định riêng**, không gộp.

### (1) Component boundary
`src/runner/dispatch/confinement/`, sở hữu đúng bốn phép biến đổi: **validate** khai báo confinement trên một CLI invocation (đóng lỗ `config.mjs:503-577`); **compile** nó + dữ kiện dispatch (`cwd`, `repoRoot`, `runDir` cụ thể, command, args, env, adapter) thành `ConfinementPlan`; **chọn và gọi** một backend có tên; **phát ra** `ConfinementAttestation` ghi requested-vs-effected.

**Không làm:** provisioning private-HOME/session của herdr (`worker-home.mjs`, `herdr-round.mjs:209-253` giữ nguyên); chọn executor (`resolve.mjs` vẫn độc quyền); quyết policy theo role/tier (`assignment-policy.mjs`); nuốt worktree isolation; đụng vào contract CLI `decide`/`execute`.

### (2) Component parent
`src/runner/dispatch/`, ngang hàng `resolve.mjs`/`transport.mjs`. **Hai call site** — và đây là đóng góp riêng của synthesizer, không shaper nào có cả hai:

- **Derive + attest** tại `resolve.mjs:446`, cạnh object `governance` có sẵn (tiền lệ thật, đã ship).
- **Compile + enforce** tại seam chung trước adapter trong `cli.mjs` (`:672` có argv, `:736-738` có `runDir`, `:743-746` cả hai tới adapter).

Lý do buộc phải tách: **`runDir` chưa tồn tại tại `resolveExecutorConfig`** (`cli.mjs:300` so với `:339`). Nên thiết kế một-trạm **không bao giờ** đóng được `tsk-63z`. **Không** đặt per-adapter — đó đúng là cái bẫy `cli-spawn` đã sập.

### (3) Canonical contracts
**Bước 1 không thêm field config nào.** `CONFINEMENT_FLAGS` refuse key lạ theo tên (`config.mjs:750-759`), nên thêm key là đổi contract validation — mà có 0 declarer để migrate. **Derive trước, declare sau.** Giữ nguyên 3 boolean làm công tắc cơ chế herdr; vocabulary `kind`/profile ở mức *ý định* cho OS confinement là thứ **thêm vào**, không thay thế.

### (4) Backend abstraction
Registry có tên, hình dạng như port `EXECUTOR_ADAPTERS` (`transport.mjs:691-695`), mọc **hai giai đoạn**:

```ts
// Bước 1 — describe-only. CỐ Ý chưa có apply/prepare.
interface ConfinementDescriber { id: string;
  detect(command, args, adapter, declared): boolean;
  describe(command, args): { kind, backend, innerCommand, writableExceptions }; }

// Bước 2+ — interface ép buộc, thêm sau
interface ConfinementBackend extends ConfinementDescriber {
  supports(req): Support | Unsupported;
  prepare(req): Promise<ConfinementPlan>;
  verify(plan): Promise<ConfinementAttestation>; }
```

Describer bước 1: `bwrap` (detect `command === 'bwrap'`, tự đọc argv của mình), `worker-home` (detect `adapter === 'herdr-spawn'`), `none`. **Chọn backend bằng allowlist tường minh**, không bao giờ suy "command là bwrap thì chắc an toàn". Để `prepare`/`verify` ngoài registry ở bước 1 nghĩa là bước 1 **không thể** trôi dạt thành trách nhiệm enforcement — method không tồn tại.

### (5) Default implementation
`deriveConfinement` + 3 describer, ~120 dòng, cộng derivation ở `resolve.mjs:446`, một field event, và **một dòng** ở `result-ladder.mjs:57` khôi phục `headBefore` (`headAfter` đã sống sót dưới dạng `verifiedSha`, nên đây là hoàn thiện một bất đối xứng, không phải khái niệm mới).

Verify bằng test cơ học đúng kiểu file test đã dùng: pin posture cho cả 17 executor (`os-sandbox` đúng 3, `none` 14 còn lại); pin `writableExceptions` — biến đường dẫn tuyệt đối machine-specific từ literal vô hình thành **fact được assert**; và một **falsifier** `mismatches === ['os-sandbox-undeclared']` cho đúng 3 cái đó, đỏ ngay khi có executor confined thứ tư quên khai.

> Hiện `test/runner/dispatch.test.mjs` có **0** test nhắc `confinement` hoặc `bwrap` (em grep, xác nhận). Nên golden test này là bước đầu thật sự, không phải trang trí.

### (6) Lộ trình mở rộng

| # | Bước | Đảo ngược |
|---|---|---|
| **S1** | Derive + describe + attest `'described'`. **Không** phải security control. | **Đảo được.** Xoá module, bỏ field. |
| **S2** | Đưa `innerCommand` vào `deriveProviderFamily`/`isCrossProvider`, rồi gỡ `allowCrossProvider:true` khỏi **riêng** `claude-bwrap`. | Đảo được, đổi hành vi trên 3 executor. Bước duy nhất **gỡ bỏ** một waiver an ninh. |
| **S3** | **Owner + probe harness.** Chỉ định maintainer; dựng probe lặp lại được; đăng ký check vào `fgos doctor`. | Đảo được. **Điều kiện chặn cho S4+.** |
| **S4** | Thêm interface ép buộc + gate chung trước adapter. Migrate 3 bwrap executor. | Đảo được khi tập declarer còn nhỏ. **Phụ thuộc quyết định giá trị của anh.** |
| **S5** | Thu hẹp writable bind về đúng `runDir`; gỡ path tuyệt đối hardcode. | **MỘT CHIỀU.** |
| **S6** | Cho `cli-spawn` tôn trọng flag đã khai (`transport.mjs:294-295`). | Với 0 declarer đây là no-op. Critic nói nên làm sớm vì miễn phí; synthesizer không đồng ý vội — **bất đồng còn mở (D2)**. |
| **S7** | Backend khác (macOS, container, remote). Cờ CLI `--sandbox` **không đủ tư cách** — đã bị falsify sống cho cả Claude lẫn Agy. | Đảo được từng backend. |
| **S8** | Posture áp từ trên: resolver trên executor suy ra mức tối thiểu bắt buộc. | **MỘT CHIỀU.** Cố ý để cuối. |

> **RÀNG BUỘC LỚN NHẤT, do critic độc lập tìm ra:** S3–S5 dựa vào probe P00.1 chạy lại được. **`scratch/run_probes.mjs` không có trong repo** (em xác nhận). Bằng chứng gốc là ephemeral và chưa từng được commit. Nên **lộ trình hiện thu về S1 + S2**; phần enforcement bị chặn cho tới khi có người **viết và commit** một proof confinement mới. Đây là vấn đề bằng chứng, không phải vấn đề thiết kế.

**Việc nhỏ nhất đáng làm tuần này:** một dòng sửa `result-ladder.mjs:57` + test của nó.

---

## 8. Những gì vẫn là quyết định của anh

Panel **không** giải quyết mấy cái này. Chúng không phải disclaimer đóng bài.

1. **D1 — Quan sát trước hay ép buộc trước?** (giá trị, bằng chứng không phân xử được). Bước 1 chặn **0** cuộc tấn công, tự nó thừa nhận. Ép buộc ngay thì với 0/17 profile sẽ từ chối cả những route bwrap đang tốt.
2. **D2 — S6 có nên làm sớm không?** Critic: đang là no-op, làm sớm miễn phí. Synthesizer: không nên vội ship code enforcement chưa được tập dượt. **Chưa ngã ngũ.**
3. **D3 — Trên host không hỗ trợ, `required` từ chối hay xuống cấp-và-báo?** Đây quyết định fgOS chạy được ở đâu.
4. **D4 — Threat model có phải chỉ là "ghi trên host" không?** (factual, còn mở). `--ro-bind / /` **không** chặn đọc bí mật hay network egress. Một attestation ghi "read-only" có thể là claim gây hiểu lầm. Cần chốt trước khi gắn bất kỳ nhãn nào.
5. **`writableExceptions` neo ở đâu — project đích hay assignment store của chính fgOS?** Anh đã chọn để mở. Nó quyết định S5 và đụng thẳng vào D-ADR0035 (fgOS phục vụ project khác). Đề xuất codex đưa ra một câu trả lời thứ ba: **derive lúc runtime**, không declare.

---

## 9. So sánh RUN 1 (21:07) ↔ RUN 2

### Hội tụ (mạnh)
Hai panel độc lập, prompt khác nhau, cùng kết luận **chẩn đoán**: Confinement Authority *đã tồn tại một nửa*; 0 executor dùng nó; những executor thật sự bị nhốt thì bị nhốt bằng argv mà schema không nhìn thấy; `cliSpawnAdapter` bỏ qua field; `worktree.mjs` không phải security boundary. Run 2 tới đó bằng falsification, từ một prompt **không** chỉ sẵn chỗ để nhìn.

### Phân kỳ (và vì sao)

| | Run 1 (A′) | Run 2 |
|---|---|---|
| Field `confinement` cũ | **Dùng lại**, mở rộng thêm `filesystem` | **Giữ nguyên, không mở rộng ở bước 1.** Nó trả lời *mối đe doạ khác* (permission posture), theo primary source `permission-posture-findings.md` |
| Render argv từ `writable[]` | Bước "vàng" của lộ trình | **BỊ FALSIFY.** `codex-bwrap` cần `--tmpfs`, re-bind `auth.json`, `--setenv CODEX_HOME` — khác về **loại**, không phải mức độ |
| Số trạm | Một (`resolveExecutorCommand`) | **Hai.** `runDir` chưa tồn tại lúc resolve → một trạm không bao giờ đóng được `tsk-63z` |
| Lộ trình | Xanh → Vàng → Đỏ | **Thu về S1+S2** vì probe gốc đã mất |

**Điểm quan trọng nhất của so sánh: run 1 không sai lúc nó chạy.** Lúc 21:07 chỉ có 2 bwrap executor cùng dạng công thức. `codex-bwrap` — với tmpfs và env injection — được thêm **sau đó** (commit `9ddf5901`). Repo đổi giữa hai lần chạy, và cái đổi đó làm hết hạn một phần lộ trình của run 1.

**Bài học dùng được:** kết luận của panel có **hạn sử dụng**, gắn với evidence base bên dưới nó. Chạy lại khi nền đã dịch chuyển là đúng — đúng như anh đã làm.

### Về provider diversity
Run 1 co về 2 họ (codex-readonly chết thật). Run 2 có 3 họ, và thí nghiệm brief-giống-hệt cho thấy roster **có** mang lại một lựa chọn khác biệt về chất (gemini đề xuất đưa hẳn ra ngoài fgOS — lớp giải pháp không instance claude nào nghĩ tới). Nhưng theo red-team: đây là **quan sát có giới hạn**, không phải chứng minh nhân quả — n=1 mỗi họ, lẫn với biến role.

---

## 10. Đã verify / chưa verify

**Đã verify trực tiếp bởi coordinator (em tự chạy lệnh):**
- `scratch/run_probes.mjs` **không tồn tại** → nhánh enforcement bị chặn.
- `src/setup/registrations.mjs:3407` **có** đọc `executor.confinement`.
- `test/runner/dispatch.test.mjs` có **0** match `confinement|bwrap`.
- Repo sạch sau toàn bộ phiên: không mutation, không commit lạ.

**Đã verify độc lập bởi nhiều vai, tại source:** hai cơ chế confinement; 0/17 adoption; `cliSpawnAdapter` bỏ field; `invocations[].confinement` không validate nhưng được ưu tiên; thứ tự `runDir` (`cli.mjs:300` vs `:339`); `codex-bwrap` bespoke; 3/4 executor herdr tự khai DORMANT.

**CHƯA verify — nói thẳng:**
- **Mọi vai đều không có Bash/Grep/Glob** trong mount (EROFS). Mọi thứ đọc bằng `Read` với absolute path. Đủ cho claim khẳng định có dẫn chứng; **không đủ** cho claim phủ định kiểu "không tồn tại ở đâu khác". Critic cuối có chạy được một vài grep và đã **bác** đúng một claim phủ định như vậy (`registrations.mjs`).
- Chưa ai chạy probe thật để chứng minh bind chỉ-`runDir` không làm hỏng đường báo cáo.
- Chưa có owner thật cho việc bảo trì probe/backend. `fgos doctor` là chỗ máy móc phát hiện, không phải quyền sở hữu.
- Phase explanation cuối **không chạy** (hết `maxRounds`) — §3.3.

---

## 11. Câu hỏi còn treo

1. Anh chốt D1–D4 và câu hỏi `writableExceptions` ở §8 thế nào? S4+ không đi tiếp được nếu D1 và D3 còn mở.
2. Có nên mở work item riêng cho việc **viết lại và commit** proof confinement (thay `scratch/run_probes.mjs` đã mất) không? Đó hiện là thứ duy nhất chặn S3–S5.
3. Bug `actors[]` rơi im lặng (§3.1) có đáng thành work item không? Nó là fail-open thật trong chính lớp dispatch — cùng họ với vấn đề panel này đang thiết kế để giải.
4. Có muốn em mở session mới để chạy nốt phase explanation (lead advisor, tiếng Việt, hướng người đọc) không? Nội dung quyết định đã đủ; đó là lớp trình bày.
