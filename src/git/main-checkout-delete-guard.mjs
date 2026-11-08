// main-checkout-delete-guard.mjs — judges whether a shell command an agent is about to run would
// mass-delete inside the main checkout of a fgOS project. The PreToolUse hook
// `fgos hook main-checkout-delete-guard` asks it before every shell tool call.
//
// The main checkout holds what git cannot restore: `.fgos` (installation, runtime, assignments,
// locks), `.claude`, `target`, `node_modules`. One `xargs rm -rf` after a failed `cd` deletes all
// of it. The guard is the last line of defence, so it errs toward refusing: false positives cost a
// rephrased command, a missed wipe costs a day.
//
// Refused forms, each judged in every directory the command may run in:
//   - `git clean` with -x or -X inside a main checkout (`git -C` names the directory);
//   - `xargs ... rm` inside a main checkout;
//   - `rm -r` whose target is a main checkout root, an ancestor of one, or one of its top-level
//     runtime directories (globs judged by their static directory);
//   - `find ... -delete` or `-exec rm` whose start path lies in a main checkout or above one.
// The inner command of `xargs` and `find -exec` is unwrapped (sudo and the like), and a shell's
// script is judged too: its -c operand or a heredoc fed to it.
// Scope is mass deletes only: `rm -r` of a deeper path such as `.fgos/installation` is a named
// delete and stays allowed.
// A command whose directory or operand cannot be resolved (a variable, a command substitution,
// `cd -`) is refused when it may run in a main checkout, because nothing proves it is safe.
//
// The checkout layout is read from the filesystem, not from git: a main checkout has a `.git`
// directory and a `.fgos` directory, a linked worktree has a `.git` file naming its gitdir. The
// directories judged here often do not exist (a `cd` into a worktree that failed to be created),
// and the hook runs before every shell call, so it never starts a git process.
//
// Directory tracking: `cd T` joined by `&&` narrows the directory to T, since the rest of the
// and-list runs only when `cd` succeeded; a pipeline binds tighter, so `|` keeps it. Any `;`,
// newline, `||` or `&` puts the directory the and-list started in back into play, because after a
// failed `cd` the shell keeps going there. `NAME=literal` and `export NAME=literal` are followed.
// A subshell or command substitution keeps its `cd` to itself.

import fs from 'node:fs';
import path from 'node:path';

const RUNTIME_DIRS = new Set(['.fgos', '.claude', 'target', 'node_modules']);
const UNKNOWN = null;

// ---------------------------------------------------------------------------
// Lexer: POSIX shell words and control operators, enough to find the commands
// ---------------------------------------------------------------------------

const OPERATORS = ['&&', '||', ';;', '|&', ';', '|', '&', '(', ')', '\n'];

/** Reads `$(...)` or `` `...` `` starting at `i` (pointing just past the opener); returns the inner
 * text and the index after the closer. Quotes are skipped so a `)` inside them does not close. */
function readSubstitution(src, i, closer) {
  let depth = 1;
  let start = i;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') { i += 2; continue; }
    if (closer === ')' && c === "'") { i = src.indexOf("'", i + 1); if (i < 0) break; i += 1; continue; }
    if (closer === ')' && c === '"') {
      i += 1;
      while (i < src.length && src[i] !== '"') i += src[i] === '\\' ? 2 : 1;
      i += 1;
      continue;
    }
    if (closer === ')' && c === '(') depth += 1;
    if (c === closer && --depth === 0) return { inner: src.slice(start, i), end: i + 1 };
    i += 1;
  }
  return { inner: src.slice(start), end: src.length, unterminated: true };
}

/**
 * Splits `src` into words and operators. A word records its text with known variables expanded,
 * whether any part could not be resolved (`dynamic`), whether it carries an unquoted glob or brace
 * character (`glob`), and the scripts of its command substitutions (`subs`). A heredoc or
 * here-string becomes a `heredoc` item in the command it feeds, carrying its body: a shell reading
 * it runs the body as its script, any other command reads it as data.
 */
function* lex(src, vars) {
  const items = [];
  let word = null;
  // Where the next heredoc body starts (the line after the one being read), or null when none is pending.
  let bodyAt = null;
  const startWord = () => { if (!word) word = { text: '', dynamic: false, glob: false, quoted: false, subs: [] }; };
  const endWord = () => { if (word) items.push({ type: 'word', ...word }); word = null; };

  const expandVar = (name) => {
    startWord();
    if (Object.hasOwn(vars, name) && vars[name] !== UNKNOWN) word.text += vars[name];
    else word.dynamic = true;
  };

  const readDollar = (i) => {
    const next = src[i + 1];
    if (next === '(') {
      if (src[i + 2] === '(') { const r = readSubstitution(src, i + 3, ')'); startWord(); word.dynamic = true; return readSubstitution(src, r.end, ')').end; }
      const r = readSubstitution(src, i + 2, ')');
      startWord(); word.dynamic = true; word.subs.push(r.inner);
      return r.end;
    }
    if (next === '{') {
      const close = src.indexOf('}', i + 2);
      const body = close < 0 ? src.slice(i + 2) : src.slice(i + 2, close);
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(body)) expandVar(body);
      else { startWord(); word.dynamic = true; }
      return close < 0 ? src.length : close + 1;
    }
    const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i + 1));
    if (m) { expandVar(m[0]); return i + 1 + m[0].length; }
    if (next !== undefined && /[0-9@*#?$!-]/.test(next)) { startWord(); word.dynamic = true; return i + 2; }
    startWord(); word.text += '$';
    return i + 1;
  };

  let i = 0;
  while (i < src.length) {
    // Yield what is complete before reading on, so an assignment run by the caller in between
    // is visible to the words after it.
    while (items.length) yield items.shift();
    const c = src[i];
    if (c === '\\') {
      if (src[i + 1] === '\n') { i += 2; continue; }
      startWord(); word.text += src[i + 1] ?? ''; i += 2; continue;
    }
    if (c === "'") {
      const close = src.indexOf("'", i + 1);
      startWord(); word.quoted = true;
      word.text += close < 0 ? src.slice(i + 1) : src.slice(i + 1, close);
      i = close < 0 ? src.length : close + 1;
      continue;
    }
    if (c === '"') {
      startWord(); word.quoted = true;
      i += 1;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\' && '$`"\\\n'.includes(src[i + 1])) { if (src[i + 1] !== '\n') word.text += src[i + 1]; i += 2; continue; }
        if (src[i] === '$') { i = readDollar(i); continue; }
        if (src[i] === '`') { const r = readSubstitution(src, i + 1, '`'); word.dynamic = true; word.subs.push(r.inner); i = r.end; continue; }
        word.text += src[i]; i += 1;
      }
      i += 1;
      continue;
    }
    if (c === '$') { i = readDollar(i); continue; }
    if (c === '`') { const r = readSubstitution(src, i + 1, '`'); startWord(); word.dynamic = true; word.subs.push(r.inner); i = r.end; continue; }
    if (c === ' ' || c === '\t') { endWord(); i += 1; continue; }
    if (c === '#' && !word) { while (i < src.length && src[i] !== '\n') i += 1; continue; }
    if (c === '>' || c === '<' || (c === '&' && src[i + 1] === '>')) {
      // A redirection: an fd number before it is not a word; its target word is dropped.
      if (word && !word.quoted && /^[0-9]+$/.test(word.text) && !word.dynamic) word = null;
      endWord();
      const op = /^(<<-|<<<|<<|>>|>&|<&|>\||<>|&>>|&>|>|<)/.exec(src.slice(i))[0];
      i += op.length;
      while (src[i] === ' ' || src[i] === '\t') i += 1;
      const target = [...lex(readRawWord(src, i), {})].find((it) => it.type === 'word');
      i += readRawWord(src, i).length;
      if (op === '<<<') items.push({ type: 'heredoc', text: target?.text ?? '', dynamic: Boolean(target?.dynamic) });
      if (op === '<<' || op === '<<-') {
        if (bodyAt === null) { const eol = src.indexOf('\n', i); bodyAt = eol < 0 ? src.length : eol + 1; }
        const delimiter = target?.text ?? '';
        const lines = [];
        while (bodyAt < src.length) {
          const eol = src.indexOf('\n', bodyAt);
          const line = src.slice(bodyAt, eol < 0 ? src.length : eol);
          bodyAt = eol < 0 ? src.length : eol + 1;
          if ((op === '<<-' ? line.replace(/^\t+/, '') : line) === delimiter) break;
          lines.push(line);
        }
        items.push({ type: 'heredoc', text: lines.join('\n'), dynamic: false });
      }
      continue;
    }
    const op = OPERATORS.find((o) => src.startsWith(o, i));
    if (op) {
      endWord();
      items.push({ type: 'op', op: op === ';;' ? ';' : op === '|&' ? '|' : op });
      i += op.length;
      // The heredoc bodies of this line were read with their commands; the shell goes on after them.
      if (op === '\n' && bodyAt !== null) { i = bodyAt; bodyAt = null; }
      continue;
    }
    startWord();
    if ('*?[{'.includes(c)) word.glob = true;
    if (c === '~' && word.text === '' && (src[i + 1] === '/' || src[i + 1] === undefined || /[\s;&|)]/.test(src[i + 1]))) {
      if (vars.HOME) word.text += vars.HOME; else word.dynamic = true;
    } else {
      word.text += c;
    }
    i += 1;
  }
  endWord();
  yield* items;
}

/** The raw text of one shell word starting at `i` (quotes kept), for redirection targets. */
function readRawWord(src, i) {
  let j = i;
  while (j < src.length && !/[\s;&|()<>]/.test(src[j])) {
    if (src[j] === "'") { const close = src.indexOf("'", j + 1); j = close < 0 ? src.length : close + 1; continue; }
    if (src[j] === '"') { j += 1; while (j < src.length && src[j] !== '"') j += src[j] === '\\' ? 2 : 1; j += 1; continue; }
    if (src[j] === '\\') { j += 2; continue; }
    j += 1;
  }
  return src.slice(i, j);
}

// ---------------------------------------------------------------------------
// Checkout layout
// ---------------------------------------------------------------------------

function statOrNull(p) {
  try { return fs.statSync(p); } catch { return null; }
}

/** The path with its longest existing prefix canonicalized, so a symlink into a checkout is seen. */
function canonical(p) {
  const rest = [];
  let at = path.resolve(p);
  for (;;) {
    try { return path.join(fs.realpathSync(at), ...rest.reverse()); } catch { /* walk up */ }
    const parent = path.dirname(at);
    if (parent === at) return path.resolve(p);
    rest.push(path.basename(at));
    at = parent;
  }
}

const isMainCheckoutRoot = (dir) => Boolean(statOrNull(path.join(dir, '.git'))?.isDirectory() && statOrNull(path.join(dir, '.fgos'))?.isDirectory());

/** The checkout `dir` lies in: `{ root, main }` for the nearest directory holding a `.git` entry,
 * with `mainRoot` the main checkout a linked worktree belongs to; null outside any checkout. */
function checkoutOf(dir) {
  for (let at = canonical(dir); ; at = path.dirname(at)) {
    const st = statOrNull(path.join(at, '.git'));
    if (st?.isDirectory()) return isMainCheckoutRoot(at) ? { root: at, main: true, mainRoot: at } : null;
    if (st?.isFile()) {
      let mainRoot = null;
      try {
        const gitdir = /^gitdir:\s*(.+)$/m.exec(fs.readFileSync(path.join(at, '.git'), 'utf8'))?.[1]?.trim();
        const marker = gitdir ? path.resolve(at, gitdir).lastIndexOf(`${path.sep}.git${path.sep}`) : -1;
        if (marker > 0) mainRoot = path.resolve(at, gitdir).slice(0, marker);
      } catch { /* an unreadable .git file: no main root known */ }
      return { root: at, main: false, mainRoot: mainRoot && isMainCheckoutRoot(mainRoot) ? mainRoot : null };
    }
    if (path.dirname(at) === at) return null;
  }
}

const mainCheckoutContaining = (dir) => { const c = checkoutOf(dir); return c?.main ? c.root : null; };
const isAncestorOrSelf = (ancestor, p) => { const rel = path.relative(ancestor, p); return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)); };

// ---------------------------------------------------------------------------
// Judge
// ---------------------------------------------------------------------------

const KEYWORDS = new Set(['{', '}', '!', 'if', 'then', 'else', 'elif', 'fi', 'do', 'done', 'while', 'until', 'esac', 'time']);
const WRAPPERS = new Set(['sudo', 'command', 'builtin', 'exec', 'nohup', 'nice', 'env', 'timeout', 'stdbuf', 'ionice', 'doas']);
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh']);
const XARGS_ARG_OPTIONS = new Set(['-I', '-L', '-n', '-P', '-d', '-s', '-a', '-E', '-e', '-i', '-l']);
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

const base = (w) => path.basename(w.text);

/** The words of a simple command after assignments, keywords and wrapper programs (with their
 * options) are stripped. */
function commandWords(words) {
  let i = 0;
  for (;;) {
    while (i < words.length && !words[i].quoted && (KEYWORDS.has(words[i].text) || ASSIGNMENT.test(words[i].text))) i += 1;
    if (i < words.length && WRAPPERS.has(base(words[i]))) {
      const wrapper = base(words[i]);
      i += 1;
      while (i < words.length && (words[i].text.startsWith('-') || (wrapper === 'env' && ASSIGNMENT.test(words[i].text)))) {
        if ((wrapper === 'sudo' && /^-[ugCDhprT]$/.test(words[i].text)) || (wrapper === 'nice' && words[i].text === '-n')) i += 1;
        i += 1;
      }
      if (wrapper === 'timeout' && i < words.length && /^[0-9.]+[smhd]?$/.test(words[i].text)) i += 1;
      continue;
    }
    return words.slice(i);
  }
}

/**
 * Judges `command` as a shell would run it from `cwd`. Returns `{ blocked, reasons }`; each reason
 * names the form and the main checkout it would delete in.
 */
export function judgeDeleteCommand(command, { cwd, env = process.env } = {}) {
  const reasons = [];
  const knownRoots = new Set();
  const noteRoots = (dir) => {
    if (dir === UNKNOWN) return;
    const c = checkoutOf(dir);
    if (c?.mainRoot) knownRoots.add(c.mainRoot);
  };
  for (const dir of [cwd, env.CLAUDE_PROJECT_DIR]) if (typeof dir === 'string' && dir) noteRoots(path.resolve(dir));
  const vars = { HOME: env.HOME };
  analyze(String(command ?? ''), [typeof cwd === 'string' && cwd ? path.resolve(cwd) : UNKNOWN], vars, { reasons, knownRoots, noteRoots }, 0);
  return { blocked: reasons.length > 0, reasons: [...new Set(reasons)] };
}

function analyze(script, startDirs, vars, ctx, depth) {
  if (depth > 8) { ctx.reasons.push('nested shell commands are too deep to read'); return; }
  const items = lex(script, vars);
  let dirs = [...startDirs];
  let chainBase = [...dirs];
  const stack = [];
  let words = [];
  let heredocs = [];
  const union = (a, b) => [...new Set([...a, ...b])];

  const runCommand = () => {
    const current = words;
    const fed = heredocs;
    words = [];
    heredocs = [];
    if (current.length === 0) return;
    for (const w of current) for (const sub of w.subs) analyze(sub, dirs, { ...vars }, ctx, depth + 1);
    // An assignment-only command sets shell variables for what follows.
    const assignments = current[0].text === 'export' && !current[0].quoted && current.length > 1 ? current.slice(1) : current;
    if (assignments.every((w) => ASSIGNMENT.test(w.text) && !w.quoted)) {
      for (const w of assignments) {
        const name = w.text.slice(0, w.text.indexOf('='));
        vars[name] = w.dynamic || w.glob ? UNKNOWN : w.text.slice(name.length + 1);
      }
      return;
    }
    const cmd = commandWords(current);
    if (cmd.length === 0) return;
    const name = base(cmd[0]);
    if (cmd[0].text === 'for' || cmd[0].text === 'case' || cmd[0].text === 'select') return;
    if (name === 'cd' || name === 'pushd' || name === 'popd') {
      const target = cmd.find((w, k) => k > 0 && !(w.text.startsWith('-') && w.text !== '-'));
      if (name === 'popd' || !target) dirs = name === 'popd' ? [UNKNOWN] : [vars.HOME ?? UNKNOWN];
      else if (target.dynamic || target.text === '-') dirs = [UNKNOWN];
      else dirs = changeDir(dirs, target);
      dirs.forEach(ctx.noteRoots);
      return;
    }
    judgeCommand(cmd, dirs, vars, ctx, depth, fed);
  };

  for (const item of items) {
    if (item.type === 'word') { words.push(item); continue; }
    if (item.type === 'heredoc') { heredocs.push(item); continue; }
    runCommand();
    if (item.op === '(') { stack.push({ dirs, chainBase }); chainBase = [...dirs]; continue; }
    if (item.op === ')') { const saved = stack.pop(); if (saved) ({ dirs, chainBase } = saved); continue; }
    // A pipeline binds tighter than && and ||: `cd T && a | b` runs b only after cd succeeded.
    if (item.op === '&&' || item.op === '|') continue;
    dirs = union(dirs, chainBase);
    if (item.op !== '||') chainBase = [...dirs];
  }
  runCommand();
}

/** The directories after moving from each of `dirs` to `target` (a `cd` or `git -C`). */
function changeDir(dirs, target) {
  if (target.dynamic) return [UNKNOWN];
  if (path.isAbsolute(target.text)) return [path.resolve(target.text)];
  return [...new Set(dirs.map((d) => (d === UNKNOWN ? UNKNOWN : path.resolve(d, target.text))))];
}

function resolveIn(dirs, w) {
  if (w.dynamic) return [{ unresolvable: true }];
  if (path.isAbsolute(w.text)) return [{ path: path.resolve(w.text) }];
  return dirs.map((d) => (d === UNKNOWN ? { unresolvable: true } : { path: path.resolve(d, w.text) }));
}

/** The static directory of a glob or brace word: the part before the first component holding one. */
function staticPart(text) {
  const parts = text.split('/');
  const at = parts.findIndex((p) => /[*?[{]/.test(p));
  return at < 0 ? text : parts.slice(0, at).join('/') || (text.startsWith('/') ? '/' : '.');
}

function judgeCommand(cmd, dirs, vars, ctx, depth, heredocs = []) {
  const name = base(cmd[0]);
  const args = cmd.slice(1);
  const refuse = (form, root) => ctx.reasons.push(root ? `${form} would delete inside the main checkout ${root}` : `${form}: the directory or operand cannot be resolved, so it may run in a main checkout`);
  const mainOf = (d) => (d === UNKNOWN ? undefined : mainCheckoutContaining(d));
  /** Refuses `form` when any directory it may run in is a main checkout or unknown; `computed`
   * says the operand itself is what could not be read. */
  const refuseInMain = (form, inDirs, computed = false) => {
    for (const d of inDirs) {
      const root = mainOf(d);
      if (root === undefined) { refuse(form, null); return; }
      if (root && computed) { ctx.reasons.push(`${form}: its target cannot be resolved and it may run in the main checkout ${root}`); return; }
      if (root) { refuse(form, root); return; }
    }
  };
  /** An operand that does not resolve: a relative path from an unknown directory is refused; a
   * computed path can be anything, so it is refused wherever the command may run in a main checkout. */
  const refuseUnresolved = (form, word) => (word.dynamic ? refuseInMain(form, dirs, true) : refuse(form, null));

  if (SHELLS.has(name)) {
    const at = args.findIndex((w) => /^-[a-zA-Z]*c[a-zA-Z]*$/.test(w.text));
    // The script: the -c operand, else a heredoc or here-string fed to the shell. A script file
    // operand is not read; a shell left reading its script from a pipe is refused in a main checkout.
    const script = at >= 0 ? args[at + 1] : heredocs.at(-1);
    if (script) {
      if (script.dynamic) refuseInMain(`${name} with a computed script`, dirs, true);
      else analyze(script.text, dirs, { ...vars }, ctx, depth + 1);
    } else if (at < 0 && !args.some((w) => !w.text.startsWith('-'))) {
      refuseInMain(`${name} reading its script from standard input`, dirs, true);
    }
    return;
  }
  if (name === 'eval') {
    if (args.some((w) => w.dynamic)) refuseInMain('eval of a computed string', dirs, true);
    else analyze(args.map((w) => w.text).join(' '), dirs, { ...vars }, ctx, depth + 1);
    return;
  }
  if (name === 'git') {
    let gitDirs = dirs;
    let k = 0;
    while (k < args.length && args[k].text.startsWith('-')) {
      const opt = args[k].text;
      if ((opt === '-C' || opt === '--work-tree') && args[k + 1]) { gitDirs = changeDir(gitDirs, args[k + 1]); k += 2; continue; }
      if (opt.startsWith('--work-tree=')) { gitDirs = changeDir(gitDirs, { ...args[k], text: opt.slice('--work-tree='.length) }); k += 1; continue; }
      k += opt === '-c' || opt === '--git-dir' || opt === '--namespace' ? 2 : 1;
    }
    if (args[k]?.text !== 'clean') return;
    const flags = args.slice(k + 1).filter((w) => /^-[A-Za-z]+$/.test(w.text));
    if (flags.some((w) => /[xX]/.test(w.text))) refuseInMain('git clean -x/-X', gitDirs);
    return;
  }
  /** The command xargs or find -exec runs: true when it is `rm` (after wrappers such as sudo); a
   * shell with -c is judged as a command of its own here, so its computed operands are refused. */
  const runsRm = (words) => {
    const inner = commandWords(words);
    if (!inner.length) return false;
    if (base(inner[0]) === 'rm') return true;
    if (SHELLS.has(base(inner[0]))) judgeCommand(inner, dirs, vars, ctx, depth + 1);
    return false;
  };
  if (name === 'xargs') {
    let k = 0;
    while (k < args.length && args[k].text.startsWith('-')) k += XARGS_ARG_OPTIONS.has(args[k].text) ? 2 : 1;
    if (runsRm(args.slice(k))) refuseInMain('xargs rm', dirs);
    return;
  }
  if (name === 'find') {
    let deletes = args.some((w) => w.text === '-delete');
    for (let k = 0; k < args.length; k += 1) {
      if (!['-exec', '-execdir', '-ok', '-okdir'].includes(args[k].text)) continue;
      const end = args.findIndex((w, j) => j > k && (w.text === ';' || w.text === '+'));
      if (runsRm(args.slice(k + 1, end < 0 ? args.length : end))) deletes = true;
    }
    if (!deletes) return;
    let k = 0;
    while (k < args.length && /^-[HLP]$|^-O[0-9]$/.test(args[k].text)) k += 1;
    if (args[k]?.text === '-D') k += 2;
    const starts = [];
    while (k < args.length && !/^[-(!)]/.test(args[k].text)) starts.push(args[k++]);
    for (const start of starts.length ? starts : [{ text: '.', dynamic: false, glob: false }]) {
      const word = start.glob ? { ...start, text: staticPart(start.text) } : start;
      for (const target of resolveIn(dirs, word)) {
        if (target.unresolvable) { refuseUnresolved(`find ${start.text || 'of a computed path'} -delete`, word); continue; }
        const t = canonical(target.path);
        const root = mainCheckoutContaining(t) ?? [...ctx.knownRoots].find((r) => isAncestorOrSelf(t, r));
        if (root) refuse(`find ${start.text} -delete`, root);
      }
    }
    return;
  }
  if (name === 'rm') {
    let recursive = false;
    const operands = [];
    let endOfOptions = false;
    for (const w of args) {
      if (!endOfOptions && w.text === '--') { endOfOptions = true; continue; }
      if (!endOfOptions && w.text.startsWith('--')) { if (w.text === '--recursive') recursive = true; continue; }
      if (!endOfOptions && /^-[A-Za-z]+$/.test(w.text)) { if (/[rR]/.test(w.text)) recursive = true; continue; }
      operands.push(w);
    }
    if (!recursive) return;
    for (const operand of operands) {
      const word = operand.glob ? { ...operand, text: staticPart(operand.text) } : operand;
      for (const target of resolveIn(dirs, word)) {
        if (target.unresolvable) { refuseUnresolved(`rm -r ${operand.text || 'of a computed path'}`, word); continue; }
        const t = canonical(target.path);
        if (isMainCheckoutRoot(t)) { refuse(`rm -r ${operand.text}`, t); continue; }
        const parent = path.dirname(t);
        if (RUNTIME_DIRS.has(path.basename(t)) && isMainCheckoutRoot(parent)) { refuse(`rm -r ${operand.text}`, parent); continue; }
        const above = [...ctx.knownRoots].find((r) => isAncestorOrSelf(t, r));
        if (above) refuse(`rm -r ${operand.text}`, above);
      }
    }
  }
}

/** The refusal shown to the agent: what was refused, why, and the doors that are safe. */
export function deleteGuardRefusal(reasons) {
  return [
    `BLOCKED by the fgOS main-checkout delete guard: ${reasons.join('; ')}.`,
    'The main checkout holds what git cannot restore (.fgos, .claude, target, node_modules); one mass delete there, for example after a cd that failed, wipes it.',
    'Safe doors: remove a linked worktree with `fgos worktree remove <path> --delivered-to <ref> --discard-ignored`; clean one by naming it, `git -C <linked-worktree> clean ...`, after checking it exists; delete single named files with a plain `rm <file>`.',
    'If a mass delete in the main checkout is really intended, ask the owner to run it in their own terminal.',
  ].join('\n');
}
