// test/component-authority/contracts.test.mjs — Contract index (Phase 4)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const modelDir = path.join(root, 'packages/component-authority/model');
const schemaPath = path.join(root, 'packages/component-authority/contracts/model.v1.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const components = JSON.parse(fs.readFileSync(path.join(modelDir, 'components.json'), 'utf8'));
const contracts = JSON.parse(fs.readFileSync(path.join(modelDir, 'contracts.json'), 'utf8'));

const componentIds = new Set(components.map((c) => c.id));
const contractDef = schema.$defs.contract;
const validStatuses = new Set(contractDef.properties.status.enum);

/** Top-level files under packages/<pkg>/contracts/ (not nested fixtures or vectors). */
function listPackageContractFiles(repoRoot) {
  const out = [];
  const packagesDir = path.join(repoRoot, 'packages');
  if (!fs.existsSync(packagesDir)) return out;
  for (const pkg of fs.readdirSync(packagesDir)) {
    const cdir = path.join(packagesDir, pkg, 'contracts');
    if (!fs.existsSync(cdir) || !fs.statSync(cdir).isDirectory()) continue;
    for (const name of fs.readdirSync(cdir)) {
      const full = path.join(cdir, name);
      if (!fs.statSync(full).isFile()) continue;
      out.push(path.join('packages', pkg, 'contracts', name).replace(/\\/g, '/'));
    }
  }
  return out.sort();
}

/**
 * Top-level docs/platform/<area>/contracts markdown or yaml files.
 * .yaml is included because live prose contracts such as CTR010
 * (fgos-gateway-api-v1.yaml) are OpenAPI YAML under docs/platform/.../contracts/.
 */
function listProseContractFiles(repoRoot) {
  const out = [];
  const platformDir = path.join(repoRoot, 'docs/platform');
  if (!fs.existsSync(platformDir)) return out;
  for (const area of fs.readdirSync(platformDir)) {
    const cdir = path.join(platformDir, area, 'contracts');
    if (!fs.existsSync(cdir) || !fs.statSync(cdir).isDirectory()) continue;
    for (const name of fs.readdirSync(cdir)) {
      const full = path.join(cdir, name);
      if (!fs.statSync(full).isFile()) continue;
      if (!/\.(md|ya?ml)$/i.test(name)) continue;
      out.push(path.join('docs/platform', area, 'contracts', name).replace(/\\/g, '/'));
    }
  }
  return out.sort();
}

function assertContractShape(row, label) {
  for (const req of contractDef.required) {
    assert.ok(req in row, `${label} missing required field "${req}"`);
  }
  for (const key of Object.keys(row)) {
    assert.ok(key in contractDef.properties, `${label} has unknown field "${key}"`);
  }
  assert.equal(typeof row.id, 'string');
  assert.ok(row.id.length > 0, `${label} empty id`);
  assert.equal(typeof row.canonical, 'string');
  assert.ok(row.canonical.length > 0, `${label} empty canonical`);
  assert.ok(Array.isArray(row.aliases), `${label} aliases must be array`);
  for (const a of row.aliases) assert.equal(typeof a, 'string');
  assert.equal(typeof row.meaning, 'string');
  assert.ok(row.meaning.length > 0, `${label} empty meaning`);
  assert.equal(typeof row.provider, 'string');
  assert.ok(row.provider.length > 0, `${label} empty provider`);
  assert.ok(Array.isArray(row.consumers), `${label} consumers must be array`);
  for (const c of row.consumers) assert.equal(typeof c, 'string');
  assert.ok(Array.isArray(row.evidence), `${label} evidence must be array`);
  for (const e of row.evidence) assert.equal(typeof e, 'string');
  assert.ok(validStatuses.has(row.status), `${label} invalid status "${row.status}"`);
  if (row.path !== undefined) {
    assert.equal(typeof row.path, 'string');
    assert.ok(row.path.length > 0, `${label} empty path`);
  }
  if (row.reason !== undefined) {
    assert.equal(typeof row.reason, 'string');
    assert.ok(row.reason.length > 0, `${label} empty reason`);
  }
  if (row.guards !== undefined) {
    if (Array.isArray(row.guards)) {
      for (const g of row.guards) assert.equal(typeof g, 'string');
    } else {
      assert.equal(typeof row.guards, 'string');
    }
  }
  if (row.version !== undefined) {
    assert.ok(typeof row.version === 'string' || Number.isInteger(row.version));
  }
}

/** Every top-level package/prose contract file under root has exactly one row. */
function assertContractFileCoverage(rows, repoRoot) {
  const packageFiles = listPackageContractFiles(repoRoot);
  const proseFiles = listProseContractFiles(repoRoot);
  const allFiles = [...packageFiles, ...proseFiles];

  const pathCounts = new Map();
  for (const row of rows) {
    if (!row.path) continue;
    pathCounts.set(row.path, (pathCounts.get(row.path) || 0) + 1);
  }

  for (const file of allFiles) {
    const n = pathCounts.get(file) || 0;
    assert.equal(
      n,
      1,
      `contract file ${file} must have exactly one row, found ${n}`,
    );
  }
}

/** Every row has a non-empty provider string. */
function assertProvidersPresent(rows) {
  for (const row of rows) {
    assert.equal(typeof row.provider, 'string', `${row.id ?? '<row>'} provider must be a string`);
    assert.ok(
      row.provider && row.provider.length > 0,
      `${row.id ?? '<row>'} missing provider`,
    );
  }
}

/**
 * live and designed rows must set path, and that path must exist under repoRoot.
 * No skip when path is unset.
 */
function assertLiveDesignedPathsExist(rows, repoRoot) {
  for (const row of rows) {
    if (row.status !== 'live' && row.status !== 'designed') continue;
    assert.ok(
      typeof row.path === 'string' && row.path.length > 0,
      `${row.id} status ${row.status} must have path set`,
    );
    assert.ok(
      fs.existsSync(path.join(repoRoot, row.path)),
      `${row.id} status ${row.status} path missing: ${row.path}`,
    );
  }
}

/** Longest components.json paths[] prefix that covers filePath, or null. */
function longestPathOwner(filePath, componentRows) {
  let best = null;
  let bestLen = -1;
  for (const comp of componentRows) {
    const paths = Array.isArray(comp.paths) ? comp.paths : [];
    for (const raw of paths) {
      if (typeof raw !== 'string' || raw.length === 0) continue;
      const pref = raw.replace(/\\/g, '/').replace(/\/+$/, '');
      if (filePath === pref || filePath.startsWith(pref + '/')) {
        if (pref.length > bestLen) {
          best = comp.id;
          bestLen = pref.length;
        }
      }
    }
  }
  return best;
}

test('contracts.json rows validate against model.v1.json $defs/contract', () => {
  assert.ok(Array.isArray(contracts), 'contracts.json must be an array');
  assert.ok(contracts.length > 0, 'contracts.json must not be empty');
  for (const [idx, row] of contracts.entries()) {
    assertContractShape(row, `contracts[${idx}] (${row.id})`);
  }
});

test('every top-level package contract file and every prose contract has exactly one row', () => {
  assertContractFileCoverage(contracts, root);

  // No row path points at a missing top-level file that should be indexed as live/designed
  for (const row of contracts) {
    if (!row.path) continue;
    if (row.status === 'planned') continue;
    assert.ok(
      fs.existsSync(path.join(root, row.path)),
      `row ${row.id} path ${row.path} does not exist on disk`,
    );
  }
});

test('every row has exactly one provider that exists in components.json', () => {
  assertProvidersPresent(contracts);
  for (const row of contracts) {
    assert.ok(
      componentIds.has(row.provider),
      `${row.id} provider "${row.provider}" is not a component id`,
    );
  }
});

test('every consumer exists in components.json', () => {
  for (const row of contracts) {
    for (const consumer of row.consumers) {
      assert.ok(
        componentIds.has(consumer),
        `${row.id} consumer "${consumer}" is not a component id`,
      );
    }
  }
});

test('live and designed rows name an existing path', () => {
  assertLiveDesignedPathsExist(contracts, root);
});

test('id, canonical and aliases are unique across contracts (case-insensitive)', () => {
  const ids = new Map();
  const names = new Map();

  for (const row of contracts) {
    const idKey = row.id.toLowerCase();
    assert.ok(idKey.length > 0, 'empty id');
    assert.equal(ids.has(idKey), false, `duplicate id "${row.id}"`);
    ids.set(idKey, row.id);

    const cKey = row.canonical.toLowerCase();
    assert.ok(cKey.length > 0, `${row.id} empty canonical`);
    // id may equal canonical on the same row; still unique across rows
    if (cKey !== idKey) {
      assert.equal(
        names.has(cKey) || ids.has(cKey),
        false,
        `Collision on canonical "${row.canonical}" from "${row.id}"`,
      );
    } else {
      assert.equal(names.has(cKey), false, `Collision on canonical "${row.canonical}" from "${row.id}"`);
    }
    names.set(cKey, row.id);

    for (const alias of row.aliases) {
      const aKey = alias.toLowerCase();
      assert.ok(aKey.length > 0, `${row.id} empty alias`);
      assert.equal(
        names.has(aKey) || ids.has(aKey),
        false,
        `Collision on alias "${alias}" from "${row.id}" (claimed by ${names.get(aKey) || ids.get(aKey)})`,
      );
      names.set(aKey, row.id);
    }
  }
});

test('provider differing from longest-prefix path owner carries reason', () => {
  for (const row of contracts) {
    if (!row.path) continue;
    const owner = longestPathOwner(row.path, components);
    if (!owner || owner === row.provider) continue;
    assert.equal(
      typeof row.reason,
      'string',
      `${row.id} provider "${row.provider}" differs from path owner "${owner}" for ${row.path} but reason is missing`,
    );
    assert.ok(
      row.reason.length > 0,
      `${row.id} provider "${row.provider}" differs from path owner "${owner}" for ${row.path} but reason is empty`,
    );
  }
});

test('synthetic: coverage, provider, and path-existence checks fail with named file or row', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-contracts-'));
  try {
    const orphanRel = 'packages/orphan-pkg/contracts/unindexed.v1.json';
    fs.mkdirSync(path.join(tmpRoot, 'packages/orphan-pkg/contracts'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, orphanRel), '{}\n');

    const baseRow = {
      id: 'synthetic-ok',
      canonical: 'synthetic-ok',
      aliases: [],
      meaning: 'synthetic baseline row',
      provider: 'component-authority',
      consumers: [],
      evidence: [],
      status: 'live',
      path: orphanRel,
    };

    // Coverage: contracts dir holds a file with no row
    assert.throws(
      () => assertContractFileCoverage([], tmpRoot),
      (err) => {
        assert.match(String(err.message), /unindexed\.v1\.json/);
        return true;
      },
    );

    // Provider: provider-less row
    const providerLess = { ...baseRow, id: 'synthetic-no-provider' };
    delete providerLess.provider;
    assert.throws(
      () => assertProvidersPresent([providerLess]),
      (err) => {
        assert.match(String(err.message), /synthetic-no-provider/);
        return true;
      },
    );

    // Path existence: live row whose path is missing under temp root
    const missingPathRow = {
      ...baseRow,
      id: 'synthetic-missing-path',
      path: 'packages/orphan-pkg/contracts/does-not-exist.v1.json',
    };
    assert.throws(
      () => assertLiveDesignedPathsExist([missingPathRow], tmpRoot),
      (err) => {
        assert.match(String(err.message), /synthetic-missing-path/);
        return true;
      },
    );

    // Live/designed without path set also fails (no skip when unset)
    const unsetPathRow = {
      id: 'synthetic-unset-path',
      canonical: 'synthetic-unset-path',
      aliases: [],
      meaning: 'live without path',
      provider: 'component-authority',
      consumers: [],
      evidence: [],
      status: 'live',
    };
    assert.throws(
      () => assertLiveDesignedPathsExist([unsetPathRow], tmpRoot),
      (err) => {
        assert.match(String(err.message), /synthetic-unset-path/);
        return true;
      },
    );
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
