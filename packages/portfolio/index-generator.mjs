// index-generator.mjs -- Compiles plans/backlog.md markdown table index (D-ADR0082)
import { ITEM_PRIORITIES } from './vocabulary.mjs';

function escapeCell(val) {
  if (val === undefined || val === null) return '';
  return String(val).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

/**
 * Compiles the markdown table index for `plans/backlog.md`.
 *
 * @param {object} params
 * @param {Array<{ id: string, title: string, status: string, priority: string, area: string, created: string, filename: string }>} params.items
 * @param {Array<{ id: string, title?: string, status: string, source: string[], dir: string }>} [params.discussions]
 * @param {Array<{ dir: string, title?: string, status: string, source?: string[] }>} [params.plans]
 * @returns {string} The markdown text for plans/backlog.md
 */
export function generateBacklogIndex({ items = [], discussions = [], plans = [] }) {
  // Sort items: priority (P0..P3), then created date, then id
  const sortedItems = [...items].sort((a, b) => {
    const prioA = ITEM_PRIORITIES.indexOf(a.priority);
    const prioB = ITEM_PRIORITIES.indexOf(b.priority);
    const rankA = prioA === -1 ? 99 : prioA;
    const rankB = prioB === -1 ? 99 : prioB;
    if (rankA !== rankB) return rankA - rankB;

    const dateA = a.created || '';
    const dateB = b.created || '';
    if (dateA !== dateB) return dateA.localeCompare(dateB);

    return (a.id || '').localeCompare(b.id || '');
  });

  const lines = [
    '# Product Backlog',
    '',
    '| ID | Title | Status | Priority | Area | Citing |',
    '|---|---|---|---|---|---|',
  ];

  for (const item of sortedItems) {
    const citingDiscussions = discussions
      .filter((d) => Array.isArray(d.source) && d.source.includes(item.id))
      .sort((a, b) => (a.id || '').localeCompare(b.id || ''))
      .map((d) => `[${d.id}](discussions/${d.dir}/DISCUSSION.md) (${d.status})`);

    const citingPlans = plans
      .filter((p) => Array.isArray(p.source) && p.source.includes(item.id))
      .sort((a, b) => (a.dir || '').localeCompare(b.dir || ''))
      .map((p) => `[${p.dir}](${p.dir}/plan.md) (${p.status})`);

    const allCiting = [...citingDiscussions, ...citingPlans];
    const citingCol = allCiting.length > 0 ? allCiting.join(', ') : '-';

    const idLink = item.filename
      ? `[${item.id}](backlog/${item.filename})`
      : item.id;

    lines.push(
      `| ${idLink} | ${escapeCell(item.title)} | ${item.status} | ${item.priority} | ${escapeCell(item.area)} | ${citingCol} |`
    );
  }

  lines.push('');
  return lines.join('\n');
}
