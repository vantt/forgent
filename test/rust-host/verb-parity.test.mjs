// Parity of every verb the host took over from the Node payload: one table per verb
// (`parity-cases/<name>.cases.mjs`), each case run on the step's base release (the Node payload with that release's
// environment) and on the host this tree stages. The base is named by `FGOS_TEST_PARITY_BASE`, a description file of
// the staged base release (see the recipe in `harness.mjs`). A table that exports `runPreparedCase(entryA, entryB,
// testCase)` owns how one case runs (a fresh fixture per entry); the step's close deletes this file and the tables.
import "../helpers/process-tmp-root.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseEntry, PARITY_CASES_DIR } from "./harness.mjs";

const TABLES = ["events", "session"];
const JOBS = 4;

/** The base release as the entry that serves its verbs from Node, with the environment that release was staged with. */
function baseEntry() {
  const file = process.env.FGOS_TEST_PARITY_BASE;
  assert.ok(file, "FGOS_TEST_PARITY_BASE is not set: it names the description file of the staged base release (recipe in test/rust-host/harness.mjs)");
  const base = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    type: "node",
    executable: process.execPath,
    target: path.join(base.releasePath, "bin/fgos.mjs"),
    spec: `node:${base.releasePath}`,
    env: { FGOS_HOST_BIN: base.hostBin, FGOS_ACTIVE_RELEASE_PATH: base.releasePath, FGOS_ACTIVE_MANIFEST_PATH: base.manifestPath },
  };
}

for (const name of TABLES) {
  test(`the host answers like the base release for every ${name} case`, { timeout: 1800000 }, async () => {
    const hostBin = process.env.FGOS_HOST_BIN;
    assert.ok(hostBin && fs.existsSync(hostBin), `FGOS_HOST_BIN is not a built host binary (${hostBin}); run this file through node scripts/run-tests.mjs`);
    const table = await import(pathToFileURL(path.join(PARITY_CASES_DIR, `${name}.cases.mjs`)).href);
    assert.ok(table.cases.length > 0 && typeof table.runPreparedCase === "function", `${name}: no cases or no runPreparedCase`);
    const entryA = baseEntry();
    const entryB = parseEntry(`bin:${hostBin}`);
    const failures = [];
    let next = 0;
    const worker = async () => {
      while (next < table.cases.length) {
        const testCase = table.cases[next++];
        const outcome = await table.runPreparedCase(entryA, entryB, testCase);
        if (!outcome.passed) failures.push(`${outcome.caseId}: ${outcome.differences.join(" | ")}`);
      }
    };
    await Promise.all(Array.from({ length: JOBS }, worker));
    assert.deepEqual(failures, [], `${failures.length} of ${table.cases.length} ${name} cases differ between the base release and the host`);
  });
}
