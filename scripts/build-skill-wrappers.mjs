#!/usr/bin/env node
// build-skill-wrappers.mjs — forgentX's own dogfood/CI entry point for the
// shared render in src/setup/skill-wrappers.mjs (`renderSkillSurfaces`): assembles
// canonical skills from `core/skills/` and `domains/*/skills/` into `.agents/skills/`,
// regenerates `.claude/skills/<name>/SKILL.md` thin wrappers, mirrors
// dev-skills into `plugins/fgOS/skills/`, then regenerates the instruction
// projections (the managed AGENTS.md block, the effective instruction set and the
// projection ledger) from `core/instructions/`. Only skill names fgOS owns are written.
// `npm run build:skills`. This script is what a maintainer runs after editing a
// canonical skill under `core/skills/*` or `domains/*/skills/*`.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSkillSurfaces } from '../src/setup/skill-wrappers.mjs';
import { ensureAddonForScript } from './lib/git-addon-stage.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The render parses YAML through the native door, so the addon is staged before the first write.
ensureAddonForScript();
const { assembled, written, mirrored, projection } = renderSkillSurfaces(repoRoot);

for (const assembledPath of assembled) process.stdout.write(`assembled ${path.relative(repoRoot, assembledPath)}\n`);
for (const wrapperPath of written) process.stdout.write(`wrote ${path.relative(repoRoot, wrapperPath)}\n`);
process.stdout.write(`${written.length} skill wrapper(s) generated.\n`);
for (const mirroredPath of mirrored) process.stdout.write(`mirrored ${path.relative(repoRoot, mirroredPath)}\n`);
process.stdout.write(`${mirrored.length} plugin dev-skill(s) mirrored.\n`);
process.stdout.write(projection.changed
  ? `regenerated ${projection.computed.destinationRelativePath}, ${projection.computed.effectiveSetRelativePath}, and ${projection.computed.ledgerRelativePath}\n`
  : 'instruction projections already up to date.\n');
