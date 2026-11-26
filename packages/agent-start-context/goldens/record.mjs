#!/usr/bin/env node
// Records what heads and agent files receive at start today, read-only, from fixed inputs, so the composer that
// replaces these producers can be held to the same text (docs/platform/agent-start-context/spec.md). Writes
// goldens/<delivery>/<case>.txt and goldens/cases.json. With --check it rebuilds everything in memory and exits 1
// on the first difference, writing nothing.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
const CHECK = process.argv.includes('--check');

// Every YAML parse goes through the native door, which loads only a staged addon (the same step project-agents.mjs takes).
const { ensureAddonForScript } = await import(path.join(REPO_ROOT, 'scripts/lib/git-addon-stage.mjs'));
ensureAddonForScript(process.env, REPO_ROOT);

const { openingText, taskBriefOf } = await import(path.join(REPO_ROOT, 'src/session-host/head-start.mjs'));
const { pinPersona, renderPersonaSection, renderOnWake } = await import(path.join(REPO_ROOT, 'src/runner/agent-definitions.mjs'));
const { findAgentYamlFiles, projectAgentMarkdown } = await import(path.join(REPO_ROOT, 'scripts/project-agents.mjs'));

// The personas a head runs as today, with the fixed inputs of each case.
const HEADS = ['secretary', 'supervisor', 'shaper', 'planner', 'lead'];
const NAME = 'golden';
const TASK = { path: 'plans/261122-1946-agent-start-context/plan.md' };
const HANDOFF = { path: '.fgos/runtime/session-rotation/golden/handoff-0001.md' };
const QUESTION = 'q-golden0001';

function headOpening(persona, { task = null, handoff = null, forQuestion = null }) {
  const pinned = pinPersona(persona, { projectRoot: REPO_ROOT });
  return openingText({
    persona,
    name: NAME,
    personaLines: renderPersonaSection(persona, { projectRoot: REPO_ROOT, pinnedText: pinned.text }),
    handoff,
    forQuestion,
    task: taskBriefOf(persona, task),
    onWake: renderOnWake(persona, { projectRoot: REPO_ROOT, pinnedText: pinned.text }),
  });
}

function build() {
  const files = new Map();
  const cases = [];
  for (const persona of HEADS) {
    const variants = [
      ['plain', {}],
      ['task', { task: TASK }],
      ['handoff', { handoff: HANDOFF }],
      ['question', { forQuestion: QUESTION }],
    ];
    for (const [variant, input] of variants) {
      const id = `${persona}-${variant}`;
      files.set(`opening/${id}.txt`, `${headOpening(persona, input)}\n`);
      cases.push({ id, delivery: 'opening', persona, name: NAME, ...input });
    }
  }
  for (const file of findAgentYamlFiles(REPO_ROOT)) {
    const { name } = file;
    const rel = `${file.source}/${file.fileName}`;
    files.set(`agent-file/${name}.md`, projectAgentMarkdown(name, fs.readFileSync(file.filePath, 'utf8'), rel));
    cases.push({ id: name, delivery: 'agent-file', persona: name, source: rel });
  }
  const base = execFileSync('git', ['-C', REPO_ROOT, 'log', '-1', '--format=%H', '--', 'src/session-host', 'src/runner/agent-definitions.mjs', 'scripts/project-agents.mjs', 'core/agents'], { encoding: 'utf8' }).trim();
  files.set('cases.json', `${JSON.stringify({ base, cases }, null, 2)}\n`);
  return files;
}

const files = build();
let differences = 0;
for (const [rel, text] of files) {
  const target = path.join(HERE, rel);
  if (CHECK) {
    const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
    if (current !== text) {
      differences += 1;
      console.error(`differs: ${rel}`);
    }
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  }
}
if (CHECK) {
  if (differences > 0) process.exit(1);
  console.log(`goldens match: ${files.size} files`);
} else {
  console.log(`wrote ${files.size} files`);
}
