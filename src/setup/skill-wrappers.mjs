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
  fs.renameSync(tmpPath, targetPath);
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
    `The real skill content lives at \`${relPath}\`, this project's own canonical skill source.\n` +
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
 * Generate every `.claude/skills/<name>/SKILL.md` wrapper from its
 * `.agents/skills/<name>/SKILL.md` source, for every skill directory
 * found directly under `agentsSkillsRoot` -- except `_shared` (a folder
 * of referenced fragments, not a dispatchable skill of its own; it has no
 * SKILL.md/frontmatter to wrap, and a wrapper's own redirect already
 * routes any `_shared` reference inside the source file to
 * `agentsSkillsRoot`'s own `_shared/`, so `.claude/skills/_shared` is not
 * needed once every `.claude/skills/*` entry is a redirect). Returns the
 * list of wrapper paths written.
 */
export function generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot) {
  const written = [];
  const validWrapperNames = new Set();
  if (fs.existsSync(agentsSkillsRoot)) {
    for (const entry of fs.readdirSync(agentsSkillsRoot, { withFileTypes: true })) {
      if (isOwnTmpFile(entry.name)) continue;
      if (!entry.isDirectory() || entry.name === '_shared') continue;
      const sourcePath = path.join(agentsSkillsRoot, entry.name, 'SKILL.md');
      if (!fs.existsSync(sourcePath)) continue;

      validWrapperNames.add(entry.name);

      const sourceContent = fs.readFileSync(sourcePath, 'utf8');
      const wrapperDir = path.join(claudeSkillsRoot, entry.name);
      const wrapperPath = path.join(wrapperDir, 'SKILL.md');
      const sourceRelativePath = path.relative(wrapperDir, sourcePath).replaceAll('\\', '/');
      fs.mkdirSync(wrapperDir, { recursive: true });
      fs.writeFileSync(wrapperPath, generateWrapperContent(sourceContent, sourceRelativePath));
      written.push(wrapperPath);

      const skillDir = path.join(agentsSkillsRoot, entry.name);
      for (const subEntry of fs.readdirSync(skillDir, { withFileTypes: true })) {
        if (isOwnTmpFile(subEntry.name)) continue;
        if (subEntry.name === 'SKILL.md') continue;
        const subSource = path.join(skillDir, subEntry.name);
        const subTarget = path.join(wrapperDir, subEntry.name);
        if (subEntry.isDirectory()) {
          copyDirRecursive(subSource, subTarget);
        } else {
          atomicCopyFileSync(subSource, subTarget);
        }
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

/** Recursively copy every file under `sourceDir` into `targetDir`,
 * creating directories as needed. Overwrites an existing file at the same
 * relative path -- the source is canonical, so a stale target copy is
 * meant to be replaced, not preserved. */
function copyDirRecursive(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (isOwnTmpFile(entry.name)) continue;
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(sourcePath, targetPath);
    } else {
      atomicCopyFileSync(sourcePath, targetPath);
    }
  }
}

/** The one name rule the plugin mirror applies: only `_shared/` and the
 * `fgos-*` dev-skills are ever written into `plugins/fgOS/skills`. The
 * classifier in `isGeneratedAdapterTarget` reuses this exact predicate so
 * "what the mirror writes" and "what counts as mirrored" cannot drift --
 * but the name alone is never sufficient there: a hand-authored
 * `plugins/fgOS/skills/fgos-custom/` with no canonical source is still
 * unmanaged (see `isMirroredPluginSkill`). */
function isMirroredDevSkillName(name) {
  return name === '_shared' || name.startsWith('fgos-');
}

/**
 * Mirrors the 14 coding-domain dev-skills (`fgos-*`) and `_shared/` from
 * `agentsSkillsRoot` (`.agents/skills`) into `pluginSkillsRoot`
 * (`plugins/fgOS/skills`). Returns the list of target skill directory paths written.
 */
export function mirrorDevSkillsIntoPlugin(agentsSkillsRoot, pluginSkillsRoot) {
  const mirrored = [];
  if (!fs.existsSync(agentsSkillsRoot)) return mirrored;
  for (const entry of fs.readdirSync(agentsSkillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!isMirroredDevSkillName(entry.name)) continue;
    const sourceDir = path.join(agentsSkillsRoot, entry.name);
    const targetDir = path.join(pluginSkillsRoot, entry.name);
    copyDirRecursive(sourceDir, targetDir);
    mirrored.push(targetDir);
  }
  return mirrored;
}


/**
 * Known distribution / adapter targets for fgOS skills.
 * Canonical skills are authored in `core/skills/` and `domains/<domain>/skills/`;
 * all other surfaces are generated adapter targets.
 */
export const SKILL_ADAPTER_TARGETS = Object.freeze({
  agents: Object.freeze({
    id: 'agents',
    name: 'Codex / OpenAI portable skills',
    targetRelDir: '.agents/skills',
    kind: 'portable-projection',
    triggerSyntax: '$<skill-name>',
    adapterStatus: 'implemented',
  }),
  claude: Object.freeze({
    id: 'claude',
    name: 'Claude Code thin wrappers',
    targetRelDir: '.claude/skills',
    kind: 'thin-wrapper',
    triggerSyntax: '/fgos:<verb>',
    adapterStatus: 'implemented',
  }),
  plugin: Object.freeze({
    id: 'plugin',
    name: 'Claude fgOS plugin skills bundle',
    targetRelDir: 'plugins/fgOS/skills',
    kind: 'mirrored-bundle',
    triggerSyntax: '/fgos:<verb>',
    adapterStatus: 'implemented',
  }),
  gemini: Object.freeze({
    id: 'gemini',
    name: 'Gemini CLI extension package',
    targetRelDir: '.gemini/extensions/fgos',
    kind: 'extension-package',
    triggerSyntax: '/fgos:<verb>',
    adapterStatus: 'partial',
  }),
});

function resolveProjectRoot(targetPath, projectRoot) {
  if (projectRoot) return projectRoot;
  if (path.isAbsolute(targetPath)) {
    let best = null;
    for (const segment of ['.agents', '.claude', 'plugins', 'core', 'domains', '.gemini']) {
      const needle = path.sep + segment + path.sep;
      const idx = targetPath.lastIndexOf(needle);
      if (idx !== -1) {
        if (!best || idx > best.idx) best = { idx, root: targetPath.slice(0, idx) };
      }
      const endNeedle = path.sep + segment;
      if (targetPath.endsWith(endNeedle)) {
        const endIdx = targetPath.length - endNeedle.length;
        if (!best || endIdx > best.idx) best = { idx: endIdx, root: targetPath.slice(0, endIdx) };
      }
    }
    if (best) return best.root;
  }
  return process.cwd();
}

function hasCanonicalOrAssembledSkill(skillName, root) {
  if (!root || !skillName) return false;
  if (
    fs.existsSync(path.join(root, '.agents', 'skills', skillName, 'SKILL.md')) ||
    fs.existsSync(path.join(root, 'core', 'skills', skillName, 'SKILL.md'))
  ) {
    return true;
  }
  const domainsDir = path.join(root, 'domains');
  if (fs.existsSync(domainsDir)) {
    try {
      for (const domain of fs.readdirSync(domainsDir)) {
        if (fs.existsSync(path.join(domainsDir, domain, 'skills', skillName, 'SKILL.md'))) {
          return true;
        }
      }
    } catch {}
  }
  return false;
}

function hasSharedFragmentSource(root, subPath) {
  if (!root) return false;
  if (!subPath || subPath === '_shared' || subPath === '_shared/') {
    return (
      fs.existsSync(path.join(root, 'core', 'skills', '_shared')) ||
      fs.existsSync(path.join(root, '.agents', 'skills', '_shared'))
    );
  }
  const fragmentSub = subPath.startsWith('_shared/') ? subPath.slice('_shared/'.length) : subPath;
  if (
    fs.existsSync(path.join(root, 'core', 'skills', '_shared', fragmentSub)) ||
    fs.existsSync(path.join(root, '.agents', 'skills', '_shared', fragmentSub))
  ) {
    return true;
  }
  const domainsDir = path.join(root, 'domains');
  if (fs.existsSync(domainsDir)) {
    try {
      for (const domain of fs.readdirSync(domainsDir)) {
        if (fs.existsSync(path.join(domainsDir, domain, 'skills', '_shared', fragmentSub))) {
          return true;
        }
      }
    } catch {}
  }
  return false;
}

/**
 * Checks whether a skill directory under `.claude/skills` is a generated wrapper
 * (has `GENERATED_WRAPPER_MARKER` in its `SKILL.md`) or corresponds to a canonical/assembled skill,
 * distinguishing generated wrappers from hand-authored skills (e.g. `ui-spec`, `gitnexus`).
 */
function isGeneratedClaudeSkillWrapper(skillDirName, targetPath, projectRoot) {
  const root = resolveProjectRoot(targetPath, projectRoot);
  const candidateDir = path.isAbsolute(targetPath)
    ? (targetPath.includes(path.join('.claude', 'skills', skillDirName))
        ? path.join(root, '.claude', 'skills', skillDirName)
        : null)
    : path.join(root, '.claude', 'skills', skillDirName);

  if (candidateDir) {
    const skillMd = path.join(candidateDir, 'SKILL.md');
    if (fs.existsSync(skillMd)) {
      try {
        const stat = fs.statSync(skillMd);
        if (stat.isFile() && fs.readFileSync(skillMd, 'utf8').includes(GENERATED_WRAPPER_MARKER)) {
          return true;
        }
      } catch {}
    }
  }

  // Provenance check: does a canonical or assembled source exist for this skill?
  if (hasCanonicalOrAssembledSkill(skillDirName, root)) {
    return true;
  }

  return false;
}

/** Whether `plugins/fgOS/skills/<sub>` is something `mirrorDevSkillsIntoPlugin`
 * itself would have written: the name must pass the mirror's own rule AND a
 * canonical/assembled source must exist to have been mirrored from. Mirrored
 * files are byte-identical copies of the full skill, so they never carry
 * `GENERATED_WRAPPER_MARKER` -- provenance is the only proof available here.
 * A hand-authored `fgos-custom/` (right prefix, no source) or a hand-authored
 * user command (`pick/`, `submit/`, `cook/`) is never this function's to claim. */
function isMirroredPluginSkill(sub, root) {
  if (sub === '_shared' || sub.startsWith('_shared/')) {
    return hasSharedFragmentSource(root, sub);
  }
  const skillName = sub.split('/')[0];
  if (!skillName || !isMirroredDevSkillName(skillName)) return false;
  return hasCanonicalOrAssembledSkill(skillName, root);
}

/**
 * Checks whether a path is a generated adapter target rather than a canonical authoring source.
 *
 * Precise classification:
 * - `.agents/skills/*`: assembled portable projection
 * - `.gemini/extensions/fgos/*`: generated extension package
 * - `plugins/fgOS/skills/*`: only what the plugin mirror writes -- `_shared/` fragments and
 *   `fgos-*` dev-skills that have a canonical/assembled source (`isMirroredPluginSkill`);
 *   hand-authored plugin skills (`pick`, `submit`, `cook`, or a custom `fgos-*` with no
 *   source) are NOT generated targets.
 * - `.claude/skills/*`: only generated thin-wrapper stubs containing `GENERATED_WRAPPER_MARKER`
 *   or canonical provenance; hand-authored or third-party skills (e.g. `ui-spec`, `gitnexus`)
 *   are NOT generated targets.
 */
export function isGeneratedAdapterTarget(targetPath, projectRoot) {
  const root = resolveProjectRoot(targetPath, projectRoot);
  const rel = path.isAbsolute(targetPath) ? path.relative(root, targetPath) : targetPath;
  const normalized = rel.split(path.sep).join('/');

  if (normalized === '.agents/skills' || normalized.startsWith('.agents/skills/')) {
    return true;
  }

  if (normalized === '.gemini/extensions/fgos' || normalized.startsWith('.gemini/extensions/fgos/')) {
    return true;
  }

  if (normalized.startsWith('plugins/fgOS/skills/')) {
    return isMirroredPluginSkill(normalized.slice('plugins/fgOS/skills/'.length), root);
  }

  if (normalized.startsWith('.claude/skills/')) {
    const sub = normalized.slice('.claude/skills/'.length);
    const skillName = sub.split('/')[0];
    if (!skillName || skillName === '_shared') return false;
    return isGeneratedClaudeSkillWrapper(skillName, targetPath, projectRoot);
  }

  return false;
}

/**
 * Checks whether a path is a canonical skill authoring source directory or file.
 */
export function isCanonicalSkillSource(sourcePath, projectRoot) {
  const root = resolveProjectRoot(sourcePath, projectRoot);
  const rel = path.isAbsolute(sourcePath) ? path.relative(root, sourcePath) : sourcePath;
  const normalized = rel.split(path.sep).join('/');
  return (
    normalized.startsWith('core/skills/') ||
    new RegExp('^domains/[^/]+/skills/').test(normalized)
  );
}

/**
 * Derives canonical intent ID from frontmatter `intent:` or `public-intent:` field or skill name.
 * Default shape: `fgos:<verb>` or `fgos:<compound-verb>`.
 */
export function deriveSkillIntentId(skillName, frontmatterContent = '') {
  const match = frontmatterContent.match(/^(?:intent|public-intent):\s*(\S+)/m);
  if (match && match[1]) {
    return match[1];
  }
  if (skillName.startsWith('fgos-')) {
    return `fgos:${skillName.slice(5)}`;
  }
  return `fgos:${skillName}`;
}

function normalizeGeminiCommandVerb(intentId) {
  const rawVerb = intentId.startsWith('fgos:') ? intentId.slice(5) : intentId;
  if (
    !rawVerb ||
    rawVerb !== rawVerb.toLowerCase() ||
    !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(rawVerb) ||
    WINDOWS_RESERVED_BASENAMES.has(windowsReservedBasename(rawVerb))
  ) {
    throw new Error(
      `invalid Gemini command intent "${intentId}": command verb must use lowercase ASCII letters, digits, and single hyphens only`,
    );
  }
  return rawVerb;
}

function geminiCommandPathForIntent(intentId) {
  return `commands/fgos/${normalizeGeminiCommandVerb(intentId)}.toml`;
}

/**
 * Maps a canonical skill intent ID to native host triggers across
 * Codex/OpenAI, Claude, and Gemini CLI.
 */
export function mapSkillIntentToHostTriggers(intentId, skillName) {
  const verb = normalizeGeminiCommandVerb(intentId);
  const knownCodexOverrides = {
    'fgos:pick': '$fgos-routing',
  };
  const knownCompat = {
    'fgos:submit': '/fgOS:submit',
    'fgos:pick': '/fgOS:pick',
    'fgos:code-panel': '/fgOS:code-panel',
    'fgos:architecture-panel': '/fgOS:architecture-panel',
  };
  const isPartial = intentId === 'fgos:pick' || intentId === 'fgos:submit';
  return {
    intentId,
    skillName,
    codex: knownCodexOverrides[intentId] ?? (skillName ? `$${skillName}` : `$fgos-${verb}`),
    claude: `/fgos:${verb}`,
    claudeCompat: knownCompat[intentId] ?? null,
    gemini: `/fgos:${verb}`,
    status: isPartial ? 'partial' : 'implemented',
  };
}

/**
 * Scans `core/skills/` and `domains/<domain>/skills/` to discover all canonical skills.
 * Enforces exactly one canonical source per skill by default (`checkDuplicates: true`),
 * and rejects duplicate canonical intent IDs and duplicate derived host command paths/triggers
 * before any adapter or projection write.
 */
export function discoverCanonicalSkills(projectRoot, { checkDuplicates = true } = {}) {
  const coreSkillsRoot = path.join(projectRoot, 'core', 'skills');
  const domainsRoot = path.join(projectRoot, 'domains');
  const skills = [];
  const nameToSources = new Map();

  if (fs.existsSync(coreSkillsRoot)) {
    for (const entry of fs.readdirSync(coreSkillsRoot, { withFileTypes: true })) {
      if (isOwnTmpFile(entry.name) || entry.name.startsWith('.')) continue;
      if (!entry.isDirectory() || entry.name === '_shared') continue;
      const skillDir = path.join(coreSkillsRoot, entry.name);
      const skillFile = path.join(skillDir, 'SKILL.md');
      if (!fs.existsSync(skillFile)) continue;

      const relPath = path.relative(projectRoot, skillDir).replaceAll('\\', '/');
      if (!nameToSources.has(entry.name)) {
        nameToSources.set(entry.name, []);
      }
      nameToSources.get(entry.name).push(relPath);

      const content = fs.readFileSync(skillFile, 'utf8');
      const frontmatter = extractFrontmatter(content);
      const userInvocable = !/^user-invocable:\s*false$/m.test(frontmatter);
      const intentId = deriveSkillIntentId(entry.name, frontmatter);
      const triggers = mapSkillIntentToHostTriggers(intentId, entry.name);

      skills.push({
        name: entry.name,
        authority: 'core',
        domain: null,
        canonicalDir: relPath,
        skillFilePath: path.relative(projectRoot, skillFile).replaceAll('\\', '/'),
        frontmatter,
        userInvocable,
        intentId,
        triggers,
      });
    }
  }

  if (fs.existsSync(domainsRoot)) {
    for (const domainEntry of fs.readdirSync(domainsRoot, { withFileTypes: true })) {
      if (isOwnTmpFile(domainEntry.name) || domainEntry.name.startsWith('.')) continue;
      if (!domainEntry.isDirectory()) continue;
      const domainSkillsRoot = path.join(domainsRoot, domainEntry.name, 'skills');
      if (!fs.existsSync(domainSkillsRoot)) continue;

      for (const entry of fs.readdirSync(domainSkillsRoot, { withFileTypes: true })) {
        if (isOwnTmpFile(entry.name) || entry.name.startsWith('.')) continue;
        if (!entry.isDirectory() || entry.name === '_shared') continue;
        const skillDir = path.join(domainSkillsRoot, entry.name);
        const skillFile = path.join(skillDir, 'SKILL.md');
        if (!fs.existsSync(skillFile)) continue;

        const relPath = path.relative(projectRoot, skillDir).replaceAll('\\', '/');
        if (!nameToSources.has(entry.name)) {
          nameToSources.set(entry.name, []);
        }
        nameToSources.get(entry.name).push(relPath);

        const content = fs.readFileSync(skillFile, 'utf8');
        const frontmatter = extractFrontmatter(content);
        const userInvocable = !/^user-invocable:\s*false$/m.test(frontmatter);
        const intentId = deriveSkillIntentId(entry.name, frontmatter);
        const triggers = mapSkillIntentToHostTriggers(intentId, entry.name);

        skills.push({
          name: entry.name,
          authority: 'domain',
          domain: domainEntry.name,
          canonicalDir: relPath,
          skillFilePath: path.relative(projectRoot, skillFile).replaceAll('\\', '/'),
          frontmatter,
          userInvocable,
          intentId,
          triggers,
        });
      }
    }
  }

  assertPortableGeneratedSkillNames(skills);

  if (checkDuplicates) {
    for (const [skillName, paths] of nameToSources.entries()) {
      if (paths.length > 1) {
        throw new Error(
          `duplicate skill name "${skillName}" found in multiple files: ${paths.join(', ')}`,
        );
      }
    }

    const intentToSkills = new Map();
    for (const skill of skills) {
      if (!intentToSkills.has(skill.intentId)) {
        intentToSkills.set(skill.intentId, []);
      }
      intentToSkills.get(skill.intentId).push(skill);
    }
    for (const [intentId, list] of intentToSkills.entries()) {
      if (list.length > 1) {
        throw new Error(
          `duplicate canonical intent ID "${intentId}" found across skills: ${list.map((s) => `${s.name} (${s.canonicalDir})`).join(', ')}`,
        );
      }
    }

    const hostCommandPaths = new Map();
    const hostTriggers = new Map();

    for (const skill of skills) {
      const geminiCmdPath = geminiCommandPathForIntent(skill.intentId);
      if (!hostCommandPaths.has(geminiCmdPath)) {
        hostCommandPaths.set(geminiCmdPath, []);
      }
      hostCommandPaths.get(geminiCmdPath).push(skill);

      for (const [host, trigger] of Object.entries(skill.triggers)) {
        if (!trigger || host === 'intentId' || host === 'skillName' || host === 'status') continue;
        const key = `${host}:${trigger}`;
        if (!hostTriggers.has(key)) {
          hostTriggers.set(key, []);
        }
        hostTriggers.get(key).push(skill);
      }
    }

    for (const [cmdPath, list] of hostCommandPaths.entries()) {
      if (list.length > 1) {
        throw new Error(
          `duplicate derived host command path "${cmdPath}" found across skills: ${list.map((s) => `${s.name} (${s.canonicalDir})`).join(', ')}`,
        );
      }
    }

    for (const [key, list] of hostTriggers.entries()) {
      if (list.length > 1) {
        const [host, trigger] = key.split(':');
        throw new Error(
          `duplicate derived host trigger "${trigger}" for host "${host}" found across skills: ${list.map((s) => `${s.name} (${s.canonicalDir})`).join(', ')}`,
        );
      }
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
 * Enforces that shared fragments do not collide across sources by default (`checkCollisions: true`).
 */
export function discoverSharedFragments(projectRoot, { checkCollisions = true } = {}) {
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

  if (checkCollisions) {
    for (const { relPath, sources } of pathToSources.values()) {
      if (sources.length > 1) {
        throw new Error(
          `duplicate shared fragment "${relPath}" found in multiple sources: ${sources.join(', ')}`,
        );
      }
    }
  }

  return fragments.sort((a, b) => a.relativeFragmentPath.localeCompare(b.relativeFragmentPath));
}

function toPosixRelativePath(fromDir, toPath) {
  let rel = path.relative(fromDir, toPath).split(path.sep).join('/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

function packagedSharedReferenceFor(filePath, skillsDir, fragmentPath) {
  return toPosixRelativePath(path.dirname(filePath), path.join(skillsDir, '_shared', fragmentPath));
}

function canonicalSharedRoots(projectRoot) {
  if (!projectRoot) return [];
  const roots = [
    path.join(projectRoot, 'core', 'skills', '_shared'),
    path.join(projectRoot, '.agents', 'skills', '_shared'),
  ];
  const domainsRoot = path.join(projectRoot, 'domains');
  if (fs.existsSync(domainsRoot)) {
    for (const domainEntry of fs.readdirSync(domainsRoot, { withFileTypes: true })) {
      if (isOwnTmpFile(domainEntry.name) || domainEntry.name.startsWith('.') || !domainEntry.isDirectory()) continue;
      roots.push(path.join(domainsRoot, domainEntry.name, 'skills', '_shared'));
    }
  }
  return roots.map((root) => {
    const resolved = path.resolve(root);
    let real = resolved;
    try {
      real = fs.realpathSync.native(resolved);
    } catch {
      // A not-yet-materialized projection root can still be a lexical rewrite source.
    }
    return { resolved, real };
  });
}

function isPathInside(parent, candidate) {
  const rel = path.relative(parent, candidate);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function fragmentPathForCanonicalReference(candidatePath, sharedRoots) {
  if (path.win32.isAbsolute(candidatePath)) {
    const normalizedWinPath = path.win32.normalize(candidatePath);
    const match = /(?:^|[\\/])(?:core[\\/]skills[\\/]_shared|domains[\\/][^\\/]+[\\/]skills[\\/]_shared)[\\/](.+)$/i.exec(normalizedWinPath);
    return match ? match[1].split('\\').join('/') : null;
  }

  const resolved = path.resolve(candidatePath);
  let real = resolved;
  try {
    real = fs.realpathSync.native(resolved);
  } catch {
    // Broken absolute refs are left untouched unless their lexical path is under a known root.
  }
  for (const root of sharedRoots) {
    const matchedRoot = isPathInside(root.real, real)
      ? root.real
      : isPathInside(root.resolved, resolved)
        ? root.resolved
        : null;
    if (!matchedRoot) continue;
    const matchedPath = matchedRoot === root.real ? real : resolved;
    const fragmentPath = path.relative(matchedRoot, matchedPath).split(path.sep).join('/');
    if (fragmentPath) return fragmentPath;
  }
  return null;
}

function rewriteAbsoluteSharedReferences(content, filePath, skillsDir, projectRoot, sharedRoots) {
  if (!projectRoot || sharedRoots.length === 0) return content;
  const absoluteProjectPathPattern = /(?:[A-Za-z]:[\\/]|\\\\[^\\/\s`)"']+[\\/][^\\/\s`)"']+[\\/]|\/)[^`\n)"']+/g;
  return content.replace(absoluteProjectPathPattern, (rawRef) => {
    const fragmentPath = fragmentPathForCanonicalReference(rawRef, sharedRoots);
    return fragmentPath ? packagedSharedReferenceFor(filePath, skillsDir, fragmentPath) : rawRef;
  });
}

function rewritePackagedSkillReferences(content, filePath, skillsDir, sharedRoots = [], projectRoot) {
  let rewritten = content
    .replace(
      /(?:\.\.\/)+core\/skills\/_shared\/([^`\s)"']+)/g,
      (_, fragmentPath) => packagedSharedReferenceFor(filePath, skillsDir, fragmentPath),
    )
    .replace(
      /(?:\.\.\/)+domains\/.+?\/skills\/_shared\/([^`\n)"']+)/g,
      (_, fragmentPath) => packagedSharedReferenceFor(filePath, skillsDir, fragmentPath),
    )
    .replace(
      /(?:\.\.\/)+\.agents\/skills\/_shared\/([^`\s)"']+)/g,
      (_, fragmentPath) => packagedSharedReferenceFor(filePath, skillsDir, fragmentPath),
    );
  return rewriteAbsoluteSharedReferences(rewritten, filePath, skillsDir, projectRoot, sharedRoots);
}

function rewritePackagedTextReferences(root, { projectRoot } = {}) {
  if (!fs.existsSync(root)) return;
  const sharedRoots = canonicalSharedRoots(projectRoot);
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      let content;
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }
      if (content.includes('\0')) continue;
      const rewritten = rewritePackagedSkillReferences(content, fullPath, root, sharedRoots, projectRoot);
      if (rewritten !== content) fs.writeFileSync(fullPath, rewritten, 'utf8');
    }
  };
  walk(root);
}

/**
 * Generates a self-contained Gemini CLI extension package under `targetOutputDir` from canonical skills.
 * Packages resolved skill instruction bodies/files into `skills/<name>/SKILL.md`,
 * shared fragments into `skills/_shared/`, extension manifest in `gemini-extension.json`,
 * extension documentation in `GEMINI.md`, and command definitions in `commands/fgos/<verb>.toml`.
 */
export function generateGeminiSkillPackage(projectRoot, targetOutputDir, { skills } = {}) {
  const canonicalSkills = skills ?? discoverCanonicalSkills(projectRoot);
  const written = [];

  // Verify no duplicate command paths or intent collisions before writing any adapter files
  const seenVerbs = new Map();
  assertPortableGeneratedSkillNames(canonicalSkills);
  assertPortableGeneratedSkillPathCollisions(canonicalSkills);
  for (const s of canonicalSkills) {
    const verb = normalizeGeminiCommandVerb(s.intentId);
    if (!seenVerbs.has(verb)) {
      seenVerbs.set(verb, []);
    }
    seenVerbs.get(verb).push(s);
  }
  for (const [verb, list] of seenVerbs.entries()) {
    if (list.length > 1) {
      throw new Error(
        `duplicate derived Gemini command path "commands/fgos/${verb}.toml" found across skills: ${list.map((s) => `${s.name} (${s.canonicalDir || s.name})`).join(', ')}`,
      );
    }
  }

  fs.mkdirSync(targetOutputDir, { recursive: true });
  const commandsDir = path.join(targetOutputDir, 'commands', 'fgos');
  fs.mkdirSync(commandsDir, { recursive: true });
  const skillsDir = path.join(targetOutputDir, 'skills');
  fs.mkdirSync(skillsDir, { recursive: true });

  // 1. Package _shared fragments into skills/_shared if present
  if (projectRoot) {
    const sharedFragments = discoverSharedFragments(projectRoot);
    if (sharedFragments.length > 0) {
      const targetShared = path.join(skillsDir, '_shared');
      for (const fragment of sharedFragments) {
        const targetPath = path.join(targetShared, fragment.relativeFragmentPath);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        atomicCopyFileSync(path.join(projectRoot, fragment.sourcePath), targetPath);
      }
      written.push(targetShared);
    }
  }

  // 2. Package resolved skill instruction bodies/files into skills/<name>/
  for (const s of canonicalSkills) {
    const targetSkillDir = path.join(skillsDir, s.name);
    const sourcePath = (s.canonicalDir && projectRoot) ? path.join(projectRoot, s.canonicalDir) : null;
    if (sourcePath && fs.existsSync(sourcePath)) {
      const stat = fs.statSync(sourcePath);
      if (stat.isDirectory()) {
        copyDirRecursive(sourcePath, targetSkillDir);
      } else {
        fs.mkdirSync(targetSkillDir, { recursive: true });
        atomicCopyFileSync(sourcePath, path.join(targetSkillDir, 'SKILL.md'));
      }
    } else if (s.rawContent || s.frontmatter || s.skillFilePath) {
      fs.mkdirSync(targetSkillDir, { recursive: true });
      const content = s.rawContent || (s.frontmatter ? `${s.frontmatter}\n# ${s.name}\n` : `# ${s.name}\n`);
      fs.writeFileSync(path.join(targetSkillDir, 'SKILL.md'), content, 'utf8');
    }
    const packagedSkillFile = path.join(targetSkillDir, 'SKILL.md');
    if (fs.existsSync(packagedSkillFile)) {
      written.push(packagedSkillFile);
    }
  }
  rewritePackagedTextReferences(skillsDir, { projectRoot });

  const manifest = {
    name: 'fgos',
    version: '0.1.0',
    description: 'fgOS platform skills and command adapters for Gemini CLI',
    commands: canonicalSkills.map((s) => {
      const verb = normalizeGeminiCommandVerb(s.intentId);
      return {
        name: verb,
        description: `Execute ${s.name} (${s.intentId})`,
        file: `commands/fgos/${verb}.toml`,
      };
    }),
  };
  const manifestPath = path.join(targetOutputDir, 'gemini-extension.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  written.push(manifestPath);

  const geminiDoc = [
    '# fgOS Skills for Gemini CLI',
    '',
    'This extension package adapts canonical fgOS skills for Gemini CLI.',
    'All commands below map to packaged fgOS skill instructions.',
    '',
    '## Available Commands',
    '',
    ...canonicalSkills.map((s) => {
      const trigger = s.triggers.gemini;
      return `- \`${trigger}\`: packaged skill \`skills/${s.name}/SKILL.md\` (intent: \`${s.intentId}\`)`;
    }),
    '',
  ].join('\n');
  const docPath = path.join(targetOutputDir, 'GEMINI.md');
  fs.writeFileSync(docPath, geminiDoc);
  written.push(docPath);

  // The package must run with the source repo absent: the only runnable
  // reference a command carries is `packaged_source`, a path inside this
  // extension. `provenance` records which canonical dir the packaged copy
  // was rendered from (the projection-ledger question "which canonical
  // skill source produced it") and is never what the prompt tells the host
  // to read.
  for (const s of canonicalSkills) {
    const verb = normalizeGeminiCommandVerb(s.intentId);
    const tomlPath = path.join(commandsDir, `${verb}.toml`);
    const packagedRelPath = `skills/${s.name}/SKILL.md`;
    const tomlContent = [
      `name = "${verb}"`,
      `description = "Run fgOS canonical skill ${s.name}"`,
      `intent = "${s.intentId}"`,
      `packaged_source = "${packagedRelPath}"`,
      `provenance = "${s.canonicalDir || 'inline'}"`,
      `user_invocable = ${s.userInvocable}`,
      `prompt = "Read and follow the packaged fgOS skill instructions at ${packagedRelPath}, inside this fgos extension's own install directory, directly."`,
      '',
    ].join('\n');
    fs.writeFileSync(tomlPath, tomlContent);
    written.push(tomlPath);
  }

  return written;
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
 * @param {boolean} [options.prune=true] - When true, prunes orphan skill directories from `agentsSkillsRoot` that are not present in canonical sources (`core/skills` or `domains/[domain]/skills`). Set to false when layering domain skills on top of copied base skills.
 * @param {boolean} [options.checkDuplicates=true] - When true, rejects duplicate skill names and canonical intent IDs.
 * @param {boolean} [options.checkCollisions=true] - Legacy compatibility option; collisions are always rejected before production assembly copies shared fragments.
 */
export function assembleSkills(
  projectRoot,
  targetAgentsSkills,
  { prune = true, checkDuplicates = true, checkCollisions = true } = {},
) {
  const agentsSkillsRoot = targetAgentsSkills ?? path.join(projectRoot, '.agents', 'skills');
  const coreSkillsRoot = path.join(projectRoot, 'core', 'skills');
  const domainsRoot = path.join(projectRoot, 'domains');
  const assembled = [];

  if (!fs.existsSync(coreSkillsRoot) && !fs.existsSync(domainsRoot)) {
    return assembled;
  }

  // 1. Check shared fragment collisions across core and domains.
  // Collisions remain fatal even for callers that pass the legacy
  // checkCollisions:false option; disabling the diagnostic cannot permit an
  // actual generated-file overwrite.
  const sharedFragments = discoverSharedFragments(projectRoot);

  // 2. Discover canonical skills and check for duplicate canonical skill names
  const canonicalSkills = discoverCanonicalSkills(projectRoot, { checkDuplicates });

  const validSkillNames = new Set();

  // 3. Assemble _shared fragments into .agents/skills/_shared
  if (sharedFragments.length > 0) {
    validSkillNames.add('_shared');
    const targetShared = path.join(agentsSkillsRoot, '_shared');
    for (const fragment of sharedFragments) {
      const targetPath = path.join(targetShared, fragment.relativeFragmentPath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      atomicCopyFileSync(path.join(projectRoot, fragment.sourcePath), targetPath);
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
      copyDirRecursive(sourcePath, targetPath);
    } else {
      fs.mkdirSync(agentsSkillsRoot, { recursive: true });
      atomicCopyFileSync(sourcePath, targetPath);
    }
    assembled.push(targetPath);
  }

  // 5. Prune orphans: remove directories under agentsSkillsRoot that do not
  // correspond to any valid canonical skill or _shared fragments.
  if (prune && fs.existsSync(agentsSkillsRoot)) {
    for (const entry of fs.readdirSync(agentsSkillsRoot, { withFileTypes: true })) {
      if (isOwnTmpFile(entry.name)) continue;
      if (!validSkillNames.has(entry.name)) {
        const orphanPath = path.join(agentsSkillsRoot, entry.name);
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
  try {
    assembleSkills(packageRoot);
  } catch {
    // Best-effort: packageRoot's own .agents/skills (already
    // shipped/committed) is still used below, unassembled.
  }
  const sourceAgentsSkills = path.join(packageRoot, '.agents', 'skills');
  if (!fs.existsSync(sourceAgentsSkills)) {
    return { copied: false, wrappersWritten: [] };
  }
  const targetAgentsSkills = path.join(targetRoot, '.agents', 'skills');
  const targetClaudeSkills = path.join(targetRoot, '.claude', 'skills');
  // Self-hosting (forgentX's own dev checkout running `fgos setup` on
  // itself): packageRoot and targetRoot are the same real directory, so
  // there is nothing to copy -- `.agents/skills` is already its own
  // target. Skip straight to wrapper (re)generation, the same thing
  // `npm run build:skills` already does on its own.
  const copied = path.resolve(packageRoot) !== path.resolve(targetRoot);
  if (copied) {
    copyDirRecursive(sourceAgentsSkills, targetAgentsSkills);
    // prune: false -- this call only layers targetRoot's own domain skills
    // on top of the packageRoot base skills just copied above; the base
    // skills are never derivable from targetRoot's own core/skills+domains,
    // so the default prune-orphans pass would delete them outright the
    // moment targetRoot has any domains/ of its own (see assembleSkills's
    // own comment on its `prune` parameter).
    assembleSkills(targetRoot, undefined, { prune: false });
  }
  const wrappersWritten = generateAllSkillWrappers(targetAgentsSkills, targetClaudeSkills);
  return { copied, wrappersWritten };
}
