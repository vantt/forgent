const fs = require('fs');
const file = 'src/verbs/merge/approve.mjs';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('mergeGitHubPR')) {
  content = content.replace(
    "import { isMainTreeClean } from '../../runner/clean-tree.mjs';",
    "import { isMainTreeClean } from '../../runner/clean-tree.mjs';\nimport { mergeGitHubPR } from '../../runner/github-adapter.mjs';"
  );
}

const githubBlock = `
  if (github) {
    if (source !== 'runner') {
      throw new StoreError('validation', \`approve --github: "\${id}" is a \${source}-sourced item — GitHub approval requires a runner-sourced item with a live fgw/\${id} branch (no branch exists to attach a PR to for pull/legacy items).\`);
    }
    // Same refusal \`requireField\` produces in the adapter: absent,
    // empty, or bare (parsed as boolean \`true\`) all mean "no value given".
    if (prNumber === undefined || prNumber === null || prNumber === '' || prNumber === true) {
      throw new StoreError('validation', 'approve --github requires --pr <n> (the GitHub PR number from a prior review --github)');
    }
    // Acceptance-evidence pre-flight (tsk-396 D2): checked BEFORE the
    // real GitHub-side merge, not caught after the fact inside
    // moveWork's own \`to === 'delivered'\` check — a GitHub merge can't
    // be \`git merge --abort\`ed the way a local one can, so this matters
    // even more here than on the local paths above.
    assertAcceptanceEvidence(id, item);
    assertPlanEvidence(id, item, repoRoot);
    const result = await mergeGitHubPR(repoRoot, prNumber, { ghCommand });
    if (result.outcome === 'merged') {
      // Accepted rough edge (this slice): unlike the local merged path, no
      // cleanupMergedBranch runs — the local fgw/<id> branch and its pushed
      // origin copy are both left in place after a server-side merge (no
      // local cleanup mechanism exists for a branch merged on GitHub).
      // tsk-5dk D2: mergeCommit comes from mergeGitHubPR's own post-merge
      // status read (github-adapter.mjs) — may be undefined if GitHub's
      // eventual consistency hasn't attached it yet (accepted rough
      // edge, same as the module's own doc comment); mergedInto matches
      // the literal 'main' the local root-into-main path already uses.
      const mergedSha = result.mergeCommit?.oid;
      recordApprovePostSuccessFault(dir, { id, phase: 'github merge', mergedSha, mergedInto: 'main' });
      const { event } = moveWork(dir, { id, to: 'delivered', expectedStatus: 'awaiting-approval', role: 'human', mergedSha, mergedInto: 'main' });
      return { id, mode: 'github', to: 'delivered', prNumber, seq: event.seq };
    }
    // blocked — mirrors the local merge-conflict/verify-fail-post-merge
    // shape: park awaiting-approval -> blocked with the classifyGhFailure reason,
    // plus a friction record carrying the failure layer and gh's stderr.
    const reason = result.reason;
    const layer = { 'auth-failure': 'environment', 'rate-limited': 'environment', 'unreachable': 'environment', 'gh-invocation-failed': 'state' }[reason] || 'state';
    const conflict = moveBlockedOrConflict(dir, { id, reason, role: 'system' });
    if (conflict) return conflict;
    addFriction(dir, {
      id,
      disposition: 'blocked',
      errorClass: reason,
      layer,
      attempts: 1,
      detail: \`gh pr merge #\${prNumber} failed at step \${result.step}: \${result.detail}\`,
    });
    return { id, mode: 'github', to: 'blocked', prNumber, reason, detail: result.detail };
  }
`;

const anchor = `  if (github && process.env.NODE_ENV !== 'test') {
    throw new StoreError('validation', 'approve --github is explicitly forbidden (test suite bypass not allowed for trunk merges).');
  }`;

content = content.replace(anchor, anchor + githubBlock);
fs.writeFileSync(file, content);
