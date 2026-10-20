// git-spawn-match.mjs -- the one matcher the one-door gate shares (Git spec §12): the static scan
// (scripts/git-one-door-scan.mjs), the runtime spy (test/helpers/git-spawn-spy.mjs) and the sandbox
// door (scripts/lib/sandbox-git.mjs) all decide "does this run Git?" and "is this the sandbox door?"
// here, so the three can never disagree.

import fs from 'node:fs';
import path from 'node:path';
import { parseYaml } from '../../src/util/yaml.mjs';

/** The spawn-option key the sandbox door sets to its sandbox root; nothing else may set it. */
export const SANDBOX_DOOR = Symbol.for('fgos.git.sandbox-door');

/** The spawn-option key goal-check sets on a consumer's declared command (configured-binary, owner
 * decision Q1). The scan accepts it only on a spawn whose binary is not a literal. */
export const CONSUMER_COMMAND = Symbol.for('fgos.git.consumer-command');

/** The named class for a script of a skill that declares itself outside the product one-door boundary
 * (owner decision 2026-10-20, Git spec §12): reported and counted, never a census site. */
export const STANDALONE_SKILL_CLASS = 'standalone-skill-script';

const skillDeclarations = new Map();

/** The skill a file belongs to when that skill declares `metadata.oneDoor: standalone` in its own
 * SKILL.md: the nearest SKILL.md at or above the file's directory, not above `stop`. A skill is known by
 * its declaration, never by its path; a file in no skill, or in a skill without the field, gives null. */
export function standaloneSkillOf(file, stop) {
  const top = path.resolve(stop);
  for (let dir = path.dirname(path.resolve(file)); ; dir = path.dirname(dir)) {
    const manifest = path.join(dir, 'SKILL.md');
    if (!skillDeclarations.has(manifest)) skillDeclarations.set(manifest, readStandaloneDeclaration(manifest));
    const declared = skillDeclarations.get(manifest);
    if (declared !== undefined) return declared;
    if (dir === top || !dir.startsWith(`${top}${path.sep}`)) return null;
  }
}

// undefined: no SKILL.md here; null: a skill that is inside the boundary; a name: a standalone skill.
function readStandaloneDeclaration(manifest) {
  let text;
  try { text = fs.readFileSync(manifest, 'utf8'); } catch { return undefined; }
  const block = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text)?.[1];
  let meta = null;
  try { meta = block === undefined ? null : parseYaml(block, { filename: manifest }); } catch { return null; }
  return meta?.metadata?.oneDoor === 'standalone' ? String(meta.name ?? path.basename(path.dirname(manifest))) : null;
}

/** Whether a shell command string runs `git` or a repository hook at a command position. */
export function shellRunsGit(text) {
  return /(^|[;&|(`\n]|\$\(|\bthen\b|\bdo\b|\bexec\b|\bxargs\b|\benv\b)\s*(?:[A-Z_]+=\S*\s+)*(?:command\s+)?(?:\S*\/)?git(?:\.exe)?(?=\s|$|['"`;)])/.test(text)
    || /(^|\s|\/)\.githooks\/|\/hooks\/(pre-commit|commit-msg|pre-push)\b/.test(text);
}

/** The repository paths a sandbox-door Git call names, which must all lie under its sandbox root: its
 * `cwd` when given, every `-C`/`--git-dir` operand (resolved from that cwd) and every absolute argument.
 * The door refuses a call that names none; door and spy both judge a call by this list. */
export function sandboxNamedPaths(args, cwd) {
  const base = path.resolve(cwd ?? process.cwd());
  const repos = args.flatMap((arg, i) => ((arg === '-C' || arg === '--git-dir') && i + 1 < args.length ? [path.resolve(base, String(args[i + 1]))] : []));
  return [...(cwd === undefined ? [] : [base]), ...repos, ...args.filter((arg) => typeof arg === 'string' && path.isAbsolute(arg))];
}
