import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('runner liveness retains current decision assertions with complete-record consumer evidence', () => {
  const root = path.resolve(import.meta.dirname, '../..');
  const reportDir = 'plans/260925-documentation-authority-unification/reports/phase-06/';
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-liveness-'));
  try {
    const original = fs.readFileSync(path.join(root, reportDir, 'step9-liveness-scan.mjs'), 'utf8');
    // Redirect only report output; all source and consumer evidence stays real.
    const source = original.replace('fs.writeFileSync(R+f,', `fs.writeFileSync(${JSON.stringify(scratch + '/') }+f,`)
      .replace("assert.equal(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'plan/260925-documentation-authority-unification');", '');
    assert.notEqual(source, original);
    const env = { ...process.env }; delete env.CLAUDE_CODE_SESSION_ID;
    execFileSync(process.execPath, ['--input-type=module'], { cwd: root, input: source, env, maxBuffer: 2e6 });
    const scan = JSON.parse(fs.readFileSync(path.join(scratch, 'step9-liveness.json'), 'utf8'));
    // Preserve the original 31 protected headings by content-derived identity,
    // not their ordinal positions: main can insert headings before any of them.
    // The flag retains the same 13 complete-record evidence/non-retirement cases.
    const required = [
      ['0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập', true],
      ['quyết-định-2', true],
      ['0021-wire-main-checkout-lock-hook-qua-fgos-doctorsetup-không-epoch-fence', true],
      ['quyết-định-3', false],
      ['quy-tắc-chọn-cơ-chế-dispatch-áp-dụng-y-hệt-cho-subtask-lẫn-capacity', true],
      ['0033-capacity-cli-spawn-shaped-thắng-haslivetaskaccess-thu-hẹp-0026-rule-2', true],
      ['quyết-định-11', true],
      ['cơ-chế-phân-biệt-không-phải-heuristic-mới', false],
      ['capability-aware-dispatch-activation-tsk-46f', true],
      ['quyết-định-13', false],
      ['agent-coordination-foundation-shared-capability-catalog-planning-awareness-cluster-docshistoryagent-coordination-foundationplanmd', true],
      ['quyết-định-14', false],
      ['confinement-authority-một-cửa-kiểm-soát-giam-giữ-runtime-executethroughconfinement', false],
      ['đổi-sang-atomic-cas-commit-tree-cho-merge-gate-d-adr0042-atomic-cas-commit-tree-cho-merge-gate', true],
      ['0046-gom-thang-tierrigor-2-thang-1-bảng-xoá-mọi-lớp-chồng', true],
      ['0047-p1-lõi-thực-thi-unit-một-bind-một-cửa-chạy-fgos-run-3-pattern-cộng-tác-đóng-4-mối-authority-l5-1-đã-bị-thay-một-phần-bởi-0061', false],
      ['0048-p2-plan-chạy-được-unit-cho-mọi-đường-vào-driver-mỏng-fgos-run-bỏ-demandfactsmatcher', false],
      ['0049-p3b-work-không-còn-stage-work-chỉ-còn-bản-ghilifecycle-workflow-runner-là-sequencer-duy-nhất-đóng-a4', true],
      ['0050-p6-nối-thật-herdr-là-transport-mặc-định-posture-một-đường-fallback-quota-qua-pane-mới', false],
      ['0051-cổng-ghi-file-đi-theo-chuỗi-fallback-quyền-git-của-invocation-giữ-lại-cho-work-loop', true],
      ['0052-worker-không-bao-giờ-có-quyền-git-runner-commit-trên-mọi-đường-thay-mục-2-của-0051-đã-bị-thay-một-phần-bởi-0060', false],
      ['0053-một-cơ-chế-truyền-kết-quả-đường-dẫn-report-trong-contextrefs-phân-giải-một-lần', true],
      ['0055-panel-khác-họ-provider-giữa-các-ghế-là-ưu-tiên-mềm-bind-rải-ghế-theo-thứ-tự-prefer-reviewed-vẫn-cứng', false],
      ['0056---seats-chuyên-biệt-hoá-ghế-panel-bằng-lens-khi-khởi-động-không-thêm-workflow-yaml-hay-registry', false],
      ['0057---seats-name-persona-có-tên-theo-ba-tầng-tra-cứu-ghim-nội-dung-lúc-start-gắn-đúng-một-ghế', false],
      ['0058-provider-failure-fails-over-inside-execution-core-another-account-of-the-same-provider-first-then-the-next-candidate', false],
      ['0059-a-domain-persona-pack-is-a-folder-what-a-seat-can-name-what-it-pinned-and-who-ran-it-are-each-stated-by-one-read', false],
      ['0060-runner-commit-theo-writes-của-unit-một-matcher-preflight-index-resume-chỉ-commit-brief-ghi-file-nói-rõ-phạm-vi-thay-mục-1-2-của-0052', false],
      ['0061-unit-ad-hoc-được-preferpersona-mềm-one-liner-fgos-run-workflow-start---units--effort-unit-ghi-nối-nhánh-thay-một-phần-mục-1-của-0047', false],
      ['0062-xoá-cửa-thô-dispatch-là-tầng-thấp-fanout-về-tầng-work-thay-phần-purpose-door-của-rul68-2-tầng-dispatch-và-phần-mỗi-cửa-một-lane-posture-của-rul77-posture-belongs-to-the-capability', false],
      ['0063-work-chỉ-là-bên-dùng-dispatch-nhận-input-generic-thay-phần-đầu-vào-còn-lại-của-rul73-dispatch-does-not-know-work2', false],
    ].map(([anchor, completeRecord]) => {
      const matches = scan.sections.filter(section => section.anchor === anchor);
      assert.equal(matches.length, 1, `protected heading must resolve uniquely: ${anchor}`);
      return { section: matches[0], completeRecord };
    });
    assert.deepEqual(required.filter(({ section }) => section.classification !== 'current-decision').map(({ section }) => section.anchor), []);
    for (const { section } of required.filter(({ completeRecord }) => completeRecord)) {
      const evidence = section.recordEvidence;
      assert(evidence.consumers.length || evidence.extantPaths.length, section.anchor);
      assert(evidence.startLine <= section.startLine && evidence.endLine >= section.endLine);
      for (const consumer of evidence.consumers) {
        const line = fs.readFileSync(path.join(root, consumer.path), 'utf8').split('\n')[consumer.line - 1];
        assert.equal(line, consumer.text);
        assert(line.includes(consumer.symbol));
      }
      for (const cited of evidence.extantPaths) assert(fs.existsSync(path.join(root, cited)));
      assert.equal(section.retired, false);
      assert.equal(section.retirementEligible, false);
    }
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});
