// git-spawn-match.mjs -- the one matcher the one-door gate shares (Git spec §12): the static scan
// (scripts/git-one-door-scan.mjs), the runtime spy (test/helpers/git-spawn-spy.mjs) and the sandbox
// door (scripts/lib/sandbox-git.mjs) all decide "does this run Git?" and "is this the sandbox door?"
// here, so the three can never disagree.

import fs from 'node:fs';
import path from 'node:path';
import { YamlParseError, readFrontmatter } from '../../src/util/yaml.mjs';

/** The spawn-option key the sandbox door sets to its sandbox root; nothing else may set it. */
export const SANDBOX_DOOR = Symbol.for('fgos.git.sandbox-door');

/** The spawn-option key goal-check sets on a consumer's declared command (configured-binary, owner
 * decision Q1). The scan accepts it only on a spawn whose binary is not a literal. */
export const CONSUMER_COMMAND = Symbol.for('fgos.git.consumer-command');

/** The named class for a script of a skill that declares itself outside the product one-door boundary
 * (owner decision 2026-10-20, Git spec §12): reported and counted, never a census site. */
export const STANDALONE_SKILL_CLASS = 'standalone-skill-script';

/** The named class for a spawn from a tool the owner declared in scripts/lib/git-one-door-declarations.v1.json
 * (`declared-tooling-exemption`): never a census site, exactly as the static scan classifies it. The
 * test runner (scripts/run-tests.mjs) drops these records without logging or counting them. */
export const DECLARED_TOOLING_CLASS = 'declared-tooling-exemption';

/** The Git verbs that only read, in the form `hookVerb` returns. The static scan accepts a declared
 * tooling or hook exemption only for these, and the runtime spy exempts only these, so the two agree. */
export const READ_VERBS = new Set(['reflog show', 'reflog exists', 'config --get', 'config --get-all', 'config --list', 'rev-parse', 'diff', 'show', 'cat-file', 'ls-files', 'ls-tree', 'show-ref', 'diff-tree', 'log', 'merge-base', 'for-each-ref', 'symbolic-ref read', 'rev-list', 'var', 'version', '--version', 'check-attr', 'check-ignore', 'name-rev', 'describe']);

/** The verb of a Git argv (its words after `git`), in the form READ_VERBS keys: `config` with its
 * first option, `reflog` with its subcommand (`show` when none), and `symbolic-ref` as `read` only
 * when it names one ref and sets or deletes nothing. */
export function hookVerb(words) {
  let i = 0;
  while (i < words.length && /^(-C|-c|--git-dir|--work-tree)$/.test(words[i])) i += 2;
  const [verb, ...rest] = words.slice(i);
  if (verb === 'config') return `config ${rest[0]}`;
  if (verb === 'reflog') return `reflog ${rest[0] && !rest[0].startsWith('-') ? rest[0] : 'show'}`;
  if (verb === 'symbolic-ref') {
    const sets = rest.some((w) => /^(-d|--delete|-m)$/.test(w)) || rest.filter((w) => !w.startsWith('-')).length !== 1;
    return `symbolic-ref ${sets ? 'write' : 'read'}`;
  }
  return verb;
}

/** Whether a spawn of `file` with `argv` is a Git command whose verb only reads. A shell command
 * string is never judged a read: its verb is not known. */
export function isReadGitCommand(file, argv) {
  return path.basename(String(file)).replace(/\.exe$/, '') === 'git' && READ_VERBS.has(hookVerb(argv.map(String)));
}

const declaredTooling = new Map();

/** Whether the owner declared `fn` of repo-relative `file` a tooling exemption. The static scan keys a
 * declaration by path and call digest; at run time the stack names only the function, so a function that
 * holds a declared call is matched by path and function name. */
export function declaredToolingSite(root, file, fn) {
  if (!declaredTooling.has(root)) {
    const doc = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'lib', 'git-one-door-declarations.v1.json'), 'utf8'));
    declaredTooling.set(root, new Set(doc.declarations.filter((d) => d.class === DECLARED_TOOLING_CLASS).map((d) => `${d.path}\0${d.siteId.split(':')[0]}`)));
  }
  return declaredTooling.get(root).has(`${file.split(path.sep).join('/')}\0${fn}`);
}

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
  let meta = null;
  try { ({ meta } = readFrontmatter(text, manifest)); } catch (err) { if (err instanceof YamlParseError) return null; throw err; }
  return meta?.metadata?.oneDoor === 'standalone' ? String(meta.name ?? path.basename(path.dirname(manifest))) : null;
}

/** Whether a shell command string runs `git` or a repository hook at a command position. */
export function shellRunsGit(text) {
  return /(^|[;&|(`\n]|\$\(|\bthen\b|\bdo\b|\bexec\b|\bxargs\b|\benv\b)\s*(?:[A-Z_]+=\S*\s+)*(?:command\s+)?(?:\S*\/)?git(?:\.exe)?(?=\s|$|['"`;)])/.test(text)
    || /(^|\s|\/)\.githooks\/|\/hooks\/(pre-commit|commit-msg|pre-push)\b/.test(text);
}

/** The repository paths a sandbox-door Git call names, which must all lie under its sandbox root: its
 * `cwd` when given, every `-C`, `--git-dir` and `--work-tree` operand (separate or `=` form, resolved
 * from that cwd) and every absolute argument. The door refuses a call that names none; door and spy
 * both judge a call by this list. */
export function sandboxNamedPaths(args, cwd) {
  const base = path.resolve(cwd ?? process.cwd());
  const repos = args.flatMap((arg, i) => {
    if (typeof arg !== 'string') return [];
    if (arg === '-C' || arg === '--git-dir' || arg === '--work-tree') return i + 1 < args.length ? [path.resolve(base, String(args[i + 1]))] : [];
    const inline = /^--(?:git-dir|work-tree)=(.*)$/s.exec(arg);
    return inline ? [path.resolve(base, inline[1])] : [];
  });
  return [...(cwd === undefined ? [] : [base]), ...repos, ...args.filter((arg) => typeof arg === 'string' && path.isAbsolute(arg))];
}
