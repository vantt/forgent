# Phase 03 — Brief producer mutating + coverage nối `writes`

Mốc M1, bước B (song song 02, 04, 05-core) · Lane L3 (`feat/rununit-settle`) · Ước lượng 0.75d · Rủi ro: trung bình

## Context

- Packet r4 R0.1 (nguyên nhân probe 1: objective bảo agent tự commit → gitdir read-only → claim blocked → `run.mjs:499` không tới commit) và R0.3 (coverage). Quyết định Lead #6 (brief, `needsWrites`), #7.
- Hiện trạng: brief read-only có dòng "result files vẫn phải ghi" (`src/runner/dispatch/assignment.mjs:897`, commit `dca2e62da`) nhưng brief mutating không nói ai commit (grep `assignment.mjs`, `operation-prompt-templates.mjs`: không có). Settlement gọi `attributeWorkspaceChanges({ preLaunchDirt, postRunDirt })` không có `declaredCoverage` (`src/runner/dispatch/settlement.mjs:656`) → `coverageMatched` luôn false. `writeScope` của effective contract = cả worktree (`effective-execution-contract.mjs:218`) — đó là phạm vi mount, giữ nguyên.
- Claim v2 bỏ qua field lạ (`agent-result-claim-contract.mjs`: "Unknown fields ... never change validity") → thêm `needsWrites` là additive, không đổi version.

## Prior art

`dca2e62da` là khuôn đúng cho thay đổi brief (sửa `assignment.mjs` + `effective-execution-contract.mjs` + `test/runner/dispatch-brief.test.mjs`, `test/runner/assignment.test.mjs`). `checkCoverage` (`evidence-attribution.mjs:123-127`) thay bằng `matchesWriteScope` (01).

## Requirements

1. **Brief mutating producer** (assignment `kind: 'unit-run'`, `mutation: 'mutating'`, role `producer`): thêm khối
   - "Chỉ ghi file trong phạm vi: <writeScope đã expand, từng dòng>."
   - "Không `git add`, không `git commit`: runner commit sau khi lượt pass, chỉ các file trong phạm vi."
   - "Dòng đầu `summary` là subject commit dạng conventional (`type(scope): ...`)."
   - "Cần ghi thêm file ngoài phạm vi: không ghi; khai `needsWrites: [<path>...]` trong agent-result.json và nói lý do trong summary."
   Brief read-only giữ nguyên. Đường Work cũ (`spawnWorker`, driver) không đổi ở phase này.
2. **Claim:** thêm rule tuỳ chọn `needsWrites` ("mảng path repo-relative nếu có") vào `CLAIM_FIELD_RULES` (`agent-result-claim-contract.mjs`); không bắt buộc, không đổi version. Đảm bảo `agentClaim` trong RunResult giữ field này (kiểm `normalizeRunResultV3`; nếu bị lọc thì giữ nó — UNPROVEN cho tới khi test).
3. **Coverage (V-M1).** Sau P00, settlement có hai lời gọi `attributeWorkspaceChanges`:
   - lời gọi cho evidence (`settlement.mjs:~713` trên cây sau P00, trước đó là `:656`);
   - lời gọi bên trong `evaluateAttributionPolicy({ attributions: attributeWorkspaceChanges({ postRunDirt: changedFiles }), ... })` (`~:734-738`). Lời gọi này sinh cảnh báo.

   Khi assignment có `writes` không rỗng, **cả hai** lời gọi đều nhận `declaredCoverage: { paths: assignment.writes }`, và policy nhận `writeScope: assignment.writes`. Có hai bộ so khớp cần thay bằng `matchesWriteScope` (01): `checkCoverage` và bộ `inScope` riêng trong `evaluateAttributionPolicy`. Số dòng thật lấy lại trên main sau P00. `coverageMatched` chỉ nghĩa "nằm trong phạm vi đã khai"; level vẫn `correlated` khi không có attestation (không phải bằng chứng tác giả). Nghiệm thu giới hạn ở file mới sau launch; file bẩn sẵn vẫn `excluded` (settlement không có `dirtyBeforeHashes`, `evidence-attribution.mjs:49-80`) — residual đã nêu.
4. `assignment-runner.mjs` chỉ sửa nếu `writes` không tới được settlement (kiểm đường `assignment` → `settleRunOutcome`; nếu đã có `assignment.writes` thì không sửa).

## Files

Sở hữu: `src/runner/dispatch/assignment.mjs` (khối brief ~880-920), `src/runner/dispatch/effective-execution-contract.mjs` (chỉ nếu cần đưa writeScope khai báo vào brief render), `src/runner/dispatch/agent-result-claim-contract.mjs`, `src/runner/dispatch/settlement.mjs` (dòng ~656), `src/runner/dispatch/evidence-attribution.mjs` (`checkCoverage`), `src/runner/dispatch/assignment-runner.mjs` (chỉ nếu req 4 cần); test `test/runner/dispatch-brief.test.mjs`, `test/runner/assignment.test.mjs`, `test/runner/evidence-attribution.test.mjs`, `test/runner/assignment-runresult.test.mjs`.
Chỉ đọc: `write-scope.mjs`, `run.mjs`.

## Bước

1. Test đỏ brief: assignment unit-run mutating producer có 4 dòng trên với writeScope cụ thể; reviewer/read-only không có. Sửa → xanh.
2. Test đỏ claim: `needsWrites` hợp lệ không làm claim invalid; xuất hiện trong instructions; còn trong `runResult.agentClaim`.
3. Test đỏ coverage:
   - file, thư mục và glob đã khai trong `writes`: `coverageMatched: true`;
   - file nằm ngoài `writes`: false;
   - `./docs` với `docs/a.md`: true (RT-R4-2);
   - cảnh báo của `evaluateAttributionPolicy` cho cùng các ca dùng đúng phạm vi đó (không có cảnh báo `outside-write-scope-correlated` cho file trong phạm vi);
   - assignment không có `writes`: giữ hành vi cũ.
4. `npm test`. Báo cáo: Spec delta (brief mutating, `needsWrites`, coverage theo writes), CHANGELOG delta.

## Merge

Merge bước B theo thứ tự 03 → 02 → 04 → 05-core, mỗi lane rebase lên main mới nhất trước khi merge. Lead không áp spec ở bước B; 07a sẽ áp. Cổng thật nằm ở G-M1 ([phase-07a](phase-07a-doctrine-additive.md#cổng-g-m1-lead)).

## Rủi ro + rollback

- Agent không theo dòng brief (vẫn tự commit) → git read-only làm lượt blocked: cổng G-M1 ca 1 bắt; khi đó đọc claim/transcript trước khi đổi gì.
- Revert commit lane; brief là text, coverage chỉ đổi một field evidence.

## Xong khi

Test bước 1-3 xanh; `npm test` exit 0; review pass.
