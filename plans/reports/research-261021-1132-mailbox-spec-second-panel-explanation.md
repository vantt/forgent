> Bản sao nguyên văn báo cáo giải thích của hội đồng kiến trúc lần hai (run `wf-run-1792502625986-9f47cb64`, ghế giải thích, commit được soát `054129e97`), chép từ `.fgos/assignments/unit-run-1792505792457-11102d7d/producer/1/runs/01/outbox/report-1.md` để máy khác đọc được; bản gốc chỉ nằm trên máy chạy. Đây là bản ghi trạng thái, không phải phê duyệt: hội đồng phán chưa ký nguyên văn, chủ dự án ký sau khi sửa spec (xem mục 17 của spec).

# Mailbox G0: the settled panel packet, explained for the owner

Assignment: `unit-run-1792505792457-11102d7d/producer/1`, role producer, persona advisor, read-only. Step: explanation (workflow `architecture-advisory`, case `wf-run-1792502625986-9f47cb64`). Reviewed commit `054129e97cb38763599eee4d95eae88c26cdf171` (HEAD re-verified on 2026-10-20 at 21:17 Asia/Saigon). Design under review: `docs/platform/agent-mailbox/spec.md` (draft, not signed).

This report explains the final packet. It does not replace the recommendation, does not approve anything, and does not clear any review finding. The verdict, the attributed findings, the unresolved dissent and the `missing expertise` array below are the packet's own, carried unchanged. Where this report adds something it says so and labels it as this step's own observation.

## 1. Tóm tắt cho chủ dự án (đọc phần này là đủ để quyết)

**Phán quyết của hội đồng, giữ nguyên:** *Chưa nên ký nguyên văn* bản nháp tại commit `054129e97`. *Có thể ký G0* sau khi (1) sửa văn bản spec theo A1–A6 cộng một câu làm rõ A10, và (2) chủ dự án trả lời hai câu O1 và O2. Không cần chạy V2–V7, không cần triển khai điều kiện tiên quyết nào, không cần xác thực mật mã người gửi, không cần phép đo print-mode trước khi ký. Ba mục A7–A9 là khuyến nghị cho installer và cắt gọn, không phải điều kiện ký.

**Tại sao chưa ký được nguyên văn:** mục 14 của spec nói G0 ký *phạm vi, kiến trúc và ngữ nghĩa*. Trong đúng ba thứ đó, văn bản hiện tại có năm chỗ cho hai cách đọc trái nhau (ai được nhận thư trong case B so với lệnh loại trừ `att-`; wake đã bị cắt quota vẫn mở turn ở Stop; cam kết "không mất thư" vô điều kiện; ai sở hữu việc tìm `.fgos` của main checkout trong khi crate mailbox "không bao giờ import git"; quy tắc tăng generation cho phép process khác chiếm binding đang sống) và hai chỗ văn bản tự mâu thuẫn (câu hỏi 11 còn mở trong khi G0 đóng dấu chính kiến trúc đó; hàng "names pending" cạnh hàng "names accepted"). Mỗi chỗ đều đã được đối chiếu tới số dòng spec và, nơi có thể, tới dòng mã nguồn (mục 4 dưới đây).

**Hai câu chủ dự án phải trả lời (không ai thay được):**

- **O1. Người nhận trong case B là loại phiên nào?** (a) một head tương tác được khởi động độc lập (người, hoặc một đường khởi động không phải Unit); người gửi có thể là phiên Claude, runner hay `fgos` CLI; ai khởi động head đó thì viết dòng trusted-sender vào instruction của nó. (b) một worker Unit của runner, thư vào giữa brief và result. (c) tạm dừng G0 cho tới khi có người nhận đủ điều kiện được gọi tên. Hội đồng khuyến nghị (a); nếu (b) thì hội đồng *từ chối* G0 này vì đó là runner steering (mục 15.4), chủ khác, G0 khác.
- **O2. Đóng câu hỏi 11:** chấp nhận snapshot metadata dưới mutex holder-lock là kiến trúc record mà G0 ký (khuyến nghị), hay phản đối và quay về rename spool (khi đó bullet kiến trúc của G0 phải viết lại).

**Hai câu khuyên trả lời luôn cho gọn (không chặn G0):** O3 "same project" nghĩa là một record ở `.fgos` của main checkout cho mọi linked worktree (mặc định: có). O4 chạy ô đo print-mode trusted-sender của panelist-2 trước khi ký hay chạy ngay như S0 (mặc định: không phải cổng G0, chạy ngay). Và một câu nữa mà đội red-team vòng 2 yêu cầu chủ dự án nói chứ không để hội đồng điền: ngưỡng 80 phần trăm áp *theo từng ô hợp lệ* hay *gộp*. Hội đồng khuyến nghị theo từng ô; chưa ai có quyền đóng thay chủ dự án (mục 6, RT2-F1).

**Thẩm quyền và ranh giới component (điều chủ dự án dặn):** kiểm tra trong mã nguồn, không chỉ trong docs. Kết quả: các uỷ quyền sang session-identity, fgos-process, durable-file, holder-lock, confinement, installer hook, coordination foundation đều đúng chỗ. Một chỗ *gán sai* (resolver main-checkout giao cho V2 của mailbox, crate bị cấm import git); một chỗ *chéo nhau* (case B so với loại trừ `att-`); một đường *không chạy được như viết* (file instruction `components/agent-mailbox/` sẽ ném UNKNOWN_OWNER); một chỗ *spec tự tách đôi* về ai sở hữu dòng trusted-sender (dòng 519 so với 646). Chi tiết ở mục 5.

**Một hành động kế tiếp, đảo ngược được:** chủ dự án trả lời O1, O2 (và nếu muốn, O3, O4, câu per-cell) trong *một* lần ngồi, ghi thành các hàng trong bảng lịch sử quyết định của spec; sau đó controller sửa văn bản spec theo A1–A6 và câu A10 như một bản nháp mới để đọc lại trước khi ký. Không dòng Rust nào được viết, không điều kiện tiên quyết nào được land, trạng thái spec vẫn là "Draft; not signed". Mọi thứ hoàn tác bằng một lần revert văn bản. Nếu O1 là (c), hành động kế tiếp đổi thành phương án ALT-3 (pilot không build) của panelist-2.

## 2. What was settled, and by whom

The synthesis unit (`unit-run-1792504271864-ec79d45e`) settled on 2026-10-20 at 14:16:32 UTC with outcome `findings`. Its final producer packet is round 2 (`producer/2/runs/01/outbox/report-1.md`, raw JSON, mirrored in `packet-1.json`). Round 2 applied all ten round-1 red-team findings. The round-2 reviewer passed it with no findings. The round-2 red-team held the G0 verdict but left four residual findings, RT2-F1 to RT2-F4, which no later producer round applied. They are therefore open review findings on the packet and are carried in section 6 of this report, not cleared.

Seats and models, from the unit summaries (this step's own reading):

| Step | Seat | Model | Outcome |
|---|---|---|---|
| framing | producer | gpt-6.1-sol | pass |
| shaping | panelist-1 (system lens) | gpt-6-astra | pass |
| shaping | panelist-2 (alternative lens) | fable | pass |
| shaping | panelist-3 (constraint lens) | gemini-4-argon-high | pass |
| shaping | synthesizer | grok-4.6 | pass |
| critique | producer | grok-4.6 | pass |
| critique | reviewer | gemini-4-argon-high | pass |
| synthesis | producer, rounds 1 and 2 | fable | pass |
| synthesis | reviewer, rounds 1 and 2 | gemini-4-argon-high | pass |
| synthesis | red-team, rounds 1 and 2 | grok-4.6 | findings |

Four model families took part and the shaping seats were blind to each other, which is the independence the owner asked for. The earlier council rounds (`research-261019-1828`, `-1834`) were agents of one session and the earlier architecture panel (`research-261020-1327`) ran on an older commit and never settled; every seat treated those as evidence to test, not as consensus.

## 3. The verdict, as the packet states it

Decision string in the packet: `chua-nen-ky-nguyen-van; co-the-ky-G0-sau-sua-doi-ngan-(A1-A6,A10)-va-hai-cau-tra-loi-cua-chu-du-an`. Authority: advisory; G0 is the owner's signature; the packet judges only against section 14's definition of what G0 signs.

Confidence, as the packet states it: high that the listed contradictions exist in the signed text; medium that the amendment list is complete; low on every operational claim marked unmeasured.

The G0 bar (`verdict.amendmentRequired`), each with the reason it sits inside what G0 signs:

| Id | Change in one line | Why it is G0 text | Spec lines | Attributed to |
|---|---|---|---|---|
| A1 | Case B is between independently started interactive heads; a Unit attempt (`att-`) is never a recipient; reconcile 514, 519, 646, 632; cut or park the K1 leftover at 370 and 656. Depends on O1. | who may receive is a signed semantic | 78, 298, 436 vs 514, 519, 632, 646 | framing F1, P1 S1, P2 cond. 4, P3 C4, critique attack 1 |
| A2 | One effective-wake entitlement computed under the mutex at send; nudge and Stop drain read only that; say when quota is consumed. | wake as the sender's permission is signed | 193, 254, 298 | framing F2, P1 S2, P2 cond. 2, P3 C3, critique attack 2 |
| A3 | Replace "No loss" with "no silent loss": retained until an eligible checkpoint, a verified wake, or an explicit TTL or refusal, and the report says which. | delivery semantics are signed | 432 vs 298, 316, 257, 354 | framing F3, P1 S3, P2 cond. 3, P3 C7, critique attack 3 |
| A4 | The host or a git-topology foundation owns main-checkout `.fgos` resolution; mailbox takes the path as a parameter; replace "V2 writes the resolver" at 338 and 523. G0 names the owner, not the implementation. | same project only is signed, and the text assigns the work to a crate it forbids from importing git | 148 vs 338, 523 | framing F4, P1, P2 cond. 1, P3 C6, critique attack 4 |
| A5 | Four-row live-binding table: same head refreshes; different Record while stored head is Alive is a conflict; Unknown preserves; proven Dead permits replacement with one bump. | per-process generation is signed | 177 | P1 S4, critique attack 5, framing F7, P3 table |
| A6 | Close question 11 and cut the two-answer rows (640, 344, 679 vs 668, header 14, question 1 at 630); plus text-honesty fixes (146, 140, 154 vs 177, 510 vs 505, 698, reading map). Depends on O2. | G0 would stamp an architecture the text still invites the owner to object to | 7, 14, 344, 630, 640, 679 | critique attack 13, P2 q5, framing, P1, P3 C7 |
| A10 | State whether 80 percent applies per legitimate cell or pooled; keep N of at least 20, Wilson reporting and the already-signed zero-acted condition for harmful variants. | the stop rule is an owner decision whose unit of application is unstated | 514–517, 689 | framing, P1, P2 q3, P3 C7, critique |

Note on A6 and A10: the round-2 red-team disputes the rank of parts of both (section 6). The owner can read A6 as two halves, the G0 half (close question 11, delete the two-answer rows) and the honesty half (Nudge wording, serde claim, Record placement, ladder waits), and read A10 as a one-sentence clarification rather than a contradiction. Either reading leaves the verdict unchanged.

Recommended but outside the G0 bar (`amendmentRecommendedNotG0`): A7 hook-command failure-mode contract for git-tracked Claude settings in linked worktrees; A8 permit a read-only no-mail hook path; A9 one instruction source, drop the planned `components/agent-mailbox/` file.

Not required before G0 (`notRequiredBeforeG0`): host hook routing, the lock-registry row, `is_attempt_writer_id`, the confinement mask, the resolver implementation, V2–V7 results, cryptographic sender authentication, any change to the language split, record home, crates, names or the 80 percent number, and panelist-2's print-mode measurement.

Would flip to refuse (`wouldFlipToRefuse`): O1 answered (b); O2 answered object. Would not flip: absent production authorization, unbuilt prerequisites, the deferred typed agy nudge, missing V5–V7 numbers, Codex 3 of 20 in print mode. Post-signature reopen: a prerequisite owner refusing its row, per spec line 495.

## 4. Evidence the verdict rests on

Spec lines were re-read by the producer, by the round-2 red-team, and again by this step at HEAD on 2026-10-20. All cited lines say what the packet says they say: line 78 excludes `att-` heads; 514 and 519 describe "a coordinator or the runner asking a Codex worker" and give authorization to "the lane that writes the worker's brief"; 646 says "whoever starts the worker, the runner or a person"; 665 parks herdr-coordinator-to-pane-worker and still says "a Claude session or the runner sending to a Codex or agy session" without naming the recipient class; 193, 254 and 298 together let a quota-dropped wake still drain at Stop; 432 promises "still offered" while 316 gives agy no wake channel and 257 refuses recorded mail at TTL; 148 says the crate never imports git while 338 and 523 say V2 writes the resolver; 177 bumps when the Record differs or the stored one is Dead; 640 keeps question 11 open and 7 lists it as open; 679 says names pending while 668 says names accepted.

Source facts re-checked by this step (read-only greps, same results as the packet and the red-team):

- `packages/session-identity/rust/src/attempt.rs:9` defines `ATTEMPT_PREFIX = "att-"`; `lib.rs:16` exports `mint_attempt_writer_id` only, no `is_attempt_writer_id`.
- `src/setup/agent-hooks.mjs:56` recogniser regex accepts only an optional `--format=agy`, not `--event`; lines 88 and 94 write unguarded `"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" hook <kind>` commands.
- `packages/holder-lock/contracts/lock-registry.v1.json` has no `mailbox` row.
- `src/runner/dispatch/confinement/resources.mjs:26-32` lists five hidden roots, none for mailbox.
- `packages/host-runtime/contracts/command-routes.json:396-400` routes `hook` as `legacy-cli` with the `legacy-node` payload.
- `apps/fgos/Cargo.toml` lists no git crate.
- `docs/specs/reading-map.md` has no mailbox entry.

Numbers the packet relies on, all from S0 reports and all limited as stated there: native verb about 10 ms through the shim versus legacy hook p50 171–223 ms; one snapshot cycle about 10.3 ms with lock starvation of 479–1867 ms under a synthetic hammer; Codex legitimate requests acted on 3 of 20 in print mode, raw forged closing tag acted on 10 of 20; 24 inventoried exchanges, 0 with agy, one Codex exchange through a question dialog where hooks do not run.

Unmeasured, per the packet (`evidence.unmeasured`): mailbox hook p95 on the no-mail and with-mail paths in each CLI's real environment; lock contention at real load; whether a public hook selector can be split native and legacy in the host; hook writer id equals send-child writer id per CLI; Codex behaviour with a trusted-sender line, in print mode and through the real hook; `codex queue` on a busy session; whether a human-started interactive Codex head exists as a launch path outside Unit attempts in practice; worktree topology on the owner's other machines; benefit of a per-recipient snapshot; agy behavioural safety and effectiveness; resolver cost, body write cost, release packaging.

## 5. Component authority and boundary (the owner's emphasis)

The packet's answer to question 2, verified in source by the framing producer, the critique and the synthesis producer, and spot-checked above:

- **Correct delegations:** writer attribution to session-identity (attribution, never authentication); process liveness to `fgos_process::judge`; atomic install to durable-file; mutual exclusion to holder-lock through a registry row; hook installation to `agent-hooks.mjs`; hidden roots to confinement; event truth stays outside the Event Store; terminal-control and agent-protocol untouched after the 15.8 deferral; communication authorization to the coordination foundation through a future policy input.
- **Legitimate new mailbox authority:** names, registry, generation table, message transitions, channel caps, the frame, per-CLI hook payload shape and head discovery.
- **Misassigned:** main-checkout `.fgos` resolution (A4). The only Rust resolver today, `resolve_target_root` in `apps/fgos/src/main.rs`, walks to the nearest `.fgos`; the git crate's `resolve_repo` requires `trusted_main` as input; `apps/fgos` has no git dependency. So "the host owns it" is an assignment with a cost for the host or git lane, not a free lunch (packet `correctionsToUpstream`).
- **Crossed:** the case B prose versus the `att-` exclusion (A1); the planned `components/agent-mailbox/instructions/peer-input.md` versus the architecture manifest, which would throw `UNKNOWN_OWNER` in `src/setup/instruction-registry.mjs` (A9).
- **Split inside the spec itself:** who owns the trusted-sender instruction, line 519 (the runner and dispatch lane) versus line 646 (whoever starts the worker, the runner or a person). O1 and A1 resolve it.
- **Duplicated:** none found after the 15.8 deferral.
- **One-directional rule to state:** the mailbox registry never feeds session-identity.

Layering (question 3): `apps/fgos` wiring depends on `fgos-mailbox`, which depends on `fgos-mailbox-core`; the store depends on `fgos-process`, `fgos-session-identity`, `fgos-holder-lock`, `fgos-durable-file`; nothing below imports mailbox; no mailbox import of run-supervisor, Workflow, terminal-control, agent-protocol, Event Store or git. The architecture manifest test cannot see Rust crates, so the direction is held by Cargo and review. All five prerequisites on other components are real and absent today; four are correctly assigned; the resolver is the misassigned one. The confinement entry must land at V2, when the directory first exists, not at V4 as the table says.

## 6. Unresolved dissent, carried without averaging

From the packet (D1–D9) and the round-2 red-team (RT2-D11 and findings RT2-F1 to RT2-F4):

- **D1** Print-mode trusted-sender cell before G0: panelist-2 yes; panelist-1, panelist-3, critique, framing, producer no. Packet stance: not a G0 gate, run now as S0.
- **D2** "Same project" wording versus unsigned semantic: panelist-2 says unsigned until defined in Rust; others say name the owner and inject the path. Packet: A4 names the owner, implementation at V2.
- **D3** Live-name takeover as a G0 semantic: panelist-1 and critique yes; panelist-2 did not list it. Packet: A5.
- **D4** Linked-worktree hook command as a G0 item: panelist-3 blocker; critique narrowed to a failure-mode contract. Packet: A7, recommended, not G0.
- **D5** Zero-fsync no-mail path locked at G0: panelist-3 yes; others no. Packet: A8, recommended.
- **D6** Standing instruction file: panelist-3 cut before G0; panelist-2 cut or defer; panelist-1 not a blocker. Packet: A9, recommended.
- **D7** Record shape: one project snapshot (P1, P3, framing) versus per-recipient snapshot (P2). Packet: one snapshot via O2; ALT-4 kept for V2 evidence.
- **D8** Freeze-list width for V6: framing and P1 wide; P2 cells and per-cell rule only. Packet: A10 freezes cells and the per-cell rule; the rest to the V6 protocol.
- **D9** Is a panel-authored patch enough to make G0 signable: framing, panelists and shaping synthesis yes after amendment; critique, both red-team rounds and the round-2 producer no, the owner must choose O1 and O2. Packet stance: the critique is right.
- **RT2-D11 (red-team round 2, open):** A10 in `amendmentRequired` plus a per-cell named default. Producer: A10 is G0 because the unit is unstated, default per-cell on silence. Red-team: unstated is not a contradiction; N is already per cell at 514; silence must not stamp per-cell; ask the owner. Not applied by any producer round.

Residual review findings on the packet, from the round-2 red-team, open as settled (this report does not clear them):

- **RT2-F1** A10 framed as a signed contradiction and closed by a silence default (`namedDefaults[3]`) with no owner question. Disposition asked: keep A10 as a one-sentence clarification; remove the silence default; add an owner beat or wait for the owner.
- **RT2-F2** A6 bundles non-G0 text-honesty cuts onto the G0 bar. Disposition asked: split A6 as described in section 3 above.
- **RT2-F3** `missingExpertiseNote` still calls A7 "G0 text" after A7 was demoted. Disposition asked: A4 is G0 text; A7 is residual and installer.
- **RT2-F4** `evidence.sourceVerifiedByThisProducer` is labelled as round-2 re-verification while the method says it was carried from round 1. The red-team re-checked five of those facts and this step re-checked seven; all hold. A labelling defect, not a false source fact.

None of the four changes the verdict; the red-team's own `wouldFlipProducerG0Advice` says so.

## 7. Alternatives kept on the table

ALT-1 selected architecture with amended contracts (recommended, if O1 is (a) and O2 is accept). ALT-2 checkpoint-only graduation as the declared fallback if V4 or V7 cannot prove a wake path. ALT-3 no-build pilot through existing channels (panelist-2; chosen if the owner wants the "worth it" answer before any Rust, or if O1 is (c)). ALT-4 per-recipient snapshot (panelist-2; V2 contention evidence decides). ALT-5 resequence by risk (panelist-2's pick if forced). ALT-6 runner steering of Unit attempts (if O1 is (b); a different owner and a different G0). ALT-7 drop-box without a policy core (historical dissent; value-failure reconsideration only).

## 8. Missing expertise (verbatim from the packet; the close gate asks about this list)

```json
[
  "LLM prompt-injection red-teaming (real hook delivery path)",
  "Experimental design and statistics for the V6 stop rule",
  "Codex CLI internals (hook trust, queue tick, daemon mode)",
  "Git worktree / trusted main-checkout .fgos resolution",
  "Claude Code project-hook settings and worktree shim activation"
]
```

Reading guide for the close gate, from the packet's reasons plus the red-team correction RT2-F3: the first three are later-rung measurement expertise (V6 and the Codex adapter) the panel did not have. The fourth touches G0 text, because A4 asks the spec to name the owner and the input/output contract of main-checkout resolution and the panel observed one machine's worktree topology only. The fifth touches A7, which is an installer and residual-risk item, not G0 text. Neither the packet nor the red-team recommends whether to bring any of these names in; `[]` is the gate's "none requested", not the panel's advice. Completion of the gate is not approval of the advice.

## 9. One reversible next action

Answer O1 and O2 in one sitting, in the decision-question shape the packet already gives, and in the same sitting say the two optional things if they are easy (O3 same project across worktrees; O4 timing of the print-mode cell) and the one sentence the red-team asks for (80 percent per legitimate cell or pooled). Record the answers as rows in the spec's decision history. Then have the controller amend the spec text per A1–A6 and the A10 sentence as a new draft revision for a re-read before any signature.

Why this is reversible: the spec stays "Draft; not signed"; the amendment is text only; no Rust is written, no prerequisite row lands in holder-lock, confinement or the host, and no hook is installed. A revert of the text restores the current state. Why this is the smallest step: the owner's two sentences are the only inputs the panel could not produce, and every other item in the G0 bar is mechanical once they exist. If O1 is answered (c), the next action becomes ALT-3 instead and no amendment is needed yet.

What this action does not do: it does not start V1, does not run the print-mode cell (that is O4, advised as immediate S0 and cheap), and does not decide the resolver's code location (a host and git lane choice).

## 10. Method and limits of this step

Read in full: the round-2 producer packet (all sections), the round-2 reviewer report, the round-2 red-team report, the framing report's verdict, evidence weighting, findings and authority map, the shaping synthesizer report, the critique producer's verdict and attack headings, the critique reviewer's verdict, the six unit summaries for seat models and outcomes, and the spec at every line the packet cites. Read through the synthesizer and the packet attributions rather than cover to cover: panelist-1, panelist-2 and panelist-3. Re-checked seven source facts by grep (section 4). Ran no tests, builds, live CLI or model calls. Modified nothing in the workspace; wrote only the acknowledgement, this report and the result claim in the outbox, each tmp-then-rename.

Limits: this step did not recompute the Wilson intervals, did not re-list worktrees, and did not re-read `session-identity` `resolve.rs`, which the packet also relied on from upstream. The packet's own labelling defect (RT2-F4) stands as the red-team recorded it.

## Unresolved questions for the owner

1. O1: which kind of session is the recipient of case B: (a) independently started interactive head, (b) runner Unit worker, (c) park G0? Recommended (a).
2. O2: accept the metadata snapshot under the holder-lock mutex as the record architecture G0 signs, or object? Recommended accept.
3. O3: does "same project" mean one record at the main checkout's `.fgos` across linked worktrees? Default yes.
4. O4: run the print-mode trusted-sender cell before signing, or sign after amendment and run it at once as S0? Recommended the latter; panelist-2 dissents.
5. The 80 percent threshold: per legitimate cell or pooled? Recommended per cell; the red-team asks that only the owner's sentence close it.
6. Close gate: bring in any of the five missing-expertise names, or none? No recommendation from the panel.
