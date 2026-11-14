// Node-versus-host parity for every verb both sides still serve, one table per verb group
// (parity-cases/<name>.cases.mjs). Entry A is the Node payload, entry B the host binary `run-tests`
// stages as FGOS_HOST_BIN. A table lives only while both sides serve its verbs: the change that
// deletes the Node side deletes its table.
import "../helpers/process-tmp-root.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { loadParityTable, runParitySuite } from "./harness.mjs";

const TABLES = ["help"];

for (const name of TABLES) {
  test(`the host answers like the Node payload for every ${name} case`, async () => {
    const hostBin = process.env.FGOS_HOST_BIN;
    assert.ok(
      hostBin && fs.existsSync(hostBin),
      `FGOS_HOST_BIN is not set to a built host binary (${hostBin}); run this file through node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs`,
    );
    const cases = await loadParityTable(name);
    const suite = await runParitySuite(cases, {
      entryA: "node:bin/fgos.mjs",
      entryB: `bin:${hostBin}`,
      differential: true,
    });
    assert.equal(suite.total, cases.length);
    const failures = suite.failedResults.map((r) => `${r.caseId}: ${r.differences.join("; ")}`);
    assert.deepEqual(failures, [], `${suite.failedCount} of ${suite.total} ${name} cases differ between Node and the host`);
  });
}
