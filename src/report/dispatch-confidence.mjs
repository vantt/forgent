// src/report/dispatch-confidence.mjs — reader for dispatch result confidence ladder (tsk-1g6).
//
// Classifies dispatch execution results into one of four confidence levels:
// - 'reported': Structured outcome provided directly by adapter result
// - 'legacy-signal': Classified from [DONE] or [BLOCKED] token in raw worker stdout
// - 'inferred': Classified from git head delta / execution fallback when no token exists
// - 'missing': No local worker log file exists for this dispatch or file is malformed
//
// Best-effort, machine-scoped reader: reads .fgos/events.jsonl + .fgos/logs/<id>.log.

import fs from 'node:fs';
import path from 'node:path';
import { readAllEventsFromDir } from '../state/replay.mjs';
import { resolveLogsDir, fgosDirFromRoot } from '../runner/paths.mjs';

/**
 * Classifies a single dispatch log content / event pairing.
 *
 * @param {object} input
 * @param {string|null} input.logContent - Raw text from .fgos/logs/<id>.log
 * @param {object|null} input.dispatchEvent - executor.dispatch event payload
 * @returns {{ confidence: 'reported'|'legacy-signal'|'inferred'|'missing', outcome: string|null }}
 */
export function classifyDispatchResult({ logContent, dispatchEvent } = {}) {
  if (logContent == null || typeof logContent !== 'string' || !logContent.trim()) {
    return { confidence: 'missing', outcome: null };
  }

  // 1. Parse stdout sections from worker log entry format
  const stdoutBlocks = [];
  const lines = logContent.split('\n');
  let inStdout = false;
  let currentStdout = [];

  for (const line of lines) {
    if (line.startsWith('--- STDOUT ---')) {
      inStdout = true;
      currentStdout = [];
    } else if (line.startsWith('--- STDERR ---') || line.startsWith('=== ')) {
      if (inStdout) {
        inStdout = false;
        stdoutBlocks.push(currentStdout.join('\n'));
      }
    } else if (inStdout) {
      currentStdout.push(line);
    }
  }
  if (inStdout) {
    stdoutBlocks.push(currentStdout.join('\n'));
  }

  const fullStdout = stdoutBlocks.length > 0 ? stdoutBlocks.join('\n') : logContent;
  const cleanStdout = fullStdout.replace(/`+[\s\S]*?`+/g, '');

  // 2. Check for legacy signal tokens: [DONE] / [BLOCKED]
  const hasDone = cleanStdout.includes('[DONE]');
  const hasBlocked = cleanStdout.includes('[BLOCKED]');
  if (hasDone || hasBlocked) {
    return {
      confidence: 'legacy-signal',
      outcome: hasDone ? 'done' : 'blocked',
    };
  }

  // 3. Check for explicit reported outcome from adapter
  if (dispatchEvent?.payload?.outcome && dispatchEvent.payload.outcome !== 'unsignaled') {
    return {
      confidence: 'reported',
      outcome: dispatchEvent.payload.outcome,
    };
  }

  // 4. Inferred: local log exists with execution output or head delta fallback
  return {
    confidence: 'inferred',
    outcome: 'unsignaled',
  };
}

/**
 * Reads and classifies dispatch result confidence across recorded dispatches.
 *
 * @param {string} dir - Path to .fgos directory or repository root
 * @param {object} [options]
 * @param {string} [options.id] - Optional work item id to filter report
 * @returns {{ id: string|null, dispatches: Array, summary: object }}
 */
export function classifyDispatchConfidence(dir, options = {}) {
  const targetId = options.id || null;

  // Resolve fgosDir and events log path
  let fgosDir = dir;
  if (!dir.endsWith('.fgos')) {
    if (fs.existsSync(path.join(dir, '.fgos'))) {
      fgosDir = path.join(dir, '.fgos');
    } else {
      fgosDir = fgosDirFromRoot(dir);
    }
  }

  const eventsPath = path.join(fgosDir, 'events.jsonl');
  const logsDir = resolveLogsDir(fgosDir);

  let events = [];
  try {
    events = readAllEventsFromDir(fgosDir);
  } catch {
    events = [];
  }

  const dispatchEvents = events.filter(
    (ev) => ev.type === 'executor.dispatch' && (!targetId || ev.payload?.id === targetId),
  );

  const dispatches = [];

  for (const ev of dispatchEvents) {
    const workId = ev.payload?.id;

    let logContent = null;
    if (workId) {
      const logPath = path.join(logsDir, `${workId}.log`);
      try {
        if (fs.existsSync(logPath)) {
          logContent = fs.readFileSync(logPath, 'utf8');
        }
      } catch {
        logContent = null;
      }
    }

    const classified = classifyDispatchResult({ logContent, dispatchEvent: ev });

    dispatches.push({
      id: workId || null,
      executorId: ev.payload?.executorId || null,
      provider: ev.payload?.provider || null,
      command: ev.payload?.command || null,
      model: ev.payload?.model || null,
      confidence: classified.confidence,
      outcome: classified.outcome,
      timestamp: ev.ts || ev.created_at || null,
    });
  }

  // If a specific id was requested, but no dispatch event was recorded in events.jsonl,
  // check if a log file exists for that id
  if (targetId && dispatchEvents.length === 0) {
    const logPath = path.join(logsDir, `${targetId}.log`);
    let logContent = null;
    try {
      if (fs.existsSync(logPath)) {
        logContent = fs.readFileSync(logPath, 'utf8');
      }
    } catch {
      logContent = null;
    }

    if (logContent != null) {
      const classified = classifyDispatchResult({ logContent, dispatchEvent: null });
      dispatches.push({
        id: targetId,
        executorId: null,
        provider: null,
        command: null,
        model: null,
        confidence: classified.confidence,
        outcome: classified.outcome,
        timestamp: null,
      });
    }
  }

  const summary = {
    total: dispatches.length,
    reported: 0,
    'legacy-signal': 0,
    inferred: 0,
    missing: 0,
  };

  for (const d of dispatches) {
    if (summary[d.confidence] !== undefined) {
      summary[d.confidence]++;
    }
  }

  return {
    id: targetId,
    dispatches,
    summary,
  };
}
