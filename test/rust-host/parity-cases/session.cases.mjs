// Session parity table: every `fgos session` call the base release answers, as a short script of steps run on
// a fresh repository per entry. A step is a call (`args`, run in `cwd`) or an action (`do`) that changes the
// fixture the same way for both entries. `$SID0`, `$SID1` in an argument name the sessions the script started,
// in order. `mode`: `bytes` compares exit status, stdout and stderr after the run-specific values (ids, paths,
// hashes, times, pids) are replaced by stable tokens; `exit` compares the exit status alone, for the calls whose
// text the host words once for every ported verb (a missing or unknown sub-command).
//
// `cwd`: `repo` (the project root), `sub` (a subdirectory of it), `tmp` (a directory that is no repository),
// `wt0` (the first session's worktree), `wt0/sub` (a subdirectory of it), `linked` (a linked worktree of the
// repository), `frozen` (a linked worktree that carries its own real `.fgos`).
export const cases = [];

const call = (args, extra = {}) => ({ args, ...extra });
const add = (id, steps, extra = {}) => cases.push({ id: `session-${id}`, steps, ...extra });

add('list-empty', [call(['session', 'list'])]);
add('list-json', [call(['session', 'list', '--json'])]);
add('gc-empty', [call(['session', 'gc'])]);

add('start', [call(['session', 'start']), call(['session', 'list'])]);
add('start-json-item', [call(['session', 'start', '--item', 'tsk-abc', '--json']), call(['session', 'list'])]);
add('start-bare-item', [call(['session', 'start', '--item'])]);
add('start-empty-item', [call(['session', 'start', '--item', ''])]);
add('start-item-equals', [call(['session', 'start', '--item=tsk-abc'])]);
add('start-unknown-flag', [call(['session', 'start', '--bogus'])]);
add('start-unknown-flags-in-order', [call(['session', 'start', '--zeta', '1', '--alpha', '--item=x'])]);
add('list-unknown-flag', [call(['session', 'list', '--bogus'])]);
add('end-unknown-flag', [call(['session', 'end', 'x', '--forse'])]);
add('gc-unknown-flag', [call(['session', 'gc', '--all'])]);

add('missing-sub', [call(['session'], { mode: 'exit' })]);
add('unknown-sub', [call(['session', 'bogus'], { mode: 'exit' })]);

add('start-from-a-non-repository', [call(['session', 'start'], { cwd: 'tmp' })]);
add('start-from-a-linked-worktree', [{ do: 'linkedWorktree' }, call(['session', 'start'], { cwd: 'linked' })]);
add('start-from-a-frozen-worktree', [{ do: 'frozenWorktree' }, call(['session', 'start'], { cwd: 'frozen' })]);
add('end-from-a-frozen-worktree', [{ do: 'frozenWorktree' }, call(['session', 'end', 'x'], { cwd: 'frozen' })]);
add('gc-from-a-frozen-worktree', [{ do: 'frozenWorktree' }, call(['session', 'gc'], { cwd: 'frozen' })]);
add('dir-names-another-project-from-a-subdirectory', [
  { do: 'otherProject' },
  call(['session', 'list', '--dir', '$OTHER'], { cwd: 'sub' }),
  call(['session', 'start', '--dir', '$OTHER', '--json'], { cwd: 'repo' }),
  call(['session', 'list', '--dir', '$OTHER'], { cwd: 'repo' }),
// The base release makes a store of its own below the project when it is run from a subdirectory; the host
// acts on the project's store (the one difference, accepted), so the fixture's subdirectory is not compared.
], { ignoreSub: true });
add('dir-that-does-not-exist', [call(['session', 'list', '--dir', '/nonexistent/project'])]);

add('start-from-inside-a-session-worktree', [
  call(['session', 'start']),
  call(['session', 'start'], { cwd: 'wt0' }),
  call(['session', 'list']),
]);
add('start-from-below-a-session-worktree', [
  call(['session', 'start']),
  { do: 'subdirOfSession' },
  call(['session', 'start'], { cwd: 'wt0/sub' }),
  call(['session', 'list']),
]);

add('end-without-an-id', [call(['session', 'end'])]);
add('end-force-before-the-id', [call(['session', 'start']), call(['session', 'end', '--force', '$SID0'])]);
add('end-unknown', [call(['session', 'end', 'nope'])]);
add('end-unknown-force', [call(['session', 'end', 'nope', '--force'])]);
add('end-clean', [call(['session', 'start']), call(['session', 'end', '$SID0']), call(['session', 'list'])]);
add('end-twice', [call(['session', 'start']), call(['session', 'end', '$SID0']), call(['session', 'end', '$SID0'])]);
add('end-with-force-flag', [call(['session', 'start']), call(['session', 'end', '$SID0', '--force', '--json']), call(['session', 'list'])]);
add('end-diverged-then-forced', [
  call(['session', 'start']),
  { do: 'commitInside', session: 0 },
  call(['session', 'end', '$SID0']),
  call(['session', 'list']),
  call(['session', 'end', '$SID0', '--force']),
  call(['session', 'list']),
]);
add('end-dirty-and-forced-keeps-everything', [
  call(['session', 'start']),
  { do: 'commitInside', session: 0 },
  { do: 'dirty', session: 0 },
  call(['session', 'end', '$SID0', '--force']),
  call(['session', 'list']),
], { nativeCause: true });

add('gc-reclaims-a-dead-start-process', [
  call(['session', 'start']),
  call(['session', 'start', '--item', 'tsk-live']),
  { do: 'markDead', sessions: [0] },
  call(['session', 'gc']),
  call(['session', 'list']),
]);
add('gc-spares-a-diverged-and-a-dirty-orphan', [
  call(['session', 'start']),
  call(['session', 'start']),
  call(['session', 'start']),
  { do: 'commitInside', session: 0 },
  { do: 'dirty', session: 1 },
  { do: 'markDead', sessions: [0, 1, 2] },
  call(['session', 'gc']),
  call(['session', 'list']),
]);
add('gc-from-inside-a-live-session-worktree', [
  call(['session', 'start']),
  call(['session', 'start']),
  { do: 'markDead', sessions: [0, 1] },
  call(['session', 'gc'], { cwd: 'wt0' }),
  call(['session', 'list']),
]);
add('gc-keeps-a-row-whose-process-it-cannot-judge', [
  call(['session', 'start']),
  { do: 'dropRecord', session: 0 },
  call(['session', 'gc']),
  call(['session', 'list']),
]);
add('gc-reclaims-a-row-whose-worktree-is-gone', [
  call(['session', 'start']),
  { do: 'removeWorktreeDir', session: 0 },
  call(['session', 'gc']),
  call(['session', 'list']),
]);

for (const [id, text] of [['not-json', '{bad'], ['not-an-array', '{}']]) {
  add(`registry-${id}`, [
    { do: 'writeRegistry', text },
    call(['session', 'list']),
    call(['session', 'start']),
    call(['session', 'gc']),
    call(['session', 'end', 'x']),
    { do: 'readRegistry' },
  ]);
}
