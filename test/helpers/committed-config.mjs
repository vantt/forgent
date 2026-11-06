import './process-tmp-root.mjs';
// A frozen copy of this repository's own project config (`test/fixtures/committed-config.yaml`): the executors,
// invocations and capability pools these tests name. It is a copy, not a read of `.fgos/config.yaml`, so the
// tests keep their subject once the programs and executor entries live in each machine's global file. The keys a
// project file may not hold (the default executor, executor entries, `aliases`) are laid in the scratch machine
// home the way a machine that holds them reads them.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readConfig } from '../../src/config/facade.mjs';
import { plainConfig, writeProjectConfig } from './config-fixture.mjs';
import { parseYaml } from '../../src/util/yaml.mjs';

const FROZEN = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'committed-config.yaml');

let text = null;
const committedConfigText = () => (text ??= fs.readFileSync(FROZEN, 'utf8'));

/** A project directory holding the committed config file (and the machine home holding its machine keys), for tests that read it through the runner loader. */
export function committedConfigDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-committed-config-'));
  writeProjectConfig(dir, plainConfig(parseYaml(committedConfigText(), { filename: FROZEN })));
  return dir;
}

let runner = null;
/** The committed config's effective `runner` section: the standard under the committed file and the machine keys it holds. */
export function committedRunnerConfig() {
  if (!runner) {
    const dir = committedConfigDir();
    runner = readConfig({ projectRoot: dir, globalDir: path.join(process.env.HOME, '.fgos'), sections: ['runner'] }).value.runner;
  }
  return structuredClone(runner);
}
