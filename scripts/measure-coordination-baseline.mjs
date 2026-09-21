#!/usr/bin/env node
// scripts/measure-coordination-baseline.mjs — Reproducible coordination baseline and replay measurement harness (Unit 0C).
// Contract version: coordination-baseline.v1

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { replaySession } from '../src/runner/coordination/replay.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRepoRoot = path.resolve(__dirname, '..');

export const CANONICAL_SKILL_PATHS = [
  'core/skills/fgos-plan-loop/SKILL.md',
  'core/skills/fgos-architecture-panel/SKILL.md',
  'domains/coding/skills/fgos-code-panel/SKILL.md',
];

export const CONTRACT_VERSION = 'coordination-baseline.v1';

export function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

/**
 * Checked-in allowlist normalizer for semantic replay state.
 * Explicitly excludes timestamps and ephemeral execution state.
 */
export function normalizeSemanticSession(manifest, events = []) {
  const assignments = [];
  const authorizations = [];
  const dispositions = [];
  const contributions = [];
  const humanTurns = [];
  const retries = [];
  const actors = [];
  let finalStatus = manifest.status ?? 'unknown';
  let finalPhase = manifest.phase ?? null;
  const terminalTypes = new Set(['session-completed', 'session-partial', 'session-failed', 'session-cancelled']);

  for (const ev of events) {
    if (!ev || !ev.type) continue;
    const p = ev.payload || {};
    if (ev.type === 'actor-bound') {
      actors.push({
        actorId: p.actorId || '',
        role: p.role || '',
        persona: p.persona || '',
      });
    } else if (ev.type === 'assignment-created') {
      assignments.push({
        assignmentId: p.assignmentId || '',
        actorId: p.actorId || '',
        operationId: p.operationId || '',
        nodeId: p.nodeId || '',
      });
    } else if (ev.type === 'operation-authorized') {
      authorizations.push({
        authorizationId: p.authorizationId || '',
        operationId: p.operationId || '',
        nodeId: p.nodeId || '',
        targetActorId: p.targetActorId || '',
        grantedContextRefs: Array.isArray(p.grantedContextRefs) ? [...p.grantedContextRefs].sort() : [],
      });
    } else if (ev.type === 'driver-disposition-recorded') {
      dispositions.push({
        targetRef: p.targetRef || '',
        disposition: p.disposition || '',
        rationale: p.rationale || '',
        evidenceRefs: Array.isArray(p.evidenceRefs) ? [...p.evidenceRefs].sort() : [],
      });
    } else if (ev.type === 'deliberation-contribution-linked') {
      contributions.push({
        turnId: p.turnId || '',
        author: p.author || '',
        anchors: Array.isArray(p.anchors) ? [...p.anchors].sort() : [],
        respondsTo: Array.isArray(p.respondsTo) ? [...p.respondsTo].sort() : [],
      });
    } else if (ev.type === 'human-turn-recorded') {
      humanTurns.push({
        turnId: p.turnId || '',
        turnOrdinal: typeof p.turnOrdinal === 'number' ? p.turnOrdinal : 0,
        channel: p.channel || '',
        artifactRef: p.artifactRef || '',
        revision: p.revision || '',
        externalRef: p.externalRef || '',
      });
    } else if (ev.type === 'run-retried') {
      retries.push({
        assignmentId: p.assignmentId || '',
        reason: p.reason || '',
        retryId: p.retryId || '',
        previousRunId: p.previousRunId || '',
        nextRunId: p.nextRunId || '',
      });
    } else if (ev.type === 'session-phase-transitioned') {
      if (p.toPhase) finalPhase = p.toPhase;
    } else if (terminalTypes.has(ev.type)) {
      if (ev.type === 'session-completed') finalStatus = 'completed';
      else if (ev.type === 'session-partial') finalStatus = 'partial';
      else if (ev.type === 'session-failed') finalStatus = 'failed';
      else if (ev.type === 'session-cancelled') finalStatus = 'cancelled';
    }
  }

  actors.sort((a, b) => a.actorId.localeCompare(b.actorId));
  assignments.sort((a, b) => a.assignmentId.localeCompare(b.assignmentId));
  authorizations.sort((a, b) => a.authorizationId.localeCompare(b.authorizationId));
  dispositions.sort((a, b) => (a.targetRef || '').localeCompare(b.targetRef || ''));
  contributions.sort((a, b) => (a.turnId || '').localeCompare(b.turnId || ''));
  humanTurns.sort((a, b) => (a.turnId || '').localeCompare(b.turnId || ''));
  retries.sort((a, b) => a.assignmentId.localeCompare(b.assignmentId) || (a.retryId || '').localeCompare(b.retryId || '') || a.reason.localeCompare(b.reason));

  return {
    coordinationId: manifest.coordinationId,
    schemaVersion: String(manifest.schemaVersion || '1'),
    status: finalStatus,
    phase: finalPhase,
    objective: manifest.objective || '',
    definitionRef: manifest.definitionRef ? {
      id: manifest.definitionRef.id,
      version: manifest.definitionRef.version || '1.0.0',
    } : null,
    snapshotIdentity: manifest.snapshotRef?.digest || null,
    assignmentRefs: Array.isArray(manifest.assignmentRefs) ? [...manifest.assignmentRefs].sort() : [],
    actors,
    assignments,
    authorizations,
    dispositions,
    contributions,
    humanTurns,
    retries,
    quorum: manifest.quorum ? {
      requiredActorIds: Array.isArray(manifest.quorum.requiredActorIds) ? [...manifest.quorum.requiredActorIds].sort() : [],
      completed: Array.isArray(manifest.quorum.completed) ? [...manifest.quorum.completed].sort() : [],
      failed: Array.isArray(manifest.quorum.failed) ? [...manifest.quorum.failed].sort() : [],
      missing: Array.isArray(manifest.quorum.missing) ? [...manifest.quorum.missing].sort() : [],
    } : null,
  };
}

export function measureSessionFromReplay(sessionId, manifest, events = []) {
  let dispatchCount = 0;
  let retryCount = 0;
  let promptBytes = Buffer.byteLength(manifest.objective || '', 'utf8');
  let evidenceOutcome = manifest.status ?? 'unknown';
  const terminalTypes = new Set(['session-completed', 'session-partial', 'session-failed', 'session-cancelled']);

  for (const ev of events) {
    if (!ev || !ev.type) continue;
    const p = ev.payload || {};
    if (ev.type === 'assignment-created') {
      dispatchCount += 1;
      if (p.prompt) {
        promptBytes += Buffer.byteLength(String(p.prompt), 'utf8');
      }
    } else if (ev.type === 'run-retried') {
      retryCount += 1;
    } else if (terminalTypes.has(ev.type)) {
      if (ev.type === 'session-completed') evidenceOutcome = 'completed';
      else if (ev.type === 'session-partial') evidenceOutcome = 'partial';
      else if (ev.type === 'session-failed') evidenceOutcome = 'failed';
      else if (ev.type === 'session-cancelled') evidenceOutcome = 'cancelled';
    }
  }

  // The coordination session event log schema defines no formal wave-scheduling contract.
  // Reporting null maintains measurement honesty instead of guessing based on actor repeats or phase transitions.
  const sequentialWaves = null;

  return {
    id: sessionId,
    schemaVersion: String(manifest.schemaVersion || '1'),
    eventCount: events.length,
    dispatchCount,
    sequentialWaves,
    promptBytes,
    retryCount,
    evidenceOutcome,
  };
}

export function replayCorpusFromDirectory(corpusDir) {
  if (!fs.existsSync(corpusDir)) {
    return {
      corpusPresent: false,
      sessionCount: 0,
      bySchema: {},
      semanticDigest: null,
      measuredSessions: [],
      failures: [],
    };
  }

  const entries = fs.readdirSync(corpusDir, { withFileTypes: true });
  const sessionDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

  const bySchema = {};
  const normalizedSessions = [];
  const measuredSessions = [];
  const failures = [];

  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-baseline-replay-'));
  const targetSessionsDir = path.join(sandbox, '.fgos', 'coordination', 'sessions');
  const targetAssignmentsDir = path.join(sandbox, '.fgos', 'assignments');
  fs.mkdirSync(path.dirname(targetSessionsDir), { recursive: true });
  fs.mkdirSync(targetAssignmentsDir, { recursive: true });

  try {
    fs.cpSync(path.resolve(corpusDir), targetSessionsDir, { recursive: true });

    // Copy companion assignments from adjacent or repo locations if present
    const candidateAssignmentsDirs = [
      path.join(path.dirname(corpusDir), 'assignments'),
      path.join(path.dirname(path.dirname(corpusDir)), 'assignments'),
    ];
    for (const companionAssignmentsDir of candidateAssignmentsDirs) {
      if (fs.existsSync(companionAssignmentsDir)) {
        const asgnEntries = fs.readdirSync(companionAssignmentsDir, { withFileTypes: true });
        for (const asgnEntry of asgnEntries) {
          if (asgnEntry.isDirectory()) {
            const srcPath = path.join(companionAssignmentsDir, asgnEntry.name);
            const destPath = path.join(targetAssignmentsDir, asgnEntry.name);
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true });
              const asgnJson = path.join(srcPath, 'assignment.json');
              if (fs.existsSync(asgnJson)) {
                fs.copyFileSync(asgnJson, path.join(destPath, 'assignment.json'));
              }
            }
          }
        }
      }
    }

    for (const sessionId of sessionDirs) {
      const sDir = path.join(targetSessionsDir, sessionId);
      const manifestPath = path.join(sDir, 'session.json');

      if (!fs.existsSync(manifestPath)) {
        continue;
      }

      try {
        // Read manifest raw to validate schema
        const raw = fs.readFileSync(manifestPath, 'utf8');
        const parsedManifest = JSON.parse(raw);
        const rawSchemaVer = String(parsedManifest.schemaVersion || '1');
        if (!['1', '2', '3'].includes(rawSchemaVer)) {
          throw new Error(`session "${sessionId}" declares unsupported schemaVersion "${rawSchemaVer}"`);
        }

        // Run real replaySession
        const replayed = replaySession(sessionId, { repoRoot: sandbox });
        const schemaVer = String(replayed.manifest.schemaVersion || '1');
        bySchema[schemaVer] = (bySchema[schemaVer] || 0) + 1;

        const normalized = normalizeSemanticSession(replayed.manifest, replayed.events);
        normalizedSessions.push(normalized);
        measuredSessions.push(measureSessionFromReplay(sessionId, replayed.manifest, replayed.events));
      } catch (err) {
        failures.push({
          coordinationId: sessionId,
          error: err.message,
        });
      }
    }
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }

  normalizedSessions.sort((a, b) => a.coordinationId.localeCompare(b.coordinationId));
  measuredSessions.sort((a, b) => a.id.localeCompare(b.id));
  const serializedAll = normalizedSessions.map((s) => stableStringify(s)).join('\n');
  const semanticDigest = 'sha256:' + sha256(serializedAll);

  return {
    corpusPresent: true,
    sessionCount: normalizedSessions.length,
    bySchema,
    semanticDigest,
    measuredSessions,
    failures,
  };
}


export function measureSkills(repoRoot) {
  const results = [];
  for (const relPath of CANONICAL_SKILL_PATHS) {
    const fullPath = path.join(repoRoot, relPath);
    if (!fs.existsSync(fullPath)) {
      results.push({ path: relPath, bytes: 0, words: 0, lines: 0, missing: true });
      continue;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    const bytes = Buffer.byteLength(content, 'utf8');
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const lines = content.split('\n').length;
    results.push({ path: relPath, bytes, words, lines });
  }
  return results;
}

export function getDirtyFingerprint(repoRoot) {
  try {
    const status = execSync('git status --porcelain=v2 --untracked-files=all -z', { cwd: repoRoot }).toString();
    const diff = execSync('git diff -p', { cwd: repoRoot }).toString();
    return 'sha256:' + sha256(status + '\n---\n' + diff);
  } catch {
    return 'sha256:unknown';
  }
}

export function getCommit(repoRoot) {
  try {
    return execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim();
  } catch {
    return 'unknown';
  }
}

export function getLockfileDigest(repoRoot) {
  const lockPath = path.join(repoRoot, 'package-lock.json');
  if (fs.existsSync(lockPath)) {
    return 'sha256:' + sha256(fs.readFileSync(lockPath));
  }
  return 'sha256:missing';
}

export function loadScenarios(repoRoot, customPath) {
  const candidate = customPath || path.join(repoRoot, 'test/fixtures/coordination-baseline/scenarios.json');
  if (fs.existsSync(candidate)) {
    const list = JSON.parse(fs.readFileSync(candidate, 'utf8'));
    return list.map((sc) => ({
      ...sc,
      durationMs: typeof sc.durationMs === 'number' ? sc.durationMs : 0,
    }));
  }
  return [];
}

export function runBaselineHarness(opts = {}) {
  const repoRoot = opts.repoRoot || defaultRepoRoot;
  const commit = getCommit(repoRoot);
  const dirtyFingerprint = opts.dirtyFingerprint || getDirtyFingerprint(repoRoot);
  const lockfileDigest = getLockfileDigest(repoRoot);
  const skills = measureSkills(repoRoot);
  const scenarios = loadScenarios(repoRoot, opts.scenariosPath);

  const corpusPath = opts.corpusPath || path.join(repoRoot, '.fgos/coordination/sessions');
  const replay = replayCorpusFromDirectory(corpusPath);

  const report = {
    contractVersion: CONTRACT_VERSION,
    source: {
      commit,
      dirtyFingerprint,
      node: process.version,
      lockfileDigest,
    },
    skills,
    scenarios,
    replay,
  };

  return report;
}

export function formatMarkdownReport(report) {
  const measuredRows = (report.replay?.measuredSessions || []).map((m) =>
    `| \`${m.id}\` | ${m.schemaVersion} | ${m.eventCount} | ${m.dispatchCount} | ${m.retryCount} | ${m.sequentialWaves ?? 'null'} | ${m.promptBytes} | \`${m.evidenceOutcome}\` |`
  ).join('\n');

  return `# Coordination Baseline and Replay Report

- Contract Version: \`${report.contractVersion}\`
- Source Commit: \`${report.source.commit}\`
- Node Environment: \`${report.source.node}\`
- Lockfile Digest: \`${report.source.lockfileDigest}\`
- Dirty Fingerprint: \`${report.source.dirtyFingerprint}\`

## Skills Instruction Footprint
| Skill Path | Bytes | Words | Lines |
|---|---:|---:|---:|
${report.skills.map((s) => `| \`${s.path}\` | ${s.bytes} | ${s.words} | ${s.lines} |`).join('\n')}

## Measured Corpus Sessions (Authoritative Replay)
| Session ID | Schema | Events | Dispatches | Retries | Waves | Prompt Bytes | Status / Outcome |
|---|---:|---:|---:|---:|---:|---:|---|
${measuredRows || '*No sessions measured from corpus.*'}

## Declared Scenario Fixture Expectations (Comparison Baseline)
> Note: Scenario metrics reflect declared benchmark fixture expectations from canonical scenario definitions.

| Scenario ID | Prompt Bytes | Input Tokens | Output Tokens | Dispatches | Waves | Duration (ms) | Evidence Outcome |
|---|---:|---:|---:|---:|---:|---:|---|
${report.scenarios.map((sc) => `| \`${sc.id}\` | ${sc.promptBytes} | ${sc.inputTokens ?? 'null'} | ${sc.outputTokens ?? 'null'} | ${sc.dispatchCount} | ${sc.sequentialWaves} | ${sc.durationMs ?? 0} | \`${sc.evidenceOutcome}\` |`).join('\n')}

## Replay Corpus Verification
- Corpus Present: \`${report.replay.corpusPresent}\`
- Session Count: \`${report.replay.sessionCount}\`
- Schemas Breakdown: ${Object.entries(report.replay.bySchema).map(([k, v]) => `Schema ${k}: ${v}`).join(', ') || 'none'}
- Semantic Digest: \`${report.replay.semanticDigest}\`
- Failures: ${report.replay.failures.length === 0 ? 'None (0 failures)' : report.replay.failures.length}
`;
}

// CLI entrypoint
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const args = process.argv.slice(2);
  let corpusPath = null;
  let jsonOutput = false;
  let outputFile = null;
  let reportFile = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--corpus' && args[i + 1]) corpusPath = args[++i];
    else if (args[i] === '--json') jsonOutput = true;
    else if (args[i] === '--output' && args[i + 1]) outputFile = args[++i];
    else if (args[i] === '--report' && args[i + 1]) reportFile = args[++i];
  }

  const baseline = runBaselineHarness({ corpusPath });

  if (outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(baseline, null, 2));
  }
  if (reportFile) {
    fs.writeFileSync(reportFile, formatMarkdownReport(baseline));
  }

  if (jsonOutput) {
    process.stdout.write(JSON.stringify(baseline, null, 2) + '\n');
  } else {
    process.stdout.write(formatMarkdownReport(baseline));
  }

  if (baseline.replay.failures.length > 0) {
    for (const f of baseline.replay.failures) {
      process.stderr.write(`replay error in session "${f.coordinationId}": ${f.error}\n`);
    }
    process.exit(1);
  }
}

