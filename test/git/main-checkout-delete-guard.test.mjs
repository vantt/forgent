import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { judgeDeleteCommand } from '../../src/git/main-checkout-delete-guard.mjs';
import { deleteGuardPrefilter } from '../../src/setup/agent-hooks.mjs';

// The guard reads the checkout layout from the filesystem: a main checkout has a `.git` directory
// and a `.fgos` directory, a linked worktree has a `.git` file. The fixture builds exactly that.
function layout() {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'delete-guard-')));
  const main = path.join(base, 'projects', 'forgent');
  for (const dir of ['.git', '.fgos/runtime', '.claude', 'target', 'node_modules', 'src']) fs.mkdirSync(path.join(main, dir), { recursive: true });
  const worktree = path.join(base, 'projects', 'forgent-worktrees', 'harden-x');
  fs.mkdirSync(path.join(worktree, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(worktree, '.git'), `gitdir: ${main}/.git/worktrees/harden-x\n`);
  const plain = path.join(base, 'scratch');
  fs.mkdirSync(plain);
  return { base, main, worktree, plain, missing: path.join(base, 'projects', 'forgent-worktrees', 'never-created') };
}

// Every refusal asserted below also has to pass the prefilter that the hook wiring runs before it
// starts the guard: a refused command the prefilter would skip is a wipe the guard never sees.
const judge = (command, cwd, env = {}) => {
  const verdict = judgeDeleteCommand(command, { cwd, env: { HOME: '/nonexistent-home', ...env } });
  if (verdict.blocked) assert.equal(deleteGuardPrefilter.matches(command), true, `the prefilter would skip a refused command: ${command}`);
  return verdict;
};

test('the command that wiped the main checkout is refused: a failed cd chained with ; and && into xargs rm', () => {
  const { main, missing } = layout();
  const verdict = judge(
    `fgos worktree create ${missing} --branch harden/x --base origin/main; cd ${missing} && npm ci; git status --porcelain --ignored | grep '^!!' | xargs rm -rf`,
    main,
  );
  assert.equal(verdict.blocked, true);
  assert.match(verdict.reasons.join('\n'), /xargs rm/);
});

test('the incident form with the worktree in a shell variable is refused', () => {
  const { main } = layout();
  const verdict = judge(`W=$(mktemp -d); cd $W && ls; git status --porcelain --ignored | grep '^!!' | xargs rm -rf`, main);
  assert.equal(verdict.blocked, true);
});

test('a ;-chained cd that may fail keeps the old directory in play', () => {
  const { main, worktree, missing } = layout();
  assert.equal(judge(`cd ${missing}; git clean -fdx`, main).blocked, true);
  assert.equal(judge(`cd ${worktree} || true; git clean -fdx`, main).blocked, true);
});

test('an &&-chained cd into a linked worktree is allowed', () => {
  const { main, worktree } = layout();
  assert.deepEqual(judge(`cd ${worktree} && git clean -fdx`, main), { blocked: false, reasons: [] });
  assert.equal(judge(`cd ${worktree} && git status --porcelain --ignored | grep '^!!' | xargs rm -rf`, main).blocked, false);
});

test('git clean with -x or -X is refused in the main checkout, at its root or below', () => {
  const { main } = layout();
  for (const cmd of ['git clean -fdx', 'git clean -xfd', 'git clean -X -f', 'git clean -ffdX', '/usr/bin/git clean -fdx']) {
    assert.equal(judge(cmd, main).blocked, true, cmd);
  }
  assert.equal(judge('git clean -fdx', path.join(main, 'src')).blocked, true);
  assert.equal(judge('git clean -n', main).blocked, false, 'no -x: untracked files only, out of scope');
});

test('git -C names the directory: a linked worktree passes, the main checkout does not', () => {
  const { main, worktree, plain } = layout();
  assert.equal(judge(`git -C ${worktree} clean -fdx`, main).blocked, false);
  assert.equal(judge(`git -C ${main} clean -fdx`, worktree).blocked, true);
  assert.equal(judge(`git -C ../forgent clean -fdX`, worktree.replace('harden-x', '')).blocked, true);
  assert.equal(judge('git -C "$W" clean -fdx', plain).blocked, true, 'an unresolvable -C is refused');
});

test('xargs rm is refused in the main checkout and allowed in a linked worktree or outside any checkout', () => {
  const { main, worktree, plain } = layout();
  assert.equal(judge('git ls-files -o | xargs -0 rm', main).blocked, true);
  assert.equal(judge('find . -name "*.log" | xargs -I{} rm -f {}', main).blocked, true);
  assert.equal(judge('git status --porcelain --ignored | xargs rm -rf', worktree).blocked, false);
  assert.equal(judge('ls | xargs rm', plain).blocked, false);
});

test('rm -r of the main checkout root or a top-level runtime directory is refused, however it is spelled', () => {
  const { main, worktree, base } = layout();
  for (const cmd of [
    'rm -rf .fgos',
    'rm -r .claude/',
    'rm -rf target node_modules',
    'rm -fr ./target',
    'rm --recursive --force node_modules',
    'rm -rf .',
    'rm -rf *',
    'rm -rf .fgos/*',
    `rm -rf ${main}`,
    `rm -rf ${path.join(base, 'projects')}`,
    'sudo rm -rf .fgos',
    `bash -c 'cd ${main} && rm -rf .fgos'`,
    'rm -rf "$(git rev-parse --show-toplevel)"/.fgos',
    'for f in .fgos target; do rm -rf "$f"; done',
  ]) {
    assert.equal(judge(cmd, main).blocked, true, cmd);
  }
  assert.equal(judge(`rm -rf ${main}/.fgos`, worktree).blocked, true, 'absolute target from a worktree');
  assert.equal(judge(`rm -rf ${main}`, '/').blocked, true);
});

test('rm of single named files and of deeper paths stays allowed in the main checkout', () => {
  const { main } = layout();
  for (const cmd of ['rm sc.log', 'rm -f node_trace.1.log w1.log', 'rm -rf .fgos/runtime/tmp/scratch', 'rm -rf target/debug/incremental', 'rm -r src/old-dir']) {
    assert.equal(judge(cmd, main).blocked, false, cmd);
  }
});

test('rm -r of a linked worktree runtime directory is allowed', () => {
  const { main, worktree } = layout();
  assert.equal(judge('rm -rf .fgos target node_modules', worktree).blocked, false);
  assert.equal(judge(`rm -rf ${worktree}/target`, main).blocked, false);
  assert.equal(judge(`W=${worktree}; rm -rf $W/node_modules`, main).blocked, false, 'a literal assignment is followed');
});

test('find -delete or -exec rm under the main checkout is refused, under a worktree allowed', () => {
  const { main, worktree, base } = layout();
  assert.equal(judge('find . -name "*.tmp" -delete', main).blocked, true);
  assert.equal(judge(`find ${main}/.fgos -type f -exec rm {} +`, worktree).blocked, true);
  assert.equal(judge(`find ${base} -name x -delete`, worktree).blocked, true, 'a start above the main checkout');
  assert.equal(judge('find . -name "*.tmp" -delete', worktree).blocked, false);
  assert.equal(judge('find . -name "*.tmp" -print', main).blocked, false, 'no delete');
});

test('a heredoc, here-string or pipe that feeds a shell is the shell\'s script and is judged', () => {
  const { main, worktree } = layout();
  for (const cmd of [
    "bash <<'X'\nrm -rf ./*\nX",
    'sh -s <<EOF\ngit clean -fdx\nEOF',
    "cat <<'A' > notes.txt; zsh <<'B'\nrm -rf x\nA\nrm -rf .fgos\nB",
    "bash <<< 'rm -rf .fgos'",
    "echo 'rm -rf .fgos' | sh",
  ]) {
    assert.equal(judge(cmd, main).blocked, true, cmd);
  }
  assert.equal(judge("bash <<'X'\nrm -rf ./*\nX", worktree).blocked, false, 'the same script in a linked worktree');
  assert.equal(judge("cat > run.sh <<'X'\nrm -rf ./*\nX\nbash -n run.sh", main).blocked, false, 'a heredoc fed to cat is data, a script file operand is not read');
});

test('the inner command of xargs and find -exec is unwrapped through wrappers and shells', () => {
  const { main, worktree } = layout();
  for (const cmd of [
    'find . -exec sudo rm -rf {} +',
    'find . -name x -exec /bin/rm -f {} \\;',
    "ls | xargs sh -c 'rm -rf \"$@\"' _",
    "find . -type d -exec bash -c 'rm -r \"$0\"' {} \\;",
  ]) {
    assert.equal(judge(cmd, main).blocked, true, cmd);
  }
  assert.equal(judge('find . -exec sudo rm -rf {} +', worktree).blocked, false);
  assert.equal(judge("find . -name '*.md' -exec grep -l rm {} +", main).blocked, false, 'an -exec that is not rm');
});

test('export of a literal path is followed like a plain assignment', () => {
  const { main, worktree } = layout();
  assert.equal(judge(`export W=${worktree}; cd "$W" && rm -rf ./*`, main).blocked, false);
  assert.equal(judge('export W=$(pwd); cd "$W"; rm -rf ./*', main).blocked, true);
});

test('words inside quotes, comments and heredoc bodies are not commands', () => {
  const { main } = layout();
  const commit = `git commit -m "$(cat <<'EOF'\nfix: never xargs rm -rf after a failed cd; git clean -fdx\nEOF\n)"`;
  assert.equal(judge(commit, main).blocked, false);
  assert.equal(judge(`echo 'git clean -fdx' # rm -rf .fgos`, main).blocked, false);
  assert.equal(judge(`grep -n "xargs rm" docs/x.md`, main).blocked, false);
});

test('an unresolvable directory or operand in the main checkout is refused and says why', () => {
  const { main, plain } = layout();
  const verdict = judge('cd "$WT"; rm -rf "$DIR"', main);
  assert.equal(verdict.blocked, true);
  assert.match(verdict.reasons.join('\n'), /cannot be resolved/);
  assert.equal(judge('rm -rf "$DIR"', plain).blocked, false, 'outside any main checkout');
  assert.equal(judge('cd -; git clean -fdx', plain).blocked, true, 'cd - leaves the directory unknown');
});

test('a shell or eval running a computed script, and a quoted command name, are refused in the main checkout', () => {
  const { main } = layout();
  for (const cmd of ['eval "$X"', 'bash -c "$X"', 'dash -c "$X"', 'ksh -c "$X"', 'zsh -c "$X"', 'echo hi | sh', 'echo hi\nsh', "'rm' -rf .fgos", '"rm" -rf .', 'find . -exec sh -c "$X" {} \\;']) {
    assert.equal(judge(cmd, main).blocked, true, cmd);
  }
});

test('a directory outside any checkout is never judged', () => {
  const { plain } = layout();
  assert.equal(judge('git clean -fdx; rm -rf *; find . -delete', plain).blocked, false);
});
