#!/usr/bin/env node
// build-skill-wrappers.mjs — forgentX's own dogfood/CI entry point for the
// shared generator in src/setup/skill-wrappers.mjs (tsk-1qi D7): regenerates
// every `.claude/skills/<name>/SKILL.md` thin wrapper from its
// `.agents/skills/<name>/SKILL.md` source, in this repo's own checkout.
// `npm run build:skills`. Replaces test/skills/fgos-mirror.test.mjs's old
// byte-identical assertion (removed, tsk-1qi) with a proof surface: this
// script is what a maintainer runs after editing a `.agents/skills/*`
// source, and the mirror test now checks the generated wrappers are
// actually up to date, not that they byte-match a hand-maintained copy.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleSkills, generateAllSkillWrappers, mirrorDevSkillsIntoPlugin } from '../src/setup/skill-wrappers.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const agentsSkillsRoot = path.join(repoRoot, '.agents', 'skills');
const claudeSkillsRoot = path.join(repoRoot, '.claude', 'skills');
const pluginSkillsRoot = path.join(repoRoot, 'plugins', 'fgOS', 'skills');

const assembled = assembleSkills(repoRoot);
for (const assembledPath of assembled) {
  process.stdout.write(`assembled ${path.relative(repoRoot, assembledPath)}\n`);
}

const written = generateAllSkillWrappers(agentsSkillsRoot, claudeSkillsRoot);
for (const wrapperPath of written) {
  process.stdout.write(`wrote ${path.relative(repoRoot, wrapperPath)}\n`);
}
process.stdout.write(`${written.length} skill wrapper(s) generated.\n`);

const mirrored = mirrorDevSkillsIntoPlugin(agentsSkillsRoot, pluginSkillsRoot);
for (const mirroredPath of mirrored) {
  process.stdout.write(`mirrored ${path.relative(repoRoot, mirroredPath)}\n`);
}
process.stdout.write(`${mirrored.length} plugin dev-skill(s) mirrored.\n`);

