// skill-wrappers.mjs — generates `.claude/skills/<name>/SKILL.md` thin-
// wrapper stubs from `.agents/skills/<name>/SKILL.md` (tsk-1qi, D5/D7 of
// docs/history/install-setup-external-project-reliability/CONTEXT.md,
// D7 of docs/history/core-foundation-domain-boundary/DISCUSSION.md).
//
// Canonical skill authoring lives under `core/skills/` (platform-level)
// and `domains/<domain>/skills/` (domain-owned). `assembleSkills`
// materializes them into `.agents/skills/*` as the orchestrator-neutral
// portable projection. `.claude/skills/<name>/SKILL.md` thin wrappers are
// generated from `.agents/skills/*` with short read-and-follow redirects,
// never full copies (Pinned terms, "Thin wrapper"). Frontmatter is copied
// verbatim so Claude Code's skill listing still displays the real
// name/description; only the body redirects.
//
// Callers: `npm run build:skills` (repo CI/dogfood: assembles canonical skills,
// generates thin wrappers, and mirrors dev-skills into plugins/fgOS/skills)
// and `fgos setup`'s external-project materialize path (`materializeSkillsIntoProject`).

import fs from 'node:fs';
import path from 'node:path';
import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';
import { inspectEntries, inspectPath } from '../util/git-paths.mjs';
import { computeInstructionProjection, materializeInstructionProjection } from './instruction-projections.mjs';

const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

// `fs.copyFileSync` truncates the destination in place before writing it,
// so a concurrent reader of that same destination (e.g. a sibling `fgos
// setup` process assembling/reading the same shared `packageRoot/.agents/
// skills/*`, tsk-25b) can observe a momentarily-empty or partially-written
// file. `rename` within the same directory is atomic on POSIX filesystems,
// so a reader always sees either the old file or the fully-written new
// one, never a partial state. Same tmp-then-rename shape every other
// atomic write in this repo already uses.
const ATOMIC_TMP_SUFFIX_PATTERN = /\.tmp-\d+-\d+-[a-z0-9]+$/;
const WINDOWS_RESERVED_BASENAMES = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  'com1',
  'com2',
  'com3',
  'com4',
  'com5',
  'com6',
  'com7',
  'com8',
  'com9',
  'lpt1',
  'lpt2',
  'lpt3',
  'lpt4',
  'lpt5',
  'lpt6',
  'lpt7',
  'lpt8',
  'lpt9',
]);

function windowsPathCollisionKey(relPath) {
  return String(relPath)
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.normalize('NFC').toLowerCase().replace(/[. ]+$/g, ''))
    .join('/');
}

function windowsReservedBasename(segment) {
  return String(segment).split('.')[0].normalize('NFC').toLowerCase().replace(/[. ]+$/g, '');
}

function hasWindowsTrailingDotOrSpace(segment) {
  const normalized = String(segment).normalize('NFC');
  return normalized !== normalized.replace(/[. ]+$/g, '');
}

function atomicCopyFileSync(sourcePath, targetPath) {
  const tmpPath = `${targetPath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  fs.copyFileSync(sourcePath, tmpPath);
  try {
    fs.renameSync(tmpPath, targetPath);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch {}
    throw err;
  }
}

// `readdirSync` on a directory another process is concurrently writing into
// via `atomicCopyFileSync` can catch that process's own in-flight
// `*.tmp-<pid>-<ts>-<rand>` file before it renames it away — copying or
// pruning that transient name races the writer's own rename and throws
// ENOENT (tsk-25b). Every loop below that walks a directory
// `atomicCopyFileSync`/`assembleSkills` can be concurrently writing into
// (a shared `packageRoot/.agents/skills`, in this repo's own test suite)
// filters entries through this so an in-flight tmp file is invisible to
// them, same as it is to the writer's own eventual rename target.
function isOwnTmpFile(name) {
  return ATOMIC_TMP_SUFFIX_PATTERN.test(name);
}

// Marker line unique to a wrapper this module itself generated. `.claude/
// skills/*` is not an exclusively-generated tree (a hand-authored or
// plugin-installed skill can live there directly, never routed through
// `.agents/skills` at all) -- the prune pass below must never remove an
// entry it cannot prove it wrote itself, and this exact line is that
// proof: it is unconditionally present in every `generateWrapperContent`
// output, so its presence is a real generated-wrapper signature.
const GENERATED_WRAPPER_MARKER = 'This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.';

/** The YAML frontmatter block (including its `---` fences) at the top of
 * a SKILL.md's content, or `''` when none is present. */
export function extractFrontmatter(sourceContent) {
  const match = FRONTMATTER_PATTERN.exec(sourceContent);
  return match ? match[0] : '';
}

/**
 * The generated wrapper's full content: the source's own frontmatter,
 * verbatim, followed by a short redirect body naming `sourceRelativePath`
 * (the real file's path relative to the wrapper's own location — a
 * sibling-relative path, D7, never an absolute path that would break once
 * copied into a different project).
 */
export function generateWrapperContent(sourceContent, sourceRelativePath) {
  const frontmatter = extractFrontmatter(sourceContent);
  if (!frontmatter) {
    throw new Error('generateWrapperContent: source has no YAML frontmatter block (---...---) to copy');
  }
  const relPath = sourceRelativePath.replaceAll('\\', '/');
  return (
    `${frontmatter}\n` +
    `${GENERATED_WRAPPER_MARKER}\n` +
    `The real skill content lives at \`${relPath}\`, an assembled projection whose generated header identifies its canonical source.\n` +
    'Read that file and follow it directly.\n'
  );
}

/** Whether `claudeSkillsRoot/name` is a wrapper this module itself
 * previously generated (its `SKILL.md` carries `GENERATED_WRAPPER_MARKER`)
 * -- the only entries the prune pass in `generateAllSkillWrappers` is ever
 * allowed to remove. A missing `SKILL.md`, a read error, or content
 * without the marker all mean "not provably ours" and must return `false`:
 * a hand-authored or plugin-installed skill living directly under `.claude/
 * skills/*` (never routed through `.agents/skills`) is never this
 * function's to judge. */
function isGeneratedWrapper(wrapperDirPath) {
  const skillMdPath = path.join(wrapperDirPath, 'SKILL.md');
  try {
    return fs.readFileSync(skillMdPath, 'utf8').includes(GENERATED_WRAPPER_MARKER);
  } catch {
    return false;
  }
}

/**
 * The skill names fgOS owns: every skill assembled from the `core/skills` and
 * `domains/<domain>/skills` sources of the given roots, plus the `_shared`
 * fragment folder. Every step that writes into a skill root (wrap, mirror,
 * setup copy) takes its names from this set, so a skill directory another kit
 * installed there is never written, whatever its name or content.
 */
export function ownedSkillNames(...roots) {
  const owned = new Set(['_shared']);
  for (const root of new Set(roots)) {
    for (const skill of discoverCanonicalSkills(root)) owned.add(skill.name);
  }
  return owned;
}

/**
 * The directories directly under `skillsRoot` whose names are in `owned`, the
 * one filter every skill-root write goes through. A check on the target
 * directory itself (for example a generated-stamp refusal for a same-named
 * folder fgOS did not write) belongs here.
 */
function ownedSkillDirs(skillsRoot, owned) {
  if (!(owned instanceof Set)) throw new TypeError('ownedSkillDirs requires the owned skill name set');
  if (!fs.existsSync(skillsRoot)) return [];
  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && owned.has(entry.name) && !isOwnTmpFile(entry.name));
}

/**
 * Generate every `.claude/skills/<name>/SKILL.md` wrapper from its
 * `.agents/skills/<name>/SKILL.md` source, for every skill directory
 * found directly under `agentsSkillsRoot` whose name is in `owned` (see
 * `ownedSkillNames`; other names are never touched) -- except `_shared` (a folder
 * of referenced fragments, not a dispatchable skill of its own; it has no
 * SKILL.md/frontmatter to wrap, and a wrapper's own redirect already
 * routes any `_shared` reference inside the source file to
 * `agentsSkillsRoot`'s own `_shared/`, so `.claude/skills/_shared` is not
 * needed once every `.claude/skills/*` entry is a redirect). Returns the
 * list of wrapper paths written. An optional `keep(targetPath, incoming)`
 * (see `createProjectSkillGuard`) names a target file to leave untouched;
 * a kept wrapper is not listed as written.
 */
export function generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot, { owned, keep } = {}) {
  const written = [];
  const validWrapperNames = new Set();
  for (const entry of ownedSkillDirs(agentsSkillsRoot, owned)) {
    if (entry.name === '_shared') continue;
    const sourcePath = path.join(agentsSkillsRoot, entry.name, 'SKILL.md');
    if (!fs.existsSync(sourcePath)) continue;

    validWrapperNames.add(entry.name);

    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    const wrapperDir = path.join(claudeSkillsRoot, entry.name);
    const wrapperPath = path.join(wrapperDir, 'SKILL.md');
    const sourceRelativePath = path.relative(wrapperDir, sourcePath).replaceAll('\\', '/');
    const wrapperContent = generateWrapperContent(sourceContent, sourceRelativePath);
    if (!keep?.(wrapperPath, wrapperContent)) {
      fs.mkdirSync(wrapperDir, { recursive: true });
      fs.writeFileSync(wrapperPath, wrapperContent);
      written.push(wrapperPath);
    }

    const skillDir = path.join(agentsSkillsRoot, entry.name);
    for (const subEntry of fs.readdirSync(skillDir, { withFileTypes: true })) {
      if (isOwnTmpFile(subEntry.name)) continue;
      if (subEntry.name === 'SKILL.md') continue;
      const subSource = path.join(skillDir, subEntry.name);
      const subTarget = path.join(wrapperDir, subEntry.name);
      if (subEntry.isDirectory()) {
        copyDirRecursive(subSource, subTarget, keptCopy(keep));
      } else {
        keptCopy(keep)(subSource, subTarget);
      }
    }
  }

  if (fs.existsSync(claudeSkillsRoot)) {
    for (const entry of fs.readdirSync(claudeSkillsRoot, { withFileTypes: true })) {
      if (validWrapperNames.has(entry.name)) continue;
      const orphanPath = path.join(claudeSkillsRoot, entry.name);
      if (!isGeneratedWrapper(orphanPath)) continue;
      fs.rmSync(orphanPath, { recursive: true, force: true });
    }
  }

  return written;
}

/** `atomicCopyFileSync` that leaves a target file `keep` names untouched. */
function keptCopy(keep) {
  if (!keep) return atomicCopyFileSync;
  return (sourcePath, targetPath) => {
    if (!keep(targetPath, fs.readFileSync(sourcePath))) atomicCopyFileSync(sourcePath, targetPath);
  };
}

function skillVersion(content) {
  const match = /^\s*version:\s*["']?(\d+(?:\.\d+)*)["']?\s*$/m.exec(extractFrontmatter(content));
  return match ? match[1].split('.').map(Number) : null;
}

function isNewerVersion(candidate, baseline) {
  if (!candidate || !baseline) return false;
  for (let i = 0; i < Math.max(candidate.length, baseline.length); i += 1) {
    const diff = (candidate[i] ?? 0) - (baseline[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

function readIfFile(file) {
  try {
    return fs.readFileSync(file);
  } catch {
    return null;
  }
}

/**
 * The files of a project's own skill folders that setup must not overwrite
 * with the release copy: a tracked file with uncommitted changes since HEAD
 * (its content would be lost), and every file of a skill whose `SKILL.md`
 * declares a newer `version` than the copy being written (the project's
 * version is ahead of the release). Anything else -- untracked, or tracked
 * and clean, or identical content -- is refreshed as before.
 *
 * `guard.forRoots(sourceSkillsRoot, targetSkillsRoot)` returns
 * `keep(targetPath, incoming)`; each call that returns true records the
 * target's project-relative path in `guard.skipped`. Outside a git
 * repository only the version rule applies.
 */
export function createProjectSkillGuard(projectRoot) {
  const skipped = [];
  let dirty;
  const dirtyPaths = () => {
    if (dirty) return dirty;
    dirty = new Set();
    try {
      const inspect = createGitInspect(gitPortOptions(projectRoot));
      const facts = inspect.resolveRepo();
      if (!facts.notARepository) {
        for (const entry of inspectEntries((page) => inspect.status({ ...page, untracked: 'none' }))) {
          dirty.add(path.join(facts.worktreeRoot, inspectPath(entry.path)));
        }
      }
    } catch {
      // Any Git refusal or absence (not installed, untrusted-worktree, ...)
      // falls back to the version rule alone.
    }
    return dirty;
  };
  return {
    skipped,
    forRoots(sourceSkillsRoot, targetSkillsRoot) {
      const versionAhead = new Map();
      return (targetPath, incoming) => {
        const current = readIfFile(targetPath);
        if (!current || current.equals(Buffer.from(incoming))) return false;
        const name = path.relative(targetSkillsRoot, targetPath).split(path.sep)[0];
        if (!versionAhead.has(name)) {
          // Decided on the first file of the skill, before any of its files is rewritten.
          const targetMd = readIfFile(path.join(targetSkillsRoot, name, 'SKILL.md'));
          const sourceMd = readIfFile(path.join(sourceSkillsRoot, name, 'SKILL.md'));
          versionAhead.set(name, Boolean(targetMd && sourceMd
            && isNewerVersion(skillVersion(targetMd.toString('utf8')), skillVersion(sourceMd.toString('utf8')))));
        }
        // worktreeRoot is canonical; the project may be reached through a symlink.
        if (!versionAhead.get(name) && !dirtyPaths().has(fs.realpathSync(targetPath))) return false;
        skipped.push(path.relative(projectRoot, targetPath).split(path.sep).join('/'));
        return true;
      };
    },
  };
}

/** Recursively copy every file under `sourceDir` into `targetDir`,
 * creating directories as needed. Overwrites an existing file at the same
 * relative path -- the source is canonical, so a stale target copy is
 * meant to be replaced, not preserved. */
function copyDirRecursive(sourceDir, targetDir, copyFile = atomicCopyFileSync) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (isOwnTmpFile(entry.name)) continue;
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(sourcePath, targetPath, copyFile);
    } else {
      copyFile(sourcePath, targetPath);
    }
  }
}

/** The one name rule the plugin mirror applies: only `_shared/` and the
 * `fgos-*` dev-skills are ever written into `plugins/fgOS/skills`. */
function isMirroredDevSkillName(name) {
  return name === '_shared' || name.startsWith('fgos-');
}

/**
 * Mirrors the 14 coding-domain dev-skills (`fgos-*`) and `_shared/` from
 * `agentsSkillsRoot` (`.agents/skills`) into `pluginSkillsRoot`
 * (`plugins/fgOS/skills`). Returns the list of target skill directory paths written.
 */
export function mirrorDevSkillsIntoPlugin(agentsSkillsRoot, pluginSkillsRoot, owned) {
  const mirrored = [];
  for (const entry of ownedSkillDirs(agentsSkillsRoot, owned)) {
    if (!isMirroredDevSkillName(entry.name)) continue;
    const sourceDir = path.join(agentsSkillsRoot, entry.name);
    const targetDir = path.join(pluginSkillsRoot, entry.name);
    copyDirRecursive(sourceDir, targetDir);
    mirrored.push(targetDir);
  }
  return mirrored;
}


/**
 * Scans `core/skills/` and `domains/<domain>/skills/` to discover all canonical skills.
 * Rejects a duplicate skill name, a name that is not one portable path segment and a
 * Windows path alias before any projection write.
 */
export function discoverCanonicalSkills(projectRoot) {
  const skills = [];
  const nameToSources = new Map();

  const scanSkillsRoot = (skillsRoot, authority, domain) => {
    if (!fs.existsSync(skillsRoot)) return;
    for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
      if (isOwnTmpFile(entry.name) || entry.name.startsWith('.')) continue;
      if (!entry.isDirectory() || entry.name === '_shared') continue;
      const skillDir = path.join(skillsRoot, entry.name);
      if (!fs.existsSync(path.join(skillDir, 'SKILL.md'))) continue;
      const relPath = path.relative(projectRoot, skillDir).replaceAll('\\', '/');
      if (!nameToSources.has(entry.name)) nameToSources.set(entry.name, []);
      nameToSources.get(entry.name).push(relPath);
      skills.push({ name: entry.name, authority, domain, canonicalDir: relPath });
    }
  };

  scanSkillsRoot(path.join(projectRoot, 'core', 'skills'), 'core', null);
  const domainsRoot = path.join(projectRoot, 'domains');
  if (fs.existsSync(domainsRoot)) {
    for (const domainEntry of fs.readdirSync(domainsRoot, { withFileTypes: true })) {
      if (isOwnTmpFile(domainEntry.name) || domainEntry.name.startsWith('.')) continue;
      if (!domainEntry.isDirectory()) continue;
      scanSkillsRoot(path.join(domainsRoot, domainEntry.name, 'skills'), 'domain', domainEntry.name);
    }
  }

  assertPortableGeneratedSkillNames(skills);
  for (const [skillName, paths] of nameToSources.entries()) {
    if (paths.length > 1) {
      throw new Error(
        `duplicate skill name "${skillName}" found in multiple files: ${paths.join(', ')}`,
      );
    }
  }
  assertPortableGeneratedSkillPathCollisions(skills);

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

function assertPortableGeneratedSkillName(skillName) {
  const rawName = String(skillName || '');
  if (!rawName || rawName.includes('/') || rawName.includes('\\')) {
    throw new Error(
      `invalid skill name "${skillName}": emitted skill path must be a single portable path segment`,
    );
  }
  const normalizedName = rawName.normalize('NFC');
  const windowsKey = windowsPathCollisionKey(normalizedName);
  if (!windowsKey || windowsKey === '.' || windowsKey === '..') {
    throw new Error(
      `invalid skill name "${skillName}": emitted skill path must not collapse to a reserved relative segment`,
    );
  }
  if (WINDOWS_RESERVED_BASENAMES.has(windowsReservedBasename(normalizedName))) {
    throw new Error(
      `invalid skill name "${skillName}": emitted skill path segments must not use Windows reserved basenames`,
    );
  }
  if (hasWindowsTrailingDotOrSpace(normalizedName)) {
    throw new Error(
      `invalid skill name "${skillName}": emitted skill path segments must not end with dots or spaces`,
    );
  }
}

function assertPortableGeneratedSkillNames(skills) {
  for (const skill of skills) {
    assertPortableGeneratedSkillName(skill.name);
  }
}

function assertPortableGeneratedSkillPathCollisions(skills) {
  const pathToSkills = new Map();
  for (const skill of skills) {
    const key = windowsPathCollisionKey(skill.name);
    if (!pathToSkills.has(key)) {
      pathToSkills.set(key, []);
    }
    pathToSkills.get(key).push(skill);
  }
  for (const [key, list] of pathToSkills.entries()) {
    if (list.length > 1) {
      throw new Error(
        `duplicate emitted skill path "${key}" found across skills: ${list.map((s) => `${s.name} (${s.canonicalDir || s.name})`).join(', ')}`,
      );
    }
  }
}

/**
 * Scans `core/skills/_shared/` and `domains/<domain>/skills/_shared/` to discover shared fragments.
 * Rejects a fragment path two sources both provide.
 */
export function discoverSharedFragments(projectRoot) {
  const coreSkillsRoot = path.join(projectRoot, 'core', 'skills');
  const domainsRoot = path.join(projectRoot, 'domains');
  const fragments = [];
  const pathToSources = new Map();

  const assertPortableFragmentSegment = (relPath, segment) => {
    if (WINDOWS_RESERVED_BASENAMES.has(windowsReservedBasename(segment))) {
      throw new Error(
        `invalid shared fragment path "${relPath}": fragment names must not use Windows reserved basenames`,
      );
    }
    if (hasWindowsTrailingDotOrSpace(segment)) {
      throw new Error(
        `invalid shared fragment path "${relPath}": fragment names must not end with dots or spaces`,
      );
    }
  };

  const scanShared = (sharedRoot, sourceLabel) => {
    if (!fs.existsSync(sharedRoot)) return;
    const walk = (currentDir, relBase = '') => {
      for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
        if (isOwnTmpFile(entry.name) || entry.name.startsWith('.')) continue;
        if (entry.name.includes('\\')) {
          throw new Error(
            `invalid shared fragment path "${relBase ? `${relBase}/${entry.name}` : entry.name}": fragment names must not contain backslashes`,
          );
        }
        const entryRel = relBase ? `${relBase}/${entry.name}` : entry.name;
        assertPortableFragmentSegment(entryRel, entry.name);
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath, entryRel);
        } else {
          const projectRelPath = path.relative(projectRoot, fullPath).replaceAll('\\', '/');
          const collisionKey = windowsPathCollisionKey(entryRel);
          if (!pathToSources.has(collisionKey)) {
            pathToSources.set(collisionKey, { relPath: entryRel, sources: [] });
          }
          pathToSources.get(collisionKey).sources.push(projectRelPath);
          fragments.push({
            relativeFragmentPath: entryRel,
            sourcePath: projectRelPath,
            sourceLabel,
          });
        }
      }
    };
    walk(sharedRoot);
  };

  scanShared(path.join(coreSkillsRoot, '_shared'), 'core');
  if (fs.existsSync(domainsRoot)) {
    for (const domainEntry of fs.readdirSync(domainsRoot, { withFileTypes: true })) {
      if (isOwnTmpFile(domainEntry.name) || domainEntry.name.startsWith('.')) continue;
      if (!domainEntry.isDirectory()) continue;
      scanShared(path.join(domainsRoot, domainEntry.name, 'skills', '_shared'), `domains/${domainEntry.name}`);
    }
  }

  for (const { relPath, sources } of pathToSources.values()) {
    if (sources.length > 1) {
      throw new Error(
        `duplicate shared fragment "${relPath}" found in multiple sources: ${sources.join(', ')}`,
      );
    }
  }

  return fragments.sort((a, b) => a.relativeFragmentPath.localeCompare(b.relativeFragmentPath));
}

const ASSEMBLED_HEADER_PREFIX = '<!-- Generated by fgOS skill assembly from ';

function withGeneratedHeader(sourceContent, sourceRelativePath) {
  const frontmatter = extractFrontmatter(sourceContent);
  const header = `${ASSEMBLED_HEADER_PREFIX}${sourceRelativePath} (npm run build:skills in the fgOS source repo). Do not edit this copy; it is overwritten. -->`;
  return `${frontmatter}${header}\n${sourceContent.slice(frontmatter.length)}`;
}

// Publish rendered Markdown once: concurrent readers must never see an
// unstamped intermediate copy. Non-Markdown retains the existing copy path.
function copyAssembledFile(projectRoot, sourcePath, targetPath) {
  if (!sourcePath.endsWith('.md')) {
    atomicCopyFileSync(sourcePath, targetPath);
    return;
  }

  const sourceRelativePath = path.relative(projectRoot, sourcePath).replaceAll('\\', '/');
  const content = withGeneratedHeader(fs.readFileSync(sourcePath, 'utf8'), sourceRelativePath);
  const tmpPath = `${targetPath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    fs.writeFileSync(tmpPath, content);
    fs.renameSync(tmpPath, targetPath);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch {}
    throw err;
  }
}

// True when `entryPath` (a file or a directory tree) holds a Markdown file stamped by
// `withGeneratedHeader`: provenance of an entry fgOS itself assembled. A skill another tool
// installed into the same directory carries no such stamp, so the prune pass leaves it alone.
function carriesAssembledHeader(entryPath) {
  const stat = fs.statSync(entryPath);
  if (stat.isDirectory()) {
    return fs.readdirSync(entryPath).some((name) => !isOwnTmpFile(name) && carriesAssembledHeader(path.join(entryPath, name)));
  }
  return entryPath.endsWith('.md') && fs.readFileSync(entryPath, 'utf8').includes(ASSEMBLED_HEADER_PREFIX);
}

/**
 * Assembles `.agents/skills/*` from `core/skills/*` and `domains/[domain]/skills/*`
 * (D7 of docs/history/core-foundation-domain-boundary/DISCUSSION.md).
 *
 * Canonical skill authoring lives under `core/skills/` (domain-agnostic)
 * and `domains/[domain]/skills/` (domain-specific). This assembly step copies or
 * materializes those skill sources into `agentsSkillsRoot` (`.agents/skills`),
 * which acts as the unified render target before thin wrappers are generated
 * in `.claude/skills`.
 *
 * Safe no-op when neither `core/skills` nor `domains/` exist. Returns array
 * of target paths written/assembled.
 *
 * @param {string} projectRoot - Root of the project containing `core/skills/` and/or `domains/`
 * @param {string} [targetAgentsSkills] - Destination directory for assembled skills (defaults to `<projectRoot>/.agents/skills`)
 * @param {object} [options]
 * @param {boolean} [options.prune=true] - When true, prunes orphan skill entries that fgOS itself assembled (generated header) from `agentsSkillsRoot` that are not present in canonical sources (`core/skills` or `domains/[domain]/skills`). Set to false when layering domain skills on top of copied base skills.
 */
export function assembleSkills(
  projectRoot,
  targetAgentsSkills,
  { prune = true } = {},
) {
  const agentsSkillsRoot = targetAgentsSkills ?? path.join(projectRoot, '.agents', 'skills');
  const coreSkillsRoot = path.join(projectRoot, 'core', 'skills');
  const domainsRoot = path.join(projectRoot, 'domains');
  const assembled = [];

  if (!fs.existsSync(coreSkillsRoot) && !fs.existsSync(domainsRoot)) {
    return assembled;
  }

  // 1. Shared fragment collisions across core and domains are fatal before any copy.
  const sharedFragments = discoverSharedFragments(projectRoot);

  // 2. Discover canonical skills and check for duplicate canonical skill names
  const canonicalSkills = discoverCanonicalSkills(projectRoot);

  const validSkillNames = new Set();

  // 3. Assemble _shared fragments into .agents/skills/_shared
  if (sharedFragments.length > 0) {
    validSkillNames.add('_shared');
    const targetShared = path.join(agentsSkillsRoot, '_shared');
    for (const fragment of sharedFragments) {
      const targetPath = path.join(targetShared, fragment.relativeFragmentPath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      copyAssembledFile(projectRoot, path.join(projectRoot, fragment.sourcePath), targetPath);
    }
    assembled.push(targetShared);
  }

  // 4. Assemble canonical skills into .agents/skills/<name>
  for (const skill of canonicalSkills) {
    validSkillNames.add(skill.name);
    const sourcePath = path.join(projectRoot, skill.canonicalDir);
    const targetPath = path.join(agentsSkillsRoot, skill.name);
    const stat = fs.statSync(sourcePath);
    if (stat.isDirectory()) {
      copyDirRecursive(sourcePath, targetPath, (source, target) => copyAssembledFile(projectRoot, source, target));
    } else {
      fs.mkdirSync(agentsSkillsRoot, { recursive: true });
      copyAssembledFile(projectRoot, sourcePath, targetPath);
    }
    assembled.push(targetPath);
  }

  // 5. Prune orphans: remove entries under agentsSkillsRoot that do not
  // correspond to any valid canonical skill or _shared fragments AND that fgOS
  // itself assembled (generated header). Skills other tools installed here stay.
  if (prune && fs.existsSync(agentsSkillsRoot)) {
    for (const entry of fs.readdirSync(agentsSkillsRoot, { withFileTypes: true })) {
      if (isOwnTmpFile(entry.name)) continue;
      if (!validSkillNames.has(entry.name)) {
        const orphanPath = path.join(agentsSkillsRoot, entry.name);
        if (!carriesAssembledHeader(orphanPath)) continue;
        fs.rmSync(orphanPath, { recursive: true, force: true });
      }
    }
  }

  return assembled;
}

/**
 * `fgos setup`'s external-project materialize path (D5/D7): an external
 * project starts with neither `.agents/skills` nor `.claude/skills` at
 * all, so there is nothing to generate a wrapper FROM until the real
 * source is copied in first. Copies `packageRoot/.agents/skills` into
 * `targetRoot/.agents/skills` verbatim, then generates every
 * `targetRoot/.claude/skills/*` wrapper against that freshly-copied,
 * now-local sibling copy -- never against `packageRoot` directly, so the
 * generated wrappers stay self-contained inside the target project and
 * never point back at wherever npm installed the global package (D7).
 *
 * Runs `assembleSkills` first (D7) so `.agents/skills` is assembled from
 * `core/skills` + `domains/[domain]/skills` before materializing -- a
 * git-checkout-based or symlinked dev install's `packageRoot` needs this
 * to pick up skill content authored since `.agents/skills` was last built.
 *
 * That assemble is best-effort here specifically (round-2 review finding,
 * tsk-397): a real global npm install's `packageRoot` is the shared
 * package directory, which can be root-owned or a read-only filesystem --
 * `.agents/skills` already ships pre-assembled+committed in that case
 * (D7), so a write failure here means "nothing new to pick up", not "setup
 * is broken". Same "pure observability/best-effort write must not crash
 * the caller" degrade-to-continue shape `appendWorkerLog` already uses
 * (`src/runner/worker-log.mjs`) for the identical class of failure
 * (disk full, EACCES, read-only target) -- never filtered to specific
 * error codes there either, so this stays consistent rather than
 * inventing a second contract for the same kind of I/O failure.
 *
 * A no-op when `packageRoot` carries no `.agents/skills` at all (e.g. a
 * pre-tsk-1qi package version, or a dev checkout of some other tool) --
 * same "absent capability = clean skip" contract every other optional
 * setup/doctor behavior in this repo already follows.
 */
export function materializeSkillsIntoProject(packageRoot, targetRoot) {
  // Which names fgOS may write is read from sources and decided before any write.
  const owned = ownedSkillNames(packageRoot, targetRoot);
  try {
    assembleSkills(packageRoot);
  } catch {
    // Best-effort: packageRoot's own .agents/skills (already
    // shipped/committed) is still used below, unassembled.
  }
  const sourceAgentsSkills = path.join(packageRoot, '.agents', 'skills');
  if (!fs.existsSync(sourceAgentsSkills)) {
    return { copied: false, wrappersWritten: [], skipped: [] };
  }
  const targetAgentsSkills = path.join(targetRoot, '.agents', 'skills');
  const targetClaudeSkills = path.join(targetRoot, '.claude', 'skills');
  // Self-hosting (forgentX's own dev checkout running `fgos setup` on
  // itself): packageRoot and targetRoot are the same real directory, so
  // there is nothing to copy -- `.agents/skills` is already its own
  // target. Skip straight to wrapper (re)generation, the same thing
  // `npm run build:skills` already does on its own.
  const copied = path.resolve(packageRoot) !== path.resolve(targetRoot);
  const guard = copied ? createProjectSkillGuard(targetRoot) : null;
  if (copied) {
    const keepCopy = keptCopy(guard.forRoots(sourceAgentsSkills, targetAgentsSkills));
    for (const entry of ownedSkillDirs(sourceAgentsSkills, owned)) {
      copyDirRecursive(path.join(sourceAgentsSkills, entry.name), path.join(targetAgentsSkills, entry.name), keepCopy);
    }
    // prune: false -- this call only layers targetRoot's own domain skills
    // on top of the packageRoot base skills just copied above; the base
    // skills are never derivable from targetRoot's own core/skills+domains,
    // so the default prune-orphans pass would delete them outright the
    // moment targetRoot has any domains/ of its own (see assembleSkills's
    // own comment on its `prune` parameter).
    assembleSkills(targetRoot, undefined, { prune: false });
  }
  const wrappersWritten = generateAllSkillWrappers(targetAgentsSkills, targetClaudeSkills, {
    owned,
    keep: guard?.forRoots(targetAgentsSkills, targetClaudeSkills),
  });
  return { copied, wrappersWritten, skipped: guard?.skipped ?? [] };
}

/**
 * Renders this checkout's skill surfaces (`.agents/skills`, `.claude/skills`,
 * `plugins/fgOS/skills`) and instruction projections from their sources. The
 * owned names and the instruction projection are computed first, so any
 * refusal leaves the tree untouched; only then does it write.
 */
export function renderSkillSurfaces(root) {
  const owned = ownedSkillNames(root);
  computeInstructionProjection(root);
  const agentsSkillsRoot = path.join(root, '.agents', 'skills');
  const assembled = assembleSkills(root);
  const written = generateAllSkillWrappers(agentsSkillsRoot, path.join(root, '.claude', 'skills'), { owned });
  const mirrored = mirrorDevSkillsIntoPlugin(agentsSkillsRoot, path.join(root, 'plugins', 'fgOS', 'skills'), owned);
  const projection = materializeInstructionProjection(root);
  return { assembled, written, mirrored, projection };
}
