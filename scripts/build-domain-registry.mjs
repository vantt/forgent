#!/usr/bin/env node
// build-domain-registry.mjs — compile each domain's YAML into domains/<domain>/compiled.json.
//
// src/state/domain-registry.mjs loads the compiled file at import time, so one YAML typo cannot
// take down every verb. The YAML stays the source of truth: `--check`, the doctor check
// `domain-registry-compiled` and the test all judge drift with checkCompiledDomains
// (src/util/domain-compile.mjs). This script only writes what that module compiles.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCompiledDomains, compileAllDomains, renderCompiledDomain } from '../src/util/domain-compile.mjs';
import { ensureAddonForScript } from './lib/git-addon-stage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureAddonForScript();
  if (process.argv.includes('--check')) {
    const { problems } = checkCompiledDomains(root);
    for (const problem of problems) console.error(problem);
    process.exit(problems.length > 0 ? 1 : 0);
  }
  for (const [name, compiled] of Object.entries(compileAllDomains(root))) {
    const target = path.join(root, 'domains', name, 'compiled.json');
    const next = renderCompiledDomain(compiled);
    if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') === next) continue;
    fs.writeFileSync(target, next);
    console.log(`wrote domains/${name}/compiled.json`);
  }
}
