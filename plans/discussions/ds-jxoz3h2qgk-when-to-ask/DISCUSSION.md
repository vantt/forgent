---
id: ds-jxoz3h2qgk
title: "When does an agent truly need to ask the owner"
status: open
source: []
created: 2026-11-26
---

discussion: open

## Seed

Opened by the supervisor on the owner order relayed by the secretary (Miu), 2026-11-26 09:57. Park owner questions in the question store instead of waiting on them.

- **Outcome:** a skill set that tells every agent when a question to the owner is truly needed, so a head decides inside its approved frame and does not stall overnight on a question it could have settled itself.
- **Trigger:** night stall from q-myvzcbz3sx and q-vqyxe5oi6j.
- **Read first:** AGENTS.md product priority 2 (Release con người); core/skills/_shared/decision-question.md.
- **Evidence (open owner questions to judge against the rule):** q-qzchcwl7ya, q-5sog3pzmqn, q-pmhxzsfpr7, q-pkvxdfpg3n, q-ubi34e6xd3.

## 1. Trạng thái hiện tại

Vòng 5, 2026-11-26 11:05 +07. Chủ đưa ra mô hình bốn thành phần: mục tiêu, hướng đi, hành động, hệ quả. Chỉ hỏi khi hành động sinh hệ quả (lệch mục tiêu) mà không có hướng đi nào tránh được. Chọn giữa các hướng đi thì agent tự làm. §6 đã viết lại quanh mô hình này; phép thử con đường là cách tìm hướng đi. Còn hai điểm cần chủ xác nhận: tầng mục tiêu nào được tính, và câu hỏi về mục tiêu. Phần dưới là trạng thái vòng 2.

Chủ đã nêu nguyên tắc (§5, 10:15). Chủ chỉ trả lời câu hỏi **hướng đi**: thay đổi rất lớn về chức năng, về cách tổ chức, hoặc lập một bộ luật mới. Câu hỏi về **tác vụ actionable** phải được biến thành việc tìm cách làm an toàn và đảo ngược được; có cách thì làm rồi báo, chỉ hỏi khi không còn đường nào khác. Phạm vi là mọi câu hỏi, không chỉ các câu trong seed.

Đã lọc toàn bộ 163 câu trong kho (bốn agent Haiku, bằng chứng ở [evidence-question-classification.md](evidence-question-classification.md)). Kết quả: 70% không cần hỏi, 17% là "thiếu tay" (head bị nhốt không chạy được bước host), 13% là hướng đi. Chủ chọn đúng phương án đề xuất 89/94 lần. Năm lần chủ chọn khác đều rơi vào đúng hai chỗ: hạ tiêu chí nghiệm thu, và nới ranh giới tin cậy thường trực. Bộ mẫu hỏi / không hỏi ở §6. Vẫn là bản nháp, chưa có D-ID.

q-otq7dwgory (footprint có thuộc khung không) đã cancel vì nguyên tắc của chủ trả lời nó: mở footprint để đạt acceptance của chính plan là actionable.

Còn mở:
- **Lớp "thiếu tay"** (§3 row 10): khoảng 45 câu không phải quyết định mà là nhờ chủ chạy hộ. Cần xác định plan 261124-0004-heads-operate-without-owner (done 25/11 22:08) đã đóng lớp này chưa trước khi đề xuất gì thêm.
- Kênh "đã quyết, báo chủ" (§3 row 7).
- Phạm vi giao: chỉ văn bản skill, hay cả cửa (§3 row 6).

## 2. Mục tiêu & đề bài

Heads stall for hours, overnight included, on questions they could have decided. On 2026-11-25 two leads asked to widen their plan footprints by one or two small files that their own acceptance criteria needed. The owner answered both with the recommended option at 01:44Z, about 8.5 hours later, and five dependent phases waited the whole time. Across the whole store the pattern holds: 163 questions in seven days, the recommended option picked 95% of the time, 193 hours of total waiting. The owner's principle (§5, 2026-11-26 10:15) is the target. The owner answers only direction questions: a very large change of functionality, of how things are organized, or a new rule set. Every actionable question becomes a search for a safe, reversible way to do the work, which the agent then does and reports. It asks only when no such way exists. The goal is one shared rule, plus a set of ask / don't-ask templates, that every agent (lead, supervisor, secretary, shaper, planner, worker) applies the same way, so that only direction questions reach the owner.

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Where "when to ask" is written today | **Rõ** | AGENTS.md priority 2 gives the intent. `core/skills/_shared/decision-question.md` § Approved frame gives the rule ("Inside the frame, decide and report; about to leave the frame: stop and ask"). Also `fgos-supervisor/SKILL.md:164-166`, `fgos-lead/SKILL.md:77-80,86` (refusal → owner question) and `plan-contract.md:77` ("only what the owner alone can answer", with no test). |
| 2 | Why the trigger questions were asked | **Rõ** | The frame is defined as "which files/contracts may change", so each extra file was a frame exit. PS-24 forbids a lead from editing its own footprint. The leads followed the rule. |
| 3 | The ten seed questions | **Rõ** | Superseded by the full classification in row 9. |
| 4 | Is the footprint part of the frame | **Rõ (owner principle, 10:15)** | No. A widening that serves the plan's own acceptance is actionable. q-otq7dwgory was cancelled with that reason. The 40 footprint-widen questions in the store: 30/30 answered with the recommendation. |
| 5 | Ask-triggers | **Provisional, replaced by §6** | The four draft triggers (T1-T4) of round 1 are folded into the templates in §6. |
| 6 | Skill text only, or doors too | **Chưa rõ** | Text alone cannot remove a question that a door forces: `authority declare --approved-by` takes only an answered q-id (class "reconfirm-settled-decision", 4 questions), and PS-24 refuses a lead's self-widening (ds-mzyircswox). Size after row 10. |
| 7 | How "decided, reporting" reaches the owner | **Chưa rõ** | The store has only ask/answer/ack/cancel. Options: a report line in the batch Miu relays, or a non-blocking "decided, reverse if you disagree" record. |
| 8 | Prior art | **Rõ** | `gate-bypass` almost never ran (1.6%; ds-5i3t6na4ym round 7). The lesson: a rule that depends on a checker the agent cannot satisfy does not reduce questions. ds-hme6khnird built the store, not the when-to-ask rule. |
| 9 | Classification of all 163 questions | **Rõ (evidence)** | [evidence-question-classification.md](evidence-question-classification.md). no-ask 114 (70%), hands 28 (17%), direction 21 (13%). The owner picked the recommended option 89/94 times. The 5 overrides: 3 acceptance narrowings (q-lnjt5zzbfq, q-aanvfxaopa, q-trgzaa34ua), 1 standing trust-boundary widening (q-nt7ptsq2nd), 1 hands (q-ddj673fmju). All 10 org-structure and 5 new-rule questions were settled in chat discussion, then cancelled. |
| 10 | **The hands class** | **Chưa rõ** | About 45 questions (missing-grant-or-door 44, git-recovery-ops 20, and the host-only cleanups, overlapping) ask the owner to *run* a host step: full suites, release activation, worktree removal, config patch, `fgos git recover`. They are not decisions. Prior art: p-g5ktat4kej → plan 261124-0004-heads-operate-without-owner (done 2026-11-25 22:08); q-werrxi4i7i was redirected by the owner to "a generic escalation door bounded by protected things" (ds-liu5g4k3gh). Next: check whether hands questions still come after 2026-11-25 22:08 (2 on 2026-11-26 so far) before proposing anything. |

## 4. Quyết định đã chốt

| D-ID | Tóm tắt | Nguồn / rationale |
|---|---|---|

(None yet. The owner principle of 10:15 is one round old; the §6 templates wait for one more round before any D-ID.)

## 5. Q&A log

- 2026-11-26 10:15 +07, shaper, round 1: Scouted all 10 seed questions and the current rule text. Found that the frame definition ("which files may change") is what turned footprint widenings into owner questions. Drafted four ask-triggers. Parked q-otq7dwgory: is the footprint part of the frame?
- 2026-11-26 10:15 +07, owner (chat, round 2): Phạm vi không chỉ là các câu trong seed; đây là một nguyên tắc áp cho mọi câu hỏi. Chủ trả lời câu hỏi **quyết định hướng đi**: thay đổi rất lớn về chức năng, về cách tổ chức, hoặc tạo ra một bộ luật mới. Câu hỏi về **tác vụ actionable** không phải "nó nguy hiểm, anh có làm không" (không có tính xây dựng); nó là động lực để tìm cách làm an toàn và đảo ngược được nếu fail. Có cách ổn thì làm rồi báo chủ; chỉ hỏi khi không còn cách nào khác. Việc tiếp theo: dùng agent rẻ lọc toàn bộ câu hỏi trong kho, phân nhóm, và đưa ra mẫu "gặp loại này thì hỏi / không hỏi".
- 2026-11-26 10:40 +07, shaper, round 2: Cancelled q-otq7dwgory (answered by the principle). Exported 163 questions from the store. Four Haiku agents classified them; the shaper merged the results and drafted the templates in §6. Evidence: evidence-question-classification.md.

- 2026-11-26 10:35 +07, shaper, round 3: Gave the shaper's own position: agree with the principle, with five pushbacks. (1) The line between direction and actionable lies in the consequence, not the topic; proposed test: "does it set or lower a standard that outlives this task?" (2) Reversible means within one step and not reaching outside the repo (fgOS runs on other projects). (3) Decide-and-report drifts unless someone reads the decisions aggregated by plan and file. (4) The 70% figure is the rule applied to itself; the 95% figure and the 5 overrides are the real evidence. (5) Direction questions belong in a discussion, not in a night-time A/B store question (all 15 org/rule questions were settled in chat, then cancelled). Also: "find a way" never means escaping the cage; the hands class needs one structural door.
- 2026-11-26 10:45 +07, owner (chat): Agrees with point 1. The three acceptance overrides (q-lnjt5zzbfq, q-aanvfxaopa on plan 261121-2110-component-authority-doors; q-trgzaa34ua on plan 261124-1433-authority-declare-update) are all component-authority. Owner direction: component-authority's core must be released first and be done, so that it is there to govern everything that appears afterwards. The bar is lowered temporarily: related things it would need to check are no longer required to be checked first. It only needs to exist, so it governs the new things and at the same time knows and remembers the old unresolved ones; the old ones are then solved one by one. Waiting for the old ones before releasing it would leave every new thing unchecked meanwhile.
- 2026-11-26 10:50 +07, shaper, round 3: Reading of the owner's answer: the three overrides were not the owner lowering a bar case by case. They were one standing direction ("ship the governor first; it ledgers the old debt") that existed only in the owner's head, so each lead re-derived the opposite recommendation per phase. Proposed refinement of test 1: applying a recorded direction is actionable; only setting or changing a direction is an owner question, asked once and recorded where agents read it. Pushback raised: lower the bar on what the governor manages, never on the governor's own core correctness (q-trgzaa34ua closed with 50 unexplained cargo failures in the full suite).

- 2026-11-26 10:55 +07, owner (chat): "Một hướng đi chưa được ghi ra" is itself a sign of the communication quality between owner and agent; the owner cannot realistically remember which direction to tell the agent. Clean is the goal, the final wish; the best way of reaching it matters more.
- 2026-11-26 11:00 +07, shaper, round 4: Accepted. The burden cannot be "the owner writes every direction down". The agent must derive the path itself. Evidence that it could have: AGENTS.md product priority already orders Ship Faster (1) above DoD (3) and Polish after DoD (4), and the three leads recommended the polish-first path anyway. The missing piece is a path test the agent runs before recommending: what end goal does this serve, and which order reaches it best? A piece that governs or unlocks others lands first; known debt goes into the thing that will track it. Only when the path cannot be derived from the goal, the priorities and the role of the piece is it an owner question, and then it is asked as "the best path I see is X because …", not "clean now or debt?". The pushback on the governor's own correctness stays open.

- 2026-11-26 10:46 +07, owner (chat): Praised the path test ("phép thử về con đường"); had it been applied before this exchange, the exchange would not have been needed.
- 2026-11-26 10:50 +07, shaper, round 4: Self-check: the shaper did not apply the path test either. q-otq7dwgory (round 1) could have been derived from the goal "agents ask only when truly needed" plus priority 2, without asking. The path test is now step 0 of §6.
- 2026-11-26 10:53 +07, owner (chat, round 5): Bối cảnh có bốn thành phần: mục tiêu đang có (kết quả), hướng đi (các cách khác nhau để đạt mục tiêu), hành động sắp diễn ra (chủ thể của câu hỏi), hệ quả. Chỉ gọi là hệ quả (hậu quả) khi kết quả của hành động dẫn tới khác mục tiêu đang có. Hành động có thể là một trong các hướng đi. Tín hiệu quan trọng của một câu hỏi là hành động sinh ra hệ quả (lệch mục tiêu). Hướng đi là cách thông minh để tới mục tiêu với chất lượng đã thống nhất mà chi phí rẻ hơn, trong bối cảnh này chính là thời gian nhanh hơn.
- 2026-11-26 11:05 +07, shaper, round 5: Regenerated §6 around the four-part model. What follows from the model: choosing between directions is never an owner question; a risk is not a consequence but work to make safe; uncertainty about deviation is resolved by cheap measurement, not by asking; a phase acceptance is the planner's chosen direction, not the owner's goal. The model itself answers the governor-correctness question from round 3: a red core falls below the agreed quality (a deviation), while named debt around it is a direction. Two refinements proposed in chat: which goal level counts, and what happens when the goal itself is unclear.

## 6. Thiết kế đã chốt {#design}

Bản nháp vòng 5, chưa chốt. Một luật dùng chung thay cho đoạn § Approved frame trong `core/skills/_shared/decision-question.md`. Mọi skill có chỗ bảo agent hỏi thì trỏ về luật này, không viết lại.

### Mô hình bốn thành phần (chủ, vòng 5)

| Thành phần | Nghĩa |
|---|---|
| **Mục tiêu** | Kết quả đã thống nhất, cùng chất lượng đã thống nhất (gồm cả các ràng buộc chủ đã đặt: luật, ranh giới tin cậy). |
| **Hướng đi** | Các cách hành động khác nhau để đạt *cùng* mục tiêu đó. Hướng đi thông minh là hướng đạt mục tiêu với chất lượng đã thống nhất mà chi phí rẻ hơn; trong bối cảnh này chi phí chủ yếu là thời gian. |
| **Hành động** | Chủ thể của câu hỏi: việc sắp làm. Nó là một trong các hướng đi. |
| **Hệ quả** | Chỉ gọi là hệ quả khi kết quả của hành động **lệch khỏi mục tiêu**: kết quả khác, hoặc chất lượng thấp hơn mức đã thống nhất. |

**Luật.** Tín hiệu duy nhất để hỏi chủ là: hành động sẽ sinh ra hệ quả (lệch mục tiêu), **và** không có hướng đi nào khác đạt mục tiêu mà tránh được độ lệch đó. Chọn giữa các hướng đi không phải câu hỏi: agent tự chọn hướng nhanh nhất mà vẫn giữ chất lượng đã thống nhất, làm, rồi báo.

**Phép thử con đường** (vòng 4) là cách agent tìm ra các hướng đi trước khi kết luận là có hệ quả:
1. Hành động này phục vụ mục tiêu nào?
2. Thứ tự nào tới mục tiêu đó nhanh nhất? Mảnh nào quản lý hoặc mở khoá các mảnh khác thì lên trước. Nợ đã biết thì ghi vào chính thứ sẽ theo dõi nó, không chặn đường. Đối chiếu thứ tự ưu tiên sản phẩm: Ship Faster > Release con người > DoD > Polish sau DoD.
3. Rủi ro của một hướng đi không phải là hệ quả. Rủi ro là việc cần làm cho an toàn và đảo ngược được (sao lưu, dry-run, làm phần an toàn trước, giữ dữ liệu). Chưa chắc kết quả có lệch không thì đi đo hoặc thử với chi phí thấp, không hỏi.
4. Chỉ khi mọi hướng đều lệch mục tiêu mới hỏi. Khi hỏi thì nêu độ lệch ("hướng tốt nhất em thấy là X; nó lệch mục tiêu ở chỗ Y, vì …"), không hỏi "có làm không".

**Câu hỏi về mục tiêu** là một loại khác: khi mục tiêu hoặc chất lượng đã thống nhất chưa rõ, hoặc khi việc đang làm đề xuất đặt mục tiêu mới. Khi đó hỏi để làm rõ hoặc đặt mục tiêu, thường trong một discussion, không phải một câu A/B.

### Áp vào bằng chứng

| Nhóm trong kho | Hướng đi hay hệ quả | Kết luận |
|---|---|---|
| Mở footprint (40) | Hướng đi: thêm vài file để đạt đúng acceptance của plan | Không hỏi |
| Dọn dẹp (18), phục hồi git/ops (20), xin xác nhận điều đã chốt (4) | Hướng đi có rủi ro: làm cho an toàn rồi làm | Không hỏi |
| Ba câu component-authority (q-lnjt5zzbfq, q-aanvfxaopa, q-trgzaa34ua) | Mục tiêu của chủ: bộ quản được release và đang chạy, quản mọi thứ mới, nhớ nợ cũ. "Ghi nợ có tên" là một hướng đi tới mục tiêu đó, không lệch. Acceptance của từng phase là hướng đi do planner chọn, không phải mục tiêu của chủ. | Không hỏi |
| q-trgzaa34ua, phần full suite chưa chạy | Nếu 50 lỗi `cargo test` là đỏ thật trong chính bộ quản thì chất lượng thấp hơn mức đã thống nhất, tức là lệch | Tìm hướng để kiểm trước (chạy full suite ở nơi chạy được). Chỉ hỏi khi không có hướng nào. |
| Đổi tổ chức (10), luật mới (5), đổi chức năng lớn (2) | Đặt hoặc đổi mục tiêu hay ràng buộc | Câu hỏi về mục tiêu, thường bàn trong discussion |
| Nới ranh giới tin cậy thường trực (q-nt7ptsq2nd, q-okdzvolti3) | Ranh giới tin cậy là một phần chất lượng đã thống nhất; nới nó là lệch | Hỏi, trừ khi có hướng khác không cần nới |
| Thiếu tay (~45) | Không phải câu hỏi: agent bị nhốt không chạy được bước host | Đi đường việc đặc quyền (§3 row 10) |

```mermaid
flowchart TD
  A[Hành động sắp làm] --> G{Mục tiêu và chất lượng<br/>đã thống nhất có rõ không?}
  G -- không --> QG[Câu hỏi về mục tiêu:<br/>làm rõ hoặc đặt, trong discussion]
  G -- có --> P[Phép thử con đường:<br/>liệt kê các hướng đi,<br/>chọn hướng nhanh nhất giữ chất lượng]
  P --> C{Kết quả có lệch<br/>mục tiêu không?}
  C -- chưa chắc --> M[Đo hoặc thử rẻ, rồi xét lại]
  M --> C
  C -- không --> R{Có rủi ro?}
  R -- có --> SAFE[Làm cho an toàn và đảo ngược được]
  R -- không --> DO
  SAFE --> DO[Làm, ghi lại, báo chủ]
  C -- có --> ALT{Có hướng khác<br/>không lệch?}
  ALT -- có --> P
  ALT -- không, vì thiếu quyền chạy --> H[Đường việc đặc quyền]
  ALT -- không --> ASK[Hỏi chủ: nêu độ lệch,<br/>năm phần, gom bộ, chỉ park phần bị chặn]
```

## 7. Danh mục hạng mục / task {#tasks}

Draft; to be filled once §3 rows 6, 7 and 10 settle.

### Shared ask rule {#task-shared-ask-rule}
- Goal: replace § Approved frame in `core/skills/_shared/decision-question.md` with the §6 rule and templates. Repoint `fgos-lead` (the refusal table, rows 77-80), `fgos-supervisor:164-166`, `plan-contract.md:77` and the secretary at it.
- Draft verify: re-judge the 163 questions in the evidence file against the new text. Only H1-H6 reach the owner.

### Doors accept a recorded decision {#task-doors}
- Goal: the footprint widen (shared with ds-mzyircswox) and `authority declare` accept a settled D-ID or a recorded agent decision, not only an answered q-id.

### Hands class {#task-hands}
- Goal: pending §3 row 10.
