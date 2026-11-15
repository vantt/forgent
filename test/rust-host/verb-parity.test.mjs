// Parity of each verb the host now serves natively with the release the step started from (its base), one table per
// verb (parity-cases/<name>.cases.mjs). Entry A is the base release's Node CLI with the base's staged environment;
// entry B is the host binary `run-tests` staged for this tree. Every case builds its own fixture for each entry, so a
// write never reaches the other entry's state; paths and time-dependent fields are normalised before comparing.
// A table lives only while the base still serves its verbs: the change that closes the step deletes it.
import "../helpers/process-tmp-root.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadParityTable, parseEntry, parityBaseEntrySpec, runCaseOnEntry, compareResults, snapshotDirectory, diffDirectorySnapshots } from "./harness.mjs";

// The tables of the verbs a step moved; the step that closes deletes its own. Empty until a step adds one.
const TABLES = [];

function baseEntry() {
  const description = JSON.parse(fs.readFileSync(parityBaseEntrySpec().slice("release:".length), "utf8"));
  const entry = parseEntry(`node:${description.releasePath}/bin/fgos.mjs`);
  entry.env = { FGOS_HOST_BIN: description.hostBin, FGOS_ACTIVE_RELEASE_PATH: description.releasePath, FGOS_ACTIVE_MANIFEST_PATH: description.manifestPath };
  return entry;
}

const TIME_KEYS = new Set(["updatedAtMs", "oldestRetainedAtMs", "ageMs"]);
function scrub(value) {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, TIME_KEYS.has(k) && typeof v === "number" ? 0 : scrub(v)]));
  return value;
}

/** The answer with the fixture's paths, object ids and time fields replaced, as a result `compareResults` reads. */
function normalise(result, fixture) {
  // The fixture's own directory, and the repository's when a repository sits elsewhere; a candidate worktree carries a random suffix.
  const text = (raw) => raw.split(path.dirname(fixture.repo)).join("<FIX>").split(fixture.temp).join("<FIX>").replace(/parity-land-[A-Za-z0-9]{6}/g, "parity-land-<id>").replace(/\b[0-9a-f]{64}\b/g, "<hash>").replace(/\b[0-9a-f]{40}\b/g, "<oid>");
  let stdoutText = text(result.stdoutText);
  try {
    const envelope = JSON.parse(stdoutText);
    delete envelope.data_hash;
    delete envelope.generated_at;
    stdoutText = JSON.stringify(scrub(envelope), null, 2);
  } catch { /* not JSON: compared as bytes */ }
  const stderrText = text(result.stderrText);
  return { ...result, nodeChildren: result.spawnedChildren.filter((child) => path.basename(child.cmd) === "node").length, stdoutText, stderrText, stdout: Buffer.from(stdoutText), stderr: Buffer.from(stderrText), spawnedChildren: [] };
}

async function runOnEntry(entry, testCase, builders) {
  const fixture = await builders[testCase.fixture]();
  try {
    const args = typeof testCase.args === "function" ? testCase.args(fixture) : testCase.args;
    const call = { id: testCase.id, args, cwd: fixture.cwd, env: fixture.env, ignoreChildren: true, timeoutMs: 60000 };
    const before = snapshotDirectory(fixture.repo, false);
    const result = normalise(await runCaseOnEntry(entry, call), fixture);
    const outcome = { fixture, result };
    if (testCase.mode === "after") {
      const delta = diffDirectorySnapshots(before, snapshotDirectory(fixture.repo, false));
      const paths = (list) => list.map((e) => (typeof e === "string" ? e : e.path)).map((p) => p.replace(/lc-[0-9a-f]{64}/g, "lc-<hash>")).sort();
      outcome.paths = { created: paths(delta.created), modified: paths(delta.modified), deleted: paths(delta.deleted) };
      outcome.after = normalise(await runCaseOnEntry(entry, { ...call, args: ["git", "status", "--json"] }), fixture);
    }
    return outcome;
  } finally {
    fixture.close();
  }
}

for (const name of TABLES) {
  test(`the host answers like the base release for every ${name} case`, async () => {
    const hostBin = process.env.FGOS_HOST_BIN;
    assert.ok(hostBin && fs.existsSync(hostBin), `FGOS_HOST_BIN is not set to a built host binary (${hostBin}); run this file through node scripts/run-tests.mjs`);
    const table = await import(new URL(`./parity-cases/${name}.cases.mjs`, import.meta.url));
    const cases = await loadParityTable(name);
    const [a, b] = [baseEntry(), parseEntry(`bin:${hostBin}`)];
    const failures = [];
    for (const testCase of cases) {
      const hostSide = await runOnEntry(b, testCase, table.builders);
      // A verb the host serves natively starts no Node process.
      if (hostSide.result.nodeChildren) failures.push(`${testCase.id}: the host started ${hostSide.result.nodeChildren} node process(es)`);
      if (testCase.mode === "accepted") {
        const { result } = hostSide;
        if (testCase.exit !== undefined) {
          if (result.exitCode !== testCase.exit) failures.push(`${testCase.id}: host exit ${result.exitCode}`);
          // The host also records the malformed call and names the record; the base prints only the refusal.
          if (!result.stderrText.startsWith(testCase.hostStderr)) failures.push(`${testCase.id}: host said ${JSON.stringify(result.stderrText)}`);
          const baseSide = await runOnEntry(a, testCase, table.builders);
          if (baseSide.result.exitCode !== testCase.exit) failures.push(`${testCase.id}: base exit ${baseSide.result.exitCode}`);
        } else if (testCase.check) {
          // The host answers differently on purpose: the case states how, from both answers.
          const baseSide = await runOnEntry(a, testCase, table.builders);
          const problem = result.exitCode === 0 && baseSide.result.exitCode === 0 ? testCase.check(JSON.parse(result.stdoutText).data, JSON.parse(baseSide.result.stdoutText).data) : `exits ${result.exitCode} and ${baseSide.result.exitCode}`;
          if (problem) failures.push(`${testCase.id}: ${problem}`);
        } else {
          if (result.exitCode !== 0) failures.push(`${testCase.id}: host exit ${result.exitCode}: ${result.stderrText}`);
          else if (JSON.stringify(JSON.parse(result.stdoutText).data) !== JSON.stringify(testCase.host)) failures.push(`${testCase.id}: host answered ${result.stdoutText}`);
          const baseSide = await runOnEntry(a, testCase, table.builders);
          if (!testCase.base(JSON.parse(baseSide.result.stdoutText).data)) failures.push(`${testCase.id}: the base no longer prints the defect this case documents`);
        }
        continue;
      }
      const baseSide = await runOnEntry(a, testCase, table.builders);
      const modes = testCase.mode === "exact" ? ["exact-bytes"] : ["semantic-json"];
      const compared = compareResults({ id: testCase.id, modes, ignoreChildren: true }, baseSide.result, hostSide.result);
      if (!compared.passed) failures.push(`${testCase.id}: ${compared.differences.join("; ")}`);
      if (testCase.mode === "after") {
        const state = compareResults({ id: `${testCase.id}-after`, modes: ["semantic-json"], ignoreChildren: true }, baseSide.after, hostSide.after);
        if (!state.passed) failures.push(`${testCase.id} (state afterwards): ${state.differences.join("; ")}`);
        if (JSON.stringify(baseSide.paths) !== JSON.stringify(hostSide.paths)) failures.push(`${testCase.id}: files written differ: ${JSON.stringify(baseSide.paths)} vs ${JSON.stringify(hostSide.paths)}`);
      }
    }
    assert.deepEqual(failures, [], `${failures.length} of ${cases.length} ${name} cases differ between the base release and the host`);
  });
}
