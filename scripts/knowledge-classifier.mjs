// scripts/knowledge-classifier.mjs
// Read-only classifier and inventory generator for existing end-user documentation.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../src/report/frontmatter.mjs';

const DIATAXIS_NAMES = new Set(['tutorial', 'tutorials', 'how-to', 'reference', 'explanation']);

export function slugify(str) {
  if (!str) return 'uncategorized';
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'uncategorized';
}

/**
 * Sanitize role so it does NOT match any Diataxis quadrant/mode name (Rule Q4).
 */
export function sanitizeRole(rawRole) {
  const slugged = slugify(rawRole);
  if (DIATAXIS_NAMES.has(slugged)) {
    if (slugged === 'reference') return 'lookup-table';
    if (slugged === 'how-to') return 'recipe';
    if (slugged === 'explanation') return 'concept';
    if (slugged === 'tutorial' || slugged === 'tutorials') return 'walkthrough';
    return 'guide';
  }
  return slugged || 'guide';
}

function extractFirstH1(body) {
  if (!body) return null;
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Classify a single doc file given its relative path and text content.
 */
export function classifyDocFile(relativePath, content) {
  const { meta, body } = parseFrontmatter(content);
  const firstH1 = extractFirstH1(body);

  let purposeTitle = null;
  let purposeSlug = null;
  let confidence = 'medium';
  let evidence = '';

  if (meta.authoritative_for) {
    purposeTitle = String(meta.authoritative_for);
    purposeSlug = slugify(purposeTitle);
    confidence = 'high';
    evidence = `frontmatter authoritative_for: ${meta.authoritative_for}`;
  } else if (firstH1) {
    purposeTitle = firstH1;
    purposeSlug = slugify(firstH1);
    confidence = 'medium';
    evidence = `first H1: ${firstH1}`;
  } else {
    const baseName = path.basename(relativePath, '.md');
    purposeTitle = baseName;
    purposeSlug = slugify(baseName);
    confidence = 'low';
    evidence = `file basename: ${baseName}`;
  }

  const topicId = purposeSlug;

  // Determine mode from quadrant path
  let mode = 'explanation';
  if (relativePath.includes('how-to')) mode = 'how-to';
  else if (relativePath.includes('tutorial')) mode = 'tutorial';
  else if (relativePath.includes('reference')) mode = 'reference';

  // Determine candidate role
  let rawRole = 'guide';
  if (meta.role) {
    rawRole = String(meta.role);
  } else if (relativePath.includes('decisions')) {
    rawRole = 'decision-record';
  } else {
    const baseName = path.basename(relativePath, '.md');
    rawRole = baseName;
  }

  const role = sanitizeRole(rawRole);
  const targetPath = `docs/${purposeSlug}/${role}.md`;

  const entities = Array.isArray(meta.entities)
    ? meta.entities
    : Array.isArray(meta.tags)
    ? meta.tags
    : [];

  return {
    oldPath: relativePath,
    topicId,
    purposeSlug,
    purposeTitle,
    role,
    entities,
    framework: 'diataxis',
    mode,
    targetPath,
    confidence,
    evidence,
  };
}

/**
 * Scan all markdown doc files under repoRoot/docs and classify them.
 */
export function classifyCorpus(docsDir) {
  const results = [];
  if (!fs.existsSync(docsDir)) return results;

  const targetDirs = ['how-to', 'explanation', 'reference', 'tutorials', 'tutorial', 'decisions'];

  for (const dirName of targetDirs) {
    const fullDir = path.join(docsDir, dirName);
    if (!fs.existsSync(fullDir)) continue;

    const files = fs.readdirSync(fullDir, { recursive: true });
    for (const f of files) {
      if (typeof f === 'string' && f.endsWith('.md')) {
        const fullPath = path.join(fullDir, f);
        const relPath = path.relative(path.dirname(docsDir), fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        results.push(classifyDocFile(relPath, content));
      }
    }
  }

  return results;
}

/**
 * Generate human markdown report and JSON inventory data.
 */
export function generateReports(corpusResults, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });

  const dataPath = path.join(outputDir, 'inventory-data.json');
  const reportPath = path.join(outputDir, 'inventory-report.md');

  fs.writeFileSync(dataPath, JSON.stringify(corpusResults, null, 2), 'utf8');

  const roleCounts = {};
  const purposeCounts = {};
  const targetPathCounts = {};

  for (const item of corpusResults) {
    roleCounts[item.role] = (roleCounts[item.role] || 0) + 1;
    purposeCounts[item.purposeSlug] = (purposeCounts[item.purposeSlug] || 0) + 1;
    targetPathCounts[item.targetPath] = (targetPathCounts[item.targetPath] || 0) + 1;
  }

  const duplicates = Object.entries(targetPathCounts).filter(([, count]) => count > 1);

  let md = `# Knowledge Inventory & Classification Report\n\n`;
  md += `Total files analyzed: ${corpusResults.length}\n\n`;
  md += `## Role Distribution\n\n`;
  for (const [r, count] of Object.entries(roleCounts)) {
    md += `- **${r}**: ${count}\n`;
  }
  md += `\n## Purpose Distribution\n\n`;
  for (const [p, count] of Object.entries(purposeCounts)) {
    md += `- **${p}**: ${count}\n`;
  }
  if (duplicates.length > 0) {
    md += `\n## Candidate Duplicate Targets (same topic + role)\n\n`;
    for (const [tp, count] of duplicates) {
      md += `- **${tp}**: ${count} source files\n`;
    }
  }

  fs.writeFileSync(reportPath, md, 'utf8');
  return { dataPath, reportPath };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const docsDir = path.join(repoRoot, 'docs');
  const outputDir = path.join(repoRoot, 'docs/history/compound-learn-artifact-registry/reports');

  const results = classifyCorpus(docsDir);
  const { dataPath, reportPath } = generateReports(results, outputDir);
  console.log(`Classified ${results.length} files.`);
  console.log(`Data saved to ${dataPath}`);
  console.log(`Report saved to ${reportPath}`);
}
