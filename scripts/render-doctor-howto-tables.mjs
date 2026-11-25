#!/usr/bin/env node
// Renders the doctor-check catalog of docs/how-to/install-fgos-in-a-project-and-use-doctor.md (section 4.7)
// from the registry contract, so the how-to lists every row the doctor runs and the fix that repairs it.
//   node scripts/render-doctor-howto-tables.mjs           rewrite the generated block in place
//   node scripts/render-doctor-howto-tables.mjs --check   exit 1 when the block differs from the registry
// The config group is expanded the way the host expands it (registry `groups.config` + the config crate's rows).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const HOWTO_PATH = path.join(ROOT, 'docs/how-to/install-fgos-in-a-project-and-use-doctor.md');
export const BEGIN = '<!-- doctor-catalog:begin -->';
export const END = '<!-- doctor-catalog:end -->';

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

/** Every row in run order with its description and the id of the fix that repairs it (or null). */
export function catalogRows() {
  const registry = readJson('packages/distribution/contracts/doctor-registry.v1.json');
  const group = registry.groups.config;
  const config = readJson(group.contract);
  const configFix = (id) => group.fixIdMap[id] ?? `${group.fixIdPrefix}${id}`;

  const repairedBy = new Map();
  const note = (rowId, fixId) => { if (!repairedBy.has(rowId)) repairedBy.set(rowId, fixId); };
  for (const fix of registry.fixes) {
    if (fix.group === 'config') continue;
    note(fix.id, fix.id);
    for (const rowId of fix.repairs ?? []) note(rowId, fix.id);
  }
  const rows = [];
  for (const entry of registry.rows) {
    if (entry.group === 'config') {
      for (const row of config.rows) {
        const id = group.idMap[row.id] ?? row.id;
        rows.push({
          id,
          description: group.descriptionOverrides?.[row.id] ?? row.description,
          fix: row.fix ? configFix(row.fix) : null,
        });
      }
    } else {
      rows.push({ id: entry.id, description: entry.description, fix: null });
    }
  }
  return rows.map((row) => ({ ...row, fix: row.fix ?? repairedBy.get(row.id) ?? null }));
}

const cell = (text) => String(text).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();

export function renderCatalog() {
  const lines = [
    `${catalogRows().length} rows, in the order the doctor runs them.`,
    '',
    '| Id | Checks | Fix |',
    '|---|---|---|',
  ];
  for (const row of catalogRows()) {
    const fix = row.fix ? `\`fgos doctor --fix --only ${row.fix}\`` : 'none registered';
    lines.push(`| \`${row.id}\` | ${cell(row.description)} | ${fix} |`);
  }
  return `${BEGIN}\n${lines.join('\n')}\n${END}`;
}

/** The how-to text with its generated block replaced; throws when the markers are missing. */
export function withCatalog(text) {
  const start = text.indexOf(BEGIN);
  const end = text.indexOf(END);
  if (start === -1 || end === -1 || end < start) throw new Error(`the how-to lacks the ${BEGIN} ... ${END} markers`);
  return text.slice(0, start) + renderCatalog() + text.slice(end + END.length);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const current = fs.readFileSync(HOWTO_PATH, 'utf8');
  const next = withCatalog(current);
  if (process.argv.includes('--check')) {
    if (next !== current) {
      console.error('docs/how-to doctor catalog differs from the registry: run node scripts/render-doctor-howto-tables.mjs');
      process.exit(1);
    }
  } else if (next !== current) {
    fs.writeFileSync(HOWTO_PATH, next);
  }
}
