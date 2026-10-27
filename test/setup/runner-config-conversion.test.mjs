import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { convertRunnerPatternsConfig } from '../../src/setup/runner-config-conversion.mjs';
import { loadRunnerConfigForDir } from '../../src/runner/dispatch/config.mjs';
import {
  writeProjectConfig,
  writeGlobalConfig,
  writeRawLegacyProjectConfig,
  readRawProjectConfig,
  readRawGlobalConfig,
  legacyProjectConfigPath,
} from '../helpers/config-fixture.mjs';

function makeTempDirs() {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-conv-test-project-'));
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-conv-test-home-'));
  return { projectDir, homeDir };
}

function cleanupDirs({ projectDir, homeDir }) {
  if (projectDir && fs.existsSync(projectDir)) fs.rmSync(projectDir, { recursive: true, force: true });
  if (homeDir && fs.existsSync(homeDir)) fs.rmSync(homeDir, { recursive: true, force: true });
}

const oldPatternsConfig = () => ({
  executor: { command: 'claude', args: ['{prompt}'] },
  timeoutMs: 5000,
  modelPolicies: {
    claude: {
      nano: 'haiku',
      standard: 'sonnet',
      advanced: 'sonnet',
      flagship: 'opus',
      frontier: 'opus',
    },
  },
  patterns: {
    defaultRule: { mutatingMinRigor: 'standard' },
    reviewed: {
      maxRounds: 3,
      checkersByRigor: {
        standard: ['reviewer'],
        high: ['reviewer', 'red-team'],
      },
    },
    seatBinding: {
      schema: 1,
    },
  },
});

test('converts project configuration from retired patterns shape with a backup, comments and schema 2', () => {
  const { projectDir, homeDir } = makeTempDirs();
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    writeProjectConfig(projectDir, { runner: oldPatternsConfig() });
    const originalText = readRawProjectConfig(projectDir);
    writeGlobalConfig(homeDir, { defaults: { tier: 'standard' } });
    const globalBytesBefore = readRawGlobalConfig(homeDir);

    const result = convertRunnerPatternsConfig(projectDir);

    assert.equal(result.status, 'converted');
    assert.ok(result.backup, 'must return backup path');
    assert.ok(fs.existsSync(result.backup), 'backup file must exist on disk');

    const backupBytes = fs.readFileSync(result.backup, 'utf8');
    assert.equal(backupBytes, originalText, 'backup must be byte-identical to original content');

    const convertedBytes = readRawProjectConfig(projectDir);
    assert.ok(convertedBytes.includes('$comment'), 'converted file must contain comment explanation');

    const convertedParsed = JSON.parse(convertedBytes.replace(/^#[^\n]*\n+/g, ''));
    assert.equal(convertedParsed.runner?.patterns?.reviewed, undefined, 'retired reviewed tuning deleted from file patterns');
    assert.equal(convertedParsed.runner?.patterns?.defaultRule, undefined, 'retired defaultRule deleted from file patterns');
    assert.equal(convertedParsed.runner?.loops?.reviewed?.maxRounds, 3);
    assert.deepEqual(convertedParsed.runner?.loops?.reviewed?.checkersByRigor, {
      standard: ['reviewer'],
      high: ['reviewer', 'red-team'],
    });

    const loaded = loadRunnerConfigForDir(projectDir);
    assert.equal(loaded.loops?.reviewed?.maxRounds, 3);
    assert.deepEqual(loaded.loops?.reviewed?.checkersByRigor.standard, ['reviewer']);
    assert.deepEqual(loaded.loops?.reviewed?.checkersByRigor.high, ['reviewer', 'red-team']);
    assert.equal(loaded.patterns?.seatBinding?.schema, 2);
    assert.equal(loaded.patterns?.defaultRule, undefined);
    assert.equal(loaded.patterns?.reviewed?.maxRounds, undefined);

    const globalBytesAfter = readRawGlobalConfig(homeDir);
    assert.equal(globalBytesAfter, globalBytesBefore, 'global configuration must never be modified');
  } finally {
    process.env.HOME = prevHome;
    cleanupDirs({ projectDir, homeDir });
  }
});

test('converts legacy json project configuration with backup, comments and schema 2', () => {
  const { projectDir } = makeTempDirs();
  try {
    const originalText = `${JSON.stringify({ runner: oldPatternsConfig() }, null, 2)}\n`;
    writeRawLegacyProjectConfig(projectDir, originalText);

    const result = convertRunnerPatternsConfig(projectDir);
    assert.equal(result.status, 'converted');
    assert.ok(result.backup);

    const backupBytes = fs.readFileSync(result.backup, 'utf8');
    assert.equal(backupBytes, originalText, 'backup must equal original bytes');

    const loaded = loadRunnerConfigForDir(projectDir);
    assert.equal(loaded.loops?.reviewed?.maxRounds, 3);
    assert.equal(loaded.patterns?.seatBinding?.schema, 2);
    assert.equal(loaded.patterns?.defaultRule, undefined);
    assert.equal(loaded.patterns?.reviewed?.maxRounds, undefined);
  } finally {
    cleanupDirs({ projectDir });
  }
});

test('running conversion a second time changes nothing and creates no additional backup', () => {
  const { projectDir, homeDir } = makeTempDirs();
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    writeRawLegacyProjectConfig(projectDir, `${JSON.stringify({ runner: oldPatternsConfig() }, null, 2)}\n`);

    const firstResult = convertRunnerPatternsConfig(projectDir);
    assert.equal(firstResult.status, 'converted');
    assert.ok(firstResult.backup);

    const legacyFile = legacyProjectConfigPath(projectDir);
    const mtimeAfterFirst = fs.statSync(legacyFile).mtimeMs;
    const fgosDir = path.dirname(legacyFile);
    const backupsBeforeSecond = fs.readdirSync(fgosDir).filter((name) => name.includes('.pre-patterns-catalog-'));
    assert.equal(backupsBeforeSecond.length, 1);

    const secondResult = convertRunnerPatternsConfig(projectDir);
    assert.equal(secondResult.status, 'unchanged');
    assert.deepEqual(secondResult.written, []);

    const mtimeAfterSecond = fs.statSync(legacyFile).mtimeMs;
    assert.equal(mtimeAfterSecond, mtimeAfterFirst, 'second run must not rewrite the file');

    const backupsAfterSecond = fs.readdirSync(fgosDir).filter((name) => name.includes('.pre-patterns-catalog-'));
    assert.equal(backupsAfterSecond.length, 1, 'second run must not create an additional backup');
  } finally {
    process.env.HOME = prevHome;
    cleanupDirs({ projectDir, homeDir });
  }
});

test('project configuration already in the new shape is untouched', () => {
  const { projectDir } = makeTempDirs();
  try {
    const modernConfig = {
      executor: { command: 'claude', args: ['{prompt}'] },
      timeoutMs: 5000,
      modelPolicies: {
        claude: {
          nano: 'haiku',
          standard: 'sonnet',
          advanced: 'sonnet',
          flagship: 'opus',
          frontier: 'opus',
        },
      },
      loops: {
        reviewed: {
          maxRounds: 2,
          checkersByRigor: { standard: ['reviewer'] },
        },
      },
      patterns: {
        seatBinding: { schema: 2 },
      },
    };

    writeProjectConfig(projectDir, { runner: modernConfig });
    const bytesBefore = readRawProjectConfig(projectDir);

    const result = convertRunnerPatternsConfig(projectDir);
    assert.equal(result.status, 'unchanged');
    assert.deepEqual(result.written, []);

    const bytesAfter = readRawProjectConfig(projectDir);
    assert.equal(bytesAfter, bytesBefore, 'file must stay byte-identical');
  } finally {
    cleanupDirs({ projectDir });
  }
});

test('project configuration with marker schema 1 and no retired keys is left untouched', () => {
  const { projectDir } = makeTempDirs();
  try {
    const marker1Config = {
      executor: { command: 'claude', args: ['{prompt}'] },
      timeoutMs: 5000,
      modelPolicies: {
        claude: {
          nano: 'haiku',
          standard: 'sonnet',
          advanced: 'sonnet',
          flagship: 'opus',
          frontier: 'opus',
        },
      },
      patterns: {
        seatBinding: { schema: 1 },
      },
    };

    writeProjectConfig(projectDir, { runner: marker1Config });
    const bytesBefore = readRawProjectConfig(projectDir);

    const result = convertRunnerPatternsConfig(projectDir);
    assert.equal(result.status, 'unchanged');
    assert.deepEqual(result.written, []);

    const bytesAfter = readRawProjectConfig(projectDir);
    assert.equal(bytesAfter, bytesBefore, 'marker schema 1 must not be bumped without retired keys');

    const loaded = loadRunnerConfigForDir(projectDir);
    assert.equal(loaded.patterns?.seatBinding?.schema, 1);
  } finally {
    cleanupDirs({ projectDir });
  }
});

test('project directory with no configuration returns absent status', () => {
  const { projectDir } = makeTempDirs();
  try {
    const result = convertRunnerPatternsConfig(projectDir);
    assert.equal(result.status, 'absent');
    assert.deepEqual(result.written, []);
  } finally {
    cleanupDirs({ projectDir });
  }
});
