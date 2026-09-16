// src/runner/dispatch/provider-adapter.mjs
// ProviderAdapter — pure rendering layer translating canonical runtime options
// into provider-specific command invocation facts (design.md §3.5, Phase 01).
//
// PURE FUNCTION INVARIANT:
// This module must be 100% pure: no spawn, no child_process, no fs write,
// no network, and no mutation of input arguments or global configuration.
// Production dispatch continues to use the legacy transport path byte-for-byte;
// this module is invoked in shadow mode by tests and future compiler stages.

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
  codex: [
    '--model',
    '-s',
    '-s read-only',
    '-s danger-full-access',
    '--dangerously-bypass-approvals-and-sandbox',
    '--dangerously-skip-permissions',
    '--skip-git-repo-check',
  ],
  'openai-codex': [
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
  agy: [
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

/**
 * Normalizes providerFamily and command into a canonical provider family key.
 * Handles display aliases, provider model identifiers, and CLI commands.
 */
export function normalizeProviderFamily(providerFamily, command) {
  const norm = String(providerFamily ?? '').trim().toLowerCase();
  const cmd = String(command ?? '').trim().toLowerCase();

  if (norm === 'z-ai' || norm === 'glm') return 'z-ai';
  if (cmd === 'pi' || norm === 'pi') return 'pi';
  if (norm === 'openai-codex' || norm === 'codex' || cmd === 'codex') return 'openai-codex';
  if (norm === 'gemini' || norm === 'agy' || cmd === 'agy') return 'gemini';
  if (norm === 'claude' || cmd === 'claude') return 'claude';
  return norm || cmd || 'unknown';
}

/**
 * Returns known policy-shaped flags for a given provider family.
 */
export function getProviderPolicyShapedFlags(providerFamily, command) {
  const norm = normalizeProviderFamily(providerFamily, command);
  return KNOWN_POLICY_SHAPED_FLAGS[norm] ?? [];
}

/**
 * Pure environment variable expansion for strings containing ${VAR}.
 * Resolves ${VAR} placeholders against baseEnv without mutation or side effects.
 */
export function resolveEnvPatch(rawEnv, baseEnv = process.env) {
  if (!rawEnv || typeof rawEnv !== 'object') return {};
  const resolved = {};
  for (const [k, v] of Object.entries(rawEnv)) {
    if (typeof v === 'string') {
      resolved[k] = v.replace(/\$\{([^}]+)\}/g, (_, varName) => baseEnv?.[varName] ?? '');
    } else {
      resolved[k] = v;
    }
  }
  return resolved;
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
 * Base ProviderAdapter defining common pure rendering contract and option resolution.
 */
export class BaseProviderAdapter {
  constructor(family) {
    this.family = family;
  }

  get policyShapedFlags() {
    return KNOWN_POLICY_SHAPED_FLAGS[this.family] ?? [];
  }

  supportsEffort() {
    return false;
  }

  supportsToolGating() {
    return false;
  }

  render({
    command,
    baseArgs = [],
    argsTemplate,
    promptPlaceholder = '<prompt>',
    model,
    promptEnvelope,
    runtimeOptions = {},
    executorFacts = {},
  } = {}) {
    const rawTemplate = Array.isArray(baseArgs) && baseArgs.length > 0
      ? [...baseArgs]
      : Array.isArray(argsTemplate)
        ? [...argsTemplate]
        : [];

    const warnings = [];
    const promptVal = promptPlaceholder ?? promptEnvelope?.briefPath ?? promptEnvelope?.text ?? '<prompt>';
    const resolvedModel = model ?? runtimeOptions?.model ?? executorFacts?.model;

    // 1. Substitute {prompt} and {model} into template elements
    let renderedArgs = rawTemplate.map((arg) => {
      if (typeof arg !== 'string') return String(arg);
      let res = arg;
      if (promptVal !== undefined) {
        res = res.split('{prompt}').join(promptVal);
      }
      if (resolvedModel !== undefined) {
        res = res.split('{model}').join(resolvedModel);
      }
      return res;
    });

    // 2. Handle model if not in template
    let appliedModel = 'unsupported';
    if (resolvedModel !== undefined) {
      appliedModel = 'applied';
      if (!renderedArgs.includes('--model') && !rawTemplate.some((a) => typeof a === 'string' && a.includes('{model}'))) {
        renderedArgs = [...renderedArgs, '--model', resolvedModel];
      }
    }

    // 3. Handle reasoning effort
    let appliedEffort = 'unsupported';
    const requestedEffort = runtimeOptions?.reasoningEffort ?? runtimeOptions?.effort;
    const hasEffortInArgs = renderedArgs.includes('--effort');

    if (this.supportsEffort()) {
      if (hasEffortInArgs) {
        appliedEffort = 'applied';
        if (requestedEffort) {
          const effortIdx = renderedArgs.indexOf('--effort');
          if (effortIdx !== -1 && effortIdx + 1 < renderedArgs.length) {
            renderedArgs[effortIdx + 1] = requestedEffort;
          }
        }
      } else if (requestedEffort) {
        renderedArgs = [...renderedArgs, '--effort', requestedEffort];
        appliedEffort = 'applied';
      }
    } else {
      if (hasEffortInArgs) {
        appliedEffort = 'applied';
      } else if (requestedEffort) {
        appliedEffort = 'omitted-with-audit';
        warnings.push(`Provider family "${this.family}" does not support runtime option reasoningEffort ("${requestedEffort}"); omitted with audit.`);
      }
    }

    // 4. Handle toolIntent
    let appliedToolIntent = 'unsupported';
    const hasAllowedTools = renderedArgs.includes('--allowedTools');
    const hasPiTools = renderedArgs.includes('--tools');

    if (hasAllowedTools) {
      appliedToolIntent = 'applied-via-allowedTools';
    } else if (hasPiTools) {
      appliedToolIntent = 'applied-via-tools';
    } else if (runtimeOptions?.toolIntent) {
      if (this.supportsToolGating() === 'allowedTools') {
        const toolsStr = Array.isArray(runtimeOptions.toolIntent)
          ? runtimeOptions.toolIntent.join(',')
          : String(runtimeOptions.toolIntent);
        renderedArgs = [...renderedArgs, '--allowedTools', toolsStr];
        appliedToolIntent = 'applied-via-allowedTools';
      } else if (this.supportsToolGating() === 'tools') {
        const toolsStr = Array.isArray(runtimeOptions.toolIntent)
          ? runtimeOptions.toolIntent.join(',')
          : String(runtimeOptions.toolIntent);
        renderedArgs = [...renderedArgs, '--tools', toolsStr];
        appliedToolIntent = 'applied-via-tools';
      } else {
        warnings.push(`Provider family "${this.family}" does not support toolIntent gating; unsupported.`);
      }
    }

    // 5. Handle readOnly / permission mode
    let appliedReadOnly = 'unsupported';
    const isBwrap = executorFacts?.confinement?.backend === 'bwrap';
    const hasReadOnlyFlag = renderedArgs.some((arg, idx) => arg === '-s' && renderedArgs[idx + 1] === 'read-only');

    if (isBwrap || hasReadOnlyFlag) {
      appliedReadOnly = 'enforced-by-sandbox';
    } else if (hasAllowedTools) {
      const allowedToolsVal = renderedArgs[renderedArgs.indexOf('--allowedTools') + 1] ?? '';
      // If allowedTools excludes write grants (e.g. git add, git commit), tool gating enforces read-only
      const hasWriteGrants = allowedToolsVal.includes('git add') || allowedToolsVal.includes('git commit');
      if (!hasWriteGrants) {
        appliedReadOnly = 'applied-via-tool-gating';
      }
    }

    // 6. Persona delivery (unsupported in Phase 01, Phase 02 scope)
    const appliedPersona = 'unsupported';

    // 7. Policy-shaped flags
    const policyShapedFlags = extractPolicyShapedFlags(renderedArgs, this.family);

    // 8. Env patch
    const envPatch = resolveEnvPatch(executorFacts?.env);

    return {
      command: command ?? this.family,
      args: renderedArgs,
      envPatch,
      applied: {
        model: appliedModel,
        reasoningEffort: appliedEffort,
        effort: appliedEffort,
        toolIntent: appliedToolIntent,
        allowedTools: appliedToolIntent,
        readOnly: appliedReadOnly,
        permissionMode: appliedReadOnly,
        persona: appliedPersona,
      },
      warnings,
      policyShapedFlags,
    };
  }
}

export class ClaudeProviderAdapter extends BaseProviderAdapter {
  constructor(family = 'claude') {
    super(family);
  }

  supportsEffort() {
    return true;
  }

  supportsToolGating() {
    return 'allowedTools';
  }
}

export class CodexProviderAdapter extends BaseProviderAdapter {
  constructor(family = 'openai-codex') {
    super(family);
  }

  supportsEffort() {
    return false;
  }

  supportsToolGating() {
    return false;
  }
}

export class GeminiProviderAdapter extends BaseProviderAdapter {
  constructor(family = 'gemini') {
    super(family);
  }

  supportsEffort() {
    return false;
  }

  supportsToolGating() {
    return false;
  }
}

export class PiProviderAdapter extends BaseProviderAdapter {
  constructor(family = 'pi') {
    super(family);
  }

  supportsEffort() {
    return false;
  }

  supportsToolGating() {
    return 'tools';
  }
}

export class GlmProviderAdapter extends ClaudeProviderAdapter {
  constructor(family = 'z-ai') {
    super(family);
  }
}

export const PROVIDER_ADAPTERS = {
  claude: new ClaudeProviderAdapter('claude'),
  'openai-codex': new CodexProviderAdapter('openai-codex'),
  codex: new CodexProviderAdapter('openai-codex'),
  gemini: new GeminiProviderAdapter('gemini'),
  agy: new GeminiProviderAdapter('gemini'),
  pi: new PiProviderAdapter('pi'),
  'z-ai': new GlmProviderAdapter('z-ai'),
  glm: new GlmProviderAdapter('z-ai'),
};

/**
 * Resolves a ProviderAdapter instance for given provider family and command.
 */
export function getProviderAdapter(providerFamily, command) {
  const norm = normalizeProviderFamily(providerFamily, command);
  return PROVIDER_ADAPTERS[norm] ?? new BaseProviderAdapter(norm);
}

/**
 * Canonical entry point translating canonical runtime options and executor facts
 * into provider-specific invocation details.
 *
 * Pure function: returns { command, args, envPatch, applied, warnings, policyShapedFlags }.
 */
export function renderProviderInvocation(inputs = {}) {
  const adapter = getProviderAdapter(inputs.providerFamily, inputs.command);
  return adapter.render(inputs);
}
