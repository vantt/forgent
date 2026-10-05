// What herdr itself said about an agent at the moment a round did not settle.
//
// WHY. A round that ends as timed-out, died, blocked or a provider limit is judged by us, but herdr
// is the one that understands the agent: its own detector names the state, the rule that matched,
// the manifest it used and, when nothing matched, the fallback it fell back on. The pane is often
// closed or recycled soon after, so without a snapshot the next stall has to be guessed at again.
// This writes that snapshot into the run directory, next to the other evidence of the round.
//
// BEST EFFORT. A failure here must never turn a settled failure into a crash: every read is
// guarded, and what could not be read is recorded as an error entry instead of being left out.

import fs from 'node:fs';
import path from 'node:path';

export const DIAGNOSIS_FILE = 'herdr-diagnosis.json';
export const DIAGNOSIS_CONTRACT = 'herdr-diagnosis.v1';

const MAX_SCREEN_CHARS = 8000;

const attempt = (read) => {
  try {
    return read();
  } catch (err) {
    return { error: { code: err?.code ?? 'error', message: String(err?.message ?? err).slice(0, 300) } };
  }
};

/**
 * @param {object} client the herdr client (`agentGet`, `agentExplain`, `agentRead`)
 * @param {string} target agent name or pane id
 * @param {{ lines?: number, now?: () => number }} [options]
 */
export function captureHerdrDiagnosis(client, target, { lines = 40, now = Date.now } = {}) {
  const agent = attempt(() => client.agentGet(target));
  const explain = attempt(() => client.agentExplain(target));
  const detectionScreen = attempt(() => {
    const text = client.agentRead(target, { lines, source: 'detection' });
    return typeof text === 'string' && text.length > MAX_SCREEN_CHARS ? text.slice(-MAX_SCREEN_CHARS) : text;
  });
  return {
    contract: DIAGNOSIS_CONTRACT,
    capturedAt: new Date(now()).toISOString(),
    target,
    agent,
    explain,
    detectionScreen,
  };
}

/**
 * Write the diagnosis into `runDir`, atomically. Returns the file name, or null when it could not
 * be written.
 */
export function writeHerdrDiagnosis(runDir, diagnosis) {
  if (typeof runDir !== 'string' || !runDir) return null;
  try {
    const file = path.join(runDir, DIAGNOSIS_FILE);
    const tmp = `${file}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, `${JSON.stringify(diagnosis, null, 2)}\n`);
    fs.renameSync(tmp, file);
    return DIAGNOSIS_FILE;
  } catch {
    return null;
  }
}
