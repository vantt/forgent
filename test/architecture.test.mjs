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

// ─── Phase 01 mutation-unlock R6b: executeAssignment(...) isReadOnlyMode
// posture, enumerated at EVERY real call site codebase-wide ────────────────
// The invariant that actually matters (phase-01-mutation-unlock.md R6b):
// session-engine.mjs's `runExecutorAttempt` must remain the ONLY code path
// anywhere allowed to derive `isReadOnlyMode` from an Assignment's own
// stamped `mutation` posture (the one expression able to resolve to
// `false`). Every OTHER real call site must keep an `isReadOnlyMode`
// posture this test can prove stays `true` (or `true` for exactly the
// inline-provenance case, cli.mjs's own pre-existing shape) -- a DECLARED
// Assignment's mutation posture is governed by the wholly separate,
// pre-existing role/operation classification in
// assignment-normalizer.mjs's `stampDeclaredAssignment`, out of this
// invariant's scope (R6c).

/** From `source` (already comment-stripped), return the full `executeAssignment(...)`
 * call text starting at `startIndex` (the index of the `e` in
 * `executeAssignment`), balancing parens across multiple lines so a
 * multi-line call (e.g. cli.mjs's own shape) is captured whole. */
export function extractCallStatement(source, startIndex) {
  const parenStart = source.indexOf('(', startIndex);
  let depth = 0;
  for (let i = parenStart; i < source.length; i++) {
    if (source[i] === '(') depth++;
    else if (source[i] === ')') {
      depth -= 1;
      if (depth === 0) return source.slice(startIndex, i + 1);
    }
  }
  return source.slice(startIndex);
}

/** Every real `executeAssignment(...)` CALL site in `source` (never its own
 * `function executeAssignment(` definition, never an `import {
 * executeAssignment }` specifier -- neither has a `(` immediately after the
 * bare name once comments are stripped, so the lookbehind below excludes
 * the definition and the regex simply never matches the import form at
 * all). Returns the full balanced call text for each. */
export function findExecuteAssignmentCallTexts(rawSource) {
  const cleaned = rawSource.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  const re = /(?<!function )\bexecuteAssignment\s*\(/g;
  const calls = [];
  let m;
  while ((m = re.exec(cleaned))) {
    calls.push(extractCallStatement(cleaned, m.index));
  }
  return calls;
}

/** Pure posture check, given `{file, callText}` pairs -- separated from file
 * I/O so the "deliberately broken" test below can exercise it directly
 * against synthetic input, per this cell's own Tests First #6. */
export function checkExecuteAssignmentCallSitePostures(sites) {
  const violations = [];
  for (const { file, callText } of sites) {
    if (file === 'src/runner/coordination/session-engine.mjs') {
      // The ONLY site allowed to ever resolve isReadOnlyMode to false --
      // must derive it from the Assignment's own stamped mutation posture,
      // never a hardcoded boolean.
      if (!/isReadOnlyMode:\s*assignment\.mutation\s*!==\s*'mutating'/.test(callText)) {
        violations.push(`${file}: runExecutorAttempt's executeAssignment(...) call no longer derives isReadOnlyMode from assignment.mutation -- found: ${callText}`);
      }
    } else if (file === 'src/runner/dispatch/operation-choice.mjs') {
      // Confirmed (R6c): this call's own `assignment` is built two lines
      // above by the SAME function's one buildAssignment({work, stage,
      // operation, ...}) call, which never sets `provenance.kind: 'inline'`
      // -- so it can never carry the inline-forgery risk R6a's stamp gate
      // protects against, and never needs to set isReadOnlyMode at all.
      if (/isReadOnlyMode/.test(callText)) {
        violations.push(`${file}: executeAssignment(...) now sets isReadOnlyMode explicitly -- re-verify R6c's investigation still holds (phase-01-mutation-unlock.md R6c) before accepting this`);
      }
    } else if (file === 'src/runner/dispatch/cli.mjs') {
      // Every cli.mjs call site must keep isReadOnlyMode either literal
      // `true`, or `true` for exactly the known inline-provenance case.
      const hasLiteralTrue = /isReadOnlyMode:\s*true\b/.test(callText);
      const hasInlineTrue = /isReadOnlyMode:\s*asgnObj\.provenance\?\.kind\s*===\s*'inline'/.test(callText);
      if (/isReadOnlyMode:\s*false\b/.test(callText)) {
        violations.push(`${file}: executeAssignment(...) call sets isReadOnlyMode: false literally -- illegal anywhere outside session-engine.mjs's runExecutorAttempt`);
      } else if (!hasLiteralTrue && !hasInlineTrue) {
        violations.push(`${file}: executeAssignment(...) call's isReadOnlyMode is neither literal true nor the known true-for-inline expression -- ${callText}`);
      }
    } else {
      violations.push(`${file}: unexpected NEW executeAssignment(...) call site -- add explicit posture coverage to checkExecuteAssignmentCallSitePostures before accepting it`);
    }
  }
  return violations;
}

test('executeAssignment(...) isReadOnlyMode posture: every real call site codebase-wide is enumerated, and only session-engine.mjs\'s runExecutorAttempt may ever resolve it to false', () => {
  const files = [...mjsFilesUnder('src'), ...mjsFilesUnder('bin')];
  const sites = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(root, file), 'utf8');
    for (const callText of findExecuteAssignmentCallTexts(raw)) {
      sites.push({ file, callText });
    }
  }

  const foundFiles = new Set(sites.map((s) => s.file));
  const expectedFiles = new Set([
    'src/runner/coordination/session-engine.mjs',
    'src/runner/dispatch/cli.mjs',
    'src/runner/dispatch/operation-choice.mjs',
  ]);
  assert.deepEqual(
    [...foundFiles].sort(),
    [...expectedFiles].sort(),
    `executeAssignment(...) call sites changed -- update this enumeration's expectedFiles/postures (found in: ${[...foundFiles].sort().join(', ')})`,
  );

  const sessionEngineSites = sites.filter((s) => s.file === 'src/runner/coordination/session-engine.mjs');
  assert.equal(sessionEngineSites.length, 1, `expected exactly one executeAssignment(...) call site in session-engine.mjs, found ${sessionEngineSites.length}`);

  const cliSites = sites.filter((s) => s.file === 'src/runner/dispatch/cli.mjs');
  assert.equal(cliSites.length, 2, `expected exactly two executeAssignment(...) call sites in cli.mjs, found ${cliSites.length}`);

  assert.deepEqual(checkExecuteAssignmentCallSitePostures(sites), []);
});

test('R6b posture check actually catches a violation (deliberately broken synthetic input, not a passing no-op)', () => {
  assert.ok(
    checkExecuteAssignmentCallSitePostures([
      { file: 'src/runner/coordination/session-engine.mjs', callText: "executeAssignment(assignment, { ...opts, isReadOnlyMode: true })" },
    ]).length > 0,
    'a hardcoded isReadOnlyMode: true replacing the mutation-derived expression in session-engine.mjs must be flagged',
  );
  assert.ok(
    checkExecuteAssignmentCallSitePostures([
      { file: 'src/runner/dispatch/cli.mjs', callText: 'executeAssignment(assignment, { isReadOnlyMode: false })' },
    ]).length > 0,
    'a literal isReadOnlyMode: false in cli.mjs must be flagged',
  );
  assert.ok(
    checkExecuteAssignmentCallSitePostures([
      { file: 'src/runner/dispatch/operation-choice.mjs', callText: 'executeAssignment(assignment, { isReadOnlyMode: false })' },
    ]).length > 0,
    'operation-choice.mjs setting isReadOnlyMode explicitly must be flagged for re-investigation',
  );
  assert.ok(
    checkExecuteAssignmentCallSitePostures([{ file: 'src/runner/some-new-dispatch-file.mjs', callText: 'executeAssignment(x, y)' }]).length > 0,
    'a brand-new, uncovered call site must be flagged rather than silently passing',
  );
  // Sanity: the real, current, correct shapes for every known site produce
  // zero violations -- this check is not vacuously true.
  assert.deepEqual(
    checkExecuteAssignmentCallSitePostures([
      { file: 'src/runner/coordination/session-engine.mjs', callText: "executeAssignment(assignment, { ...opts, isReadOnlyMode: assignment.mutation !== 'mutating' })" },
      { file: 'src/runner/dispatch/cli.mjs', callText: "executeAssignment(asgnObj, { isReadOnlyMode: asgnObj.provenance?.kind === 'inline' })" },
      { file: 'src/runner/dispatch/cli.mjs', callText: 'executeAssignment(assignment, { isReadOnlyMode: true })' },
      { file: 'src/runner/dispatch/operation-choice.mjs', callText: 'executeAssignment(assignment, opts)' },
    ]),
    [],
  );
});

