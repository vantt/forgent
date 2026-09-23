const fs = require('fs');

function updateTestFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  // Replace the assertions inside the 7 tests
  content = content.replace(
    /test\('approve --github without --pr is a validation error[^]*?\n}\);/g,
    `test('approve --github without --pr is explicitly forbidden', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-nopr');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-approve-nopr', '--github'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, \`\${result.stdout}\${result.stderr}\`);
  assert.match(result.stderr, /explicitly forbidden/);
});`
  );

  content = content.replace(
    /test\('approve --github --pr on an item with a missing-evidence[^]*?\n}\);/g,
    `test('approve --github --pr on an item with a missing-evidence is explicitly forbidden', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-cos-missing');
  run(cwd, ['edit', 'gh-approve-cos-missing', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);
  commitPendingBeforeApprove(cwd, 'gh-approve-cos-missing');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-approve-cos-missing', '--github', '--pr', '42'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, \`\${result.stdout}\${result.stderr}\`);
  assert.match(result.stderr, /explicitly forbidden/);
});`
  );

  content = content.replace(
    /test\('approve --github with a dirty main tree is NOT blocked[^]*?\n}\);/g,
    `test('approve --github with a dirty main tree is explicitly forbidden', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-dirty');
  commitPendingBeforeApprove(cwd, 'gh-approve-dirty');
  fs.writeFileSync(path.join(cwd, 'unrelated-dirt.txt'), 'uncommitted\\n');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-dirty', '--github', '--pr', '5'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, \`\${result.stdout}\${result.stderr}\`);
  assert.match(result.stderr, /explicitly forbidden/);
});`
  );

  content = content.replace(
    /test\('approve --github --pr on a fake gh merge success transitions[^]*?\n}\);/g,
    `test('approve --github --pr on a fake gh merge success is explicitly forbidden', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-merged');
  commitPendingBeforeApprove(cwd, 'gh-approve-merged');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-merged', '--github', '--pr', '42'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, \`\${result.stdout}\${result.stderr}\`);
  assert.match(result.stderr, /explicitly forbidden/);
});`
  );

  content = content.replace(
    /test\('approve --github --pr on a fake gh merge failure transitions[^]*?\n}\);/g,
    `test('approve --github --pr on a fake gh merge failure is explicitly forbidden', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-blocked');
  const fake = writeAuthFailFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-blocked', '--github', '--pr', '99'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, \`\${result.stdout}\${result.stderr}\`);
  assert.match(result.stderr, /explicitly forbidden/);
});`
  );

  fs.writeFileSync(file, content);
}

updateTestFile('test/cli/fgos-approve-4.test.mjs');

let content5 = fs.readFileSync('test/cli/fgos-approve-5.test.mjs', 'utf8');
content5 = content5.replace(
  /test\('approve --github --pr on the same self-modifying diff PROCEEDS[^]*?\n}\);/g,
  `test('approve --github --pr on the same self-modifying diff is explicitly forbidden', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-iron-ack-item');
  const fgosDir = path.join(cwd, '.fgos');
  const config = { actions: { allowSelfModification: false } };
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify(config));
  execGit(cwd, ['add', '.fgos/config.json']);
  execGit(cwd, ['commit', '-m', 'config']);
  commitPendingBeforeApprove(cwd, 'gh-iron-ack-item');

  fs.writeFileSync(path.join(cwd, 'src/actions.mjs'), '// changed\\n');
  execGit(cwd, ['add', 'src/actions.mjs']);
  execGit(cwd, ['commit', '-m', 'mod']);
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-iron-ack-item', '--github', '--pr', 'f01', '--acknowledge-iron-law'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, \`\${result.stdout}\${result.stderr}\`);
  assert.match(result.stderr, /explicitly forbidden/);
});`
);
fs.writeFileSync('test/cli/fgos-approve-5.test.mjs', content5);

