// src/runner/dispatch/provider-adapter.mjs
// Provider facts shared by the launch path and the doctor: provider-family naming (`familyOf`), the
// registry of policy-shaped flags, the denylist check, reasoning-effort rendering and the
// launched-model check. Pure: no spawn, no fs, no network, no mutation of its inputs.
import path from 'node:path';
import { REASONING_EFFORT_VALUES } from './tier-cell.mjs';


/**
 * Registry of known policy-shaped flags per provider family.
 * These flags encode runtime policy (model, reasoning effort, tool gating,
 * permission/approval mode, or sandbox boundaries) rather than pure invocation mechanics.
 */
export const KNOWN_POLICY_SHAPED_FLAGS = {
  claude: [
    '--model',
    '--effort',
    '--allowedTools',
    '--permission-mode',
    '--dangerously-skip-permissions',
  ],
  openai: [
    '--model',
    '-s',
    '-s read-only',
    '-s danger-full-access',
    '--dangerously-bypass-approvals-and-sandbox',
    '--dangerously-skip-permissions',
    '--skip-git-repo-check',
  ],
  gemini: [
    '--model',
    '--mode',
    '--effort',
  ],
  pi: [
    '--provider',
    '--model',
    '--tools',
    '--approve',
    '--mode',
  ],
  'z-ai': [
    '--model',
    '--effort',
    '--allowedTools',
    '--permission-mode',
    '--dangerously-skip-permissions',
  ],
  glm: [
    '--model',
    '--effort',
    '--allowedTools',
    '--permission-mode',
    '--dangerously-skip-permissions',
  ],
};

/** Other spellings of the family the config keys `modelPolicies` and its pools by. */
const FAMILY_ALIASES = Object.freeze({ 'openai-codex': 'openai', codex: 'openai', glm: 'z-ai', agy: 'gemini' });

/**
 * The provider family: the one answer to "which provider serves this", the key of `modelPolicies`, of
 * `tierFallback`, of pools and of the denylist. `source` is an executor entry (its own `providerModel`, else
 * `provider`) or a spelling; with neither, the family is inferred from `command` (an executor entry that names
 * nothing is `claude`). A declared vendor always wins over the CLI harness: harnesses like pi or claude can
 * invoke third-party models, and the vendor is the egress destination. `openai-codex`, `codex`, `glm` and
 * `agy` are spellings of `openai`, `z-ai` and `gemini`. Pure.
 */
export function familyOf(source, command) {
  const isEntry = source !== null && typeof source === 'object';
  const declared = isEntry ? (source.providerModel || source.provider) : source;
  const text = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
  const key = text(declared) || text(command) || (isEntry ? 'claude' : '');
  return Object.hasOwn(FAMILY_ALIASES, key) ? FAMILY_ALIASES[key] : key;
}

/**
 * Normalizes a list of disallowed providers to a Set of canonical provider family names.
 * Skips empty or non-string entries.
 *
 * @param {string[]|Iterable<string>} [disallowedProviders]
 * @returns {Set<string>}
 */
export function normalizeDisallowedProviders(disallowedProviders) {
  const normalized = new Set();
  if (!disallowedProviders) return normalized;
  const list = Array.isArray(disallowedProviders) || disallowedProviders instanceof Set
    ? disallowedProviders
    : (typeof disallowedProviders[Symbol.iterator] === 'function' ? disallowedProviders : []);
  for (const entry of list) {
    if (typeof entry === 'string' && entry.trim()) {
      const canonical = familyOf(entry);
      if (canonical) {
        normalized.add(canonical);
      }
    }
  }
  return normalized;
}

/**
 * Evaluates whether candidateProvider is disallowed under disallowedProviders governance.
 * Normalizes both the deny-list entries and the candidate provider family into the
 * single canonical provider vocabulary.
 *
 * @param {string[]|Set<string>} [disallowedProviders]
 * @param {string} [candidateProvider]
 * @param {string} [candidateCommand]
 * @returns {{ disallowed: boolean, canonicalProvider: string }}
 */
export function checkProviderDisallowed(disallowedProviders, candidateProvider, candidateCommand) {
  const canonicalProvider = familyOf(candidateProvider, candidateCommand);
  if (!disallowedProviders || !canonicalProvider) {
    return { disallowed: false, canonicalProvider };
  }
  const denySet = disallowedProviders instanceof Set
    ? disallowedProviders
    : normalizeDisallowedProviders(disallowedProviders);
  return {
    disallowed: denySet.has(canonicalProvider),
    canonicalProvider,
  };
}

/**
 * Boolean convenience helper for checkProviderDisallowed.
 *
 * @param {string[]|Set<string>} [disallowedProviders]
 * @param {string} [candidateProvider]
 * @param {string} [candidateCommand]
 * @returns {boolean}
 */
export function isProviderDisallowed(disallowedProviders, candidateProvider, candidateCommand) {
  return checkProviderDisallowed(disallowedProviders, candidateProvider, candidateCommand).disallowed;
}

/**
 * Returns known policy-shaped flags for a given provider family.
 */
export function getProviderPolicyShapedFlags(providerFamily, command) {
  return KNOWN_POLICY_SHAPED_FLAGS[familyOf(providerFamily, command)] ?? [];
}

/**
 * Extracts policy-shaped flags actually present in rendered argv.
 * Flags encoding runtime policy (model/effort/tool gating/sandbox/approvals)
 * are extracted while pure invocation mechanics (e.g. -p, {prompt}, exec, --new-project)
 * are excluded.
 */
export function extractPolicyShapedFlags(args, providerFamily) {
  if (!Array.isArray(args)) return [];
  const flags = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--model') {
      flags.push('--model');
    } else if (arg === '--effort') {
      flags.push('--effort');
    } else if (arg === '--allowedTools') {
      flags.push('--allowedTools');
    } else if (arg === '--permission-mode') {
      flags.push('--permission-mode');
    } else if (arg === '--dangerously-bypass-approvals-and-sandbox') {
      flags.push('--dangerously-bypass-approvals-and-sandbox');
    } else if (arg === '--dangerously-skip-permissions') {
      flags.push('--dangerously-skip-permissions');
    } else if (arg === '--skip-git-repo-check') {
      flags.push('--skip-git-repo-check');
    } else if (arg === '-s') {
      flags.push('-s');
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        flags.push(`-s ${args[i + 1]}`);
      }
    } else if (arg === '--mode') {
      flags.push('--mode');
    } else if (arg === '--provider') {
      flags.push('--provider');
    } else if (arg === '--tools') {
      flags.push('--tools');
    } else if (arg === '--approve') {
      flags.push('--approve');
    }
  }

  // Deduplicate preserving insertion order
  return Array.from(new Set(flags));
}

/**
 * How each provider CLI takes a reasoning-effort level, keyed by the spawned
 * command's own name: the CLI decides the flag, not the provider family (pi
 * runs openai and deepseek models alike; the claude CLI also fronts z-ai).
 * Levels are fgOS's canonical vocabulary (config.mjs REASONING_EFFORT_VALUES);
 * `native` maps one onto a different CLI word where the CLI names it
 * differently. Verified against the installed CLIs' --help (2026-10-14):
 * claude/agy `--effort low|medium|high|xhigh|max`, pi/omp `--thinking
 * off|minimal|low|medium|high|xhigh|max`; codex has no flag and reads
 * `model_reasoning_effort` from its config, which `-c key=value` overrides
 * for one run (it accepts any string without checking, so fgOS checks).
 */
const REASONING_EFFORT_CONTROLS = Object.freeze({
  claude: { flag: '--effort' },
  agy: { flag: '--effort' },
  pi: { flag: '--thinking' },
  omp: { flag: '--thinking' },
  codex: { configKey: 'model_reasoning_effort', native: { max: 'xhigh' } },
});

/**
 * The canonical effort levels a command's CLI can be told to run at: every level when fgOS knows the
 * CLI's effort control (a level the CLI names differently is mapped by `renderReasoningEffortArgs`),
 * none otherwise. Seat Binding reads this per invocation so a level no launch could render is never
 * promised.
 */
export function renderedEffortLevels(command) {
  return REASONING_EFFORT_CONTROLS[path.basename(String(command ?? ''))] ? [...REASONING_EFFORT_VALUES] : [];
}

/**
 * Renders a canonical reasoning-effort level into an invocation's args
 * template (before `{prompt}`/`{model}` substitution, so an adapter that
 * rebuilds argv from the template sees the same flag). A level the template
 * already hard-codes is replaced, never duplicated. Returns null when the
 * command has no effort control fgOS knows how to set.
 *
 * @returns {null | { args: string[], control: { command: string, flag: string, native: string, replaced?: string } }}
 */
export function renderReasoningEffortArgs({ command, args = [], effort }) {
  const name = path.basename(String(command ?? ''));
  const control = REASONING_EFFORT_CONTROLS[name];
  if (!control) return null;
  const native = control.native?.[effort] ?? effort;
  const out = [...args];
  let replaced;
  let flag;
  if (control.configKey) {
    flag = `-c ${control.configKey}`;
    const prefix = `${control.configKey}=`;
    const idx = out.findIndex((arg, i) => i > 0 && out[i - 1] === '-c' && typeof arg === 'string' && arg.startsWith(prefix));
    if (idx !== -1) {
      replaced = out[idx].slice(prefix.length);
      out[idx] = `${prefix}${native}`;
    } else {
      // Options follow the `exec` subcommand when there is one.
      out.splice(out[0] === 'exec' ? 1 : 0, 0, '-c', `${prefix}${native}`);
    }
  } else {
    flag = control.flag;
    const idx = out.indexOf(control.flag);
    if (idx !== -1 && idx + 1 < out.length) {
      replaced = out[idx + 1];
      out[idx + 1] = native;
    } else {
      out.unshift(control.flag, native);
    }
  }
  return { args: out, control: { command: name, flag, native, ...(replaced !== undefined ? { replaced } : {}) } };
}

/**
 * What the spawned CLI itself says about the model, read from its output.
 * Each pattern is a message the real CLI printed (2026-10-14): codex prints a
 * `model: <id>` header line and warns `Model metadata for \`<id>\` not
 * found` for a model it does not know; agy refuses with `model <id> is not
 * recognized as a known model`; pi refuses with `Model "<id>" not found`.
 */
const MODEL_REFUSAL_PATTERNS = [
  /model (\S+) is not recognized as a known model/,
  /Model "([^"]+)" not found/,
  /Model metadata for `([^`]+)` not found/,
];
const MODEL_REPORT_PATTERN = /^model: (\S+)$/m;

/**
 * Pre-spawn half of the model check, computed where the argv is built:
 * `requested` is the model the caller asked for (a `--model` flag), and
 * `launched` the model the invocation is actually given after policy
 * (a redirect to another provider re-derives it from that provider's tier).
 */
export function checkLaunchedModel({ requested, launched, args = [] }) {
  const warnings = [];
  if (requested && launched && requested !== launched) {
    warnings.push({
      code: 'model-overridden',
      requested,
      launched,
      message: `requested model "${requested}" was replaced by "${launched}" before launch`,
    });
  }
  // Only a model the caller asked for is worth a warning: an executor that
  // never takes a model (an MCP tool, a pane driver) is not ignoring one.
  if (requested && launched && !args.some((arg) => typeof arg === 'string' && arg.includes(launched))) {
    warnings.push({
      code: 'model-not-passed',
      launched,
      message: `the invocation's argv never carries model "${launched}"; the CLI runs whatever model its own config names`,
    });
  }
  return { ...(requested ? { requested } : {}), ...(launched ? { launched } : {}), warnings };
}

/**
 * Post-run half: the pre-spawn warnings plus what the CLI's own output says
 * (it refused or did not know the model, or reported running another one).
 * Returns the structured warning list a dispatch result carries; empty when
 * nothing disagrees.
 */
export function collectModelWarnings(modelCheck, { stdout = '', stderr = '' } = {}) {
  if (!modelCheck) return [];
  const warnings = [...(modelCheck.warnings ?? [])];
  const text = `${typeof stderr === 'string' ? stderr : ''}\n${typeof stdout === 'string' ? stdout : ''}`;
  for (const pattern of MODEL_REFUSAL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      warnings.push({
        code: 'model-unsupported',
        model: match[1],
        message: `the provider CLI does not recognize model "${match[1]}"`,
        evidence: match[0],
      });
      break;
    }
  }
  // The header goes to stderr; a worker's own stdout may print any text.
  const reported = (typeof stderr === 'string' ? stderr : '').match(MODEL_REPORT_PATTERN)?.[1];
  if (reported && modelCheck.launched && reported !== modelCheck.launched) {
    warnings.push({
      code: 'model-reported-different',
      launched: modelCheck.launched,
      reported,
      message: `launched with model "${modelCheck.launched}" but the CLI reports running "${reported}"`,
    });
  }
  return warnings;
}
