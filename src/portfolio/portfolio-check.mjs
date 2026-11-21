// portfolio-check.mjs -- Portfolio contract check (D-ADR0082)
import fs from 'node:fs';
import path from 'node:path';
import { readFrontmatter } from '../util/yaml.mjs';
import { parseBacklogItem } from './item.mjs';
import { parseDiscussion } from './discussion.mjs';
import { generateBacklogIndex } from './index-generator.mjs';
import { PLAN_STATUSES } from './vocabulary.mjs';

/**
 * Validates the portfolio contract for a repository.
 *
 * @param {object} options
 * @param {string} options.repoRoot - Absolute or relative path to the repo root
 * @param {((relPath: string) => boolean)} [options.isNewFile] - Predicate to identify newly added files
 * @param {boolean} [options.strict=false] - If true, treats all discussions and plans as new (failing if uncited)
 * @param {boolean} [options.checkIndex=true] - Whether to verify plans/backlog.md matching generated index
 * @returns {{ ok: boolean, errors: string[], warnings: string[], items: any[], discussions: any[], plans: any[] }}
 */
export function checkPortfolio({
  repoRoot,
  isNewFile = () => false,
  strict = false,
  checkIndex = true,
}) {
  const errors = [];
  const warnings = [];

  const backlogDir = path.join(repoRoot, 'plans', 'backlog');
  const discussionsDir = path.join(repoRoot, 'plans', 'discussions');
  const plansRoot = path.join(repoRoot, 'plans');

  const items = [];
  const discussions = [];
  const plans = [];

  // 1. Read and validate backlog items
  if (fs.existsSync(backlogDir)) {
    const entries = fs.readdirSync(backlogDir);
    for (const entry of entries) {
      if (!entry.endsWith('.md')) continue;
      const fullPath = path.join(backlogDir, entry);
      const relPath = path.join('plans', 'backlog', entry);
      try {
        const text = fs.readFileSync(fullPath, 'utf8');
        const parsed = parseBacklogItem(text, relPath);
        items.push({
          ...parsed,
          filename: entry,
          relPath,
        });
      } catch (err) {
        errors.push(`${relPath}: ${err.message}`);
      }
    }
  }

  // 2. Read and validate discussions
  if (fs.existsSync(discussionsDir)) {
    const entries = fs.readdirSync(discussionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const discFile = path.join(discussionsDir, entry.name, 'DISCUSSION.md');
      const relPath = path.join('plans', 'discussions', entry.name, 'DISCUSSION.md');
      if (!fs.existsSync(discFile)) continue;
      try {
        const text = fs.readFileSync(discFile, 'utf8');
        const parsed = parseDiscussion(text, relPath);
        discussions.push({
          ...parsed,
          dir: entry.name,
          relPath,
        });
      } catch (err) {
        errors.push(`${relPath}: ${err.message}`);
      }
    }
  }

  // 3. Read and validate plans
  if (fs.existsSync(plansRoot)) {
    const entries = fs.readdirSync(plansRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'backlog' || entry.name === 'discussions') continue;
      const planFile = path.join(plansRoot, entry.name, 'plan.md');
      const relPath = path.join('plans', entry.name, 'plan.md');
      if (!fs.existsSync(planFile)) continue;

      try {
        const text = fs.readFileSync(planFile, 'utf8');
        const { meta } = readFrontmatter(text, relPath);

        // Check plan status
        const status = meta.status;
        if (status && !PLAN_STATUSES.includes(status)) {
          errors.push(
            `${relPath}: unknown plan status '${status}'; allowed: ${PLAN_STATUSES.join(', ')}`
          );
        }

        // Extract sources
        let sourceList = [];
        if (Array.isArray(meta.source)) {
          sourceList = meta.source.map(String);
        } else if (typeof meta.source === 'string' && meta.source.trim()) {
          sourceList = [meta.source.trim()];
        }

        plans.push({
          dir: entry.name,
          title: meta.title ? String(meta.title) : entry.name,
          status: String(status || 'draft'),
          source: sourceList,
          meta,
          relPath,
        });
      } catch (err) {
        errors.push(`${relPath}: ${err.message}`);
      }
    }
  }

  const itemMap = new Map(items.map((it) => [it.id, it]));
  const discussionMap = new Map(discussions.map((d) => [d.id, d]));

  // 4. Citation integrity checks: every referenced p- and ds- id must exist
  for (const disc of discussions) {
    for (const src of disc.source) {
      if (src.startsWith('p-')) {
        if (!itemMap.has(src)) {
          errors.push(
            `unknown-source: discussion ${disc.id} (${disc.relPath}) cites non-existent backlog item '${src}'`
          );
        }
      } else {
        errors.push(
          `invalid-discussion-source: discussion ${disc.id} source '${src}' must be a backlog item id (p-...)`
        );
      }
    }
  }

  for (const plan of plans) {
    for (const src of plan.source) {
      if (src.startsWith('p-')) {
        if (!itemMap.has(src)) {
          errors.push(
            `unknown-source: plan ${plan.dir} (${plan.relPath}) cites non-existent backlog item '${src}'`
          );
        }
      } else if (src.startsWith('ds-')) {
        if (!discussionMap.has(src)) {
          errors.push(
            `unknown-source: plan ${plan.dir} (${plan.relPath}) cites non-existent discussion '${src}'`
          );
        }
      }
    }
  }

  // 5. In-flight backlog item must have at least one citing discussion or plan
  for (const item of items) {
    if (item.status === 'in-flight') {
      const citingDisc = discussions.filter((d) => d.source.includes(item.id));
      const citingPlan = plans.filter((p) => p.source.includes(item.id));
      if (citingDisc.length === 0 && citingPlan.length === 0) {
        errors.push(
          `in-flight-uncited: backlog item '${item.id}' is 'in-flight' but has no citing discussion or plan`
        );
      }
    }
  }

  // 6. New discussion or plan must cite at least one backlog item
  for (const disc of discussions) {
    const hasBacklog = disc.source.some((s) => s.startsWith('p-'));
    if (!hasBacklog) {
      const isNew = strict || isNewFile(disc.relPath);
      const msg = `missing-backlog-source: discussion '${disc.id}' (${disc.relPath}) does not cite any backlog item`;
      if (isNew) {
        errors.push(msg);
      } else {
        warnings.push(msg);
      }
    }
  }

  for (const plan of plans) {
    const hasBacklog = plan.source.some((s) => s.startsWith('p-'));
    if (!hasBacklog) {
      const isNew = strict || isNewFile(plan.relPath);
      const msg = `missing-backlog-source: plan '${plan.dir}' (${plan.relPath}) does not cite any backlog item`;
      if (isNew) {
        errors.push(msg);
      } else {
        warnings.push(msg);
      }
    }
  }

  // 7. Drift checks
  for (const item of items) {
    const citingPlans = plans.filter((p) => p.source.includes(item.id));
    const citingDisc = discussions.filter((d) => d.source.includes(item.id));

    // Item done with a citing plan running
    if (item.status === 'done') {
      for (const p of citingPlans) {
        if (p.status === 'running') {
          errors.push(
            `drift-done-item-plan-running: backlog item '${item.id}' is 'done' but citing plan '${p.dir}' is 'running'`
          );
        }
      }
    }

    // Item in-flight with all citing plans completed/withdrawn and no active discussion
    if (item.status === 'in-flight') {
      if (citingPlans.length > 0 && citingPlans.every((p) => p.status === 'done' || p.status === 'withdrawn')) {
        const hasActiveDiscussion = citingDisc.some(
          (d) => d.status === 'open' || d.status === 'paused'
        );
        if (!hasActiveDiscussion) {
          errors.push(
            `drift-in-flight-plans-ended: backlog item '${item.id}' is 'in-flight' but all citing plans are ended and no open discussion cites it`
          );
        }
      }
    }
  }

  // 8. Index drift check
  if (checkIndex) {
    const indexPath = path.join(plansRoot, 'backlog.md');
    if (items.length > 0 || fs.existsSync(indexPath)) {
      const expectedIndex = generateBacklogIndex({ items, discussions, plans });
      if (!fs.existsSync(indexPath)) {
        errors.push(`index-missing: plans/backlog.md does not exist`);
      } else {
        const actualIndex = fs.readFileSync(indexPath, 'utf8');
        if (actualIndex.trim() !== expectedIndex.trim()) {
          errors.push(`index-drift: plans/backlog.md does not match freshly generated index`);
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    items,
    discussions,
    plans,
  };
}
