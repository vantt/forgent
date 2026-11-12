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

/** What a person needs to know after the global file moved: older releases on this machine read that file. */
export const GLOBAL_MOVED_NOTE = '~/.fgos/config.json moved; projects on an older release refuse until `fgctl upgrade`';

/** A refusal to write (a confined session, a read-only home, no host to ask): init reports it and goes on, and its own config read then says what is still wrong. */
const isWriteRefusal = (err) => {
  const text = `${err?.code ?? ''} ${err?.stderr ?? ''}`;
  return /config-write-confined|config-io|host-unavailable/.test(text);
};

/**
 * Settles the legacy JSON config of the project at `root` and of this machine. Returns `{ steps, note?, warning? }`:
 * the steps taken (`'copy'`, `'finish'`, `'convert-global'`, `'convert-project'`), the line to show when the global
 * file moved, and a warning when a write was refused. A key whose private destination holds a different value is never
 * overwritten and never dropped: it throws `config-migrate-destination-differs`, with nothing written.
 */
export function settleLegacyConfig(root) {
  const steps = [];
  let found;
  try {
    found = checkConfig({ projectRoot: root }).findings;
  } catch (err) {
    // Where the write verbs cannot run (no Unix file door), nothing is moved and the readers say so by name.
    if (err instanceof ConfigDoorError && err.code === 'config-platform-unsupported') return { steps };
    throw err;
  }
  const of = (row, wantGlobal) => found.filter((f) => f.row === row && (wantGlobal === undefined || isGlobal(f) === wantGlobal));
  // A step that wrote changes what the check reports; one that did not leaves the findings as they were.
  const ran = (step, act) => { act(); steps.push(step); found = checkConfig({ projectRoot: root }).findings; };

  try {
    const moving = of(MISPLACED_ROW, true);
    if (moving.some((f) => f.detail.includes('destination-different'))) {
      throw Object.assign(new Error('config-migrate-destination-differs: ~/.fgos/private already holds a different account pool or gateway token than ~/.fgos/config.json; keep the one you want and remove the other, then run fgos init again'), { code: 'config-migrate-destination-differs' });
    }
    if (moving.some((f) => f.fix === 'copy-to-destination')) ran('copy', () => fixConfig({ projectRoot: root, ids: ['copy-to-destination'] }));
    if (of(MISPLACED_ROW, true).length > 0) ran('finish', () => hostVerb(root, ['--global', '--finish', '--machine-checked']));
    if (of(LEGACY_ROW, true).length > 0) ran('convert-global', () => hostVerb(root, ['--global', '--convert', '--machine-checked']));
    if (of(LEGACY_ROW, false).length > 0) ran('convert-project', () => hostVerb(root, []));
  } catch (err) {
    if (!isWriteRefusal(err)) throw err;
    return { steps, warning: `legacy config not moved: ${err.message.split('\n')[0]}; run \`fgos init\` where the home is writable` };
  }
  const globalMoved = steps.some((step) => step !== 'convert-project');
  return { steps, ...(globalMoved ? { note: GLOBAL_MOVED_NOTE } : {}) };
}
