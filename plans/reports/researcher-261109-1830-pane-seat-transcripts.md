# Transcript của seat chạy trong pane herdr: có mất không?

Ngày 2026-11-09. Chỉ đọc, không sửa gì dưới .fgos hay agent home.
Ký hiệu: [CHỨNG CỨ] = đã đọc/chạy thấy; [SUY LUẬN] = suy ra, chưa tận mắt.

## Kết luận ngắn

1. Với pi/omp (deepseek, gemini), CLI CÓ ghi session của nó (cả hai in dòng resume ở cuối màn hình). File session nằm
   trong private home của attempt (suy luận), và finalize-home XOÁ nguyên thư mục home đó, không chép gì ra trước.
   Hiện không còn file nào. fgOS không "bỏ quên link": nó xoá.
2. stdout.log của seat pane là ảnh chụp màn hình pane lúc settle (chỉ phần visible), không phải log phiên. Đó là
   thiết kế hiện tại ("evidence cho người đọc"), nhưng là khoảng trống nếu cần transcript.
3. Seat headless (glm, mode direct) có transcript trong stdout.log chỉ vì fgOS gọi pi với `--mode json`; CLI tự in
   JSONL ra stdout. Thư mục home của nó cũng bị xoá giống pane.
4. Claude pane: không tìm thấy session ở đâu cả; không xác định được vì sao (xem mục 1).
5. Cách cứu hiện có sau sự kiện: chỉ có `outbox/report-*.md` + `result-*.json` do agent tự viết, và run record.
   Không có đường lấy lại transcript.

## 1. Từng họ executor

Cấu hình: core/config-standard/runner.yaml (claude-herdr-bwrap :41, pi-herdr :106, omp-herdr :179, pi-cli-bwrap :58/:149).

| Seat | mode trong envelope.json | cờ gọi CLI | CLI ghi session? | Còn tồn tại? |
|---|---|---|---|---|
| claude (ecaa6381, pane) | terminal | `--effort medium --model sonnet --add-dir <runDir>` (TUI) | Không xác định | Không thấy |
| gemini omp (4be9d1ba, pane) | terminal | `omp --model gemini-3.8-flash-high --tools ... --auto-approve` | Có: màn hình cuối in "Resume this session with omp --resume 01a1bfcc-d122-71c9-9cda-dd421cb900e6" | Không. `find` dưới ~/.omp ~/.pi theo id: rỗng |
| deepseek pi (4d8d34ca, pane) | terminal | `pi --model thehive/deepseek... --tools ... --approve` | Có: "To resume this session: pi --session 01a1bfcc-cfe0-7666-97f2-9e3921be5f1b" | Không (find rỗng) |
| glm pi-cli-bwrap (b9ad7c8a, headless) | direct | `pi ... --mode json --approve -p <prompt>` | Có: dòng đầu stdout là `{"type":"session","id":"01a1bfcc-d1d3-..."}` | stdout.log 1.25 MB giữ trọn; file session riêng thì không |

Các seat 70cd218a cùng mẫu [CHỨNG CỨ]: assumptions (omp, pane, stdout.log 7.6 KB, in "omp --resume 01a1bfe3-8ec8-..."),
ship-maintain (pi, pane, 3.6 KB, "pi --session 01a1bfe3-8eaf-..."), feedback-loops (pi, direct, 3.5 MB JSONL). Id session của hai seat
pane không còn file nào dưới ~/.pi, ~/.omp.

Session store thật không có dấu vết của các run này [CHỨNG CỨ]:
- ~/.claude/projects/-home-vantt-projects-forgent/: file mới trong 17:12-18:10 chỉ là d1289d42... và ec3510cc... (phiên của người điều phối, grep unitRunId ra phiên điều phối, không phải seat).
- ~/.pi/agent/sessions, ~/.omp/agent/sessions: bản ghi mới nhất cũ hơn nhiều (Oct 8, Oct 19). ~/.omp/profiles/*/agent/sessions
  và ~/.pi/accounts/*/sessions: không có gì ngày 2026-11-09.
- /tmp/fgos-confinement hiện rỗng (cuối 18:08).

Vì sao nằm trong private home (suy luận có chứng cứ gián tiếp):
- src/runner/dispatch/confinement/drivers/bwrap.mjs:672-674: `resolvedEnv[homeEnv] = privateHome.executionTarget.path`, với
  homeEnv = `credentialStore.homeEnv` = `PI_CODING_AGENT_DIR` cho pi/omp (runner.yaml :111-112, :186-187). Tức thư mục dữ liệu agent của pi/omp
  trỏ vào `/tmp/fgos-confinement/<dispatchId>/home`.
- launcher.sh: `--tmpfs ~/.pi/agent --tmpfs ~/.omp/agent` (và các account dir) che store thật; phần còn lại của / là `--ro-bind`.
  Nên pi/omp không thể ghi session vào store thật; chỉ còn private home ghi được.
- pi/omp lưu session dưới `<agentDir>/sessions` (cấu trúc hiện thấy ở ~/.pi/agent/sessions và ~/.omp/agent/sessions). Chưa mở thấy tận mắt một
  private home đang sống để xác nhận đường dẫn, vì sideFile (nơi có env thật) và home đều đã bị xoá. [SUY LUẬN]

Claude [SUY LUẬN, yếu]: runner.yaml khai `claude-herdr-bwrap` không có `credentialStore`, và launcher.sh không `--tmpfs ~/.claude`; env trong
envelope HOME=/home/vantt. Dưới `--ro-bind / /`, ~/.claude không ghi được, nên có khả năng claude không lưu được session; tôi không thể phân biệt
"không ghi" với "ghi vào private home qua env nằm trong sideFile đã xoá". Cần một run claude mới, còn sống, để đo.

## 2. Các bước settle làm gì với vị trí đó

closed.json pane: settle-attempt, finalize-home, cleanup-trust, release-slot (headless chỉ settle-attempt, finalize-home).

- finalize-home: src/run-supervisor/steps/finalize-home.mjs:8-16 gọi `finalizeAttemptHome`
  (src/runner/dispatch/confinement/authority.mjs:~950-985). Hàm này duyệt descriptor trong protected/confinement-finalization/*.json,
  ghi lại credential gia hạn (`writeBackRenewedCredential`), rồi `removeAttemptHome(target, dispatchId)` XOÁ cả thư mục home. Không có bước chép/giữ nội dung.
  Chỉ giữ home khi write-back credential lỗi (state `credential-home-kept/held`). Bằng chứng: confinement-finalization/*.json của cả bốn run có
  `"cleanupState":"cleaned"`, `pathRef` /tmp/fgos-confinement/disp_.../home, và steps/finalize-home.json `{"homes":1}`.
  Cùng bước đó xoá luôn `protected/attempt-secrets.json` (finalize-home.mjs:13), nên env thật của seat cũng mất.
  Comment đầu cleanup.mjs: "An attempt home is removed only by adopt's finalize-home step".
- cleanup-trust: chỉ gỡ mục trust của thư mục làm việc khỏi trust store ("trust":"none-written" trong cả hai run đã xem). Không đụng session.
- settle-attempt: ghi kết quả, đọc outbox, và (terminal) đọc màn hình pane (xem mục 3). Không chép transcript.
- release-slot: đóng pane (disposition close). Sau đó không còn scrollback.

Kết luận: transcript (nếu có) bị fgOS xoá; không bị bỏ quên, không bị chép.

## 3. Vì sao stdout.log khác nhau

- Pane (mode terminal): capture của gate (`protected/capture/<cmd>/stdout.log`) RỖNG (receipt.json captureDigests = sha256 của chuỗi rỗng, e3b0c442...).
  TUI vẽ trực tiếp lên tty của pane, không qua stdout capture. src/run-supervisor/steps/settle-attempt.mjs:202:
  `const stdoutText = readTail(capture.stdout) || screenText;` với `screenText` từ `paneScreenOf` (settle-attempt.mjs:68-83), gọi
  `tc.read({ source: 'visible' })`, tức chỉ màn hình đang hiện. settlement.mjs:728 ghi chuỗi này vào `<runDir>/stdout.log`.
  Comment ngay tại :200: "the stdout of a pane that writes no capture". Lúc settle, agent đã thoát nên màn hình là prompt shell + dòng
  resume của CLI + dòng "launcher.sh" (đúng 497 B claude, 4 KB deepseek, 20 KB gemini vì omp còn in lại đoạn cuối tin nhắn).
  Nó không phải log phiên.
- Headless (mode direct): fgOS tự thêm `--mode json` (envelope args của b9ad7c8a), CLI in JSONL ra stdout, capture ghi lại, settle copy vào stdout.log.
  Đó là tính năng của CLI, không phải cơ chế fgOS chụp transcript.
- Đánh giá: theo thiết kế (stdout.log = bằng chứng cho người), nhưng không có chỗ nào trong docs/platform/run-supervisor hoặc docs/platform/runner
  nói về transcript/session log (grep không ra kết quả cho "transcript", "session log", "scrollback"). Vậy là khoảng trống chưa được quyết định, không phải loại trừ có chủ đích.

## 4. Có cách cứu sau sự kiện không

- `fgos dispatch show-run <run-id> --json` và `fgos dispatch inspect --run <run-id> --json` (đã chạy trên run_unit-run-1794219233953-ecaa6381/producer/1_01):
  trả run record, result, claim, evidence; không có transcript. inspect còn báo `resourceState: ambiguous`, `evidenceCompleteness.resource: stale`.
  `watch` chỉ poll trạng thái (src/verbs/dispatch/watch.mjs `tailLog` đọc stdout.log).
- herdr: `herdr pane read <PANE_ID> --source visible|recent|recent-unwrapped|detection --lines N` đọc được scrollback ("recent") khi pane còn sống,
  nhưng release-slot đóng pane ngay sau settle, và settle chỉ lấy `visible`. Sau khi pane đóng thì không đọc được.
- Session của CLI: có id resume trong stdout.log (pane omp/pi), nhưng `omp --resume`/`pi --session` cần file session, mà file đã bị xoá cùng home. Id đó hiện vô dụng.
- Cái còn lại và đáng tin: `outbox/report-1.md`, `result-1.json` (agent viết theo protocol), evidence.json, receipt.json.

## 5. Thay đổi nhỏ nhất để có transcript của seat pane

Ý: trước khi `removeAttemptHome`, chép thư mục session của CLI từ private home vào run dir. Không dựng cơ chế capture mới, dùng đúng chỗ đang xoá.

- Điểm chèn: `finalizeAttemptHome` (src/runner/dispatch/confinement/authority.mjs, vòng lặp trước `removeAttemptHome(target, ...)`),
  vì đó là nơi duy nhất biết `runDir` và `target` (home) cùng lúc, và đã nằm dưới lock attempt, domain process rỗng.
- Việc làm: nếu `<target>/sessions` tồn tại thì chép (không theo symlink, giới hạn kích thước, mode 0600) vào
  `<runDir>/protected/session/` (hoặc `<runDir>/session/` nếu muốn người đọc thấy); ghi tên đường dẫn vào steps/finalize-home.json `detail`
  (finalize-home.mjs:14-16 đã trả `detail`). Tuyệt đối chỉ chép `sessions/`, không chép auth.json/agent.db (đó là bản sao login: finalize-home đang xoá chính vì thế).
- Khai báo theo CLI: dùng `interactiveMode.kind` (pi/omp/claude, đã có trong runner.yaml) hoặc thêm một khoá `sessionDir` cạnh `credentialStore`
  để không phân nhánh theo tên provider (nguyên tắc spec §6.5 trong bwrap.mjs:668). Thêm khoá config phải vào core/config-standard và core/config-schema (quy tắc AGENTS.md).
- Cần chạm: authority.mjs (hoặc cleanup.mjs nếu đặt hàm chép cạnh `removeAttemptHome`), runner.yaml + schema (khoá khai báo thư mục session), run-supervisor spec
  (docs/platform/run-supervisor/spec.md, phần finalize-home và danh sách file trong run dir, :75), test sở hữu `finalizeAttemptHome` (một bằng chứng ở tầng thấp nhất; không nhân bản test).
  Giữ ý: một CLI không khai báo thư mục session thì không chép gì (hành vi cũ).
- Rủi ro cần quyết: (a) kích thước (omp/pi session nhiều MB, glm headless đã 1-3 MB); (b) transcript có thể chứa dữ liệu nhạy cảm
  (đặt trong `protected/`, 0600); (c) claude: vị trí session chưa rõ, phải đo trên một run sống trước khi hứa.
- Phương án rẻ hơn, chưa xác minh được: nếu `pi`/`omp` có cờ chọn thư mục session (kiểu `--session-dir`), trỏ về một đường dẫn trong run dir
  qua đường bind ghi được (outbox đã được bind ghi) thì không cần chép; `pi --help` chạy ở đây không in ra mục nào về session nên tôi không khẳng định được.

## Câu hỏi còn mở

- Claude pane: session có được ghi không và ở đâu? Cần một run mới giữ nguyên home (hoặc chạy probe bwrap đọc env của sideFile trước khi finalize).
- Đường dẫn chính xác `<PI_CODING_AGENT_DIR>/sessions` trong private home: xác nhận bằng một run sống.

Status: DONE_WITH_CONCERNS
Summary: Seat pane pi/omp có session do CLI ghi vào private home, và finalize-home xoá cả home không chép gì; stdout.log pane chỉ là ảnh màn hình visible lúc settle, còn stdout.log headless đầy đủ nhờ `--mode json`. Thay đổi nhỏ nhất là chép `<home>/sessions` vào run dir trong `finalizeAttemptHome` trước `removeAttemptHome`.
Concerns/Blockers: Đường dẫn session trong private home và hành vi của claude pane là suy luận, vì sideFile và home đã bị xoá; cần một run sống để xác nhận.

Report: /home/vantt/projects/forgent/plans/reports/researcher-261109-1830-pane-seat-transcripts.md
