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
    'This is a generated thin wrapper (tsk-1qi) -- do not edit directly, edit the source instead.\n' +
    `The real skill content lives at \`${sourceRelativePath}\`, this project's own canonical skill source.\n` +
    'Read that file and follow it directly.\n'
  );
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
  if (!fs.existsSync(agentsSkillsRoot)) return written;
  for (const entry of fs.readdirSync(agentsSkillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === '_shared') continue;
    const sourcePath = path.join(agentsSkillsRoot, entry.name, 'SKILL.md');
    if (!fs.existsSync(sourcePath)) continue;
    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    const wrapperDir = path.join(claudeSkillsRoot, entry.name);
    const wrapperPath = path.join(wrapperDir, 'SKILL.md');
    const sourceRelativePath = path.relative(wrapperDir, sourcePath);
    fs.mkdirSync(wrapperDir, { recursive: true });
    fs.writeFileSync(wrapperPath, generateWrapperContent(sourceContent, sourceRelativePath));
    written.push(wrapperPath);

    const skillDir = path.join(agentsSkillsRoot, entry.name);
    for (const subEntry of fs.readdirSync(skillDir, { withFileTypes: true })) {
      if (subEntry.name === 'SKILL.md') continue;
      const subSource = path.join(skillDir, subEntry.name);
      const subTarget = path.join(wrapperDir, subEntry.name);
      if (subEntry.isDirectory()) {
        copyDirRecursive(subSource, subTarget);
      } else {
        fs.copyFileSync(subSource, subTarget);
      }
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
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
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
 * A no-op when `packageRoot` carries no `.agents/skills` at all (e.g. a
 * pre-tsk-1qi package version, or a dev checkout of some other tool) --
 * same "absent capability = clean skip" contract every other optional
 * setup/doctor behavior in this repo already follows.
 */
export function materializeSkillsIntoProject(packageRoot, targetRoot) {
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
  }
  const wrappersWritten = generateAllSkillWrappers(targetAgentsSkills, targetClaudeSkills);
  return { copied, wrappersWritten };
}
