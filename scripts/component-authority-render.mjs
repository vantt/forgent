#!/usr/bin/env node
// component-authority-render.mjs — renders the human ownership views from the one
// structural model at packages/component-authority/model/ (docs/platform/component-authority/spec.md §5).
//
// Shape: the same generate-and-`--check` contract as `fgos decision-index`
// (src/report/decision-index.mjs). Compute-without-writing is shared by the write path
// and the drift mode, a repeat write over an unchanged model is byte-identical, and
// `--check` exits 1 naming every view that differs.
//
// Every view is one block between `<!-- generated:component-authority:<view> -->` and
// `<!-- /generated:component-authority:<view> -->`. Text outside the markers belongs to
// the document's author and is never touched. A view is drift when its block is missing
// (`required: true`) or when the block on disk differs from the render.
//
// The governance holder table is a required view: its markers must be present in
// governance.md, and `--check` fails when the block is missing or drifts from the model.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODEL_DIR = path.posix.join('packages', 'component-authority', 'model');
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

export const startMarker = (view) => `<!-- generated:component-authority:${view} -->`;
export const endMarker = (view) => `<!-- /generated:component-authority:${view} -->`;
const NOTE = '<!-- rendered from packages/component-authority/model/ by `node scripts/component-authority-render.mjs`; edit the model, never this block -->';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const cell = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
const code = (text) => `\`${cell(text)}\``;

/** The model as the phases before this one leave it: component rows, decision kinds, contracts, every door file. */
export function loadModel(repoRoot) {
  const dir = path.join(repoRoot, MODEL_DIR);
  const doorsDir = path.join(dir, 'doors');
  const doorFiles = fs.existsSync(doorsDir)
    ? fs.readdirSync(doorsDir).filter((name) => name.endsWith('.json')).sort()
    : [];
  const contractsPath = path.join(dir, 'contracts.json');
  return {
    components: readJson(path.join(dir, 'components.json')),
    decisionKinds: readJson(path.join(dir, 'decision-kinds.json')),
    contracts: fs.existsSync(contractsPath) ? readJson(contractsPath) : [],
    doors: doorFiles.map((name) => ({
      file: path.posix.join(MODEL_DIR, 'doors', name),
      row: readJson(path.join(doorsDir, name)),
    })),
  };
}

/** The area directory a component belongs to, from its spec path, or null when its spec is elsewhere. */
function areaOf(component) {
  const match = /^docs\/platform\/([^/]+)\//.exec(component.spec ?? '');
  return match ? match[1] : null;
}

/** Area directory named by a narrative path under docs/platform/, else null. */
function areaFromNarrative(narrative) {
  const match = /^docs\/platform\/([^/]+)\//.exec(narrative ?? '');
  return match ? match[1] : null;
}

/** Door files whose declared `allowed` paths fall under one of the component's paths or sources. */
function doorsOf(component, doors) {
  const prefixes = [...(component.paths ?? []), ...(component.source ?? [])];
  return doors.filter(({ row }) => (row.allowed ?? []).some((entry) => {
    const allowed = typeof entry === 'string' ? entry : entry?.path;
    if (typeof allowed !== 'string') return false;
    return prefixes.some((prefix) => allowed === prefix || allowed.startsWith(prefix));
  }));
}

const sortedComponents = (model) => [...model.components].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

/** Components whose owner doc sits in `area`, or every component when `area` is null. */
const componentsOfArea = (model, area) => (area
  ? sortedComponents(model).filter((component) => areaOf(component) === area)
  : sortedComponents(model));

function componentTableBody(model) {
  const lines = [
    `Ownership rows, one per component and subcomponent, sorted by id. ${NOTE}`,
    '',
    '| Component | Parent | Layer | Tier | Status | Owns | Must not own | Doors | Owner doc | Source links |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const component of sortedComponents(model)) {
    const owns = (component.owns ?? []).map(cell).join('; ');
    const mustNotOwn = (component.mustNotOwn ?? []).map(cell).join('; ');
    lines.push(`| ${code(component.id)} | ${component.parent ? code(component.parent) : '—'} | ${cell(component.layer)} | ${component.tier} | ${cell(component.status)} | ${owns} | ${mustNotOwn} | ${doorsOf(component, model.doors).length} | ${component.spec ? code(component.spec) : '—'} | ${(component.source ?? []).map(code).join(', ') || '—'} |`);
  }
  return lines.join('\n');
}

function ownerTableBody(model) {
  const lines = [
    `Component owners, one row per component and subcomponent, sorted by id. ${NOTE}`,
    '',
    '| Component | Parent | Role | Owner doc | Paths |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const component of sortedComponents(model)) {
    lines.push(`| ${code(component.id)} | ${component.parent ? code(component.parent) : '—'} | ${cell(component.meaning)} | ${component.spec ? code(component.spec) : '—'} | ${(component.paths ?? []).map(code).join(', ') || '—'} |`);
  }
  return lines.join('\n');
}

/**
 * The governance "Decision scope to holder table": the same four columns and the same
 * scope-to-holder shape the hand-written table carried, so every legacy scope alias
 * survives and `fgos decision-index` keeps resolving narratives from them. Optional
 * `readFirst` / `facts` on a decision kind override the derived portal and facts cells
 * (path with optional #anchor); otherwise derivation matches the prior table rules.
 */
function governanceHolderBody(model, repoRoot) {
  const byId = new Map(model.components.map((component) => [component.id, component]));
  const lines = [
    NOTE,
    '',
    '| Scope (legacy alias retained) | Read first | Facts and RULs | Narrative home |',
    '| --- | --- | --- | --- |',
  ];
  for (const kind of model.decisionKinds) {
    const owner = byId.get(kind.owner);
    const narrativeArea = areaFromNarrative(kind.narrative);
    const target = narrativeArea || kind.owner || kind.id;
    const scopeParts = [];
    const aliases = kind.aliases ?? [];
    // Prefer ASCII aliases as the left side (matches the hand-written table's English scopes).
    const asciiAliases = aliases.filter((alias) => /^[\x20-\x7E]+$/.test(alias) && alias !== target);
    if (asciiAliases.length) {
      for (const alias of asciiAliases) scopeParts.push(`${alias} → ${target}`);
    } else {
      scopeParts.push(`${kind.id} → ${target}`);
    }
    let portal;
    if (typeof kind.readFirst === 'string' && kind.readFirst.trim()) {
      portal = kind.readFirst.trim();
    } else {
      const area = owner ? areaOf(owner) : narrativeArea;
      const portalCandidates = [];
      if (area) portalCandidates.push(`docs/platform/${area}/README.md`);
      if (owner?.spec) portalCandidates.push(owner.spec);
      if (kind.narrative) portalCandidates.push(kind.narrative);
      portal = portalCandidates.find((rel) => {
        const filePart = rel.split('#')[0];
        return fs.existsSync(path.join(repoRoot, filePart));
      }) || owner?.spec || kind.narrative || '—';
    }
    let uniqueFacts;
    if (kind.facts !== undefined && kind.facts !== null && kind.facts !== '') {
      const list = Array.isArray(kind.facts) ? kind.facts : [kind.facts];
      uniqueFacts = [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
    } else {
      const childSpecs = model.components
        .filter((component) => component.parent === kind.owner && component.spec)
        .map((component) => component.spec);
      uniqueFacts = [...new Set([owner?.spec, ...childSpecs].filter(Boolean))];
    }
    lines.push(`| ${cell(scopeParts.join('<br>'))} | ${portal === '—' ? '—' : code(portal)} | ${uniqueFacts.map(code).join('; ') || '—'} | ${code(kind.narrative)} |`);
  }
  return lines.join('\n');
}

/**
 * One row per area. Specs not under `docs/platform/<area>/` land in `(cross-area)`
 * instead of being dropped (host-surface, durable-file, domain-*, group-thinking, …).
 */
function areaMapBody(model) {
  const lines = [
    `Area rows from the model: one row per area listing its top-level components. Specs outside docs/platform/<area>/ are listed under (cross-area). ${NOTE}`,
    '',
    '| Area | Components | What it owns | Owner doc |',
    '| --- | --- | --- | --- |',
  ];
  const byArea = new Map();
  for (const component of sortedComponents(model)) {
    if (component.parent) continue;
    const area = areaOf(component) ?? '(cross-area)';
    if (!byArea.has(area)) byArea.set(area, []);
    byArea.get(area).push(component);
  }
  for (const area of [...byArea.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    const comps = byArea.get(area);
    const ids = comps.map((component) => code(component.id)).join(', ');
    const meanings = comps.map((component) => cell(component.meaning)).filter(Boolean).join('; ') || '—';
    const specs = [...new Set(comps.map((component) => component.spec).filter(Boolean))].map(code).join(', ') || '—';
    lines.push(`| ${code(area)} | ${ids} | ${meanings} | ${specs} |`);
  }
  return lines.join('\n');
}

function sharedEntitiesBody(model, area) {
  const scope = area ? `owned by ${code(area)}` : 'across every area';
  const lines = [
    `Ownership rows ${scope}: each thing a component declares it owns, with that component. ${NOTE}`,
    '',
    '| Entity | Owner | Owner doc |',
    '| --- | --- | --- |',
  ];
  for (const component of componentsOfArea(model, area)) {
    for (const entity of component.owns ?? []) {
      lines.push(`| ${cell(entity)} | ${code(component.id)} | ${component.spec ? code(component.spec) : '—'} |`);
    }
  }
  return lines.join('\n');
}

/**
 * Architecture-map §6 component registry: one row per model component/subcomponent.
 * Module/Nhà/Physics/Vai and slice tables from the old hand-written §6 are not in the
 * model, so they stay outside the markers (or are retired as intentional removals).
 */
function architectureMapComponentsBody(model) {
  const lines = [
    `Component registry rows from the model, one per component and subcomponent, sorted by id. ${NOTE}`,
    '',
    '| Component | Parent | Layer | Tier | Status | Owns | Must not own | Owner doc |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const component of sortedComponents(model)) {
    const owns = (component.owns ?? []).map(cell).join('; ');
    const mustNotOwn = (component.mustNotOwn ?? []).map(cell).join('; ');
    lines.push(`| ${code(component.id)} | ${component.parent ? code(component.parent) : '—'} | ${cell(component.layer)} | ${component.tier} | ${cell(component.status)} | ${owns} | ${mustNotOwn} | ${component.spec ? code(component.spec) : '—'} |`);
  }
  return lines.join('\n');
}

/** Boundary label for a contract row: the clause before the first ": ", else the full meaning. */
function contractBoundary(contract) {
  const meaning = String(contract.meaning ?? '').trim();
  const idx = meaning.indexOf(': ');
  return idx === -1 ? meaning : meaning.slice(0, idx);
}

/** Contract cell: text after the first ": " so the boundary is shown only once. */
function contractMeaningCell(contract) {
  const meaning = String(contract.meaning ?? '').trim();
  const idx = meaning.indexOf(': ');
  return idx === -1 ? meaning : meaning.slice(idx + 2).trim();
}

/** Path cell: print the model path as-is (backticked); empty path stays em dash. Missing live paths are owned by contracts.test, not hidden here. */
function contractPathCell(contract) {
  const rel = contract.path;
  if (typeof rel !== 'string' || !rel.trim()) return '—';
  return code(rel);
}

/**
 * Architecture-map §7 contract registry: one row per model contract.
 * Columns: id, boundary (clause before first ": " in meaning), Contract (text
 * after that ": "), provider, consumers, status, path. Path is the model value
 * as-is; contracts.test fails missing live/designed paths.
 */
function architectureMapContractsBody(model, repoRoot) {
  const lines = [
    `Contract registry rows from the model, one per contract, sorted by id. ${NOTE}`,
    '',
    '| ID | Boundary | Contract | Provider | Consumers | Status | Path |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  const contracts = [...(model.contracts ?? [])].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const contract of contracts) {
    const consumers = (contract.consumers ?? []).map(cell).filter(Boolean);
    lines.push(`| ${code(contract.id)} | ${cell(contractBoundary(contract))} | ${cell(contractMeaningCell(contract))} | ${contract.provider ? code(contract.provider) : '—'} | ${consumers.length ? consumers.map(code).join(', ') : '—'} | ${cell(contract.status)} | ${contractPathCell(contract)} |`);
  }
  return lines.join('\n');
}

/**
 * Every view this renderer owns. `required: true` means the block must already be in the
 * file, so a view cannot silently stop being generated. A missing block on a view that is
 * not required is simply not rendered yet.
 */
export function viewDefinitions(model, repoRoot = REPO_ROOT) {
  return [
    { view: 'component-boundary', file: 'docs/platform/component-boundary.md', required: true, body: () => componentTableBody(model) },
    { view: 'readme-owner-table', file: 'docs/platform/README.md', required: true, body: () => ownerTableBody(model) },
    { view: 'governance-holder-table', file: 'docs/platform/governance.md', required: true, body: () => governanceHolderBody(model, repoRoot) },
    { view: 'system-overview-area-map', file: 'docs/platform/system-overview/spec.md', required: true, body: () => areaMapBody(model) },
    { view: 'system-overview-shared-entities', file: 'docs/platform/system-overview/spec.md', required: true, body: () => sharedEntitiesBody(model, null) },
    { view: 'observe-shared-entities', file: 'docs/platform/observe/spec.md', required: true, body: () => sharedEntitiesBody(model, 'observe') },
    { view: 'workflow-shared-entities', file: 'docs/platform/workflow/spec.md', required: true, body: () => sharedEntitiesBody(model, 'workflow') },
    { view: 'architecture-map-components', file: 'docs/platform/architecture-map.md', required: true, body: () => architectureMapComponentsBody(model) },
    { view: 'architecture-map-contracts', file: 'docs/platform/architecture-map.md', required: true, body: () => architectureMapContractsBody(model, repoRoot) },
  ];
}

/** One view's rendered block, markers included. */
export function renderBlock(view, body) {
  return [startMarker(view), body, endMarker(view)].join('\n');
}

const spanOf = (text, view) => {
  const start = startMarker(view);
  const from = text.indexOf(start);
  if (from === -1) return null;
  const to = text.indexOf(endMarker(view), from);
  return to === -1 ? null : { from, to: to + endMarker(view).length };
};

/**
 * Every view computed against the model, without writing: `{ view, file, required, block,
 * present, previous, next, changed }`. `present: false` means the file has no block for the
 * view. File content is computed once per file: every view that shares a file carries the
 * same fully-applied `previous`/`next` pair.
 */
export function computeViews(repoRoot) {
  const model = loadModel(repoRoot);
  const defs = viewDefinitions(model, repoRoot);

  // Read each file once.
  const fileState = new Map();
  for (const def of defs) {
    if (fileState.has(def.file)) continue;
    const filePath = path.join(repoRoot, def.file);
    fileState.set(def.file, {
      filePath,
      previous: fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '',
    });
  }

  // Render every block once, then apply all present blocks onto each file once.
  const prepared = defs.map((def) => {
    const state = fileState.get(def.file);
    const block = renderBlock(def.view, def.body());
    const span = spanOf(state.previous, def.view);
    return {
      view: def.view,
      file: def.file,
      filePath: state.filePath,
      required: def.required,
      block,
      present: Boolean(span),
      previous: state.previous,
    };
  });

  const nextByFile = new Map();
  for (const [file, state] of fileState) {
    let next = state.previous;
    for (const entry of prepared) {
      if (entry.file !== file || !entry.present) continue;
      const span = spanOf(next, entry.view);
      if (!span) continue;
      next = `${next.slice(0, span.from)}${entry.block}${next.slice(span.to)}`;
    }
    nextByFile.set(file, next);
  }

  return prepared.map((entry) => {
    const next = nextByFile.get(entry.file) ?? entry.previous;
    const span = entry.present ? spanOf(entry.previous, entry.view) : null;
    const singleNext = span
      ? `${entry.previous.slice(0, span.from)}${entry.block}${entry.previous.slice(span.to)}`
      : entry.previous;
    return {
      ...entry,
      next,
      // Per-view drift: this view's own block vs disk (not the multi-view file rollup).
      changed: entry.present && singleNext !== entry.previous,
      fileChanged: next !== entry.previous,
    };
  });
}

/** Views whose block differs from the tree: `{ view, file, reason }`. */
export function checkViews(repoRoot) {
  const drift = [];
  for (const view of computeViews(repoRoot)) {
    if (!view.present) {
      if (view.required) drift.push({ view: view.view, file: view.file, reason: `no ${startMarker(view.view)} block` });
      continue;
    }
    if (view.changed) drift.push({ view: view.view, file: view.file, reason: 'block differs from the model' });
  }
  return drift;
}

/**
 * Write mode: rewrite every present block in place. Reuses the file content
 * `computeViews` already built — no second span/body pass.
 */
export function writeViews(repoRoot) {
  const written = [];
  const skipped = [];
  const views = computeViews(repoRoot);
  const seenFiles = new Set();
  for (const view of views) {
    if (!view.present) {
      skipped.push({ view: view.view, file: view.file });
      continue;
    }
    if (seenFiles.has(view.filePath)) continue;
    seenFiles.add(view.filePath);
    if (!view.fileChanged) continue;
    fs.writeFileSync(view.filePath, view.next, 'utf8');
    for (const entry of views) {
      if (entry.filePath === view.filePath && entry.present && entry.changed) {
        written.push({ view: entry.view, file: entry.file });
      }
    }
  }
  return { written, skipped };
}

/** Parse a markdown table (header + rows) into an array of cell arrays. */
function parseTable(markdown) {
  const rows = [];
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((part) => part.trim());
    if (cells.length === 0) continue;
    if (cells.every((part) => /^-+$/.test(part.replace(/\s/g, '')))) continue;
    rows.push(cells);
  }
  return rows;
}

/** Build the holder-view preview report (generated table + row-by-row diff vs governance.md). */
export function buildHolderViewPreview(repoRoot) {
  const model = loadModel(repoRoot);
  const generatedBody = governanceHolderBody(model, repoRoot);
  const governancePath = path.join(repoRoot, 'docs', 'platform', 'governance.md');
  const governance = fs.readFileSync(governancePath, 'utf8');
  const section = governance.split(/^## Decision scope to holder table$/m)[1]?.split(/^## /m)[0] ?? '';
  const currentRows = parseTable(section).slice(1); // drop header
  const generatedRows = parseTable(generatedBody).slice(1);
  const currentByScope = new Map(currentRows.map((row) => [row[0], row]));
  const generatedByScope = new Map(generatedRows.map((row) => [row[0], row]));
  const allScopes = [...new Set([...currentByScope.keys(), ...generatedByScope.keys()])].sort();
  const diffLines = [
    '| Scope | Status | Current narrative home | Generated narrative home | Notes |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const scope of allScopes) {
    const cur = currentByScope.get(scope);
    const gen = generatedByScope.get(scope);
    if (!cur) {
      diffLines.push(`| ${cell(scope)} | added | — | ${cell(gen?.[3] ?? '')} | present only in the generated view |`);
      continue;
    }
    if (!gen) {
      diffLines.push(`| ${cell(scope)} | missing | ${cell(cur[3] ?? '')} | — | present only in the hand-written table |`);
      continue;
    }
    const notes = [];
    for (let i = 0; i < 4; i += 1) {
      if ((cur[i] ?? '') !== (gen[i] ?? '')) notes.push(`col${i + 1} differs`);
    }
    diffLines.push(`| ${cell(scope)} | ${notes.length ? 'changed' : 'same'} | ${cell(cur[3] ?? '')} | ${cell(gen[3] ?? '')} | ${notes.join('; ') || '—'} |`);
  }
  return [
    '# Holder view preview (component-authority)',
    '',
    'DOCOS keeps the holder table shape (scope → holder file or directory) and wants this',
    'generated view before the hand-written table in `docs/platform/governance.md` is replaced',
    '(see `plans/261121-2109-component-authority/reports/docos-boundary-answer.md`).',
    '',
    'The render script owns the `governance-holder-table` view with `required: true`, so',
    '`node scripts/component-authority-render.mjs --check` demands its markers once they are',
    'inserted and the block must match the model.',
    '',
    '## Generated table',
    '',
    generatedBody,
    '',
    '## Row-by-row diff against the hand-written table',
    '',
    ...diffLines,
    '',
  ].join('\n');
}

function previewHolderPath(argv, repoRoot) {
  const idx = argv.indexOf('--preview-holder');
  if (idx === -1) return null;
  const value = argv[idx + 1];
  if (!value || value.startsWith('-')) {
    throw new Error('component-authority-render: --preview-holder requires an output path');
  }
  return path.isAbsolute(value) ? value : path.join(repoRoot, value);
}

export function main(argv = process.argv.slice(2), { repoRoot = REPO_ROOT } = {}) {
  if (argv.includes('--preview-holder')) {
    let out;
    try {
      out = previewHolderPath(argv, repoRoot);
    } catch (err) {
      console.error(err.message);
      return 1;
    }
    const content = buildHolderViewPreview(repoRoot);
    if (argv.includes('--stdout')) {
      process.stdout.write(content);
      return 0;
    }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, content, 'utf8');
    console.log(`component-authority-render: wrote ${path.relative(repoRoot, out)}`);
    return 0;
  }
  if (argv.includes('--check')) {
    const drift = checkViews(repoRoot);
    for (const entry of drift) console.error(`component-authority-render: view "${entry.view}" in ${entry.file}: ${entry.reason}`);
    if (drift.length) {
      console.error('component-authority-render: regenerate with `node scripts/component-authority-render.mjs`.');
      return 1;
    }
    return 0;
  }
  const { written, skipped } = writeViews(repoRoot);
  for (const entry of written) console.log(`component-authority-render: wrote view "${entry.view}" in ${entry.file}`);
  for (const entry of skipped) console.log(`component-authority-render: view "${entry.view}" has no block in ${entry.file} (not rendered yet)`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
