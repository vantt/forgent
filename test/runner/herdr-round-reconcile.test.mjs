import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { reconcileHerdrSpawnRun, publishHerdrAdapterReceipt } from "../../src/runner/dispatch/herdr-round.mjs";
import { computeSha256Digest } from "../../src/runner/dispatch/cli-spawn-supervisor.mjs";
import { normalizeRunResultV2 } from '../../src/runner/dispatch/run-result.mjs';

test('reconcileHerdrSpawnRun preserves contract-corrupt provenance for a tampered v2 result.json', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-herdr-result-corrupt-'));
  try {
    const runDir = path.join(tmp, 'run');
    fs.mkdirSync(runDir, { recursive: true });
    const corruptResult = normalizeRunResultV2({
      runId: 'run-corrupt-result',
      runtime: { exitCode: 0 },
      agentClaim: { status: 'done', summary: 'original valid result' },
    });
    corruptResult.status = 'failed';
    fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(corruptResult));

    const result = await reconcileHerdrSpawnRun(runDir);

    assert.equal(result.status, 'settled');
    assert.equal(result.runResult.contractCorrupt, true);
    assert.equal(result.runResult.classification.provenance, 'contract-corrupt');
    assert.equal(result.runResult.confidence, 'failed');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("reconcileHerdrSpawnRun rejects a fabricated workerCommandDigest checked against the real workerInvocation-nested digest", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-medb-test-"));
  try {
    const runDir = path.join(tmp, "run");
    const launchCommandId = "lc-01";
    const commandsDir = path.join(runDir, "controller", "commands");
    fs.mkdirSync(commandsDir, { recursive: true });

    // Authority's real prepared-invocation shape (confinement-adapter-contract.md
    // Authority Prepared Invocation V1): workerCommandDigest/envDigest live
    // under `workerInvocation`, never at the record's top level.
    const prepBody = {
      contract: "authority-prepared-invocation.v1",
      dispatchId: "disp_1",
      workerInvocation: {
        command: "claude",
        args: ["-p", "hi"],
        workerCommandDigest: computeSha256Digest({ command: "claude", args: ["-p", "hi"] }),
        envDigest: computeSha256Digest({ FOO: "bar" }),
      },
    };
    const prepDigest = computeSha256Digest(prepBody);
    const prepRec = { ...prepBody, digest: prepDigest };
    const prepDir = path.join(runDir, "protected", "prepared-invocation");
    fs.mkdirSync(prepDir, { recursive: true });
    fs.writeFileSync(path.join(prepDir, `${launchCommandId}.json`), JSON.stringify(prepRec));

    // A receipt whose workerCommandDigest was fabricated/tampered with -- it
    // does not match the real prepared invocation's own digest.
    publishHerdrAdapterReceipt(runDir, launchCommandId, {
      contract: "herdr-adapter-receipt.v1",
      runId: "run1",
      launchCommandId,
      preparedInvocationDigest: prepDigest,
      herdrName: "fgos-run1-lc-01",
      paneId: "pane1",
      workerCommandDigest: `sha256:${"f".repeat(64)}`,
      completion: { kind: "died", reason: "died", settledAt: new Date().toISOString() },
      result: null,
    });

    const command = {
      contract: "herdr-launch-command.v1",
      runId: "run1",
      launchCommandId,
      controlEpoch: 1,
      controlTokenDigest: `sha256:${"c".repeat(64)}`,
      state: "pending",
      preparedInvocationDigest: prepDigest,
      herdrName: "fgos-run1-lc-01",
    };
    fs.writeFileSync(path.join(commandsDir, `${launchCommandId}.json`), JSON.stringify(command));

    const result = await reconcileHerdrSpawnRun(runDir, {});
    assert.equal(result.status, "refused", "a fabricated workerCommandDigest must be rejected, not silently accepted");
    assert.equal(result.reason, "confinement-mismatch");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
