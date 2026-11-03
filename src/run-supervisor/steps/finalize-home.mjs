// finalize-home: give the credential back and remove the private homes of the attempt. The step
// runs only while the supervisor or adopt holds the attempt lock and the process domain is empty.
// A home whose marker is not this attempt's throws (message starts with the code) and stays.

import fs from 'node:fs';
import { finalizeAttemptHome } from '../../runner/dispatch/confinement/authority.mjs';

export async function finalizeHome({ envelope }) {
  const finalized = finalizeAttemptHome({ runDir: envelope.runDir, attemptId: envelope.attemptId });
  if (finalized.state === 'credential-home-kept') return { result: 'retry', reason: 'credential-home-kept' };
  // The step order puts settle-attempt (the only reader of the side file) before this one, so its receipt
  // is already written; the secrets have no reader left once the home is finalized.
  fs.rmSync(envelope.sideFile, { force: true });
  // The retry budget is used up: the home stays for the owner, adopt does not run the step again.
  if (finalized.state === 'credential-home-held') return { result: 'done', detail: { homes: finalized.homes, outcome: 'credential-home-held' } };
  return { result: 'done', detail: { homes: finalized.homes } };
}
