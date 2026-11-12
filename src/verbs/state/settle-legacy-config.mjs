import { checkConfig, fixConfig, ConfigDoorError } from '../../config/facade.mjs';
import { invokeHost } from '../../util/host-bin.mjs';

// A machine or project that an older release set up holds its config as JSON, with the gateway token and the account
// pools in `~/.fgos/config.json`. The Config component owns the move to the YAML files and `~/.fgos/private`; this
// module only asks for it, in the order Config's spec (section 13) gives, before anything reads config: the key copy,
// the removal of the copied keys, the global conversion, then the project conversion. Each step runs only while the
// door's own check still reports what it settles, so a second run does nothing; the steps never print a value.

const LEGACY_ROW = 'config-format-legacy-json';
const MISPLACED_ROW = 'config-key-in-wrong-file';

const isGlobal = (finding) => typeof finding.file === 'string' && finding.file.startsWith('global:');
const hostVerb = (root, args) => invokeHost(['config', 'migrate', ...args], { dir: root, dirScope: 'caller' });

/**
 * Settles the legacy JSON config of the project at `root` and of this machine, and returns the steps taken
 * (`'copy'`, `'finish'`, `'convert-global'`, `'convert-project'`). A key whose private destination holds a different
 * value is never overwritten and never dropped: the step refuses with `config-migrate-destination-differs`.
 */
export function settleLegacyConfig(root) {
  const steps = [];
  const findings = () => checkConfig({ projectRoot: root }).findings;
  // Where the write verbs cannot run (no Unix file door), nothing is moved and the readers say so by name.
  try { findings(); } catch (err) {
    if (err instanceof ConfigDoorError && err.code === 'config-platform-unsupported') return steps;
    throw err;
  }
  const of = (row, wantGlobal) => findings().filter((f) => f.row === row && (wantGlobal === undefined || isGlobal(f) === wantGlobal));

  const moving = of(MISPLACED_ROW, true);
  if (moving.some((f) => f.detail.includes('destination-different'))) {
    throw Object.assign(new Error('config-migrate-destination-differs: ~/.fgos/private already holds a different account pool or gateway token than ~/.fgos/config.json; keep the one you want and remove the other, then run fgos init again'), { code: 'config-migrate-destination-differs' });
  }
  if (moving.length > 0) {
    if (moving.some((f) => f.fix === 'copy-to-destination')) {
      fixConfig({ projectRoot: root, ids: ['copy-to-destination'] });
      steps.push('copy');
    }
    if (of(MISPLACED_ROW, true).length > 0) {
      hostVerb(root, ['--global', '--finish', '--machine-checked']);
      steps.push('finish');
    }
  }
  if (of(LEGACY_ROW, true).length > 0) {
    hostVerb(root, ['--global', '--convert', '--machine-checked']);
    steps.push('convert-global');
  }
  if (of(LEGACY_ROW, false).length > 0) {
    hostVerb(root, []);
    steps.push('convert-project');
  }
  return steps;
}
