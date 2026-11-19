// Parity of every verb the host takes over from the Node payload: one table per verb
// (`parity-cases/<name>.cases.mjs`, each file a table), each case run on the step's base release (its own host
// with that release's environment) and on the host this tree stages. The base is named by `FGOS_TEST_PARITY_BASE`, a
// description file of the staged base release (see the recipe in `harness.mjs`). A table exports `cases` and
// `runPreparedCase(entryA, entryB, testCase)`, which owns how one case runs (a fresh fixture per entry). A table is
// added as its own file; the step's close deletes this file and the tables.
import "../helpers/process-tmp-root.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseEntry, parityBaseEntrySpec, PARITY_CASES_DIR } from "./harness.mjs";

/** Every table in the cases directory, by name; none until a verb's port adds its table. */
const TABLES = fs.existsSync(PARITY_CASES_DIR)
  ? fs.readdirSync(PARITY_CASES_DIR).filter((file) => file.endsWith(".cases.mjs")).map((file) => file.slice(0, -".cases.mjs".length)).sort()
  : [];
const JOBS = 4;

for (const name of TABLES) {
  test(`the host answers like the base release for every ${name} case`, { timeout: 1800000 }, async () => {
    const hostBin = process.env.FGOS_HOST_BIN;
    assert.ok(hostBin && fs.existsSync(hostBin), `FGOS_HOST_BIN is not a built host binary (${hostBin}); run this file through node scripts/run-tests.mjs`);
    const table = await import(pathToFileURL(path.join(PARITY_CASES_DIR, `${name}.cases.mjs`)).href);
    assert.ok(table.cases.length > 0 && typeof table.runPreparedCase === "function", `${name}: no cases or no runPreparedCase`);
    // The base release runs through its own host: since S5 its Node payload no longer serves the host verbs.
    const entryA = parseEntry(parityBaseEntrySpec());
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
