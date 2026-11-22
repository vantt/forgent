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
// The governance holder table is `required: false` until DOCOS accepts the preview at
// plans/261121-2109-component-authority/reports/holder-view-preview.md; `--check` does
// not demand its markers, and write mode only rewrites it when the markers already exist.

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

/** The model as the phases before this one leave it: component rows, decision kinds, every door file. */
export function loadModel(repoRoot) {
  const dir = path.join(repoRoot, MODEL_DIR);
  const doorsDir = path.join(dir, 'doors');
  const doorFiles = fs.existsSync(doorsDir)
    ? fs.readdirSync(doorsDir).filter((name) => name.endsWith('.json')).sort()
    : [];
  return {
    components: readJson(path.join(dir, 'components.json')),
    decisionKinds: readJson(path.join(dir, 'decision-kinds.json')),
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
 * scope-to-holder shape the hand-written table carries, so every legacy scope alias
 * survives and `fgos decision-index` keeps resolving narratives from them. Held back from
 * governance.md until DOCOS answers (phase 5 step 2); rendered into the preview report so
 * that answer can be given against the real table. `required: false` keeps `--check` green
 * while the markers are absent.
 */
function governanceHolderBody(model, repoRoot) {
  const byId = new Map(model.components.map((component) => [component.id, component]));
  const lines = [
    `Decision scopes, one row per decision kind, scope aliases retained. ${NOTE}`,
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
    if (kind.id !== target && !asciiAliases.includes(kind.id) && !scopeParts.some((part) => part.startsWith(`${kind.id} →`))) {
      // id already covered when no ascii alias forced the id→target form above.
    }
    const area = owner ? areaOf(owner) : narrativeArea;
    const portalCandidates = [];
    if (area) portalCandidates.push(`docs/platform/${area}/README.md`);
    if (owner?.spec) portalCandidates.push(owner.spec);
    if (kind.narrative) portalCandidates.push(kind.narrative);
    const portal = portalCandidates.find((rel) => fs.existsSync(path.join(repoRoot, rel))) || owner?.spec || kind.narrative || '—';
    const childSpecs = model.components
      .filter((component) => component.parent === kind.owner && component.spec)
      .map((component) => component.spec);
    const facts = [owner?.spec, ...childSpecs].filter(Boolean);
    const uniqueFacts = [...new Set(facts)];
    lines.push(`| ${cell(scopeParts.join('<br>'))} | ${portal === '—' ? '—' : code(portal)} | ${uniqueFacts.map(code).join('; ') || '—'} | ${code(kind.narrative)} |`);
  }
  return lines.join('\n');
}

function areaMapBody(model) {
  const lines = [
    `Area rows from the model: the component that owns each area, whose owner doc reads first. ${NOTE}`,
    '',
    '| Area | Owner component | What it owns | Owner doc |',
    '| --- | --- | --- | --- |',
  ];
  for (const component of sortedComponents(model)) {
    if (component.parent) continue;
    const area = areaOf(component);
    if (!area) continue;
    lines.push(`| ${code(area)} | ${code(component.id)} | ${cell(component.meaning)} | ${code(component.spec)} |`);
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
 * Every view this renderer owns. `required: true` means the block must already be in the
 * file, so a view cannot silently stop being generated. A missing block on a view that is
 * not required is simply not rendered yet: that is how the governance holder table waits
 * for DOCOS to answer before it replaces the hand-written table.
 */
export function viewDefinitions(model, repoRoot = REPO_ROOT) {
  return [
    { view: 'component-boundary', file: 'docs/platform/component-boundary.md', required: true, body: () => componentTableBody(model) },
    { view: 'readme-owner-table', file: 'docs/platform/README.md', required: true, body: () => ownerTableBody(model) },
    { view: 'governance-holder-table', file: 'docs/platform/governance.md', required: false, body: () => governanceHolderBody(model, repoRoot) },
    { view: 'system-overview-area-map', file: 'docs/platform/system-overview/spec.md', required: true, body: () => areaMapBody(model) },
    { view: 'system-overview-shared-entities', file: 'docs/platform/system-overview/spec.md', required: true, body: () => sharedEntitiesBody(model, null) },
    { view: 'observe-shared-entities', file: 'docs/platform/observe/spec.md', required: true, body: () => sharedEntitiesBody(model, 'observe') },
    { view: 'workflow-shared-entities', file: 'docs/platform/workflow/spec.md', required: true, body: () => sharedEntitiesBody(model, 'workflow') },
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
 * view, and `next` is then the file unchanged.
 */
export function computeViews(repoRoot) {
  const model = loadModel(repoRoot);
  const results = [];
  for (const def of viewDefinitions(model, repoRoot)) {
    const filePath = path.join(repoRoot, def.file);
    const previous = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    const block = renderBlock(def.view, def.body());
    const span = spanOf(previous, def.view);
    const next = span ? `${previous.slice(0, span.from)}${block}${previous.slice(span.to)}` : previous;
    results.push({
      view: def.view,
      file: def.file,
      filePath,
      required: def.required,
      block,
      present: Boolean(span),
      previous,
      next,
      changed: Boolean(span) && next !== previous,
    });
  }
  return results;
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

/** Write mode: rewrite every present block in place. Returns `{ written, skipped }`. */
export function writeViews(repoRoot) {
  const written = [];
  const skipped = [];
  // Group by file so two views in one file both apply.
  const byFile = new Map();
  for (const view of computeViews(repoRoot)) {
    if (!byFile.has(view.filePath)) byFile.set(view.filePath, []);
    byFile.get(view.filePath).push(view);
  }
  for (const [filePath, views] of byFile) {
    let content = views[0].previous;
    let fileWritten = false;
    for (const view of views) {
      if (!view.present) {
        skipped.push({ view: view.view, file: view.file });
        continue;
      }
      const span = spanOf(content, view.view);
      if (!span) {
        skipped.push({ view: view.view, file: view.file });
        continue;
      }
      const block = view.block;
      const next = `${content.slice(0, span.from)}${block}${content.slice(span.to)}`;
      if (next !== content) {
        content = next;
        fileWritten = true;
        written.push({ view: view.view, file: view.file });
      }
    }
    if (fileWritten) fs.writeFileSync(filePath, content, 'utf8');
  }
  return { written, skipped };
}

/** Parse a markdown table (header + rows) into an array of cell arrays. */
function parseTable(markdown) {
  const rows = [];
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length === 0) continue;
    if (cells.every((cell) => /^-+$/.test(cell.replace(/\s/g, '')))) continue;
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
    '# Holder view preview (component-authority phase 5)',
    '',
    'DOCOS keeps the holder table shape (scope → holder file or directory) and wants this',
    'generated view before the hand-written table in `docs/platform/governance.md` is replaced',
    '(see `plans/261121-2109-component-authority/reports/docos-boundary-answer.md`).',
    '',
    'The render script owns the `governance-holder-table` view with `required: false`, so',
    '`node scripts/component-authority-render.mjs --check` does **not** demand its markers',
    'until DOCOS accepts this preview and the markers are inserted.',
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

export function main(argv = process.argv.slice(2), { repoRoot = REPO_ROOT } = {}) {
  if (argv.includes('--preview-holder')) {
    const out = argv.includes('--stdout')
      ? null
      : path.join(repoRoot, 'plans', '261121-2109-component-authority', 'reports', 'holder-view-preview.md');
    const content = buildHolderViewPreview(repoRoot);
    if (out) {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, content, 'utf8');
      console.log(`component-authority-render: wrote ${path.relative(repoRoot, out)}`);
    } else {
      process.stdout.write(content);
    }
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
