// `fgos agents list` parity table: the personas the base release lists, from the project's tiers and the payload's,
// and every refusal of its arm, on a fresh world per entry (see `execution-world.mjs`). Both entries read the base
// release's payload, so the shipped personas are the same. Directory entries come out in bytewise order on the host
// (the Node listing used the locale's collation), so names in a case differ only where both orders agree: lower
// case letters, digits and dashes. The order itself is proven by `packages/execution/contracts/agents.v1.json`.
import { runTable, tableOf } from './execution-world.mjs';

const { cases, call, add } = tableOf('agents', ['agents']);
export { cases };
export const runPreparedCase = runTable;

const persona = (name, extra = '') => ({ do: 'file', path: `fgos/agents/${name}.yaml`, text: `name: ${name}\ndescription: ${name} persona\n${extra}` });

add('list-shipped-tiers-only', [call(['list'])]);
add('list-json', [call(['list', '--json'])]);
add('list-with-a-project-persona', [persona('mine'), call(['list'])]);
add('list-with-several-project-personas', [persona('alpha'), persona('beta-two'), persona('gamma3'), call(['list'])]);
add('list-from-a-subdirectory', [persona('mine'), call(['list'], { cwd: 'sub' })]);
add('list-from-a-linked-worktree', [{ do: 'linkedWorktree' }, call(['list'], { cwd: 'linked' })]);
add('list-with-a-worktree-flag', [persona('mine'), call(['list', '--worktree', '$REPO'], { cwd: 'outside' })]);
add('list-with-a-worktree-flag-naming-a-directory-that-is-no-repository', [call(['list', '--worktree', '$OUTSIDE'], { cwd: 'outside' })]);
add('list-with-a-relative-worktree-flag', [persona('mine'), call(['list', '--worktree', '../repo'], { cwd: 'sub' })]);
add('persona-that-shadows-a-shipped-one', [{ do: 'file', path: 'fgos/agents/planner.yaml', text: 'name: planner\ndescription: my planner\n' }, call(['list'])]);
add('persona-that-names-another-name', [{ do: 'file', path: 'fgos/agents/wrong.yaml', text: 'name: other\ndescription: x\n' }, call(['list'])]);
add('persona-without-a-description', [{ do: 'file', path: 'fgos/agents/quiet.yaml', text: 'name: quiet\n' }, call(['list'])]);
add('persona-that-is-not-yaml', [{ do: 'file', path: 'fgos/agents/broken.yaml', text: 'name: [\n' }, call(['list'])]);
add('persona-that-names-model-taste', [persona('picky', 'tier: flagship\n'), call(['list'])]);
add('persona-with-keys-the-renderer-drops', [persona('extra', 'persona:\n  voice: calm\n  mood: odd\ndecision_boundary:\n  can_decide: [a]\n  rule: b\n'), call(['list'])]);
add('persona-with-a-yml-extension-is-ignored', [{ do: 'file', path: 'fgos/agents/typo.yml', text: 'name: typo\ndescription: x\n' }, call(['list'])]);
add('persona-folder-named-like-a-definition', [{ do: 'file', path: 'fgos/agents/folder.yaml/inner.txt', text: 'x' }, call(['list'])]);
add('project-core-folder-hides-the-shipped-personas-it-lacks', [{ do: 'file', path: 'core/agents/only.yaml', text: 'name: only\ndescription: only one\n' }, call(['list'])]);
add('project-domains-folder-is-never-read', [{ do: 'file', path: 'domains/own/agents/mine.yaml', text: 'name: mine\ndescription: x\n' }, call(['list'])]);

// Refusals of the arm.
add('no-sub-verb', [call([])]);
add('unknown-sub-verb', [call(['show'])]);
add('outside-any-repository', [call(['list'], { cwd: 'outside' })]);
add('unknown-flag', [call(['list', '--bogus'])]);
add('flag-with-equals', [call(['list', '--worktree=$REPO'])]);
add('dir-bare', [call(['list', '--dir'])]);
