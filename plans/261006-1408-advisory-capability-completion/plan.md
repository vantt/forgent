---
title: "Complete advisory capability on existing runtime — do not restore coordination engine"
description: "Close architecture-advisory migration gaps with early feasibility proof, retain cognition and human authority, and reject bloat or a second engine. Separate from single-door hygiene."
status: pending
priority: P1
branch: feat/single-door-mechanisms
tags: [advisory, workflow, collaboration-pattern, migration, human-authority, simplicity]
created: 2026-10-06
---

# Advisory capability completion — chức năng trở lại, engine không trở lại

## Vì sao có plan riêng

Original [single-door plan](../261006-1415-fgos-single-door-mechanisms/plan.md) làm binding/render/doctor/dev door/root hygiene/doctrine. Khi sửa roster skill phát hiện migration advisory chưa giữ đủ chức năng. Ghép completion vào old plan đã thay trọng tâm và làm doctor/hygiene chờ unrelated acceptance. Owner yêu cầu tách và lưu toàn bộ câu hỏi phản biện cho các agent kế tiếp.

Plan này là **hoàn tất năng lực đã yêu cầu trong migration**, không đem coordination engine cũ trở lại. Một skill mỏng dùng Workflow/Pattern/Unit/bind sẵn có; không second sequencer/store/binding/actor registry. Detailed plan pending; không authorization code, không live proof.

## Đọc trước — bắt buộc cho mọi agent

1. [Owner challenges và rationale](reports/owner-challenges-and-rationale.md): vì sao bỏ engine, vì sao cần hoàn tất, scope drift và điều kiện dừng chống phình/chậm. Đọc trước design/code, không coi đây là ghi chú phụ.
2. [Preservation matrix](reports/advisory-preservation-matrix.md): mục tiêu → mechanism → observable proof.
3. `docs/specs/reading-map.md`, runner spec §0047/0048/0049/0050 và Workflow/Pattern contracts, handoff/confinement contracts, platform laws/component boundary.
4. [P4 retirement plan](../261001-0327-request-to-run-p4-discussion-patterns-engine-retirement/plan.md): owner chốt giữ discussion capabilities, engine chỉ là phương tiện. [Acceptance case2](../261001-0327-request-to-run-p4-discussion-patterns-engine-retirement/reports/acceptance-case-2.md): DONE_WITH_CONCERNS, old-v-new rerun NOT RUN. Retirement commit2180b4e72 và Workflow commit42e37adf7.
5. Original plan reports baseline/canonical-door research là snapshot evidence, không implementation success.

## Mục tiêu không được cắt

- Ba góc nhìn shaping thực: system/alternative/constraint, task khác nhau, không biết sibling proposals ở first pass.
- Critique có tác động và independent red-team kiểm **đúng recommendation cuối**/authority/dissent, không đủ tên role là xong.
- Specialist khi material need phát sinh trong critique hoặc recommendation review, contribution dùng trước advice; unavailable/remaining gap nói thật.
- Dialogue clarify/challenge/new context/alternative/composition/revise/close, chỉ chạy affected work, recovery không nhân đôi settled work.
- Human intent/constraint/turn nguyên văn có nguồn rõ; consent khác instruction; không giả quyết định/deferral/consensus.
- Read-only actual worker confinement và report-success; policy resolution/input omission không phải sandbox/read-secrecy proof.

## Vấn đề source và candidate design

Astra tìm bốn blocker review trước bỏ sót: pre-synthesis red-team không thấy packet cuối; specialist mới phát sinh chưa có legal boundary; findings làm Workflow fail; Unit ID chỉ association sau run trả về nên resume có thể chạy lại. Nguyên nhân/mốc source ở rationale và Phase02. Trước đây “chỉ ba seams” và “một start” là claim chưa đủ cơ sở, đã rút.

Candidate: finite analysis(frame/3-seat shaping/critique) → reviewed recommendation(producer=synthesizer, reviewer/red-team inspect same packet) → explanation/no-Unit human close. Actual reports ở boundary cho phép bounded specialist + affected recommendation trước explanation, không fake human gate/conditional scheduler. Driver chỉ chọn semantic next graph, không seat scheduler/queue/retry/state authority.

Runtime contracts ở existing owners: panel params, definition CLI, contextRefs/provenance/capture, opt-in completed findings routing, durable Unit preparation/Workflow association/reconnect. Five contracts không phải cam kết sufficiency; early gate phải chứng minh. Định nghĩa/task prose không được chứa infrastructure pins.

Hai human material reopens và một specialist intervention/pass là candidate bounds công khai, không lịch sử/guarantee. Phase01 khóa diễn giải, early proof kiểm giới hạn. Nếu advice vẫn thiếu căn cứ, báo thiếu với owner, không bịa recommendation hoặc reset budget. Material CASE mới chỉ do ý định thật, không budget hack.

## Phases

| # | Phase | Depends on | Exit |
|---|---|---|---|
| 01 | [Intent, challenges and preservation contract](phase-01-start.md) | — | Scope/roles/owner authority/complexity budget and proof locked |
| 02 | [Runtime contracts + early feasibility](phase-02-early-runtime-feasibility.md) | 01 | Seven live scenarios ACCEPT before large cutover/render; failure blocks this plan |
| 03 | [Thin canonical skill cutover](phase-03-thin-skill-cutover.md) | 02 | Source/task/finite definitions coherent, only after early proof and shared-source barrier |
| 04 | [Own materialization + installed-entry acceptance](phase-04-installed-entry-acceptance.md) | 03 | Regenerate/restage through existing doors; installed entry, full behavior and relevant/full suite proof |

Graph `01 → 02 → 03 → 04`. No hidden dependency on completing original doctor/root hygiene. Research/early prototype can run independently; shared runtime/build operations require writer serialization.

## Cross-plan ownership contract

- Original single-door01 minimal config/truth cleanup in canonical architecture skill must LAND before this03 edits SAME source. This is one explicit phase barrier, not blockedBy entire original plan. Original phases02/04/05/06 do not wait on this plan.
- Original02 owns generated-header feature. This04 owns regenerate/restage of its changed skill via build:skills + established release door; use selected generator revision with source provenance. If original02 is integrated, respect its headers; if not, do not claim headers implemented. No dependency on original06 doctrine/cleanup.
- Existing runner spec/changelog, shared runtime code, render/release artifacts have one active writer/builder. Snapshot/baton/integrate before generation; never stale overwrite/copy a new runtime over another plan. Distinct research can be parallel.
- No duplicated implementation/phase aliases left in original plan. Expanded phases/matrix moved here, historical baseline remains there. Unrelated plans (convention, dev activation, docs migration) remain untouched.

## Early ACCEPT / KILL — chống gần cuối mới lòi

Phase02 prototype uses existing in-process Workflow API before full skill rewrite/regeneration/release. Need real external target and actual workers. Prove: distinct cognition; objection trace to final advice; exact final-packet review; specialist newly discovered after critique/during review; findings reaches explanation but execution failures never pass; interrupted Unit/capture/parent-child recovery; human authority/bounds; workspace write-denial with successful outbox.

Record actual starts, Units, assignments/rounds, added contracts/owners, lead-active commands/time, human interruptions, wall-clock and provider usage/cost where available. Existing normal/material cases are comparison baseline if runnable; explain capability differences. No unmeasured promise of speed/cost or old-engine superiority. Do not resurrect retired runtime just to make a benchmark.

KILL/re-shape before03 if need second scheduler/store/registry/roster, seat-level lead orchestration, unbounded loops, fake owner turn/pass, duplicate work, weak confinement, or new complexity/friction without load-bearing purpose. Name smaller alternative and evidence. If true goal/law conflict persists, owner decides; agent cannot silently delete capabilities. Early gate failure blocks ONLY this advisory plan, not original hygiene.

## Success criteria and current evidence

Every preservation row proved through real reports; new claims reviewed in final packet, dissent not washed; bounded specialist actually changes/informs recommendation; human decisions/uncertainty distinct. Original/new owner words reach consumers with provenance/captured bytes. Crash recovery reuses settled execution, no accidental duplicate live worker. Installed entry exercises same behavior, not just a pasted source/API prototype. Consumer tests cover boundaries/errors/precedence and defaults; no source-text/model-token/forwarding/mock-echo tests. Spec/changelog updated; no scaffolding left; final suite/run evidence required.

Astra re-review of pre-split corrected design: correct/zero findings, accepting structure + early gate only. Live feasibility, confinement, recovery, cognitive quality and latency/cost all NOT RUN. Structural split validation does not change that state. No code/build/stage/activation/deletion authorized by planning.

Final split review by Astra: correct/zero findings for scope, ownership and rationale. Both plans passed AK validation; actual Workflow translation proved 7 original/4 advisory phases with matching dependencies/human review gates, no cycles; 88 local handoff links resolved. [Verification handoff](../261006-1415-fgos-single-door-mechanisms/reports/pm-261006-single-door-progress.md). None of this establishes live runtime success.

## Exclusions and rollback

No coordination CLI/protocol/actors/specialist-slot API resurrection, second authorizer/CAS/state database/quality oracle, generic retry/telemetry/classifier framework, provider/transport/confinement change, or unrelated distribution/root cleanup. Generic runtime repairs stay inside current owners with old default/regression protection; any boundary/law change needs explicit re-shaping rather than convenience expansion.

Rollback contracts with dependent skill promises/specs; regenerate/restage via existing doors; keep original hygiene independently reversible. Do not rewrite historical events/answered gates. Implementation requires separate instruction; a plan being valid does not mean product proven.
