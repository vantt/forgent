// Giữ bản đồ kiến trúc thật thà bằng máy (architecture-map §9.3, record 0010).
// Các phép kiểm trên docs/architecture-manifest.json:
//   (a) đủ sổ — mọi file .mjs trong src/ + bin/ có row trong manifest, một-một
//       (file thiếu row VÀ row chỉ file đã xóa đều đỏ);
//   (b) một chiều xuống — mọi import tương đối chỉ trỏ cùng tầng hoặc tầng sâu
//       hơn theo thứ tự layers của manifest; import ngược lên là bug kiến trúc.
//       Chỉ áp dụng cho đích nằm trong src/+bin/ (vùng manifest quản lý) —
//       import ra ngoài (vd. scripts/, thư mục dev/ops tool riêng, chưa bao
//       giờ được quét vào manifest) không phải câu hỏi về tầng.
//   (c) domain-siloing (D12) — core (src/, bin/, core/) không import domain cụ thể
//       (domains/<name>/); domain A không import domain B (cross-domain siloing).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'docs', 'architecture-manifest.json'), 'utf8'),
);
const rank = new Map(manifest.layers.map((layer, i) => [layer, i]));

function mjsFilesUnder(dir) {
  const fullPath = path.join(root, dir);
  if (!fs.existsSync(fullPath)) return [];
  const entries = fs.readdirSync(fullPath, {
    withFileTypes: true,
    recursive: true,
  });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.mjs'))
    .map((e) => path.relative(root, path.join(e.parentPath, e.name)).split(path.sep).join('/'));
}

const onDisk = [...mjsFilesUnder('src'), ...mjsFilesUnder('bin')].sort();
const inManifest = Object.keys(manifest.files).sort();

export function checkDomainSiloingViolation(file, target) {
  if (!target.startsWith('domains/')) {
    return null;
  }
  const targetDomain = target.split('/')[1];
  if (!file.startsWith('domains/')) {
    return `${file} (core) import domain cụ thể ${target}`;
  }
  const sourceDomain = file.split('/')[1];
  if (sourceDomain !== targetDomain) {
    return `${file} (${sourceDomain}) import domain khác ${target} (${targetDomain})`;
  }
  return null;
}

function extractImports(source) {
  const imports = [];
  const patterns = [
    /(?:import|export)\s+[^;]*?from\s+['"]([^'"]+)['"]/gms,
    /(?:import|export)\s+['"]([^'"]+)['"]/gms,
    /import\(['"]([^'"]+)['"]\)/gms,
  ];
  for (const pattern of patterns) {
    for (const m of source.matchAll(pattern)) {
      imports.push(m[1]);
    }
  }
  return imports;
}

export function extractDomainCouplings(file, source, domainNames = []) {
  const targets = [];
  const cleanSource = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

  for (const specifier of extractImports(source)) {
    const target = specifier.startsWith('.')
      ? path.relative(root, path.resolve(root, path.dirname(file), specifier)).split(path.sep).join('/')
      : specifier.split(path.sep).join('/');
    targets.push(target);
  }

  const pathPattern = /['"`](?:\.\.?[\/\\])*domains\/([a-zA-Z0-9_-]+)(?:[\/\\][^'"`]*)?['"`]/g;
  for (const m of cleanSource.matchAll(pathPattern)) {
    targets.push(m[0].slice(1, -1));
  }

  const pathJoinPattern = /path\.join\s*\([^)]*?['"]domains['"]\s*,\s*['"]([a-zA-Z0-9_-]+)['"]/g;
  for (const m of cleanSource.matchAll(pathJoinPattern)) {
    if (domainNames.includes(m[1])) {
      targets.push(`domains/${m[1]}`);
    }
  }

  if (!file.startsWith('domains/')) {
    const lines = cleanSource.split('\n');
    // Only the DEFAULT_DOMAIN declaration itself is exempt -- a broader
    // "line mentions DEFAULT_DOMAIN and has an '=' anywhere" guard would
    // also swallow a genuine hardcoded-literal coupling that happens to
    // share a line with a DEFAULT_DOMAIN comparison/ternary, e.g.
    // `if (domain !== DEFAULT_DOMAIN && domain !== 'coding')`.
    const isDefaultDomainDeclaration = (line) => /^\s*(export\s+)?const\s+DEFAULT_DOMAIN\s*=/.test(line);
    for (const domain of domainNames) {
      const single = "'" + domain + "'";
      const double = '"' + domain + '"';
      const backtick = '`' + domain + '`';
      for (const line of lines) {
        if (isDefaultDomainDeclaration(line)) {
          continue;
        }
        if (line.includes(single) || line.includes(double) || line.includes(backtick)) {
          targets.push(`domains/${domain}`);
        }
      }
    }
  }

  return targets;
}

test('đủ sổ: file .mjs trên đĩa ↔ row trong manifest, một-một', () => {
  assert.deepEqual(onDisk, inManifest);
});

test('mọi row dùng tầng đã khai trong layers', () => {
  for (const [file, layer] of Object.entries(manifest.files)) {
    assert.ok(rank.has(layer), `${file}: tầng "${layer}" không có trong layers`);
  }
});

test('mọi rule khai báo trong manifest là hợp lệ', () => {
  assert.ok(Array.isArray(manifest.rules), 'manifest.rules phải là một array');
  assert.ok(manifest.rules.includes('one-directional-layer'), 'cần rule one-directional-layer');
  assert.ok(manifest.rules.includes('domain-siloing'), 'cần rule domain-siloing');
});

test('import một chiều xuống: không file nào import ngược lên tầng trên', () => {
  const violations = [];
  for (const file of inManifest) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    // Bắt cả import nhiều dòng: `import {\n ... \n} from './x.mjs';`
    for (const m of source.matchAll(/^import\s[^;]*?from\s+['"](\.[^'"]+)['"]/gms)) {
      const target = path
        .relative(root, path.resolve(root, path.dirname(file), m[1]))
        .split(path.sep)
        .join('/');
      // The manifest only covers src/ + bin/ (per "đủ sổ" above) — a
      // relative import reaching outside that tree (e.g. into scripts/,
      // a separate area of standalone dev/ops tools never scanned into
      // the manifest) isn't a layering question at all, since there is no
      // layer rank to compare against. Only a target actually inside
      // src/+bin/ but missing its row is a real "forgot to register it"
      // bug this check exists to catch.
      const targetInManifestedTree = target.startsWith('src/') || target.startsWith('bin/');
      if (targetInManifestedTree && !(target in manifest.files)) {
        violations.push(`${file} → ${target}: đích không có row trong manifest`);
        continue;
      }
      if (!targetInManifestedTree) continue;
      if (rank.get(manifest.files[file]) > rank.get(manifest.files[target])) {
        violations.push(
          `${file} (${manifest.files[file]}) import ngược lên ${target} (${manifest.files[target]})`,
        );
      }
    }
  }
  assert.deepEqual(violations, []);
});

test('domain-siloing: core không import/couple domain cụ thể, domain không import domain khác', () => {
  const allFiles = [...new Set([...inManifest, ...mjsFilesUnder('core'), ...mjsFilesUnder('domains')])].sort();
  const domainsDir = path.join(root, 'domains');
  const domainNames = fs.existsSync(domainsDir)
    ? fs.readdirSync(domainsDir).filter((d) => fs.statSync(path.join(domainsDir, d)).isDirectory())
    : [];
  const violations = [];

  for (const file of allFiles) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) continue;
    const source = fs.readFileSync(filePath, 'utf8');
    const targets = extractDomainCouplings(file, source, domainNames);

    for (const target of targets) {
      const violation = checkDomainSiloingViolation(file, target);
      if (violation) {
        violations.push(violation);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test('domain-siloing: phát hiện vi phạm fixture (core → domain cụ thể, domain A → domain B, path/literal coupling)', () => {
  assert.equal(
    checkDomainSiloingViolation('src/runner/loop.mjs', 'domains/coding/registry.yaml'),
    'src/runner/loop.mjs (core) import domain cụ thể domains/coding/registry.yaml',
  );

  assert.equal(
    checkDomainSiloingViolation('domains/marketing/foo.mjs', 'domains/coding/bar.mjs'),
    'domains/marketing/foo.mjs (marketing) import domain khác domains/coding/bar.mjs (coding)',
  );

  assert.equal(
    checkDomainSiloingViolation('domains/coding/foo.mjs', 'domains/coding/bar.mjs'),
    null,
  );

  assert.equal(
    checkDomainSiloingViolation('domains/coding/foo.mjs', 'src/state/store.mjs'),
    null,
  );

  // Fixture tests for path construction and hardcoded literals extraction
  const sampleCoreSource = `
    const p = path.join('domains', 'coding', 'spec.md');
    const d = 'coding';
    export const DEFAULT_DOMAIN = 'coding';
  `;
  const targets = extractDomainCouplings('src/sample.mjs', sampleCoreSource, ['coding', 'marketing']);
  assert.ok(targets.includes('domains/coding'));

  // DEFAULT_DOMAIN declaration is guarded
  const defaultDomainDefOnly = "export const DEFAULT_DOMAIN = 'coding';";
  const defTargets = extractDomainCouplings('src/state/workflow-stage-graphs.mjs', defaultDomainDefOnly, ['coding']);
  assert.deepEqual(defTargets, []);

  // Regression: the DEFAULT_DOMAIN guard must exempt only the declaration
  // line itself, never any line that merely mentions DEFAULT_DOMAIN
  // alongside an unrelated hardcoded literal (e.g. a comparison/ternary).
  const mixedLine = "const target = mode === DEFAULT_DOMAIN ? primary : 'marketing';";
  assert.deepEqual(
    extractDomainCouplings('src/sample.mjs', mixedLine, ['coding', 'marketing']),
    ['domains/marketing'],
  );

  // Regression: a quoted literal path reaching up more than one directory
  // level (../domains/..., not just ./domains/...) must still be caught.
  const parentRelativeLiteral = `const p = "../domains/coding/foo.md";`;
  assert.deepEqual(
    extractDomainCouplings('src/deep/sample.mjs', parentRelativeLiteral, ['coding']),
    ['../domains/coding/foo.md'],
  );
});

