import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { convertRunnerPatternsConfig, inspectGlobalRunnerConfig, formatGlobalRetiredNotice } from '../../src/setup/runner-config-conversion.mjs';
import { loadRunnerConfigForDir } from '../../src/runner/dispatch/config.mjs';
import {
  writeProjectConfig,
  writeGlobalConfig,
  writeRawLegacyProjectConfig,
  readRawProjectConfig,
  readRawGlobalConfig,
  projectConfigPath,
  projectConfigExists,
  legacyProjectConfigPath,
} from '../helpers/config-fixture.mjs';
import { spawnSync } from 'node:child_process';

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
    assert.equal(convertedBytes.includes('$comment'), false, 'must not contain forbidden $comment property');
    assert.ok(convertedBytes.includes('@fgos:why'), 'must contain @fgos:why explanation comment');

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

test('running conversion a second time changes nothing and creates no additional backup', () => {
  const { projectDir, homeDir } = makeTempDirs();
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    writeProjectConfig(projectDir, { runner: oldPatternsConfig() });

    const firstResult = convertRunnerPatternsConfig(projectDir);
    assert.equal(firstResult.status, 'converted');
    assert.ok(firstResult.backup);

    const targetFile = projectConfigPath(projectDir);
    const mtimeAfterFirst = fs.statSync(targetFile).mtimeMs;
    const fgosDir = path.dirname(targetFile);
    const backupsBeforeSecond = fs.readdirSync(fgosDir).filter((name) => name.includes('.pre-patterns-catalog-'));
    assert.equal(backupsBeforeSecond.length, 1);

    const secondResult = convertRunnerPatternsConfig(projectDir);
    assert.equal(secondResult.status, 'unchanged');
    assert.deepEqual(secondResult.written, []);

    const mtimeAfterSecond = fs.statSync(targetFile).mtimeMs;
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

test('handles retired keys in both project and global scopes without crashing setup', () => {
  const { projectDir, homeDir } = makeTempDirs();
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    writeProjectConfig(projectDir, { runner: oldPatternsConfig() });
    writeGlobalConfig(homeDir, {
      runner: {
        patterns: {
          defaultRule: { mutatingMinRigor: 'standard' },
        },
      },
    });
    const globalBytesBefore = readRawGlobalConfig(homeDir);

    const notice = inspectGlobalRunnerConfig(path.join(homeDir, '.fgos'));
    assert.ok(notice, 'must return notice for retired keys in global config');
    assert.ok(notice.file.includes('.fgos'), 'notice must identify the global config file');
    assert.ok(notice.edits.length > 0, 'notice must describe the required edits');
    assert.ok(notice.command, 'notice must supply guidance command');
    assert.match(notice.command, /from a directory outside any fgOS project/);
    assert.ok(Array.isArray(notice.patch), 'notice must carry patch operations');
    assert.deepEqual(notice.patch, [{ unset: 'runner.patterns.defaultRule' }]);
    assert.match(notice.message, /global config holds retired keys/, 'notice must format guidance text');
    assert.match(notice.message, /from a directory outside any fgOS project/);
    assert.match(formatGlobalRetiredNotice(notice), /global config holds retired keys/, 'formatter must output guidance text');
    const result = convertRunnerPatternsConfig(projectDir);
    assert.equal(result.status, 'blocked', 'conversion is honestly reported as blocked by global retired keys refusing snapshot');
    assert.ok(result.blocker, 'must report blocker reason');
    assert.ok(result.backup, 'project backup must be preserved');
    assert.ok(fs.existsSync(result.backup), 'project backup must exist');

    const globalBytesAfter = readRawGlobalConfig(homeDir);
    assert.equal(globalBytesAfter, globalBytesBefore, 'global file must not be modified by conversion');
  } finally {
    process.env.HOME = prevHome;
    cleanupDirs({ projectDir, homeDir });
  }
});

test('stops and reports blocked when config write door refuses without raw writes', () => {
  const { projectDir } = makeTempDirs();
  try {
    writeProjectConfig(projectDir, { runner: oldPatternsConfig() });
    const originalText = readRawProjectConfig(projectDir);

    const result = convertRunnerPatternsConfig(projectDir, {
      patchDoor: () => {
        throw new Error('config-write-conflict: revision-changed');
      },
    });
    assert.equal(result.status, 'blocked', 'door refusal must report blocked');
    assert.ok(result.blocker.includes('config-write-conflict'), 'must report blocker reason');
    assert.ok(result.backup, 'backup must be created when door refuses');
    assert.ok(fs.existsSync(result.backup), 'backup file must exist on disk');
    const currentText = readRawProjectConfig(projectDir);
    assert.equal(currentText, originalText, 'file must not be rewritten around the door');
  } finally {
    cleanupDirs({ projectDir });
  }
});

test('converts configuration with modern reviewed override and retired maxRounds, keeping override meaning and passing loader', () => {
  const { projectDir, homeDir } = makeTempDirs();
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const configWithModernAndRetired = {
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
        reviewed: {
          promise: 'Multi-seat adversarial review loop',
          loop: 'reviewed',
          defaults: {
            minCheckers: ['reviewer'],
          },
          maxRounds: 4,
          checkersByRigor: {
            standard: ['reviewer'],
          },
        },
        seatBinding: {
          schema: 1,
        },
      },
    };

    writeProjectConfig(projectDir, { runner: configWithModernAndRetired });
    writeGlobalConfig(homeDir, { defaults: { tier: 'standard' } });

    const result = convertRunnerPatternsConfig(projectDir);
    assert.equal(result.status, 'converted', 'conversion must succeed');
    assert.ok(result.backup, 'backup must be created');

    const loaded = loadRunnerConfigForDir(projectDir);
    assert.equal(loaded.loops?.reviewed?.maxRounds, 4, 'maxRounds must be migrated to runner.loops.reviewed');
    assert.deepEqual(loaded.loops?.reviewed?.checkersByRigor?.standard, ['reviewer'], 'checkersByRigor must be migrated to runner.loops.reviewed');
    assert.equal(loaded.patterns?.reviewed?.promise, 'Multi-seat adversarial review loop', 'modern promise must be preserved');
    assert.equal(loaded.patterns?.reviewed?.loop, 'reviewed', 'modern loop must be preserved');
    assert.deepEqual(loaded.patterns?.reviewed?.defaults?.minCheckers, ['reviewer'], 'modern defaults must be preserved');
    assert.equal(loaded.patterns?.reviewed?.maxRounds, undefined, 'retired maxRounds must be unset from pattern entry');
    assert.equal(loaded.patterns?.reviewed?.checkersByRigor, undefined, 'retired checkersByRigor must be unset from pattern entry');
    assert.equal(loaded.patterns?.seatBinding?.schema, 2, 'schema must be bumped to 2');
  } finally {
    process.env.HOME = prevHome;
    cleanupDirs({ projectDir, homeDir });
  }
});

test('blocks conversion without data loss when both retired research-fan-out-gated and modern research-fan-out exist', () => {
  const { projectDir, homeDir } = makeTempDirs();
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const configWithCollision = {
      patterns: {
        'research-fan-out': {
          promise: 'Modern research fan-out override',
          defaults: { minCheckers: ['researcher'] },
        },
        'research-fan-out-gated': {
          loop: 'solo',
        },
        seatBinding: {
          schema: 1,
        },
      },
    };
    writeProjectConfig(projectDir, { runner: configWithCollision });
    const originalText = readRawProjectConfig(projectDir);

    const result = convertRunnerPatternsConfig(projectDir);
    assert.equal(result.status, 'blocked', 'must block conversion when modern destination already exists');
    assert.match(result.blocker, /research-fan-out/, 'blocker must name the colliding pattern key');
    assert.equal(result.backup, undefined, 'blocked pre-check must create no backup');

    const fgosDir = path.join(projectDir, '.fgos');
    const backups = fs.readdirSync(fgosDir).filter((name) => name.includes('.pre-patterns-catalog-'));
    assert.equal(backups.length, 0, 'blocked setup must leave no backup file on disk');
    const currentText = readRawProjectConfig(projectDir);
    assert.equal(currentText, originalText, 'source file must remain untouched');
  } finally {
    process.env.HOME = prevHome;
    cleanupDirs({ projectDir, homeDir });
  }
});

test('refuses legacy json project file with retired keys as blocked, leaving original bytes untouched and reporting global guidance', () => {
  const { projectDir, homeDir } = makeTempDirs();
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const originalText = `${JSON.stringify({ runner: oldPatternsConfig() }, null, 2)}\n`;
    writeRawLegacyProjectConfig(projectDir, originalText);
    writeGlobalConfig(homeDir, {
      runner: {
        patterns: {
          defaultRule: { mutatingMinRigor: 'standard' },
        },
      },
    });

    const notice = inspectGlobalRunnerConfig(path.join(homeDir, '.fgos'));
    assert.ok(notice, 'must return notice for retired keys in global config');
    assert.ok(notice.file.includes('.fgos'), 'notice must identify the global config file');
    assert.ok(notice.command, 'notice must supply guidance command');

    const result = convertRunnerPatternsConfig(projectDir);
    assert.equal(result.status, 'blocked', 'legacy json project file must be reported as blocked');
    assert.ok(result.blocker, 'must report blocker reason');
    assert.match(result.blocker, /config-format-legacy-json/, 'blocker must name config-format-legacy-json cause');
    assert.match(result.blocker, /runner\.loops\.reviewed\.maxRounds/);
    assert.match(result.blocker, /edit .*config\.json.*, then run `fgos config migrate`/);
    assert.equal(result.backup, undefined, 'legacy json refusal must create no backup');

    const fgosDir = path.join(projectDir, '.fgos');
    const backups = fs.readdirSync(fgosDir).filter((name) => name.includes('.pre-patterns-catalog-'));
    assert.equal(backups.length, 0, 'blocked legacy json must leave no backup file on disk');
    const currentText = fs.readFileSync(legacyProjectConfigPath(projectDir), 'utf8');
    assert.equal(currentText, originalText, 'original legacy json file must be untouched');

    assert.equal(projectConfigExists(projectDir), false, 'must not leave a half-written yaml file');
  } finally {
    process.env.HOME = prevHome;
    cleanupDirs({ projectDir, homeDir });
  }
});

test('setup CLI prints global guidance when both project and global files hold retired keys', () => {
  const { projectDir, homeDir } = makeTempDirs();
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    writeProjectConfig(projectDir, { runner: oldPatternsConfig() });
    writeGlobalConfig(homeDir, {
      runner: {
        patterns: {
          defaultRule: { mutatingMinRigor: 'standard' },
        },
      },
    });

    const fgosBin = path.resolve('bin/fgos.mjs');
    // boundary: CLI door integrates globalRetiredNotice with runnerPatternsConversion envelope in JSON output
    const jsonResult = spawnSync(process.execPath, [fgosBin, 'setup', '--dir', projectDir, '--json'], {
      encoding: 'utf8',
      env: { ...process.env, HOME: homeDir, USERPROFILE: homeDir },
    });
    assert.equal(jsonResult.status, 0, jsonResult.stderr);
    const parsed = JSON.parse(jsonResult.stdout);
    assert.ok(parsed.data?.globalRetiredNotice, 'json data must include globalRetiredNotice');
    assert.match(parsed.data.globalRetiredNotice.message, /global config holds retired keys/);
    assert.match(parsed.data.globalRetiredNotice.command, /from a directory outside any fgOS project/);
    assert.ok(Array.isArray(parsed.data.globalRetiredNotice.patch));
    assert.equal(parsed.data?.runnerPatternsConversion?.status, 'blocked');

    const humanResult = spawnSync(process.execPath, [fgosBin, 'setup', '--dir', projectDir], {
      encoding: 'utf8',
      env: { ...process.env, HOME: homeDir, USERPROFILE: homeDir },
    });
    assert.equal(humanResult.status, 0, humanResult.stderr);
    assert.match(humanResult.stdout, /from a directory outside any fgOS project/);
    assert.match(humanResult.stdout, /patch body/);
    assert.match(humanResult.stdout, /runner\.patterns\.defaultRule/);
  } finally {
    process.env.HOME = prevHome;
    cleanupDirs({ projectDir, homeDir });
  }
});

test('global config inspection ignores unrelated errors under reviewed pattern', () => {
  const { homeDir } = makeTempDirs();
  try {
    writeGlobalConfig(homeDir, {
      runner: {
        patterns: {
          reviewed: {
            unrelatedKey: 'invalid',
          },
        },
      },
    });
    const notice = inspectGlobalRunnerConfig(path.join(homeDir, '.fgos'));
    assert.equal(notice, null, 'unrelated errors under reviewed pattern must not produce retired key notice');
  } finally {
    cleanupDirs({ homeDir });
  }
});

test('committed door write returns converted with remaining validation diagnostic without restoring old bytes', () => {
  const { projectDir } = makeTempDirs();
  try {
    writeProjectConfig(projectDir, { runner: oldPatternsConfig() });
    const originalBytes = readRawProjectConfig(projectDir);
    const writtenContent = 'runner:\n  loops:\n    reviewed:\n      bounds:\n        maxRounds: { min: 10, max: 2 }\n';

    const result = convertRunnerPatternsConfig(projectDir, {
      patchDoor: () => {
        // Simulate a successful write door that leaves an invalid bounds state
        fs.writeFileSync(projectConfigPath(projectDir), writtenContent, 'utf8');
      },
    });

    assert.equal(result.status, 'converted', 'must report converted when door write succeeded');
    assert.ok(result.backup, 'backup path must be present');
    assert.ok(fs.existsSync(result.backup), 'backup file must exist on disk');
    assert.equal(fs.readFileSync(result.backup, 'utf8'), originalBytes, 'backup must match original bytes');
    assert.ok(result.remainingValidation, 'remaining validation diagnostic must be reported');
    assert.match(result.remainingValidation, /min .* must be <= max/);

    const currentBytes = readRawProjectConfig(projectDir);
    assert.equal(currentBytes, writtenContent, 'old bytes must never be restored over door write');
  } finally {
    cleanupDirs({ projectDir });
  }
});
