import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { listWork, editWork, addDecision, StoreError } from '../../state/store.mjs';

export const EDIT_EMPTY_PATCH_MESSAGE =
  'edit requires at least one field to change: --title/--description/--kind/--risk/--verify/--tier/--refs/--deps/--footprint/--acceptance/--priority/--intent/--docs-ref/--parent/--urgent/--impact/--effort/--merge-after/--superseded-by/--duplicates/--domain-fields/--verify-from-children/--verify-from-targets.';

export function parseListFlag(value) {
  if (value === undefined || value === true) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseAcceptanceFlag(value, message) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new StoreError('validation', message);
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    throw new StoreError('validation', `${message} (invalid JSON: ${err.message})`);
  }
}

function optionalField(value, message) {
  if (value === undefined) return undefined;
  if (value === true || value === '') {
    throw new StoreError('validation', message);
  }
  return value;
}

function formatJqVerifyCommand(root, ids) {
  const normalizedRoot = path.normalize(root);
  if (process.platform === 'win32') {
    const idList = ids.map((id) => `\\"${id}\\"`).join(',');
    return (
      `node ${normalizedRoot}/bin/fgos.mjs list --json --all --dir ${normalizedRoot} | ` +
      `jq -e ".data.work as $w | [${idList}] | map($w[.].status) | ` +
      `all(. as $s | [\\"delivered\\",\\"retrospective\\",\\"cleanup\\",\\"done\\"] | index($s) != null)" > NUL`
    );
  }
  const idList = ids.map((childId) => JSON.stringify(childId)).join(',');
  return (
    `node ${normalizedRoot}/bin/fgos.mjs list --json --all --dir ${normalizedRoot} | ` +
    `jq -e '.data.work as $w | [${idList}] | map($w[.].status) | ` +
    `all(. as $s | ["delivered","retrospective","cleanup","done"] | index($s) != null)' > /dev/null`
  );
}

export function generateVerifyFromChildren(dir, id, { cwd = process.cwd(), repoRoot } = {}) {
  const view = listWork(dir);
  const item = view.work[id];
  if (!item) {
    throw new StoreError('validation', `edit: work "${id}" not found.`);
  }
  const ids = Object.values(view.work).filter((w) => w.parent === id).map((w) => w.id);
  if (ids.length === 0) {
    throw new StoreError(
      'validation',
      `edit --verify-from-children: no item has parent === "${id}" -- refusing to write a verify that would vacuously pass (jq's "all()" on an empty list is always true).`,
    );
  }
  let root = repoRoot;
  if (!root) {
    try {
      const gitCommonDir = execFileSync(
        'git',
        ['rev-parse', '--path-format=absolute', '--git-common-dir'],
        { cwd, encoding: 'utf8', shell: false, stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim();
      root = path.resolve(path.dirname(gitCommonDir));
    } catch (err) {
      throw new StoreError('validation', `edit --verify-from-children: could not resolve the repo root via git (${err.message}).`);
    }
  }
  return formatJqVerifyCommand(root, ids);
}

export function generateVerifyFromTargets(dir, id, { cwd = process.cwd(), repoRoot } = {}) {
  const view = listWork(dir);
  const item = view.work[id];
  if (!item) {
    throw new StoreError('validation', `edit: work "${id}" not found.`);
  }
  const ids = Array.isArray(item.targets) ? item.targets : [];
  if (ids.length === 0) {
    throw new StoreError(
      'validation',
      `edit --verify-from-targets: "${id}" has no targets -- refusing to write a verify that would vacuously pass (jq's "all()" on an empty list is always true).`,
    );
  }
  let root = repoRoot;
  if (!root) {
    try {
      const gitCommonDir = execFileSync(
        'git',
        ['rev-parse', '--path-format=absolute', '--git-common-dir'],
        { cwd, encoding: 'utf8', shell: false, stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim();
      root = path.resolve(path.dirname(gitCommonDir));
    } catch (err) {
      throw new StoreError('validation', `edit --verify-from-targets: could not resolve the repo root via git (${err.message}).`);
    }
  }
  return formatJqVerifyCommand(root, ids);
}

export function parseEditFlags(flags, { id, dir, cwd = process.cwd(), repoRoot } = {}) {
  const patch = {};
  for (const field of ['title', 'description', 'kind', 'risk', 'verify', 'tier', 'urgent', 'action']) {
    if (flags[field] !== undefined) {
      patch[field] = flags[field];
    }
  }
  for (const field of ['refs', 'deps', 'footprint']) {
    if (flags[field] !== undefined) {
      patch[field] = parseListFlag(flags[field]);
    }
  }
  if (flags.acceptance !== undefined) {
    patch.acceptance = parseAcceptanceFlag(flags.acceptance, 'edit --acceptance requires a JSON-encoded array of {text, evidence} clauses.');
  }
  if (flags['domain-fields'] !== undefined) {
    patch.domainFields = parseAcceptanceFlag(flags['domain-fields'], 'edit --domain-fields requires a JSON-encoded object ({ [domainName]: {...} }).');
  }
  if (flags['docs-ref'] !== undefined) {
    patch.docsRef = optionalField(flags['docs-ref'], 'edit --docs-ref requires a non-empty path.');
  }
  if (flags['goal-tier'] !== undefined) {
    patch.goalTier = optionalField(flags['goal-tier'], "edit --goal-tier requires a value ('mvp' or 'milestone').");
  }
  if (flags['merge-after'] !== undefined) {
    patch.mergeAfter = parseListFlag(flags['merge-after']);
  }
  if (flags['superseded-by'] !== undefined) {
    if (flags['superseded-by'] === true) {
      throw new StoreError('validation', '--superseded-by requires a value; use --superseded-by "" to clear it.');
    }
    patch.supersededBy = flags['superseded-by'] === '' ? null : flags['superseded-by'];
  }
  if (flags.duplicates !== undefined) {
    patch.duplicates = parseListFlag(flags.duplicates);
  }
  if (flags.parent !== undefined) {
    if (flags.parent === true) {
      throw new StoreError('validation', '--parent requires a value; use --parent "" to clear it.');
    }
    patch.parent = flags.parent === '' ? null : flags.parent;
  }
  if (flags.priority !== undefined) {
    if (flags.priority === true) {
      throw new StoreError('validation', '--priority requires a numeric value.');
    }
    const priority = Number(flags.priority);
    if (!Number.isInteger(priority)) {
      throw new StoreError(
        'validation',
        `--priority must be an integer, got: ${JSON.stringify(flags.priority)}`,
      );
    }
    patch.priority = priority;
  }
  if (flags.intent !== undefined) {
    if (flags.intent === true) {
      throw new StoreError('validation', '--intent requires a numeric value.');
    }
    const intent = Number(flags.intent);
    if (!Number.isInteger(intent)) {
      throw new StoreError(
        'validation',
        `--intent must be an integer, got: ${JSON.stringify(flags.intent)}`,
      );
    }
    patch.intent = intent;
  }
  for (const field of ['impact', 'effort']) {
    if (flags[field] !== undefined) {
      if (flags[field] === true) {
        throw new StoreError('validation', `--${field} requires a numeric value.`);
      }
      const value = Number(flags[field]);
      if (!Number.isFinite(value) || value < 0) {
        throw new StoreError(
          'validation',
          `--${field} must be a non-negative number, got: ${JSON.stringify(flags[field])}`,
        );
      }
      patch[field] = value;
    }
  }
  if (flags['verify-from-children'] === true || flags['verify-from-targets'] === true) {
    if (flags['verify-from-children'] === true && flags['verify-from-targets'] === true) {
      throw new StoreError('validation', 'edit: --verify-from-children and --verify-from-targets are mutually exclusive -- pick one.');
    }
    if (flags['verify-from-children'] === true) {
      patch.verify = generateVerifyFromChildren(dir, id, { cwd, repoRoot });
    } else {
      patch.verify = generateVerifyFromTargets(dir, id, { cwd, repoRoot });
    }
  }
  return patch;
}

export function editUseCase({ dir }, { id, patch, role = 'human' }) {
  if (!patch || Object.keys(patch).length === 0) {
    throw new StoreError('validation', EDIT_EMPTY_PATCH_MESSAGE);
  }
  if (role !== 'human' && role !== 'session') {
    throw new StoreError('validation', `edit --role must be "human" or "session" (got "${role}").`);
  }
  const { event } = editWork(dir, { id, patch, role });
  if (patch.priority !== undefined) {
    addDecision(dir, {
      id,
      text: `priority set to ${patch.priority} via edit --priority`,
      source: 'edit',
      kind: 'priority-override',
      rationale: "tsk-sq9: mark this as a human override so plan.mjs's refined pass does not silently overwrite it",
    });
  }
  return { id, fields: Object.keys(patch), seq: event.seq };
}
