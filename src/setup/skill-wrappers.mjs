// skill-wrappers.mjs — generates `.claude/skills/<name>/SKILL.md` thin-
// wrapper stubs from `.agents/skills/<name>/SKILL.md` (tsk-1qi, D5/D7 of
// docs/history/install-setup-external-project-reliability/CONTEXT.md).
//
// `.agents/skills/*` is the canonical, orchestrator-neutral skill source
// (D5) — a wrapper's whole content is a short read-and-follow redirect to
// it, never a full copy (Pinned terms, "Thin wrapper"). Frontmatter is
// copied verbatim so Claude Code's own skill listing still shows the
// real name/description; only the body becomes the redirect.
//
// One shared function, two callers (D7): `npm run build:skills`
// (forgentX's own dogfood/CI, wrapper generation only, source and target
// are the same repo) and `fgos setup`'s external-project materialize path
// (`materializeSkillsIntoProject` below, which ALSO copies `.agents/
// skills/*` into the target project first — an external project starts
// with neither tree, so there is nothing to generate wrappers FROM until
// the source is copied in).

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
  return (
    `${frontmatter}\n` +
    `${GENERATED_WRAPPER_MARKER}\n` +
    `The real skill content lives at \`${sourceRelativePath}\`, this project's own canonical skill source.\n` +
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
      const sourceRelativePath = path.relative(wrapperDir, sourcePath);
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
    if (entry.name !== '_shared' && !entry.name.startsWith('fgos-')) continue;
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
    adapterStatus: 'implemented',
  }),
});

/**
 * Checks whether a path is a generated adapter target rather than a canonical authoring source.
 */
export function isGeneratedAdapterTarget(targetPath, projectRoot) {
  const rel = projectRoot ? path.relative(projectRoot, targetPath) : targetPath;
  const normalized = rel.split(path.sep).join('/');
  return (
    normalized === '.agents/skills' ||
    normalized.startsWith('.agents/skills/') ||
    normalized === '.claude/skills' ||
    normalized.startsWith('.claude/skills/') ||
    normalized === 'plugins/fgOS/skills' ||
    normalized.startsWith('plugins/fgOS/skills/') ||
    normalized === '.gemini/extensions/fgos' ||
    normalized.startsWith('.gemini/extensions/fgos/')
  );
}

/**
 * Checks whether a path is a canonical skill authoring source directory or file.
 */
export function isCanonicalSkillSource(sourcePath, projectRoot) {
  const rel = projectRoot ? path.relative(projectRoot, sourcePath) : sourcePath;
  const normalized = rel.split(path.sep).join('/');
  return (
    normalized.startsWith('core/skills/') ||
    new RegExp('^domains/[^/]+/skills/').test(normalized)
  );
}

/**
 * Derives canonical intent ID from frontmatter `intent:` field or skill name.
 * Default shape: `fgos:<verb>` or `fgos:<compound-verb>`.
 */
export function deriveSkillIntentId(skillName, frontmatterContent = '') {
  const match = frontmatterContent.match(/^intent:\s*(\S+)/m);
  if (match && match[1]) {
    return match[1];
  }
  if (skillName.startsWith('fgos-')) {
    return `fgos:${skillName.slice(5)}`;
  }
  return `fgos:${skillName}`;
}

/**
 * Maps a canonical skill intent ID to native host triggers across
 * Codex/OpenAI, Claude, and Gemini CLI.
 */
export function mapSkillIntentToHostTriggers(intentId, skillName) {
  const verb = intentId.startsWith('fgos:') ? intentId.slice(5) : intentId;
  const knownCodexOverrides = {
    'fgos:pick': '$fgos-routing',
  };
  const knownCompat = {
    'fgos:submit': '/fgOS:submit',
    'fgos:pick': '/fgOS:pick',
    'fgos:code-panel': '/fgOS:code-panel',
    'fgos:architecture-panel': '/fgOS:architecture-panel',
  };
  return {
    intentId,
    skillName,
    codex: knownCodexOverrides[intentId] ?? (skillName ? `$${skillName}` : `$fgos-${verb}`),
    claude: `/fgos:${verb}`,
    claudeCompat: knownCompat[intentId] ?? null,
    gemini: `/fgos:${verb}`,
  };
}

/**
 * Scans `core/skills/` and `domains/<domain>/skills/` to discover all canonical skills.
 * Enforces exactly one canonical source per skill by default (`checkDuplicates: true`),
 * throwing an Error when duplicate skill IDs are detected across sources.
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

      const relPath = path.relative(projectRoot, skillDir);
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
        skillFilePath: path.relative(projectRoot, skillFile),
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

        const relPath = path.relative(projectRoot, skillDir);
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
          skillFilePath: path.relative(projectRoot, skillFile),
          frontmatter,
          userInvocable,
          intentId,
          triggers,
        });
      }
    }
  }

  if (checkDuplicates) {
    for (const [skillName, paths] of nameToSources.entries()) {
      if (paths.length > 1) {
        throw new Error(
          `duplicate skill name "${skillName}" found in multiple files: ${paths.join(', ')}`,
        );
      }
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
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

  const scanShared = (sharedRoot, sourceLabel) => {
    if (!fs.existsSync(sharedRoot)) return;
    const walk = (currentDir, relBase = '') => {
      for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
        if (isOwnTmpFile(entry.name) || entry.name.startsWith('.')) continue;
        const entryRel = relBase ? `${relBase}/${entry.name}` : entry.name;
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath, entryRel);
        } else {
          const projectRelPath = path.relative(projectRoot, fullPath);
          if (!pathToSources.has(entryRel)) {
            pathToSources.set(entryRel, []);
          }
          pathToSources.get(entryRel).push(projectRelPath);
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
    for (const [relPath, sources] of pathToSources.entries()) {
      if (sources.length > 1) {
        throw new Error(
          `duplicate shared fragment "${relPath}" found in multiple sources: ${sources.join(', ')}`,
        );
      }
    }
  }

  return fragments.sort((a, b) => a.relativeFragmentPath.localeCompare(b.relativeFragmentPath));
}

/**
 * Generates a Gemini CLI extension package under `targetOutputDir` from canonical skills.
 * Includes `gemini-extension.json`, `GEMINI.md`, and `commands/fgos/<verb>.toml`.
 */
export function generateGeminiSkillPackage(projectRoot, targetOutputDir, { skills } = {}) {
  const canonicalSkills = skills ?? discoverCanonicalSkills(projectRoot);
  const written = [];

  fs.mkdirSync(targetOutputDir, { recursive: true });
  const commandsDir = path.join(targetOutputDir, 'commands', 'fgos');
  fs.mkdirSync(commandsDir, { recursive: true });

  const manifest = {
    name: 'fgos',
    version: '0.1.0',
    description: 'fgOS platform skills and command adapters for Gemini CLI',
    commands: canonicalSkills.map((s) => {
      const verb = s.intentId.startsWith('fgos:') ? s.intentId.slice(5) : s.intentId;
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
    'All commands below map to canonical fgOS skill intents.',
    '',
    '## Available Commands',
    '',
    ...canonicalSkills.map((s) => {
      const trigger = s.triggers.gemini;
      return `- \`${trigger}\`: canonical source \`${s.canonicalDir}\` (intent: \`${s.intentId}\`)`;
    }),
    '',
  ].join('\n');
  const docPath = path.join(targetOutputDir, 'GEMINI.md');
  fs.writeFileSync(docPath, geminiDoc);
  written.push(docPath);

  for (const s of canonicalSkills) {
    const verb = s.intentId.startsWith('fgos:') ? s.intentId.slice(5) : s.intentId;
    const tomlPath = path.join(commandsDir, `${verb}.toml`);
    const tomlContent = [
      `name = "${verb}"`,
      `description = "Run fgOS canonical skill ${s.name}"`,
      `intent = "${s.intentId}"`,
      `canonical_source = "${s.canonicalDir}"`,
      `user_invocable = ${s.userInvocable}`,
      `prompt = "Read and follow the canonical fgOS skill instructions at ${s.skillFilePath} directly."`,
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

  // 1. Check shared fragment collisions across core and domains
  discoverSharedFragments(projectRoot, { checkCollisions });

  // 2. Discover canonical skills and check for duplicate canonical skill names
  const canonicalSkills = discoverCanonicalSkills(projectRoot, { checkDuplicates });

  const validSkillNames = new Set();

  // 3. Assemble _shared fragments into .agents/skills/_shared
  const coreShared = path.join(coreSkillsRoot, '_shared');
  if (fs.existsSync(coreShared)) {
    validSkillNames.add('_shared');
    const targetShared = path.join(agentsSkillsRoot, '_shared');
    copyDirRecursive(coreShared, targetShared);
    assembled.push(targetShared);
  }

  if (fs.existsSync(domainsRoot)) {
    for (const domainEntry of fs.readdirSync(domainsRoot, { withFileTypes: true })) {
      if (isOwnTmpFile(domainEntry.name) || domainEntry.name.startsWith('.')) continue;
      if (!domainEntry.isDirectory()) continue;
      const domainShared = path.join(domainsRoot, domainEntry.name, 'skills', '_shared');
      if (fs.existsSync(domainShared)) {
        validSkillNames.add('_shared');
        const targetShared = path.join(agentsSkillsRoot, '_shared');
        copyDirRecursive(domainShared, targetShared);
        assembled.push(targetShared);
      }
    }
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

  // 5. Prune orphans
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

