import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  saveProbeCacheRecord,
  loadProbeCacheRecord,
  clearProbeCache,
  DEFAULT_PROBE_CACHE_TTL_MS,
} from "../../src/runner/dispatch/confinement/attestation-store.mjs";
import {
  allRuns,
  createRunsCache,
  withRunsCache,
  clearAllRunsCache,
  inspectDispatchRuntime,
} from "../../src/runner/dispatch/runtime-inspection.mjs";

test("R9: attestation store caches probe results by fingerprint with TTL", () => {
  clearProbeCache();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-r9-probe-"));
  const context = { runDir: path.join(tmpDir, "run1") };
  const fingerprint = {
    policyDigest: "abc123digest",
    driverVersion: "1.0.0",
    backendConfigDigest: "def456digest",
    platformDigest: "plat789digest",
  };

  const probeResult = {
    passed: true,
    message: "all 8 local-bwrap-v1 confinement probes passed",
    results: [{ probe: "host-write-denied", passed: true, detail: "ok" }],
  };

  const t0 = 1000000;
  // Save cache record
  const saved = saveProbeCacheRecord(fingerprint, probeResult, context, { now: t0 });
  assert.ok(saved);
  assert.equal(saved.passed, true);

  // Load from cache (in-memory hit)
  const cachedHit = loadProbeCacheRecord(fingerprint, context, { now: t0 + 1000 });
  assert.ok(cachedHit);
  assert.equal(cachedHit.cached, true);
  assert.equal(cachedHit.message, probeResult.message);
  assert.deepEqual(cachedHit.results, probeResult.results);

  // Clear in-memory cache to force loading from disk
  clearProbeCache();
  const diskHit = loadProbeCacheRecord(fingerprint, context, { now: t0 + 5000 });
  assert.ok(diskHit);
  assert.equal(diskHit.cached, true);
  assert.equal(diskHit.message, probeResult.message);

  // Cache miss on different fingerprint
  const diffFingerprint = { ...fingerprint, platformDigest: "changed" };
  const missFp = loadProbeCacheRecord(diffFingerprint, context, { now: t0 + 5000 });
  assert.equal(missFp, null);

  // Cache miss on expired TTL
  const expired = loadProbeCacheRecord(fingerprint, context, {
    ttlMs: 10000,
    now: t0 + 20000,
  });
  assert.equal(expired, null);
});

test("R9: allRuns is memoized within a verb call via withRunsCache", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fgos-r9-allruns-"));
  const fgosDir = path.join(tmpDir, ".fgos");
  const runsDir = path.join(fgosDir, "dispatch-runs", "g1", "01");
  fs.mkdirSync(runsDir, { recursive: true });
  fs.writeFileSync(path.join(runsDir, "run.json"), JSON.stringify({ runId: "r1", status: "launched" }));

  // Inside withRunsCache: first call reads disk, second call hits cache
  withRunsCache(() => {
    const runs1 = allRuns(tmpDir);
    assert.equal(runs1.length, 1);
    assert.equal(runs1[0].run.runId, "r1");

    // Add a second run on disk
    const runs2Dir = path.join(fgosDir, "dispatch-runs", "g1", "02");
    fs.mkdirSync(runs2Dir, { recursive: true });
    fs.writeFileSync(path.join(runs2Dir, "run.json"), JSON.stringify({ runId: "r2", status: "launched" }));

    // Still hits cache within this verb call
    const runsCached = allRuns(tmpDir);
    assert.equal(runsCached.length, 1);

    // Explicit bypassCache reads fresh disk
    const runsBypass = allRuns(tmpDir, { bypassCache: true });
    assert.equal(runsBypass.length, 2);

    // clearAllRunsCache for root clears the memoized entry
    clearAllRunsCache(tmpDir);
    const runsAfterClear = allRuns(tmpDir);
    assert.equal(runsAfterClear.length, 2);
  });

  // Outside withRunsCache: each call reads disk freshly
  const runs3Dir = path.join(fgosDir, "dispatch-runs", "g1", "03");
  fs.mkdirSync(runs3Dir, { recursive: true });
  fs.writeFileSync(path.join(runs3Dir, "run.json"), JSON.stringify({ runId: "r3", status: "launched" }));

  const runsOutside = allRuns(tmpDir);
  assert.equal(runsOutside.length, 3);
});
